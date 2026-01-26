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

// Initialize default settings if not present
export async function initSettings(): Promise<Settings> {
  const existing = await db.settings.get('default');
  if (existing) return existing;

  const settings: Settings = {
    id: 'default',
    resurfacing_enabled: false
  };
  await db.settings.put(settings);
  return settings;
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
