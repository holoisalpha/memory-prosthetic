import { supabase } from './supabase';
import { db } from './db';
import { addToSyncQueue, retryWithBackoff, isOnline } from './syncQueue';
import { migrateEntryPhotos, hasUnmigratedPhotos } from './photoStorage';
import type { MemoryEntry, BucketItem, Settings, SyncStatus, Person } from './types';

// Sync status
let isSyncing = false;
let lastSyncTime: string | null = null;
let currentSyncStatus: SyncStatus = 'idle';

// Status change listeners
type StatusListener = (status: SyncStatus) => void;
const statusListeners: Set<StatusListener> = new Set();

export function subscribeSyncStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener(currentSyncStatus);
  return () => statusListeners.delete(listener);
}

function setSyncStatus(status: SyncStatus) {
  currentSyncStatus = status;
  statusListeners.forEach(l => l(status));
}

export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

// Upload local data to Supabase (for initial migration)
export async function uploadAllToCloud(userId: string): Promise<{ entries: number; bucket: number; error?: string }> {
  if (!userId) return { entries: 0, bucket: 0, error: 'Not logged in' };

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
        user_id: userId,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (!error) entriesUploaded++;
    }

    // Upload bucket items
    for (const item of localBucket) {
      const { error } = await supabase.from('bucket_items').upsert({
        ...item,
        user_id: userId,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (!error) bucketUploaded++;
    }

    // Upload settings
    if (localSettings) {
      await supabase.from('settings').upsert({
        ...localSettings,
        id: userId,
        user_id: userId,
      }, { onConflict: 'id' });
    }

    lastSyncTime = new Date().toISOString();
    return { entries: entriesUploaded, bucket: bucketUploaded };
  } catch (err) {
    return { entries: 0, bucket: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Download cloud data to local (for new device)
export async function downloadAllFromCloud(userId: string): Promise<{ entries: number; bucket: number; error?: string }> {
  if (!userId) return { entries: 0, bucket: 0, error: 'Not logged in' };

  try {
    let entriesDownloaded = 0;
    let bucketDownloaded = 0;

    // Download entries
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId);

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
      .eq('user_id', userId);

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
      .eq('user_id', userId)
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

// Sync a single entry to cloud with retry and offline queue
export async function syncEntryToCloud(entry: MemoryEntry, userId: string): Promise<boolean> {
  if (!userId) return false;

  // If offline, queue for later
  if (!isOnline()) {
    await addToSyncQueue('entry', entry);
    setSyncStatus('offline');
    return true; // Queued successfully
  }

  try {
    // Migrate photos if needed
    let entryToSync = entry;
    if (hasUnmigratedPhotos(entry)) {
      const migratedUrls = await migrateEntryPhotos(entry, userId);
      if (migratedUrls.length > 0) {
        entryToSync = { ...entry, photo_urls: migratedUrls };
        // Update local entry with migrated URLs
        await db.entries.update(entry.id, { photo_urls: migratedUrls });
      }
    }

    await retryWithBackoff(async () => {
      const { error } = await supabase.from('entries').upsert({
        ...entryToSync,
        user_id: userId,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;
    }, 3);

    return true;
  } catch (error) {
    console.error('Sync failed, queuing for later:', error);
    await addToSyncQueue('entry', entry);
    setSyncStatus('error');
    return false;
  }
}

// Delete entry from cloud with retry and offline queue
export async function deleteEntryFromCloud(id: string, userId: string): Promise<boolean> {
  if (!userId) return false;

  if (!isOnline()) {
    await addToSyncQueue('delete_entry', { id });
    return true;
  }

  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase.from('entries').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    }, 3);
    return true;
  } catch (error) {
    console.error('Delete sync failed, queuing:', error);
    await addToSyncQueue('delete_entry', { id });
    return false;
  }
}

// Sync a bucket item to cloud with retry and offline queue
export async function syncBucketItemToCloud(item: BucketItem, userId: string): Promise<boolean> {
  if (!userId) return false;

  if (!isOnline()) {
    await addToSyncQueue('bucket', item);
    return true;
  }

  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase.from('bucket_items').upsert({
        ...item,
        user_id: userId,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;
    }, 3);
    return true;
  } catch (error) {
    console.error('Bucket sync failed, queuing:', error);
    await addToSyncQueue('bucket', item);
    return false;
  }
}

// Delete bucket item from cloud with retry and offline queue
export async function deleteBucketItemFromCloud(id: string, userId: string): Promise<boolean> {
  if (!userId) return false;

  if (!isOnline()) {
    await addToSyncQueue('delete_bucket', { id });
    return true;
  }

  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase.from('bucket_items').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    }, 3);
    return true;
  } catch (error) {
    console.error('Delete bucket sync failed, queuing:', error);
    await addToSyncQueue('delete_bucket', { id });
    return false;
  }
}

// Sync a person to cloud with retry and offline queue
export async function syncPersonToCloud(person: Person, userId: string): Promise<boolean> {
  if (!userId) return false;

  if (!isOnline()) {
    await addToSyncQueue('person', person);
    return true;
  }

  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase.from('people').upsert({
        ...person,
        user_id: userId,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;
    }, 3);
    return true;
  } catch (error) {
    console.error('Person sync failed, queuing:', error);
    await addToSyncQueue('person', person);
    return false;
  }
}

// Delete person from cloud with retry and offline queue
export async function deletePersonFromCloud(id: string, userId: string): Promise<boolean> {
  if (!userId) return false;

  if (!isOnline()) {
    await addToSyncQueue('delete_person', { id });
    return true;
  }

  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase.from('people').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    }, 3);
    return true;
  } catch (error) {
    console.error('Delete person sync failed, queuing:', error);
    await addToSyncQueue('delete_person', { id });
    return false;
  }
}

// Full bidirectional sync
export async function fullSync(userId: string): Promise<{ uploaded: number; downloaded: number; error?: string }> {
  if (isSyncing) return { uploaded: 0, downloaded: 0, error: 'Sync already in progress' };
  if (!userId) return { uploaded: 0, downloaded: 0, error: 'Not logged in' };

  isSyncing = true;
  let uploaded = 0;
  let downloaded = 0;

  try {
    // Get all local entries
    const localEntries = await db.entries.toArray();
    const localBucket = await db.bucket.toArray();

    // Get all cloud entries
    const { data: cloudEntries } = await supabase.from('entries').select('*').eq('user_id', userId);
    const { data: cloudBucket } = await supabase.from('bucket_items').select('*').eq('user_id', userId);

    // Create maps for quick lookup
    const localEntryMap = new Map(localEntries.map(e => [e.id, e]));
    const cloudEntryMap = new Map((cloudEntries || []).map(e => [e.id, e]));
    const localBucketMap = new Map(localBucket.map(b => [b.id, b]));
    const cloudBucketMap = new Map((cloudBucket || []).map(b => [b.id, b]));

    // Upload local entries not in cloud
    for (const entry of localEntries) {
      if (!cloudEntryMap.has(entry.id)) {
        await syncEntryToCloud(entry, userId);
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
        await syncBucketItemToCloud(item, userId);
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

    // Sync people
    const localPeople = await db.people.toArray();
    const { data: cloudPeople } = await supabase.from('people').select('*').eq('user_id', userId);

    const localPeopleMap = new Map(localPeople.map(p => [p.id, p]));
    const cloudPeopleMap = new Map((cloudPeople || []).map(p => [p.id, p]));

    for (const person of localPeople) {
      if (!cloudPeopleMap.has(person.id)) {
        await syncPersonToCloud(person, userId);
        uploaded++;
      }
    }

    for (const person of cloudPeople || []) {
      if (!localPeopleMap.has(person.id)) {
        const { user_id, synced_at, ...localPerson } = person;
        await db.people.add(localPerson as Person);
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
