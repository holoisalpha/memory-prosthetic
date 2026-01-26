import { useState } from 'react';
import { useBucketList, addBucketItem, toggleBucketItem, deleteBucketItem } from '../hooks/useMemories';

interface Props {
  onBack: () => void;
}

export function Bucket({ onBack }: Props) {
  const items = useBucketList();
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newItem.trim()) return;

    setAdding(true);
    await addBucketItem(newItem);
    setNewItem('');
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const pendingItems = items?.filter(i => !i.completed) ?? [];
  const completedItems = items?.filter(i => i.completed) ?? [];

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <button
          onClick={onBack}
          className="text-stone-500 hover:text-stone-700 text-sm"
        >
          &larr; Back
        </button>
        <h1 className="font-medium text-stone-900 mt-3">Bucket List</h1>
        <p className="text-xs text-stone-400 mt-1">Experiences you're looking forward to</p>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Add new item */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a dream experience..."
            maxLength={240}
            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400"
          />
          <button
            onClick={handleAdd}
            disabled={!newItem.trim() || adding}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Pending items */}
        {pendingItems.length > 0 && (
          <section className="space-y-2">
            {pendingItems.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 bg-white rounded-lg border border-stone-200 p-3"
              >
                <button
                  onClick={() => toggleBucketItem(item.id)}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-stone-300 hover:border-stone-400 flex-shrink-0"
                />
                <p className="flex-1 text-sm text-stone-800">{item.content}</p>
                <button
                  onClick={() => deleteBucketItem(item.id)}
                  className="text-stone-300 hover:text-red-400 text-xs"
                >
                  &times;
                </button>
              </div>
            ))}
          </section>
        )}

        {/* Empty state */}
        {pendingItems.length === 0 && completedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">&#x2728;</div>
            <h2 className="font-medium text-stone-700 mb-2">No dreams yet</h2>
            <p className="text-sm text-stone-500">
              Add experiences you want to have someday.
            </p>
          </div>
        )}

        {/* Completed items */}
        {completedItems.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs text-stone-400 uppercase tracking-wide">
              Completed ({completedItems.length})
            </h2>
            {completedItems.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 bg-stone-100 rounded-lg border border-stone-200 p-3"
              >
                <button
                  onClick={() => toggleBucketItem(item.id)}
                  className="mt-0.5 w-5 h-5 rounded-full bg-emerald-400 flex-shrink-0 flex items-center justify-center text-white text-xs"
                >
                  &#x2713;
                </button>
                <p className="flex-1 text-sm text-stone-500 line-through">{item.content}</p>
                <button
                  onClick={() => deleteBucketItem(item.id)}
                  className="text-stone-300 hover:text-red-400 text-xs"
                >
                  &times;
                </button>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
