import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db, getLocalDateString } from '../lib/db';
import { syncEntryToCloud, deleteEntryFromCloud, syncBucketItemToCloud, deleteBucketItemFromCloud } from '../lib/sync';
import type { MemoryEntry, MemoryType, Tone, Settings, BucketItem } from '../lib/types';

const MAX_ENTRIES_PER_DAY = 3;
const MAX_GRATITUDE_PER_DAY = 1;
const MAX_CONTENT_LENGTH = 240;

// Store current user ID for auto-sync
let currentUserId: string | null = null;

export function setCurrentUserId(userId: string | null) {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

// Get all entries for a specific date
export function useEntriesForDate(date: string) {
  return useLiveQuery(
    () => db.entries.where('entry_date').equals(date).sortBy('created_at'),
    [date]
  );
}

// Get today's entries
export function useTodaysEntries() {
  const today = getLocalDateString();
  return useEntriesForDate(today);
}

// Get entries for a month (YYYY-MM)
export function useEntriesForMonth(yearMonth: string) {
  return useLiveQuery(
    () => db.entries
      .where('entry_date')
      .startsWith(yearMonth)
      .toArray(),
    [yearMonth]
  );
}

// Get all entries (for archive/export) - sorted chronologically by entry_date, then by created_at
export function useAllEntries() {
  return useLiveQuery(async () => {
    const entries = await db.entries.toArray();
    // Sort by entry_date (newest first), then by created_at (newest first) within same date
    return entries.sort((a, b) => {
      const dateCompare = b.entry_date.localeCompare(a.entry_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });
  });
}

// Get settings
export function useSettings() {
  return useLiveQuery(() => db.settings.get('default'));
}

// Check if can add entry today
export function canAddEntry(todaysEntries: MemoryEntry[] | undefined): boolean {
  if (!todaysEntries) return true;
  return todaysEntries.length < MAX_ENTRIES_PER_DAY;
}

// Check if can add gratitude today
export function canAddGratitude(todaysEntries: MemoryEntry[] | undefined): boolean {
  if (!todaysEntries) return true;
  const gratitudeCount = todaysEntries.filter(e => e.type === 'gratitude').length;
  return gratitudeCount < MAX_GRATITUDE_PER_DAY;
}

// Add a new memory entry
export async function addEntry(
  type: MemoryType,
  content: string,
  tone: Tone = 'neutral',
  photoUrls?: string[]
): Promise<MemoryEntry | { error: string }> {
  const today = getLocalDateString();
  const todaysEntries = await db.entries.where('entry_date').equals(today).toArray();

  // Validate constraints
  if (todaysEntries.length >= MAX_ENTRIES_PER_DAY) {
    return { error: 'Maximum 3 entries per day reached' };
  }

  if (type === 'gratitude') {
    const gratitudeCount = todaysEntries.filter(e => e.type === 'gratitude').length;
    if (gratitudeCount >= MAX_GRATITUDE_PER_DAY) {
      return { error: 'Maximum 1 gratitude entry per day reached' };
    }
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` };
  }

  const entry: MemoryEntry = {
    id: uuid(),
    created_at: new Date().toISOString(),
    entry_date: today,
    type,
    content: content.trim(),
    tone,
    photo_urls: photoUrls?.slice(0, 9) // max 9 photos
  };

  await db.entries.add(entry);

  // Auto-sync to cloud
  if (currentUserId) {
    syncEntryToCloud(entry, currentUserId).catch(console.error);
  }

  return entry;
}

// Update an entry
export async function updateEntry(
  id: string,
  updates: Partial<Pick<MemoryEntry, 'content' | 'tone' | 'type' | 'photo_urls'>>
): Promise<boolean> {
  const entry = await db.entries.get(id);
  if (!entry) return false;

  if (updates.content && updates.content.length > MAX_CONTENT_LENGTH) {
    return false;
  }

  // If changing to gratitude, check limit
  if (updates.type === 'gratitude' && entry.type !== 'gratitude') {
    const todaysEntries = await db.entries.where('entry_date').equals(entry.entry_date).toArray();
    const gratitudeCount = todaysEntries.filter(e => e.type === 'gratitude').length;
    if (gratitudeCount >= MAX_GRATITUDE_PER_DAY) {
      return false;
    }
  }

  // Limit to 3 photos
  if (updates.photo_urls) {
    updates.photo_urls = updates.photo_urls.slice(0, 9);
  }

  await db.entries.update(id, updates);

  // Auto-sync to cloud
  if (currentUserId) {
    const updatedEntry = await db.entries.get(id);
    if (updatedEntry) {
      syncEntryToCloud(updatedEntry, currentUserId).catch(console.error);
    }
  }

  return true;
}

// Delete an entry
export async function deleteEntry(id: string): Promise<boolean> {
  const entry = await db.entries.get(id);
  if (!entry) return false;

  await db.entries.delete(id);

  // Auto-sync to cloud
  if (currentUserId) {
    deleteEntryFromCloud(id, currentUserId).catch(console.error);
  }

  return true;
}

// Update settings
export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  const existing = await db.settings.get('default');
  const defaults: Settings = {
    id: 'default',
    resurfacing_enabled: false,
    notifications_enabled: false,
    morning_reminder_time: '08:00',
    evening_reminder_time: '20:00'
  };
  const merged: Settings = { ...defaults, ...existing, ...updates };
  await db.settings.put(merged);
}

// Get a random resurfaced memory (for gentle resurfacing)
export async function getResurfacedMemory(): Promise<MemoryEntry | null> {
  const settings = await db.settings.get('default');
  if (!settings?.resurfacing_enabled) return null;

  const today = getLocalDateString();

  // Don't resurface if already shown today
  if (settings.last_resurfaced_date === today) return null;

  const allEntries = await db.entries.toArray();
  const pastEntries = allEntries.filter(e => e.entry_date !== today);

  if (pastEntries.length === 0) return null;

  // Prioritize: same day from past year, then random
  const todayMD = today.slice(5); // MM-DD
  const sameDay = pastEntries.filter(e => e.entry_date.slice(5) === todayMD);

  let selected: MemoryEntry;
  if (sameDay.length > 0) {
    selected = sameDay[Math.floor(Math.random() * sameDay.length)];
  } else {
    selected = pastEntries[Math.floor(Math.random() * pastEntries.length)];
  }

  // Mark as resurfaced today
  await db.settings.update('default', { last_resurfaced_date: today });

  return selected;
}

// Export all data as JSON
export async function exportData(): Promise<string> {
  const entries = await db.entries.toArray();
  const settings = await db.settings.toArray();
  const bucket = await db.bucket.toArray();
  return JSON.stringify({ entries, settings, bucket, exportedAt: new Date().toISOString() }, null, 2);
}

// Export as CSV
export async function exportCSV(): Promise<string> {
  const entries = await db.entries.orderBy('created_at').toArray();
  const headers = ['id', 'entry_date', 'created_at', 'type', 'tone', 'content'];
  const rows = entries.map(e =>
    headers.map(h => {
      const val = e[h as keyof MemoryEntry] ?? '';
      // Escape quotes and wrap in quotes if contains comma/newline
      const str = String(val);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// Delete all data
export async function deleteAllData(): Promise<void> {
  await db.entries.clear();
  await db.settings.clear();
  await db.bucket.clear();
}

// Import data from JSON backup
export async function importData(jsonString: string): Promise<{ entries: number; bucket: number; error?: string }> {
  try {
    const data = JSON.parse(jsonString);

    let entriesImported = 0;
    let bucketImported = 0;

    // Import entries
    if (data.entries && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        // Check if entry already exists
        const existing = await db.entries.get(entry.id);
        if (!existing) {
          await db.entries.add(entry);
          entriesImported++;
        }
      }
    }

    // Import bucket items
    if (data.bucket && Array.isArray(data.bucket)) {
      for (const item of data.bucket) {
        const existing = await db.bucket.get(item.id);
        if (!existing) {
          await db.bucket.add(item);
          bucketImported++;
        }
      }
    }

    // Import settings (merge with existing)
    if (data.settings && Array.isArray(data.settings)) {
      const importedSettings = data.settings.find((s: any) => s.id === 'default');
      if (importedSettings) {
        const existing = await db.settings.get('default');
        if (!existing) {
          await db.settings.put(importedSettings);
        }
      }
    }

    return { entries: entriesImported, bucket: bucketImported };
  } catch (err) {
    return { entries: 0, bucket: 0, error: 'Invalid JSON file' };
  }
}

// Toggle highlight status on an entry
export async function toggleHighlight(id: string): Promise<boolean> {
  const entry = await db.entries.get(id);
  if (!entry) return false;

  await db.entries.update(id, { highlighted: !entry.highlighted });

  // Auto-sync to cloud
  if (currentUserId) {
    const updatedEntry = await db.entries.get(id);
    if (updatedEntry) {
      syncEntryToCloud(updatedEntry, currentUserId).catch(console.error);
    }
  }

  return true;
}

// Get all highlighted entries
export function useHighlightedEntries() {
  return useLiveQuery(
    () => db.entries.filter(e => e.highlighted === true).sortBy('entry_date')
  );
}

// Add a standalone highlight (bypasses daily limits, for past life events)
export async function addStandaloneHighlight(
  content: string,
  entryDate: string, // YYYY-MM-DD for the event date
  type: MemoryType = 'moment',
  tone: Tone = 'neutral',
  photoUrls?: string[]
): Promise<MemoryEntry | { error: string }> {
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` };
  }

  const entry: MemoryEntry = {
    id: uuid(),
    created_at: new Date().toISOString(),
    entry_date: entryDate,
    type,
    content: content.trim(),
    tone,
    photo_urls: photoUrls?.slice(0, 3), // max 3 photos
    highlighted: true,
    is_standalone_highlight: true
  };

  await db.entries.add(entry);

  // Auto-sync to cloud
  if (currentUserId) {
    syncEntryToCloud(entry, currentUserId).catch(console.error);
  }

  return entry;
}

// ============ Bucket List Functions ============

// Get all bucket list items
export function useBucketList() {
  return useLiveQuery(
    () => db.bucket.orderBy('created_at').toArray()
  );
}

// Add a bucket list item
export async function addBucketItem(content: string): Promise<BucketItem> {
  const item: BucketItem = {
    id: uuid(),
    content: content.trim(),
    completed: false,
    created_at: new Date().toISOString()
  };

  await db.bucket.add(item);

  // Auto-sync to cloud
  if (currentUserId) {
    syncBucketItemToCloud(item, currentUserId).catch(console.error);
  }

  return item;
}

// Toggle bucket item completion
export async function toggleBucketItem(id: string): Promise<boolean> {
  const item = await db.bucket.get(id);
  if (!item) return false;

  await db.bucket.update(id, {
    completed: !item.completed,
    completed_at: !item.completed ? new Date().toISOString() : undefined
  });

  // Auto-sync to cloud
  if (currentUserId) {
    const updatedItem = await db.bucket.get(id);
    if (updatedItem) {
      syncBucketItemToCloud(updatedItem, currentUserId).catch(console.error);
    }
  }

  return true;
}

// Delete a bucket list item
export async function deleteBucketItem(id: string): Promise<boolean> {
  await db.bucket.delete(id);

  // Auto-sync to cloud
  if (currentUserId) {
    deleteBucketItemFromCloud(id, currentUserId).catch(console.error);
  }

  return true;
}

// Update bucket item content
export async function updateBucketItem(id: string, content: string): Promise<boolean> {
  const item = await db.bucket.get(id);
  if (!item) return false;

  await db.bucket.update(id, { content: content.trim() });

  // Auto-sync to cloud
  if (currentUserId) {
    const updatedItem = await db.bucket.get(id);
    if (updatedItem) {
      syncBucketItemToCloud(updatedItem, currentUserId).catch(console.error);
    }
  }

  return true;
}
