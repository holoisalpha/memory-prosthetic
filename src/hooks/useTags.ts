import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

// Get all unique tags used across entries
export function useTags() {
  const allTags = useLiveQuery(async () => {
    const entries = await db.entries.toArray();
    const tagSet = new Set<string>();

    for (const entry of entries) {
      if (entry.tags) {
        for (const tag of entry.tags) {
          tagSet.add(tag);
        }
      }
    }

    return Array.from(tagSet).sort();
  }, []);

  return {
    allTags: allTags || [],
    loading: allTags === undefined
  };
}

// Get tag counts
export function useTagCounts() {
  return useLiveQuery(async () => {
    const entries = await db.entries.toArray();
    const counts = new Map<string, number>();

    for (const entry of entries) {
      if (entry.tags) {
        for (const tag of entry.tags) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, []);
}

// Get popular tags (most used)
export function usePopularTags(limit = 10) {
  const tagCounts = useTagCounts();
  return tagCounts?.slice(0, limit).map(t => t.tag) || [];
}
