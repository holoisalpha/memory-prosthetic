// Core data types for Memory Prosthetic

export type MemoryType = 'moment' | 'thought' | 'win' | 'gratitude';
export type Tone = 'neutral' | 'light' | 'heavy';

export interface MemoryEntry {
  id: string;
  created_at: string;      // ISO timestamp
  entry_date: string;      // YYYY-MM-DD (local)
  type: MemoryType;
  content: string;         // max 240 characters
  tone: Tone;
  photo_url?: string;      // optional, max 1 per day
  highlighted?: boolean;   // marked as a core memory / highlight
  is_standalone_highlight?: boolean; // bypasses daily limits, for past life events
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
