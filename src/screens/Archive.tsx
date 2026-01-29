import { useState, useMemo } from 'react';
import { useAllEntries } from '../hooks/useMemories';
import { useTags } from '../hooks/useTags';
import { MemoryCard } from '../components/MemoryCard';
import { SearchBar } from '../components/SearchBar';
import { MemoryListSkeleton } from '../components/Skeleton';
import type { MemoryType, Tone } from '../lib/types';

const PAGE_SIZE = 20;

export function Archive() {
  const allEntries = useAllEntries();
  const { allTags } = useTags();
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<MemoryType | ''>('');
  const [toneFilter, setToneFilter] = useState<Tone | ''>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  // Get unique months for filter dropdown
  const months = useMemo(() => {
    if (!allEntries) return [];
    const set = new Set(allEntries.map(e => e.entry_date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [allEntries]);

  // Apply filters and search
  const filteredEntries = useMemo(() => {
    if (!allEntries) return [];
    return allEntries.filter(e => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const contentMatch = e.content.toLowerCase().includes(q);
        const tagMatch = e.tags?.some(t => t.toLowerCase().includes(q));
        if (!contentMatch && !tagMatch) return false;
      }
      if (monthFilter && !e.entry_date.startsWith(monthFilter)) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      if (toneFilter && e.tone !== toneFilter) return false;
      if (tagFilter && !e.tags?.includes(tagFilter)) return false;
      return true;
    });
  }, [allEntries, searchQuery, monthFilter, typeFilter, toneFilter, tagFilter]);

  // Paginate
  const paginatedEntries = filteredEntries.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paginatedEntries.length < filteredEntries.length;

  const clearFilters = () => {
    setSearchQuery('');
    setMonthFilter('');
    setTypeFilter('');
    setToneFilter('');
    setTagFilter('');
    setPage(0);
  };

  const hasFilters = searchQuery || monthFilter || typeFilter || toneFilter || tagFilter;

  // Loading state
  if (!allEntries) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4">
          <h1 className="font-medium text-stone-900">Archive</h1>
        </header>
        <main className="px-4 py-6 max-w-md mx-auto">
          <MemoryListSkeleton count={5} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <h1 className="font-medium text-stone-900">Archive</h1>
        <p className="text-xs text-stone-400 mt-1">
          {allEntries.length} total memories
        </p>
      </header>

      {/* Search */}
      <div className="bg-white border-b border-stone-200 px-4 py-3">
        <SearchBar
          value={searchQuery}
          onChange={(value) => { setSearchQuery(value); setPage(0); }}
          placeholder="Search memories..."
        />
      </div>

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

          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPage(0); }}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700"
            >
              <option value="">All tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

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
        {/* Results count when searching */}
        {searchQuery && (
          <p className="text-xs text-stone-500">
            {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        )}

        {filteredEntries.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">
            {hasFilters ? 'No memories match your search.' : 'No memories yet.'}
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
            Load more ({filteredEntries.length - paginatedEntries.length} remaining)
          </button>
        )}
      </main>
    </div>
  );
}
