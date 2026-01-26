import { useEffect, useState } from 'react';
import { useTodaysEntries, useSettings, canAddEntry, getResurfacedMemory } from '../hooks/useMemories';
import { getTodaysPrompt } from '../data/prompts';
import { MemoryCard } from '../components/MemoryCard';
import type { MemoryEntry } from '../lib/types';

interface Props {
  onAddMemory: () => void;
  onEditMemory: (entry: MemoryEntry) => void;
  onDeleteMemory: (id: string) => void;
}

export function Home({ onAddMemory, onEditMemory, onDeleteMemory }: Props) {
  const entries = useTodaysEntries();
  const settings = useSettings();
  const [resurfaced, setResurfaced] = useState<MemoryEntry | null>(null);
  const prompt = getTodaysPrompt();

  const canAdd = canAddEntry(entries);
  const entryCount = entries?.length ?? 0;

  useEffect(() => {
    if (settings?.resurfacing_enabled) {
      getResurfacedMemory().then(setResurfaced);
    }
  }, [settings?.resurfacing_enabled]);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-6">
        <h1 className="text-lg font-medium text-stone-900">Today</h1>
        <p className="text-sm text-stone-500 mt-1">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Today's prompt */}
        {canAdd && (
          <section className="bg-white rounded-lg border border-stone-200 p-4">
            <p className="text-stone-500 text-sm mb-4 italic">
              "{prompt.text}"
            </p>
            <button
              onClick={onAddMemory}
              className="w-full py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Add memory
            </button>
            <p className="text-xs text-stone-400 text-center mt-3">
              {entryCount}/3 entries today
            </p>
          </section>
        )}

        {!canAdd && (
          <section className="bg-stone-100 rounded-lg p-4 text-center">
            <p className="text-stone-600 text-sm">
              You've captured 3 memories today.
            </p>
          </section>
        )}

        {/* Resurfaced memory (if enabled and available) */}
        {resurfaced && (
          <section className="space-y-2">
            <h2 className="text-xs text-stone-400 uppercase tracking-wide">
              From your past
            </h2>
            <MemoryCard entry={resurfaced} showDate />
          </section>
        )}

        {/* Today's entries */}
        {entries && entries.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs text-stone-400 uppercase tracking-wide">
              Today's memories
            </h2>
            {entries.map(entry => (
              <MemoryCard
                key={entry.id}
                entry={entry}
                onEdit={onEditMemory}
                onDelete={onDeleteMemory}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
