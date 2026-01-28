import { useState, useRef } from 'react';
import { TypeSelector } from '../components/TypeSelector';
import { ToneSelector } from '../components/ToneSelector';
import { useTodaysEntries, canAddGratitude, addEntry, updateEntry } from '../hooks/useMemories';
import type { MemoryEntry, MemoryType, Tone } from '../lib/types';

const MAX_LENGTH = 240;
const MAX_PHOTOS = 5;

interface Props {
  onClose: () => void;
  editingEntry?: MemoryEntry | null;
}

export function AddMemory({ onClose, editingEntry }: Props) {
  const entries = useTodaysEntries();
  const [type, setType] = useState<MemoryType>(editingEntry?.type ?? 'moment');
  const [content, setContent] = useState(editingEntry?.content ?? '');
  const [tone, setTone] = useState<Tone>(editingEntry?.tone ?? 'neutral');
  // Support both photo_urls (new) and photo_url (legacy)
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    editingEntry?.photo_urls ?? (editingEntry?.photo_url ? [editingEntry.photo_url] : [])
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canGratitude = canAddGratitude(entries) || editingEntry?.type === 'gratitude';
  const disabledTypes: MemoryType[] = canGratitude ? [] : ['gratitude'];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Process each selected file
    Array.from(files).forEach(file => {
      if (photoUrls.length >= MAX_PHOTOS) return;

      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrls(prev => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please write something');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingEntry) {
        const success = await updateEntry(editingEntry.id, { content: content.trim(), tone, type, photo_urls: photoUrls.length > 0 ? photoUrls : undefined });
        if (!success) {
          setError('Could not update entry');
          return;
        }
      } else {
        const result = await addEntry(type, content.trim(), tone, photoUrls.length > 0 ? photoUrls : undefined);
        if ('error' in result) {
          setError(result.error);
          return;
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 border-b border-stone-200">
        <button
          onClick={onClose}
          className="text-stone-500 hover:text-stone-700 text-sm"
        >
          Cancel
        </button>
        <h1 className="font-medium text-stone-900">
          {editingEntry ? 'Edit memory' : 'New memory'}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={saving || !content.trim()}
          className={`
            text-sm font-medium
            ${saving || !content.trim()
              ? 'text-stone-300'
              : 'text-stone-900 hover:text-stone-700'
            }
          `}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Type selection */}
        <section>
          <label className="block text-xs text-stone-400 uppercase tracking-wide mb-2">
            Type
          </label>
          <TypeSelector
            selected={type}
            onChange={setType}
            disabledTypes={disabledTypes}
          />
        </section>

        {/* Content */}
        <section>
          <label className="block text-xs text-stone-400 uppercase tracking-wide mb-2">
            Memory
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="What do you want to remember?"
            className="w-full h-32 p-3 border border-stone-200 rounded-lg text-stone-800 text-sm resize-none focus:outline-none focus:border-stone-400"
            autoFocus
          />
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>{error && <span className="text-red-500">{error}</span>}</span>
            <span>{content.length}/{MAX_LENGTH}</span>
          </div>
        </section>

        {/* Tone */}
        <section>
          <label className="block text-xs text-stone-400 uppercase tracking-wide mb-2">
            Tone (optional)
          </label>
          <ToneSelector selected={tone} onChange={setTone} />
        </section>

        {/* Photos */}
        <section>
            <label className="block text-xs text-stone-400 uppercase tracking-wide mb-2">
              Photos (optional, up to {MAX_PHOTOS})
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photoUrls.length < MAX_PHOTOS && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border border-dashed border-stone-300 rounded-lg text-stone-400 text-sm hover:border-stone-400 hover:text-stone-500"
              >
                {photoUrls.length === 0 ? 'Add photos' : `Add more (${MAX_PHOTOS - photoUrls.length} remaining)`}
              </button>
            )}
          </section>
      </main>
    </div>
  );
}
