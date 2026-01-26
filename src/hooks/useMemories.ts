import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db, getLocalDateString, isToday } from '../lib/db';
import type { MemoryEntry, MemoryType, Tone, Settings } from '../lib/types';

const MAX_ENTRIES_PER_DAY = 3;
const MAX_GRATITUDE_PER_DAY = 1;
const MAX_CONTENT_LENGTH = 240;

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

// Get all entries (for archive/export)
export function useAllEntries() {
  return useLiveQuery(() => db.entries.orderBy('created_at').reverse().toArray());
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
  photoUrl?: string
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
    photo_url: photoUrl
  };

  await db.entries.add(entry);

  return entry;
}

// Update an entry (only if still today)
export async function updateEntry(
  id: string,
  updates: Partial<Pick<MemoryEntry, 'content' | 'tone' | 'type' | 'photo_url'>>
): Promise<boolean> {
  const entry = await db.entries.get(id);
  if (!entry) return false;
  if (!isToday(entry.entry_date)) return false;

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

  await db.entries.update(id, updates);
  return true;
}

// Delete an entry (only if still today)
export async function deleteEntry(id: string): Promise<boolean> {
  const entry = await db.entries.get(id);
  if (!entry) return false;
  if (!isToday(entry.entry_date)) return false;

  await db.entries.delete(id);
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
  return JSON.stringify({ entries, settings, exportedAt: new Date().toISOString() }, null, 2);
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
}
