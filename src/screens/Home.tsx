import { useEffect, useState } from 'react';
import { useTodaysEntries, useSettings, canAddEntry, getResurfacedMemory } from '../hooks/useMemories';
import { getTodaysPrompt } from '../data/prompts';
import { MemoryCard } from '../components/MemoryCard';
import type { MemoryEntry } from '../lib/types';

interface Props {
  onAddMemory: () => void;
  onEditMemory: (entry: MemoryEntry) => void;
  onDeleteMemory: (id: string) => void;
  onNavigateToTrain: () => void;
  onNavigateToSettings: () => void;
}

export function Home({ onAddMemory, onEditMemory, onDeleteMemory, onNavigateToTrain, onNavigateToSettings }: Props) {
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium text-stone-900">Today</h1>
            <p className="text-sm text-stone-500 mt-1">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToTrain}
              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Train your memory"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </button>
            <button
              onClick={onNavigateToSettings}
              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
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
