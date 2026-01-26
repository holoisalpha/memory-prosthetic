import { useEntriesForDate } from '../hooks/useMemories';
import { MemoryCard } from '../components/MemoryCard';
import { isToday } from '../lib/db';
import type { MemoryEntry } from '../lib/types';

interface Props {
  date: string; // YYYY-MM-DD
  onBack: () => void;
  onEditMemory: (entry: MemoryEntry) => void;
  onDeleteMemory: (id: string) => void;
}

export function DayDetail({ date, onBack, onEditMemory, onDeleteMemory }: Props) {
  const entries = useEntriesForDate(date);
  const editable = isToday(date);

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <button
          onClick={onBack}
          className="text-stone-500 hover:text-stone-700 text-sm mb-2"
        >
          ← Back
        </button>
        <h1 className="font-medium text-stone-900">{formattedDate}</h1>
        {!editable && (
          <p className="text-xs text-stone-400 mt-1">Read-only</p>
        )}
      </header>

      <main className="px-4 py-6 space-y-3 max-w-md mx-auto">
        {entries?.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">
            No memories for this day.
          </p>
        )}

        {entries?.map(entry => (
          <MemoryCard
            key={entry.id}
            entry={entry}
            onEdit={editable ? onEditMemory : undefined}
            onDelete={editable ? onDeleteMemory : undefined}
          />
        ))}
      </main>
    </div>
  );
}
