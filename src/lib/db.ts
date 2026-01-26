import Dexie, { type Table } from 'dexie';
import type { MemoryEntry, Settings } from './types';

class MemoryDatabase extends Dexie {
  entries!: Table<MemoryEntry>;
  settings!: Table<Settings>;

  constructor() {
    super('memory-prosthetic');
    this.version(1).stores({
      entries: 'id, entry_date, type, tone, created_at',
      settings: 'id'
    });
  }
}

export const db = new MemoryDatabase();

// Initialize default settings if not present, or migrate existing settings
export async function initSettings(): Promise<Settings> {
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

// Helper: Get local date string (YYYY-MM-DD)
export function getLocalDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

// Helper: Check if a date string is today (local time)
export function isToday(dateString: string): boolean {
  return dateString === getLocalDateString();
}

// Helper: Check if entry is editable (only editable on same day)
export function isEntryEditable(entry: MemoryEntry): boolean {
  return isToday(entry.entry_date);
}
