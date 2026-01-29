import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import { syncPersonToCloud, deletePersonFromCloud } from '../lib/sync';
import { getCurrentUserId } from './useMemories';
import type { Person } from '../lib/types';

// Get all people
export function usePeople() {
  return useLiveQuery(
    () => db.people.orderBy('name').toArray()
  );
}

// Get a single person by ID
export function usePerson(id: string | null) {
  return useLiveQuery(
    () => id ? db.people.get(id) : undefined,
    [id]
  );
}

// Get people by IDs
export function usePeopleByIds(ids: string[] | undefined) {
  return useLiveQuery(
    async () => {
      if (!ids || ids.length === 0) return [];
      const people = await db.people.bulkGet(ids);
      return people.filter((p): p is Person => p !== undefined);
    },
    [ids?.join(',')]
  );
}

// Get memory count per person
export function usePeopleWithMemoryCount() {
  return useLiveQuery(async () => {
    const people = await db.people.orderBy('name').toArray();
    const entries = await db.entries.toArray();

    return people.map(person => {
      const memoryCount = entries.filter(
        e => e.people?.includes(person.id)
      ).length;
      return { ...person, memoryCount };
    });
  });
}

// Add a new person
export async function addPerson(
  name: string,
  photoUrl?: string,
  notes?: string
): Promise<Person> {
  const person: Person = {
    id: uuid(),
    name: name.trim(),
    photo_url: photoUrl,
    notes: notes?.trim(),
    created_at: new Date().toISOString()
  };

  await db.people.add(person);

  // Auto-sync to cloud
  const userId = getCurrentUserId();
  if (userId) {
    syncPersonToCloud(person, userId).catch(console.error);
  }

  return person;
}

// Update a person
export async function updatePerson(
  id: string,
  updates: Partial<Pick<Person, 'name' | 'photo_url' | 'notes'>>
): Promise<boolean> {
  const person = await db.people.get(id);
  if (!person) return false;

  const updatedPerson = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  await db.people.update(id, updatedPerson);

  // Auto-sync to cloud
  const userId = getCurrentUserId();
  if (userId) {
    const fullPerson = await db.people.get(id);
    if (fullPerson) {
      syncPersonToCloud(fullPerson, userId).catch(console.error);
    }
  }

  return true;
}

// Delete a person
export async function deletePerson(id: string): Promise<boolean> {
  // Remove person from all entries that reference them
  const entries = await db.entries.filter(e => e.people?.includes(id) === true).toArray();
  for (const entry of entries) {
    await db.entries.update(entry.id, {
      people: entry.people?.filter(p => p !== id)
    });
  }

  await db.people.delete(id);

  // Auto-sync to cloud
  const userId = getCurrentUserId();
  if (userId) {
    deletePersonFromCloud(id, userId).catch(console.error);
  }

  return true;
}

// Search people by name
export function useSearchPeople(query: string) {
  return useLiveQuery(
    async () => {
      if (!query.trim()) {
        return db.people.orderBy('name').toArray();
      }
      const q = query.toLowerCase();
      const all = await db.people.toArray();
      return all
        .filter(p => p.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    [query]
  );
}

// Get all entries for a specific person
export function useEntriesForPerson(personId: string | null) {
  return useLiveQuery(
    async () => {
      if (!personId) return [];
      const entries = await db.entries
        .filter(e => e.people?.includes(personId) === true)
        .toArray();
      return entries.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
    },
    [personId]
  );
}
