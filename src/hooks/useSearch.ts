import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { MemoryEntry, MemoryType, Tone } from '../lib/types';

export interface SearchFilters {
  type?: MemoryType;
  tone?: Tone;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  highlighted?: boolean;
}

export function useSearch(query: string, filters?: SearchFilters) {
  const [results, setResults] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no query and no filters, return empty
    if (!query.trim() && !filters?.type && !filters?.tone && !filters?.tags?.length && !filters?.highlighted) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const searchEntries = async () => {
      const entries = await db.entries.toArray();
      const q = query.toLowerCase().trim();

      const matched = entries.filter(entry => {
        // Content search
        if (q && !entry.content.toLowerCase().includes(q)) {
          return false;
        }

        // Type filter
        if (filters?.type && entry.type !== filters.type) {
          return false;
        }

        // Tone filter
        if (filters?.tone && entry.tone !== filters.tone) {
          return false;
        }

        // Date range filter
        if (filters?.startDate && entry.entry_date < filters.startDate) {
          return false;
        }
        if (filters?.endDate && entry.entry_date > filters.endDate) {
          return false;
        }

        // Tag filter
        if (filters?.tags?.length) {
          const entryTags = entry.tags || [];
          const hasMatchingTag = filters.tags.some(t => entryTags.includes(t));
          if (!hasMatchingTag) return false;
        }

        // Highlighted filter
        if (filters?.highlighted !== undefined && entry.highlighted !== filters.highlighted) {
          return false;
        }

        return true;
      });

      // Sort by date (newest first)
      matched.sort((a, b) => b.entry_date.localeCompare(a.entry_date));

      setResults(matched);
      setLoading(false);
    };

    // Debounce search
    const timer = setTimeout(searchEntries, 150);
    return () => clearTimeout(timer);
  }, [query, filters?.type, filters?.tone, filters?.tags, filters?.startDate, filters?.endDate, filters?.highlighted]);

  return { results, loading };
}

// Search function for non-hook usage
export async function searchEntries(
  query: string,
  filters?: SearchFilters
): Promise<MemoryEntry[]> {
  const entries = await db.entries.toArray();
  const q = query.toLowerCase().trim();

  return entries.filter(entry => {
    if (q && !entry.content.toLowerCase().includes(q)) return false;
    if (filters?.type && entry.type !== filters.type) return false;
    if (filters?.tone && entry.tone !== filters.tone) return false;
    if (filters?.startDate && entry.entry_date < filters.startDate) return false;
    if (filters?.endDate && entry.entry_date > filters.endDate) return false;
    if (filters?.tags?.length) {
      const entryTags = entry.tags || [];
      if (!filters.tags.some(t => entryTags.includes(t))) return false;
    }
    if (filters?.highlighted !== undefined && entry.highlighted !== filters.highlighted) return false;
    return true;
  }).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
}
