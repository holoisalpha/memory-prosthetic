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
}

export interface Prompt {
  id: string;
  text: string;
  type?: MemoryType;       // optional suggested type
}
