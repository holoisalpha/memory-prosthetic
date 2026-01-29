import { v4 as uuid } from 'uuid';
import { supabase } from './supabase';
import { addToSyncQueue, isOnline } from './syncQueue';
import type { MemoryEntry } from './types';

const BUCKET = 'memory-photos';

// Check if a URL is a Supabase Storage URL
export function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase.co/storage');
}

// Check if a URL is a base64 data URL
export function isBase64Url(url: string): boolean {
  return url.startsWith('data:');
}

// Convert base64 data URL to Blob
export function base64ToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Upload a photo to Supabase Storage
export async function uploadPhoto(
  file: File | Blob,
  userId: string
): Promise<string> {
  const ext = file.type.split('/')[1] || 'jpg';
  const path = `${userId}/${uuid()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000' // 1 year cache
    });

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  // Get public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Upload a base64 photo
export async function uploadBase64Photo(
  dataUrl: string,
  userId: string
): Promise<string> {
  const blob = base64ToBlob(dataUrl);
  return uploadPhoto(blob, userId);
}

// Delete a photo from Supabase Storage
export async function deletePhoto(url: string, _userId: string): Promise<void> {
  if (!isSupabaseUrl(url)) return;

  // Extract path from URL
  const urlObj = new URL(url);
  const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/memory-photos\/(.+)/);
  if (!pathMatch) return;

  const path = pathMatch[1];

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error('Failed to delete photo:', error);
  }
}

// Upload photo with offline support
export async function uploadPhotoWithQueue(
  file: File | Blob | string,
  userId: string
): Promise<string> {
  // If it's already a Supabase URL, return it
  if (typeof file === 'string' && isSupabaseUrl(file)) {
    return file;
  }

  // If offline, queue for later and return the original
  if (!isOnline()) {
    if (typeof file === 'string') {
      // Queue the base64 for later upload
      await addToSyncQueue('photo', { dataUrl: file, userId });
      return file; // Return base64 for now
    }
    // Can't queue File/Blob when offline - need to convert first
    return ''; // This shouldn't happen in practice
  }

  // Online - upload immediately
  try {
    if (typeof file === 'string' && isBase64Url(file)) {
      return await uploadBase64Photo(file, userId);
    } else if (file instanceof Blob) {
      return await uploadPhoto(file, userId);
    }
    return file as string;
  } catch (error) {
    console.error('Photo upload failed:', error);
    // If upload fails, queue for retry
    if (typeof file === 'string' && isBase64Url(file)) {
      await addToSyncQueue('photo', { dataUrl: file, userId });
    }
    throw error;
  }
}

// Migrate base64 photos in an entry to Supabase Storage
export async function migrateEntryPhotos(
  entry: MemoryEntry,
  userId: string
): Promise<string[]> {
  if (!entry.photo_urls?.length) return [];

  const newUrls: string[] = [];

  for (const url of entry.photo_urls) {
    if (isSupabaseUrl(url)) {
      // Already uploaded
      newUrls.push(url);
    } else if (isBase64Url(url)) {
      try {
        const newUrl = await uploadBase64Photo(url, userId);
        newUrls.push(newUrl);
      } catch (error) {
        console.error('Failed to migrate photo:', error);
        // Keep the base64 URL if migration fails
        newUrls.push(url);
      }
    } else {
      // Unknown URL type, keep as-is
      newUrls.push(url);
    }
  }

  return newUrls;
}

// Get estimated size of base64 photos in bytes
export function getBase64Size(dataUrl: string): number {
  if (!isBase64Url(dataUrl)) return 0;
  const base64 = dataUrl.split(',')[1];
  return Math.round((base64.length * 3) / 4);
}

// Check if entry has any base64 photos (not migrated)
export function hasUnmigratedPhotos(entry: MemoryEntry): boolean {
  return entry.photo_urls?.some(isBase64Url) ?? false;
}
