import type { MemoryEntry, MemoryType } from '../lib/types';
import { isToday } from '../lib/db';
import { toggleHighlight } from '../hooks/useMemories';

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
  hideHighlightButton?: boolean;
}

export function MemoryCard({ entry, onEdit, onDelete, showDate, hideHighlightButton }: Props) {
  const editable = isToday(entry.entry_date);

  const timeString = new Date(entry.created_at).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  const handleToggleHighlight = async () => {
    await toggleHighlight(entry.id);
  };

  return (
    <article className={`bg-white rounded-lg border p-4 space-y-3 ${entry.highlighted ? 'border-amber-300 ring-1 ring-amber-100' : 'border-stone-200'}`}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[entry.type]}`}>
            {typeLabels[entry.type]}
          </span>
          <span className="text-xs text-stone-400">{timeString}</span>
        </div>
        <div className="flex items-center gap-2">
          {showDate && (
            <time className="text-xs text-stone-400">
              {new Date(entry.entry_date + 'T12:00:00').toLocaleDateString(undefined, {
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
          {!hideHighlightButton && (
            <button
              onClick={handleToggleHighlight}
              className={`p-1 rounded transition-colors ${entry.highlighted ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'}`}
              aria-label={entry.highlighted ? 'Remove from highlights' : 'Add to highlights'}
            >
              <svg className="w-5 h-5" fill={entry.highlighted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>
          )}
        </div>
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
