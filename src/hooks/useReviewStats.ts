import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { getETDateString } from '../lib/timezone';

// Get all review stats
export function useReviewStats() {
  return useLiveQuery(() => db.reviewStats.toArray());
}

// Get review stats as a map for quick lookup
export function useReviewStatsMap() {
  const stats = useReviewStats();
  if (!stats) return undefined;
  return new Map(stats.map(s => [s.entryId, s]));
}

// Get entries due for review today
export function useDueEntries() {
  return useLiveQuery(async () => {
    const today = getETDateString();
    const entries = await db.entries.toArray();
    const allStats = await db.reviewStats.toArray();
    const statsMap = new Map(allStats.map(s => [s.entryId, s]));

    const dueEntries = entries.filter(entry => {
      const stats = statsMap.get(entry.id);
      if (!stats) return true; // Never reviewed
      return stats.nextReviewDate <= today;
    });

    // Sort by priority
    dueEntries.sort((a, b) => {
      const statsA = statsMap.get(a.id);
      const statsB = statsMap.get(b.id);

      if (!statsA && statsB) return -1;
      if (statsA && !statsB) return 1;
      if (!statsA && !statsB) return 0;

      const dateCompare = statsA!.nextReviewDate.localeCompare(statsB!.nextReviewDate);
      if (dateCompare !== 0) return dateCompare;

      return statsA!.easeFactor - statsB!.easeFactor;
    });

    return dueEntries;
  });
}

// Get due count
export function useDueCount() {
  const dueEntries = useDueEntries();
  return dueEntries?.length ?? 0;
}

// Get review summary stats
export function useReviewSummary() {
  return useLiveQuery(async () => {
    const today = getETDateString();
    const entries = await db.entries.toArray();
    const allStats = await db.reviewStats.toArray();

    const reviewed = allStats.length;
    let dueToday = 0;
    let overdue = 0;
    let totalEaseFactor = 0;
    let totalReviews = 0;

    for (const stats of allStats) {
      totalEaseFactor += stats.easeFactor;
      totalReviews += stats.repetitions;
      if (stats.nextReviewDate === today) {
        dueToday++;
      } else if (stats.nextReviewDate < today) {
        overdue++;
      }
    }

    const neverReviewed = entries.length - reviewed;

    return {
      totalEntries: entries.length,
      reviewed,
      neverReviewed,
      dueToday: dueToday + neverReviewed,
      overdue,
      totalReviews,
      averageEaseFactor: reviewed > 0 ? totalEaseFactor / reviewed : 2.5,
      retentionRate: reviewed > 0
        ? Math.round((1 - (overdue / reviewed)) * 100)
        : 100
    };
  });
}
