import { useState, useMemo } from 'react';
import { useAllEntries } from '../hooks/useMemories';
import { MemoryCard } from '../components/MemoryCard';
import type { MemoryType, Tone } from '../lib/types';

const PAGE_SIZE = 20;

export function Archive() {
  const allEntries = useAllEntries();
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<MemoryType | ''>('');
  const [toneFilter, setToneFilter] = useState<Tone | ''>('');
  const [page, setPage] = useState(0);

  // Get unique months for filter dropdown
  const months = useMemo(() => {
    if (!allEntries) return [];
    const set = new Set(allEntries.map(e => e.entry_date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [allEntries]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    if (!allEntries) return [];
    return allEntries.filter(e => {
      if (monthFilter && !e.entry_date.startsWith(monthFilter)) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      if (toneFilter && e.tone !== toneFilter) return false;
      return true;
    });
  }, [allEntries, monthFilter, typeFilter, toneFilter]);

  // Paginate
  const paginatedEntries = filteredEntries.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paginatedEntries.length < filteredEntries.length;

  const clearFilters = () => {
    setMonthFilter('');
    setTypeFilter('');
    setToneFilter('');
    setPage(0);
  };

  const hasFilters = monthFilter || typeFilter || toneFilter;

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <h1 className="font-medium text-stone-900">Archive</h1>
        <p className="text-xs text-stone-400 mt-1">
          {allEntries?.length ?? 0} total memories
        </p>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-stone-200 px-4 py-3">
        <div className="flex gap-2 flex-wrap">
          <select
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setPage(0); }}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700"
          >
            <option value="">All months</option>
            {months.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as MemoryType | ''); setPage(0); }}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700"
          >
            <option value="">All types</option>
            <option value="moment">Moment</option>
            <option value="thought">Thought</option>
            <option value="win">Win</option>
            <option value="gratitude">Gratitude</option>
          </select>

          <select
            value={toneFilter}
            onChange={(e) => { setToneFilter(e.target.value as Tone | ''); setPage(0); }}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700"
          >
            <option value="">All tones</option>
            <option value="light">Light</option>
            <option value="neutral">Neutral</option>
            <option value="heavy">Heavy</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <main className="px-4 py-6 space-y-3 max-w-md mx-auto">
        {filteredEntries.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">
            {hasFilters ? 'No memories match your filters.' : 'No memories yet.'}
          </p>
        )}

        {paginatedEntries.map(entry => (
          <MemoryCard key={entry.id} entry={entry} showDate />
        ))}

        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-3 text-sm text-stone-500 hover:text-stone-700"
          >
            Load more
          </button>
        )}
      </main>
    </div>
  );
}
