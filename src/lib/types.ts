// Core data types for Memory Prosthetic

export type MemoryType = 'moment' | 'thought' | 'win' | 'gratitude';
export type Tone = 'neutral' | 'light' | 'heavy';
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export interface MemoryEntry {
  id: string;
  created_at: string;      // ISO timestamp
  entry_date: string;      // YYYY-MM-DD in ET
  type: MemoryType;
  content: string;         // no character limit
  tone: Tone;
  photo_url?: string;      // deprecated, kept for migration
  photo_urls?: string[];   // optional, max 9 photos per entry
  highlighted?: boolean;   // marked as a core memory / highlight
  is_standalone_highlight?: boolean; // bypasses daily limits, for past life events
  tags?: string[];         // custom tags
  people?: string[];       // array of person IDs tagged in this memory
}

// Person for tagging in memories (foundation for personal CRM)
export interface Person {
  id: string;
  name: string;
  photo_url?: string;      // optional profile photo
  notes?: string;          // optional notes about this person
  created_at: string;      // ISO timestamp
  updated_at?: string;     // ISO timestamp
}

// Spaced repetition data per entry (SM-2 algorithm)
export interface ReviewStats {
  entryId: string;
  easeFactor: number;      // starts at 2.5
  interval: number;        // days until next review
  nextReviewDate: string;  // YYYY-MM-DD
  repetitions: number;     // successful reviews in a row
  lastReviewed?: string;   // ISO timestamp
}

// Offline sync queue item
export interface SyncQueueItem {
  id: string;
  type: 'entry' | 'bucket' | 'photo' | 'delete_entry' | 'delete_bucket' | 'person' | 'delete_person';
  payload: any;
  created_at: string;
  retries: number;
  lastError?: string;
}

export interface DayData {
  date: string;            // YYYY-MM-DD
  entries: MemoryEntry[];
  hasPhoto: boolean;
}

export interface Settings {
  id: string;
  resurfacing_enabled: boolean;
  last_resurfaced_date?: string;
  notifications_enabled: boolean;
  morning_reminder_time?: string;  // HH:MM format, e.g. "08:00"
  evening_reminder_time?: string;  // HH:MM format, e.g. "20:00"
}

export interface Prompt {
  id: string;
  text: string;
  type?: MemoryType;       // optional suggested type
}

export interface BucketItem {
  id: string;
  content: string;         // max 240 characters
  completed: boolean;
  created_at: string;      // ISO timestamp
  completed_at?: string;   // ISO timestamp when completed
}
