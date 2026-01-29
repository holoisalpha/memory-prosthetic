import { supabase, getUser } from './supabase';
import { db } from './db';
import type { MemoryEntry, BucketItem, Settings } from './types';

// Sync status
let isSyncing = false;
let lastSyncTime: string | null = null;

// Upload local data to Supabase (for initial migration)
export async function uploadAllToCloud(): Promise<{ entries: number; bucket: number; error?: string }> {
  const user = await getUser();
  if (!user) return { entries: 0, bucket: 0, error: 'Not logged in' };

  try {
    // Get all local entries
    const localEntries = await db.entries.toArray();
    const localBucket = await db.bucket.toArray();
    const localSettings = await db.settings.get('default');

    let entriesUploaded = 0;
    let bucketUploaded = 0;

    // Upload entries
    for (const entry of localEntries) {
      const { error } = await supabase.from('entries').upsert({
        ...entry,
        user_id: user.id,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (!error) entriesUploaded++;
    }

    // Upload bucket items
    for (const item of localBucket) {
      const { error } = await supabase.from('bucket_items').upsert({
        ...item,
        user_id: user.id,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (!error) bucketUploaded++;
    }

    // Upload settings
    if (localSettings) {
      await supabase.from('settings').upsert({
        ...localSettings,
        id: user.id, // Use user ID as settings ID
        user_id: user.id,
      }, { onConflict: 'id' });
    }

    lastSyncTime = new Date().toISOString();
    return { entries: entriesUploaded, bucket: bucketUploaded };
  } catch (err) {
    return { entries: 0, bucket: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Download cloud data to local (for new device)
export async function downloadAllFromCloud(): Promise<{ entries: number; bucket: number; error?: string }> {
  const user = await getUser();
  if (!user) return { entries: 0, bucket: 0, error: 'Not logged in' };

  try {
    let entriesDownloaded = 0;
    let bucketDownloaded = 0;

    // Download entries
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id);

    if (entriesError) throw entriesError;

    for (const entry of entries || []) {
      // Remove Supabase-specific fields
      const { user_id, synced_at, ...localEntry } = entry;
      const existing = await db.entries.get(localEntry.id);
      if (!existing) {
        await db.entries.add(localEntry as MemoryEntry);
        entriesDownloaded++;
      }
    }

    // Download bucket items
    const { data: bucketItems, error: bucketError } = await supabase
      .from('bucket_items')
      .select('*')
      .eq('user_id', user.id);

    if (bucketError) throw bucketError;

    for (const item of bucketItems || []) {
      const { user_id, synced_at, ...localItem } = item;
      const existing = await db.bucket.get(localItem.id);
      if (!existing) {
        await db.bucket.add(localItem as BucketItem);
        bucketDownloaded++;
      }
    }

    // Download settings
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      const { user_id, ...localSettings } = settings;
      await db.settings.put({ ...localSettings, id: 'default' } as Settings);
    }

    lastSyncTime = new Date().toISOString();
    return { entries: entriesDownloaded, bucket: bucketDownloaded };
  } catch (err) {
    return { entries: 0, bucket: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Sync a single entry to cloud
export async function syncEntryToCloud(entry: MemoryEntry): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const { error } = await supabase.from('entries').upsert({
    ...entry,
    user_id: user.id,
    synced_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  return !error;
}

// Delete entry from cloud
export async function deleteEntryFromCloud(id: string): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const { error } = await supabase.from('entries').delete().eq('id', id).eq('user_id', user.id);
  return !error;
}

// Sync a bucket item to cloud
export async function syncBucketItemToCloud(item: BucketItem): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const { error } = await supabase.from('bucket_items').upsert({
    ...item,
    user_id: user.id,
    synced_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  return !error;
}

// Delete bucket item from cloud
export async function deleteBucketItemFromCloud(id: string): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const { error } = await supabase.from('bucket_items').delete().eq('id', id).eq('user_id', user.id);
  return !error;
}

// Full bidirectional sync
export async function fullSync(): Promise<{ uploaded: number; downloaded: number; error?: string }> {
  if (isSyncing) return { uploaded: 0, downloaded: 0, error: 'Sync already in progress' };

  const user = await getUser();
  if (!user) return { uploaded: 0, downloaded: 0, error: 'Not logged in' };

  isSyncing = true;
  let uploaded = 0;
  let downloaded = 0;

  try {
    // Get all local entries
    const localEntries = await db.entries.toArray();
    const localBucket = await db.bucket.toArray();

    // Get all cloud entries
    const { data: cloudEntries } = await supabase.from('entries').select('*').eq('user_id', user.id);
    const { data: cloudBucket } = await supabase.from('bucket_items').select('*').eq('user_id', user.id);

    // Create maps for quick lookup
    const localEntryMap = new Map(localEntries.map(e => [e.id, e]));
    const cloudEntryMap = new Map((cloudEntries || []).map(e => [e.id, e]));
    const localBucketMap = new Map(localBucket.map(b => [b.id, b]));
    const cloudBucketMap = new Map((cloudBucket || []).map(b => [b.id, b]));

    // Upload local entries not in cloud
    for (const entry of localEntries) {
      if (!cloudEntryMap.has(entry.id)) {
        await syncEntryToCloud(entry);
        uploaded++;
      }
    }

    // Download cloud entries not in local
    for (const entry of cloudEntries || []) {
      if (!localEntryMap.has(entry.id)) {
        const { user_id, synced_at, ...localEntry } = entry;
        await db.entries.add(localEntry as MemoryEntry);
        downloaded++;
      }
    }

    // Same for bucket items
    for (const item of localBucket) {
      if (!cloudBucketMap.has(item.id)) {
        await syncBucketItemToCloud(item);
        uploaded++;
      }
    }

    for (const item of cloudBucket || []) {
      if (!localBucketMap.has(item.id)) {
        const { user_id, synced_at, ...localItem } = item;
        await db.bucket.add(localItem as BucketItem);
        downloaded++;
      }
    }

    lastSyncTime = new Date().toISOString();
    return { uploaded, downloaded };
  } catch (err) {
    return { uploaded, downloaded, error: err instanceof Error ? err.message : 'Unknown error' };
  } finally {
    isSyncing = false;
  }
}

export function getLastSyncTime(): string | null {
  return lastSyncTime;
}

export function isCurrentlySyncing(): boolean {
  return isSyncing;
}
