import { useState, useMemo } from 'react';
import { useEntriesForMonth } from '../hooks/useMemories';
import type { MemoryEntry } from '../lib/types';

interface Props {
  onSelectDate: (date: string) => void;
}

// Get tone color for calendar dot
function getToneColor(entries: MemoryEntry[]): string {
  if (entries.length === 0) return '';

  const tones = entries.map(e => e.tone);
  const hasLight = tones.includes('light');
  const hasHeavy = tones.includes('heavy');

  if (hasLight && hasHeavy) return 'bg-stone-400';
  if (hasLight) return 'bg-amber-400';
  if (hasHeavy) return 'bg-slate-500';
  return 'bg-stone-400';
}

export function Calendar({ onSelectDate }: Props) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
  const entries = useEntriesForMonth(yearMonth);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map: Record<string, MemoryEntry[]> = {};
    entries?.forEach(entry => {
      if (!map[entry.entry_date]) map[entry.entry_date] = [];
      map[entry.entry_date].push(entry);
    });
    return map;
  }, [entries]);

  // Calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = Array.from({ length: startPadding + daysInMonth }, (_, i) => {
    if (i < startPadding) return null;
    return i - startPadding + 1;
  });

  const prevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const todayDate = today.getDate();

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 text-stone-500 hover:text-stone-700"
          >
            ←
          </button>
          <h1 className="font-medium text-stone-900">
            {new Date(year, month).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric'
            })}
          </h1>
          <button
            onClick={nextMonth}
            className="p-2 text-stone-500 hover:text-stone-700"
          >
            →
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs text-stone-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) {
              return <div key={i} className="aspect-square" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = entriesByDate[dateStr] || [];
            const hasEntries = dayEntries.length > 0;
            const isToday = isCurrentMonth && day === todayDate;

            return (
              <button
                key={i}
                onClick={() => hasEntries && onSelectDate(dateStr)}
                disabled={!hasEntries}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center gap-1
                  ${hasEntries ? 'hover:bg-stone-100 cursor-pointer' : 'cursor-default'}
                  ${isToday ? 'ring-1 ring-stone-300' : ''}
                `}
              >
                <span className={`text-sm ${hasEntries ? 'text-stone-900' : 'text-stone-400'}`}>
                  {day}
                </span>
                {hasEntries && (
                  <div className="flex gap-0.5">
                    {dayEntries.slice(0, 3).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1 h-1 rounded-full ${getToneColor(dayEntries)}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Light</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-stone-400" />
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Heavy</span>
          </div>
        </div>
      </main>
    </div>
  );
}
