import type { MemoryEntry, MemoryType } from '../lib/types';
import { isToday } from '../lib/db';

const typeLabels: Record<MemoryType, string> = {
  moment: 'Moment',
  thought: 'Thought',
  win: 'Win',
  gratitude: 'Gratitude'
};

const typeColors: Record<MemoryType, string> = {
  moment: 'bg-stone-100 text-stone-600',
  thought: 'bg-slate-100 text-slate-600',
  win: 'bg-amber-50 text-amber-700',
  gratitude: 'bg-rose-50 text-rose-600'
};

interface Props {
  entry: MemoryEntry;
  onEdit?: (entry: MemoryEntry) => void;
  onDelete?: (id: string) => void;
  showDate?: boolean;
}

export function MemoryCard({ entry, onEdit, onDelete, showDate }: Props) {
  const editable = isToday(entry.entry_date);

  return (
    <article className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
      <header className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[entry.type]}`}>
          {typeLabels[entry.type]}
        </span>
        {showDate && (
          <time className="text-xs text-stone-400">
            {new Date(entry.entry_date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </time>
        )}
        {entry.tone !== 'neutral' && (
          <span className="text-xs text-stone-400">
            {entry.tone === 'light' ? 'light' : 'heavy'}
          </span>
        )}
      </header>

      <p className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap">
        {entry.content}
      </p>

      {entry.photo_url && (
        <img
          src={entry.photo_url}
          alt=""
          className="w-full rounded-md object-cover max-h-48"
        />
      )}

      {editable && (onEdit || onDelete) && (
        <footer className="flex gap-3 pt-2 border-t border-stone-100">
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="text-xs text-stone-500 hover:text-stone-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              className="text-xs text-stone-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
