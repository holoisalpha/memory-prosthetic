import { useState } from 'react';
import type { MemoryEntry, MemoryType } from '../lib/types';
import { toggleHighlight } from '../hooks/useMemories';
import { usePeopleByIds } from '../hooks/usePeople';
import { PhotoLightbox } from './PhotoLightbox';

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
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const taggedPeople = usePeopleByIds(entry.people || []);

  const timeString = new Date(entry.created_at).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  const handleToggleHighlight = async () => {
    await toggleHighlight(entry.id);
  };

  return (
    <>
    {/* Lightbox with pinch-to-zoom */}
    {lightboxPhoto && (
      <PhotoLightbox
        src={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />
    )}
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

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Tagged People */}
      {taggedPeople && taggedPeople.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {taggedPeople.map(person => (
            <span
              key={person.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
            >
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 text-[10px] font-medium">
                  {person.name.charAt(0).toUpperCase()}
                </span>
              )}
              {person.name}
            </span>
          ))}
        </div>
      )}

      {/* Support both photo_urls (new) and photo_url (legacy) */}
      {(entry.photo_urls && entry.photo_urls.length > 0) || entry.photo_url ? (() => {
        const photos = entry.photo_urls && entry.photo_urls.length > 0
          ? entry.photo_urls
          : entry.photo_url
            ? [entry.photo_url]
            : [];
        return photos.length > 0 ? (
          <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {photos.map((url, index) => (
              <img
                key={index}
                src={url}
                alt=""
                className={`w-full rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity ${photos.length === 1 ? 'max-h-48' : 'aspect-square'}`}
                onClick={() => setLightboxPhoto(url)}
              />
            ))}
          </div>
        ) : null;
      })() : null}

      {(onEdit || onDelete) && (
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
    </>
  );
}
