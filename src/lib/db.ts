import Dexie, { type Table } from 'dexie';
import type { MemoryEntry, Settings, BucketItem } from './types';

class MemoryDatabase extends Dexie {
  entries!: Table<MemoryEntry>;
  settings!: Table<Settings>;
  bucket!: Table<BucketItem>;

  constructor() {
    super('memory-prosthetic');
    this.version(1).stores({
      entries: 'id, entry_date, type, tone, created_at',
      settings: 'id'
    });
    this.version(2).stores({
      entries: 'id, entry_date, type, tone, created_at',
      settings: 'id',
      bucket: 'id, completed, created_at'
    });
  }
}

export const db = new MemoryDatabase();

// Helper: Get local date string (YYYY-MM-DD)
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Check if a date string is today (local time)
export function isToday(dateString: string): boolean {
  return dateString === getLocalDateString();
}

// Helper: Check if entry is editable (only editable on same day)
export function isEntryEditable(entry: MemoryEntry): boolean {
  return isToday(entry.entry_date);
}

// Migration: Fix entry dates that were stored with UTC instead of local time
async function migrateEntryDatesToLocal() {
  const migrated = localStorage.getItem('entry_dates_migrated');
  if (migrated) return;

  const entries = await db.entries.toArray();
  for (const entry of entries) {
    const createdAt = new Date(entry.created_at);
    const correctLocalDate = getLocalDateString(createdAt);
    if (entry.entry_date !== correctLocalDate) {
      await db.entries.update(entry.id, { entry_date: correctLocalDate });
    }
  }
  localStorage.setItem('entry_dates_migrated', 'true');
}

// Migration: Convert photo_url to photo_urls array
async function migratePhotoUrlToPhotosArray() {
  const migrated = localStorage.getItem('photo_urls_migrated');
  if (migrated) return;

  const entries = await db.entries.toArray();
  for (const entry of entries) {
    if (entry.photo_url && !entry.photo_urls) {
      await db.entries.update(entry.id, {
        photo_urls: [entry.photo_url],
        photo_url: undefined
      });
    }
  }
  localStorage.setItem('photo_urls_migrated', 'true');
}

// Initialize default settings if not present, or migrate existing settings
export async function initSettings(): Promise<Settings> {
  // Run migrations
  await migrateEntryDatesToLocal();
  await migratePhotoUrlToPhotosArray();

  const existing = await db.settings.get('default');

  const defaults: Settings = {
    id: 'default',
    resurfacing_enabled: false,
    notifications_enabled: false,
    morning_reminder_time: '08:00',
    evening_reminder_time: '20:00'
  };

  if (!existing) {
    await db.settings.put(defaults);
    return defaults;
  }

  // Migrate: add any missing fields to existing settings
  const updated: Settings = {
    ...defaults,
    ...existing
  };

  // Only update if there are new fields
  if (JSON.stringify(existing) !== JSON.stringify(updated)) {
    await db.settings.put(updated);
  }

  return updated;
}
