import { useState, useRef } from 'react';
import { useHighlightedEntries, addStandaloneHighlight } from '../hooks/useMemories';
import { MemoryCard } from '../components/MemoryCard';
import type { MemoryType } from '../lib/types';

const MAX_PHOTOS = 3;

interface Props {
  onBack: () => void;
}

export function Highlights({ onBack }: Props) {
  const highlights = useHighlightedEntries();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for adding past highlights
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [type, setType] = useState<MemoryType>('moment');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim() || !entryDate) return;

    setSaving(true);
    await addStandaloneHighlight(content, entryDate, type, 'neutral', photoUrls.length > 0 ? photoUrls : undefined);
    setContent('');
    setEntryDate('');
    setType('moment');
    setPhotoUrls([]);
    setShowAddForm(false);
    setSaving(false);
  };

  // Group highlights by year
  const groupedByYear = highlights?.reduce((acc, entry) => {
    const year = entry.entry_date.slice(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {} as Record<string, typeof highlights>) ?? {};

  const years = Object.keys(groupedByYear).sort().reverse();

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-stone-500 hover:text-stone-700 text-sm"
          >
            ← Back
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm font-medium text-stone-900 hover:text-stone-700"
          >
            + Add Past Highlight
          </button>
        </div>
        <h1 className="font-medium text-stone-900 mt-3">Highlights</h1>
        <p className="text-xs text-stone-400 mt-1">Your core memories & life highlights</p>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto">
        {/* Add Past Highlight Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-stone-200 p-4 mb-6 space-y-4">
            <h2 className="font-medium text-stone-900">Add a Past Highlight</h2>
            <p className="text-xs text-stone-500">Record a significant life moment from your past.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">When did this happen?</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MemoryType)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
                >
                  <option value="moment">Moment</option>
                  <option value="win">Win</option>
                  <option value="thought">Thought</option>
                  <option value="gratitude">Gratitude</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">What happened?</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe this highlight..."
                  maxLength={240}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm h-24 resize-none"
                />
                <p className="text-xs text-stone-400 text-right mt-1">{content.length}/240</p>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Photos (optional, up to {MAX_PHOTOS})</label>
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
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 border border-stone-200 rounded-lg text-sm text-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!content.trim() || !entryDate || saving}
                className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Highlight'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {highlights?.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⭐</div>
            <h2 className="font-medium text-stone-700 mb-2">No highlights yet</h2>
            <p className="text-sm text-stone-500 mb-6">
              Star your favorite memories or add past life highlights.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium"
            >
              Add Your First Highlight
            </button>
          </div>
        )}

        {/* Highlights grouped by year */}
        {years.map(year => (
          <section key={year} className="mb-8">
            <h2 className="text-sm font-semibold text-stone-700 mb-3 sticky top-0 bg-stone-50 py-2">
              {year}
            </h2>
            <div className="space-y-3">
              {groupedByYear[year]?.map(entry => (
                <MemoryCard
                  key={entry.id}
                  entry={entry}
                  showDate
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
