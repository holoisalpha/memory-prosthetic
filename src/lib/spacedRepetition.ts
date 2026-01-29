// SM-2 Spaced Repetition Algorithm
// https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm

import { v4 as uuid } from 'uuid';
import { db } from './db';
import { getETDateString, addDays } from './timezone';
import type { ReviewStats, MemoryEntry } from './types';

// Quality ratings
export const QUALITY = {
  FORGOT: 0,        // Complete blackout
  HARD: 3,          // Remembered with significant difficulty
  GOOD: 4,          // Remembered with some hesitation
  EASY: 5           // Perfect recall
} as const;

export type Quality = typeof QUALITY[keyof typeof QUALITY];

// Initialize review stats for a new entry
export function initializeReviewStats(entryId: string): ReviewStats {
  return {
    entryId,
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: getETDateString(), // Due today
    repetitions: 0
  };
}

// Calculate next review based on quality of recall
export function calculateNextReview(quality: Quality, stats: ReviewStats): ReviewStats {
  const now = new Date();

  if (quality < 3) {
    // Failed: reset to beginning
    return {
      ...stats,
      repetitions: 0,
      interval: 1,
      nextReviewDate: getETDateString(addDays(now, 1)),
      lastReviewed: now.toISOString()
    };
  }

  // Successful recall
  let newInterval: number;
  let newEaseFactor = stats.easeFactor;
  const newReps = stats.repetitions + 1;

  if (newReps === 1) {
    newInterval = 1; // Review again tomorrow
  } else if (newReps === 2) {
    newInterval = 6; // Review in 6 days
  } else {
    newInterval = Math.round(stats.interval * stats.easeFactor);
  }

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum 1.3

  return {
    ...stats,
    repetitions: newReps,
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReviewDate: getETDateString(addDays(now, newInterval)),
    lastReviewed: now.toISOString()
  };
}

// Get entries that are due for review
export async function getEntriesDueForReview(): Promise<MemoryEntry[]> {
  const today = getETDateString();
  const entries = await db.entries.toArray();
  const allStats = await db.reviewStats.toArray();
  const statsMap = new Map(allStats.map(s => [s.entryId, s]));

  // Filter to entries that are due
  const dueEntries = entries.filter(entry => {
    const stats = statsMap.get(entry.id);
    if (!stats) {
      // Never reviewed = automatically due
      return true;
    }
    return stats.nextReviewDate <= today;
  });

  // Sort by priority:
  // 1. Overdue entries first (older nextReviewDate)
  // 2. Lower ease factor = harder = review first
  // 3. Never reviewed entries
  dueEntries.sort((a, b) => {
    const statsA = statsMap.get(a.id);
    const statsB = statsMap.get(b.id);

    // Never reviewed goes first
    if (!statsA && statsB) return -1;
    if (statsA && !statsB) return 1;
    if (!statsA && !statsB) return 0;

    // Compare by next review date (older = more overdue)
    const dateCompare = statsA!.nextReviewDate.localeCompare(statsB!.nextReviewDate);
    if (dateCompare !== 0) return dateCompare;

    // Then by ease factor (lower = harder = review first)
    return statsA!.easeFactor - statsB!.easeFactor;
  });

  return dueEntries;
}

// Get or create review stats for an entry
export async function getReviewStats(entryId: string): Promise<ReviewStats> {
  let stats = await db.reviewStats.get(entryId);
  if (!stats) {
    stats = initializeReviewStats(entryId);
    await db.reviewStats.add(stats);
  }
  return stats;
}

// Update review stats after a review
export async function updateReviewStats(entryId: string, quality: Quality): Promise<ReviewStats> {
  const currentStats = await getReviewStats(entryId);
  const newStats = calculateNextReview(quality, currentStats);
  await db.reviewStats.put(newStats);
  return newStats;
}

// Get review statistics summary
export async function getReviewSummary(): Promise<{
  totalEntries: number;
  reviewed: number;
  dueToday: number;
  overdue: number;
  averageEaseFactor: number;
}> {
  const today = getETDateString();
  const entries = await db.entries.toArray();
  const allStats = await db.reviewStats.toArray();

  const reviewed = allStats.length;
  let dueToday = 0;
  let overdue = 0;
  let totalEaseFactor = 0;

  for (const stats of allStats) {
    totalEaseFactor += stats.easeFactor;
    if (stats.nextReviewDate === today) {
      dueToday++;
    } else if (stats.nextReviewDate < today) {
      overdue++;
    }
  }

  // Count entries never reviewed as due
  const neverReviewed = entries.length - reviewed;
  dueToday += neverReviewed;

  return {
    totalEntries: entries.length,
    reviewed,
    dueToday,
    overdue,
    averageEaseFactor: reviewed > 0 ? totalEaseFactor / reviewed : 2.5
  };
}

// Reset review stats for an entry
export async function resetReviewStats(entryId: string): Promise<void> {
  await db.reviewStats.delete(entryId);
}
