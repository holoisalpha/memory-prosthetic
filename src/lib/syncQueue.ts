import { v4 as uuid } from 'uuid';
import { db } from './db';
import { supabase } from './supabase';
import type { SyncQueueItem, MemoryEntry, BucketItem } from './types';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000; // 1 second

// Exponential backoff retry
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = BASE_DELAY * Math.pow(2, i); // 1s, 2s, 4s, 8s, 16s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Add item to sync queue
export async function addToSyncQueue(
  type: SyncQueueItem['type'],
  payload: any
): Promise<void> {
  const item: SyncQueueItem = {
    id: uuid(),
    type,
    payload,
    created_at: new Date().toISOString(),
    retries: 0
  };

  await db.syncQueue.add(item);
}

// Process a single queue item
async function processQueueItem(item: SyncQueueItem, userId: string): Promise<void> {
  switch (item.type) {
    case 'entry': {
      const entry = item.payload as MemoryEntry;
      const { error } = await supabase.from('entries').upsert({
        ...entry,
        user_id: userId,
        synced_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw error;
      break;
    }

    case 'bucket': {
      const bucketItem = item.payload as BucketItem;
      const { error } = await supabase.from('bucket_items').upsert({
        ...bucketItem,
        user_id: userId,
        synced_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw error;
      break;
    }

    case 'delete_entry': {
      const { id } = item.payload as { id: string };
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      break;
    }

    case 'delete_bucket': {
      const { id } = item.payload as { id: string };
      const { error } = await supabase
        .from('bucket_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      break;
    }

    case 'photo': {
      // Photo uploads handled separately
      break;
    }
  }
}

// Process entire sync queue
export async function processSyncQueue(userId: string): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  const queue = await db.syncQueue.orderBy('created_at').toArray();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await retryWithBackoff(() => processQueueItem(item, userId), 3);
      await db.syncQueue.delete(item.id);
      synced++;
    } catch (error) {
      const err = error as Error;
      await db.syncQueue.update(item.id, {
        retries: item.retries + 1,
        lastError: err.message
      });

      // Remove items that have exceeded max retries
      if (item.retries + 1 >= MAX_RETRIES) {
        console.error(`Sync item ${item.id} exceeded max retries, removing`);
        await db.syncQueue.delete(item.id);
      }
      failed++;
    }
  }

  const remaining = await db.syncQueue.count();
  return { synced, failed, remaining };
}

// Get pending sync count
export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.count();
}

// Clear sync queue (for debugging/reset)
export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear();
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Sync when back online
export function setupOnlineListener(userId: string): () => void {
  const handler = () => {
    if (navigator.onLine && userId) {
      processSyncQueue(userId).catch(console.error);
    }
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
