import { useState } from 'react';
import { usePeopleWithMemoryCount, useEntriesForPerson, deletePerson, updatePerson, addPerson } from '../hooks/usePeople';
import { MemoryCard } from '../components/MemoryCard';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Person, MemoryEntry } from '../lib/types';

interface Props {
  onBack: () => void;
  onEditMemory?: (entry: MemoryEntry) => void;
  onDeleteMemory?: (id: string) => void;
}

export function People({ onBack, onEditMemory, onDeleteMemory }: Props) {
  const peopleWithCounts = usePeopleWithMemoryCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const filteredPeople = (peopleWithCounts || []).filter(
    p => p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;
    await addPerson(newPersonName.trim());
    setNewPersonName('');
    setShowAddPerson(false);
  };

  const handleDeletePerson = async (person: Person) => {
    if (!confirm(`Delete ${person.name}? They will be removed from all memories.`)) return;
    await deletePerson(person.id);
    if (selectedPerson?.id === person.id) {
      setSelectedPerson(null);
    }
  };

  const handleUpdatePerson = async () => {
    if (!editingPerson || !editingPerson.name.trim()) return;
    await updatePerson(editingPerson.id, { name: editingPerson.name.trim(), notes: editingPerson.notes });
    setEditingPerson(null);
  };

  if (!peopleWithCounts) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Person detail view
  if (selectedPerson) {
    return (
      <PersonDetail
        person={selectedPerson}
        onBack={() => setSelectedPerson(null)}
        onEditMemory={onEditMemory}
        onDeleteMemory={onDeleteMemory}
        onEdit={() => setEditingPerson(selectedPerson)}
        onDelete={() => handleDeletePerson(selectedPerson)}
      />
    );
  }

  // Edit person modal
  if (editingPerson) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setEditingPerson(null)}
            className="text-stone-500 text-sm"
          >
            Cancel
          </button>
          <h1 className="font-medium text-stone-900">Edit Person</h1>
          <button
            onClick={handleUpdatePerson}
            className="text-stone-900 font-medium text-sm"
          >
            Save
          </button>
        </header>
        <main className="px-4 py-6 space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-xs text-stone-400 uppercase tracking-wide mb-2">Name</label>
            <input
              type="text"
              value={editingPerson.name}
              onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-stone-400 uppercase tracking-wide mb-2">Notes (optional)</label>
            <textarea
              value={editingPerson.notes || ''}
              onChange={(e) => setEditingPerson({ ...editingPerson, notes: e.target.value })}
              placeholder="How do you know them? Any notes..."
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm h-24 resize-none"
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-stone-500 text-sm">
            Back
          </button>
          <h1 className="font-medium text-stone-900">People</h1>
          <button
            onClick={() => setShowAddPerson(true)}
            className="text-stone-900 font-medium text-sm"
          >
            + Add
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          {peopleWithCounts.length} people in your memories
        </p>
      </header>

      {/* Search */}
      <div className="bg-white border-b border-stone-200 px-4 py-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search people..."
        />
      </div>

      {/* Add person form */}
      {showAddPerson && (
        <div className="bg-white border-b border-stone-200 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
              placeholder="Enter name..."
              className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm"
              autoFocus
            />
            <button
              onClick={handleAddPerson}
              disabled={!newPersonName.trim()}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddPerson(false); setNewPersonName(''); }}
              className="px-3 py-2 text-stone-500 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <main className="px-4 py-6 max-w-md mx-auto">
        {filteredPeople.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-400 text-sm">
              {searchQuery ? 'No people found.' : 'No people yet. Tag someone in a memory to add them.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPeople.map(person => (
              <button
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                className="w-full bg-white rounded-lg border border-stone-200 p-4 flex items-center gap-3 hover:border-stone-300 transition-colors text-left"
              >
                {person.photo_url ? (
                  <img
                    src={person.photo_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 text-lg font-medium">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">{person.name}</p>
                  <p className="text-xs text-stone-400">
                    {person.memoryCount} {person.memoryCount === 1 ? 'memory' : 'memories'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Person detail view component
function PersonDetail({
  person,
  onBack,
  onEditMemory,
  onDeleteMemory,
  onEdit,
  onDelete
}: {
  person: Person;
  onBack: () => void;
  onEditMemory?: (entry: MemoryEntry) => void;
  onDeleteMemory?: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const entries = useEntriesForPerson(person.id);
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-stone-500 text-sm">
            Back
          </button>
          <h1 className="font-medium text-stone-900">{person.name}</h1>
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-stone-500 text-sm"
          >
            •••
          </button>
        </div>
      </header>

      {/* Actions dropdown */}
      {showActions && (
        <div className="bg-white border-b border-stone-200 px-4 py-2 flex gap-4">
          <button onClick={() => { onEdit(); setShowActions(false); }} className="text-sm text-stone-600">
            Edit
          </button>
          <button onClick={() => { onDelete(); setShowActions(false); }} className="text-sm text-red-500">
            Delete
          </button>
        </div>
      )}

      {/* Person info */}
      <div className="bg-white border-b border-stone-200 px-4 py-6">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt=""
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 text-2xl font-medium">
              {person.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-stone-900">{person.name}</h2>
            <p className="text-sm text-stone-400">
              {entries?.length || 0} memories together
            </p>
            {person.notes && (
              <p className="text-sm text-stone-500 mt-1">{person.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Memories */}
      <main className="px-4 py-6 space-y-3 max-w-md mx-auto">
        <h3 className="text-sm font-medium text-stone-700">Memories</h3>

        {!entries ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-8">
            No memories with {person.name} yet.
          </p>
        ) : (
          entries.map(entry => (
            <MemoryCard
              key={entry.id}
              entry={entry}
              showDate
              onEdit={onEditMemory}
              onDelete={onDeleteMemory}
            />
          ))
        )}
      </main>
    </div>
  );
}
