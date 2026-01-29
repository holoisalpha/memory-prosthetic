import { useState } from 'react';
import { useAllEntries, addEntry } from '../hooks/useMemories';
import { useDueEntries, useReviewSummary } from '../hooks/useReviewStats';
import { updateReviewStats, QUALITY, type Quality } from '../lib/spacedRepetition';
import { formatDateET, isSundayET, getWeekStartET } from '../lib/timezone';
import type { MemoryEntry, MemoryType } from '../lib/types';
import { LoadingSpinner } from '../components/LoadingSpinner';

type Mode = 'menu' | 'quiz' | 'reflection';

const typeLabels: Record<MemoryType, string> = {
  moment: 'moment',
  thought: 'thought',
  win: 'win',
  gratitude: 'gratitude'
};

// Get entries from this week (Sunday to Saturday)
function getThisWeekEntries(entries: MemoryEntry[]): MemoryEntry[] {
  const startDate = getWeekStartET();
  return entries.filter(e => e.entry_date >= startDate);
}

export function Train() {
  const allEntries = useAllEntries();
  const dueEntries = useDueEntries();
  const reviewSummary = useReviewSummary();
  const [mode, setMode] = useState<Mode>('menu');

  // Quiz state
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [isUpdating, setIsUpdating] = useState(false);

  // Reflection state
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const weekEntries = allEntries ? getThisWeekEntries(allEntries) : [];
  const currentEntry = dueEntries?.[currentEntryIndex] ?? null;

  const startQuiz = () => {
    setCurrentEntryIndex(0);
    setRevealed(false);
    setSessionStats({ correct: 0, total: 0 });
    setMode('quiz');
  };

  const handleRecall = async (quality: Quality) => {
    if (!currentEntry || isUpdating) return;

    setIsUpdating(true);
    try {
      // Update spaced repetition stats
      await updateReviewStats(currentEntry.id, quality);

      // Update session stats
      const remembered = quality >= QUALITY.HARD;
      setSessionStats(prev => ({
        correct: prev.correct + (remembered ? 1 : 0),
        total: prev.total + 1
      }));

      // Move to next entry
      if (currentEntryIndex < (dueEntries?.length ?? 0) - 1) {
        setCurrentEntryIndex(prev => prev + 1);
        setRevealed(false);
      } else {
        // No more entries
        setMode('menu');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const saveReflection = async () => {
    if (!reflectionText.trim()) return;
    await addEntry('thought', `Weekly reflection: ${reflectionText}`, 'neutral');
    setReflectionSaved(true);
  };

  if (!allEntries || !dueEntries || !reviewSummary) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Menu screen
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4">
          <h1 className="font-medium text-stone-900">Train Your Memory</h1>
          <p className="text-xs text-stone-400 mt-1">Spaced repetition for better recall</p>
        </header>

        <main className="px-4 py-6 space-y-4 max-w-md mx-auto">
          {/* Memory Quiz Card */}
          <button
            onClick={startQuiz}
            disabled={dueEntries.length === 0}
            className="w-full bg-white rounded-lg border border-stone-200 p-5 text-left hover:border-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl">
                🧠
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-stone-900">Memory Quiz</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Practice recall with spaced repetition
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {dueEntries.length > 0 ? (
                    <span className="text-xs font-medium text-amber-600">
                      {dueEntries.length} due for review
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">
                      All caught up!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Weekly Reflection Card */}
          <button
            onClick={() => setMode('reflection')}
            className="w-full bg-white rounded-lg border border-stone-200 p-5 text-left hover:border-stone-300 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-2xl">
                📝
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-stone-900">Weekly Reflection</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Review your week and capture your highlight
                </p>
                {isSundayET() && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    Perfect time to reflect!
                  </p>
                )}
              </div>
            </div>
          </button>

          {/* Stats Panel */}
          <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-stone-700">Review Stats</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold text-stone-900">{reviewSummary.totalEntries}</p>
                <p className="text-xs text-stone-400">Total memories</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-stone-900">{reviewSummary.reviewed}</p>
                <p className="text-xs text-stone-400">Reviewed</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-amber-600">{reviewSummary.dueToday}</p>
                <p className="text-xs text-stone-400">Due today</p>
              </div>
            </div>
            {reviewSummary.totalReviews > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-500 text-center">
                  {reviewSummary.totalReviews} total reviews
                </p>
              </div>
            )}
          </div>

          {/* Session Stats */}
          {sessionStats.total > 0 && (
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-sm text-emerald-700">
                Session: {sessionStats.correct}/{sessionStats.total} recalled
                <span className="ml-2 text-emerald-500">
                  ({Math.round((sessionStats.correct / sessionStats.total) * 100)}%)
                </span>
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Quiz screen
  if (mode === 'quiz' && currentEntry) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="text-stone-500 hover:text-stone-700 text-sm"
          >
            Done
          </button>
          <span className="text-sm text-stone-400">
            {currentEntryIndex + 1} of {dueEntries.length}
          </span>
        </header>

        <main className="px-4 py-8 max-w-md mx-auto">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
            {/* Prompt */}
            <div className="text-center space-y-2">
              <p className="text-sm text-stone-400">On</p>
              <p className="text-xl font-semibold text-stone-900">
                {formatDateET(currentEntry.entry_date + 'T12:00:00', 'long')}
              </p>
              <p className="text-sm text-stone-400">
                you recorded a <span className="font-medium text-stone-600">{typeLabels[currentEntry.type]}</span>
              </p>
              {currentEntry.tags && currentEntry.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 pt-1">
                  {currentEntry.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-6">
              <p className="text-center text-stone-500 text-sm mb-4">
                {revealed ? 'You wrote:' : 'Can you remember what it was?'}
              </p>

              {revealed ? (
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-stone-800 text-center leading-relaxed">
                    {currentEntry.content}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full py-4 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors"
                >
                  Reveal Answer
                </button>
              )}
            </div>

            {/* Recall rating with SM-2 quality levels */}
            {revealed && (
              <div className="space-y-3 pt-2">
                <p className="text-center text-sm text-stone-500">How well did you remember?</p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleRecall(QUALITY.FORGOT)}
                    disabled={isUpdating}
                    className="py-3 px-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Forgot
                  </button>
                  <button
                    onClick={() => handleRecall(QUALITY.HARD)}
                    disabled={isUpdating}
                    className="py-3 px-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    Hard
                  </button>
                  <button
                    onClick={() => handleRecall(QUALITY.GOOD)}
                    disabled={isUpdating}
                    className="py-3 px-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    Good
                  </button>
                  <button
                    onClick={() => handleRecall(QUALITY.EASY)}
                    disabled={isUpdating}
                    className="py-3 px-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    Easy
                  </button>
                </div>
                <p className="text-xs text-stone-400 text-center">
                  Better recall = longer until next review
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // No entries due
  if (mode === 'quiz' && !currentEntry) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4">
          <button
            onClick={() => setMode('menu')}
            className="text-stone-500 hover:text-stone-700 text-sm"
          >
            Back
          </button>
        </header>
        <main className="px-4 py-8 max-w-md mx-auto text-center">
          <div className="bg-white rounded-xl border border-stone-200 p-8">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="font-semibold text-stone-900 text-lg">All caught up!</h2>
            <p className="text-sm text-stone-500 mt-2">
              No memories due for review right now. Check back later!
            </p>
            <button
              onClick={() => setMode('menu')}
              className="mt-6 px-6 py-2 bg-stone-900 text-white rounded-lg font-medium"
            >
              Done
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Weekly Reflection screen
  if (mode === 'reflection') {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4">
          <button
            onClick={() => {
              setMode('menu');
              setReflectionSaved(false);
              setReflectionText('');
            }}
            className="text-stone-500 hover:text-stone-700 text-sm"
          >
            Back
          </button>
          <h1 className="font-medium text-stone-900 mt-2">Weekly Reflection</h1>
        </header>

        <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
          {reflectionSaved ? (
            <div className="bg-white rounded-xl border border-stone-200 p-6 text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <h2 className="font-semibold text-stone-900">Reflection Saved!</h2>
              <p className="text-sm text-stone-500">
                Great job reflecting on your week.
              </p>
              <button
                onClick={() => {
                  setMode('menu');
                  setReflectionSaved(false);
                  setReflectionText('');
                }}
                className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* This week's memories */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-stone-700">Your week so far</h2>
                {weekEntries.length === 0 ? (
                  <p className="text-sm text-stone-400 bg-white rounded-lg border border-stone-200 p-4">
                    No memories recorded this week yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {weekEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="bg-white rounded-lg border border-stone-200 p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-stone-400">
                            {formatDateET(entry.entry_date + 'T12:00:00', 'short')}
                          </span>
                          <span className="text-xs text-stone-300">-</span>
                          <span className="text-xs text-stone-400">
                            {typeLabels[entry.type]}
                          </span>
                        </div>
                        <p className="text-sm text-stone-700 line-clamp-2">
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reflection prompt */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-stone-700">
                  What was your highlight this week?
                </h2>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="The best part of my week was..."
                  className="w-full h-32 p-4 bg-white border border-stone-200 rounded-lg text-stone-800 placeholder:text-stone-400 resize-none focus:outline-none focus:border-stone-300"
                />
                <div className="flex justify-end">
                  <button
                    onClick={saveReflection}
                    disabled={!reflectionText.trim()}
                    className="px-6 py-2 bg-stone-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
                  >
                    Save Reflection
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  return null;
}
