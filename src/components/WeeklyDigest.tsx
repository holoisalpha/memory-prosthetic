import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { getWeekStartET } from '../lib/timezone';

export function WeeklyDigest() {
  const weekStart = getWeekStartET();

  const weekStats = useLiveQuery(async () => {
    const entries = await db.entries
      .filter(e => e.entry_date >= weekStart)
      .toArray();

    if (entries.length === 0) return null;

    const types = {
      moment: 0,
      thought: 0,
      win: 0,
      gratitude: 0
    };

    const peopleSet = new Set<string>();
    const tagsSet = new Set<string>();

    entries.forEach(e => {
      types[e.type]++;
      e.people?.forEach(p => peopleSet.add(p));
      e.tags?.forEach(t => tagsSet.add(t));
    });

    return {
      total: entries.length,
      types,
      peopleCount: peopleSet.size,
      tagsCount: tagsSet.size
    };
  }, [weekStart]);

  // Don't show if no entries this week
  if (!weekStats || weekStats.total === 0) return null;

  const highlights: string[] = [];

  if (weekStats.types.win > 0) {
    highlights.push(`${weekStats.types.win} ${weekStats.types.win === 1 ? 'win' : 'wins'}`);
  }
  if (weekStats.types.gratitude > 0) {
    highlights.push(`${weekStats.types.gratitude} ${weekStats.types.gratitude === 1 ? 'gratitude' : 'gratitudes'}`);
  }
  if (weekStats.peopleCount > 0) {
    highlights.push(`${weekStats.peopleCount} ${weekStats.peopleCount === 1 ? 'person' : 'people'} tagged`);
  }

  return (
    <section className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-violet-500">📅</span>
        <h2 className="text-sm font-medium text-violet-900">This week</h2>
      </div>
      <p className="text-violet-800 text-sm">
        You've captured <span className="font-semibold">{weekStats.total} {weekStats.total === 1 ? 'memory' : 'memories'}</span>
        {highlights.length > 0 && (
          <span className="text-violet-600">
            {' '}— {highlights.join(', ')}
          </span>
        )}
      </p>
    </section>
  );
}
