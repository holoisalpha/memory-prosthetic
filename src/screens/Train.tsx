import { useState } from 'react';
import { useAllEntries, addEntry } from '../hooks/useMemories';
import type { MemoryEntry, MemoryType } from '../lib/types';
import { getLocalDateString } from '../lib/db';

type Mode = 'menu' | 'quiz' | 'reflection';

const typeLabels: Record<MemoryType, string> = {
  moment: 'moment',
  thought: 'thought',
  win: 'win',
  gratitude: 'gratitude'
};

// Get entries from last 30 days
function getRecentEntries(entries: MemoryEntry[]): MemoryEntry[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = getLocalDateString(thirtyDaysAgo);

  return entries.filter(e => e.entry_date >= cutoff);
}

// Get entries from this week (Sunday to Saturday)
function getThisWeekEntries(entries: MemoryEntry[]): MemoryEntry[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const startDate = getLocalDateString(startOfWeek);

  return entries.filter(e => e.entry_date >= startDate);
}

// Check if today is Sunday
function isSunday(): boolean {
  return new Date().getDay() === 0;
}

export function Train() {
  const allEntries = useAllEntries();
  const [mode, setMode] = useState<Mode>('menu');

  // Quiz state
  const [quizEntry, setQuizEntry] = useState<MemoryEntry | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizStats, setQuizStats] = useState({ correct: 0, total: 0 });

  // Reflection state
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const recentEntries = allEntries ? getRecentEntries(allEntries) : [];
  const weekEntries = allEntries ? getThisWeekEntries(allEntries) : [];

  const startQuiz = () => {
    if (recentEntries.length === 0) return;
    const randomEntry = recentEntries[Math.floor(Math.random() * recentEntries.length)];
    setQuizEntry(randomEntry);
    setRevealed(false);
    setMode('quiz');
  };

  const nextQuestion = () => {
    if (recentEntries.length === 0) return;
    const randomEntry = recentEntries[Math.floor(Math.random() * recentEntries.length)];
    setQuizEntry(randomEntry);
    setRevealed(false);
  };

  const handleRecall = (remembered: boolean) => {
    setQuizStats(prev => ({
      correct: prev.correct + (remembered ? 1 : 0),
      total: prev.total + 1
    }));
    nextQuestion();
  };

  const saveReflection = async () => {
    if (!reflectionText.trim()) return;

    await addEntry('thought', `Weekly reflection: ${reflectionText}`, 'neutral');

    setReflectionSaved(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!allEntries) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400">Loading...</p>
      </div>
    );
  }

  // Menu screen
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4">
          <h1 className="font-medium text-stone-900">Train Your Memory</h1>
          <p className="text-xs text-stone-400 mt-1">Strengthen recall through practice</p>
        </header>

        <main className="px-4 py-6 space-y-4 max-w-md mx-auto">
          {/* Memory Quiz Card */}
          <button
            onClick={startQuiz}
            disabled={recentEntries.length === 0}
            className="w-full bg-white rounded-lg border border-stone-200 p-5 text-left hover:border-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl">
                🧠
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-stone-900">Memory Quiz</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Test your recall on memories from the last 30 days
                </p>
                <p className="text-xs text-stone-400 mt-2">
                  {recentEntries.length} memories available
                </p>
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
                {isSunday() && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ✨ Perfect time to reflect!
                  </p>
                )}
              </div>
            </div>
          </button>

          {/* Stats */}
          {quizStats.total > 0 && (
            <div className="bg-stone-100 rounded-lg p-4 text-center">
              <p className="text-sm text-stone-600">
                Session: {quizStats.correct}/{quizStats.total} recalled
                <span className="ml-2 text-stone-400">
                  ({Math.round((quizStats.correct / quizStats.total) * 100)}%)
                </span>
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Quiz screen
  if (mode === 'quiz' && quizEntry) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setMode('menu')}
            className="text-stone-500 hover:text-stone-700 text-sm"
          >
            ← Back
          </button>
          <span className="text-sm text-stone-400">
            {quizStats.total > 0 && `${quizStats.correct}/${quizStats.total}`}
          </span>
        </header>

        <main className="px-4 py-8 max-w-md mx-auto">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
            {/* Prompt */}
            <div className="text-center space-y-2">
              <p className="text-sm text-stone-400">On</p>
              <p className="text-xl font-semibold text-stone-900">
                {formatDate(quizEntry.entry_date)}
              </p>
              <p className="text-sm text-stone-400">
                you recorded a <span className="font-medium text-stone-600">{typeLabels[quizEntry.type]}</span>
              </p>
            </div>

            <div className="border-t border-stone-100 pt-6">
              <p className="text-center text-stone-500 text-sm mb-4">
                {revealed ? 'You wrote:' : 'Can you remember what it was?'}
              </p>

              {revealed ? (
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-stone-800 text-center leading-relaxed">
                    {quizEntry.content}
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

            {/* Recall rating */}
            {revealed && (
              <div className="space-y-3 pt-2">
                <p className="text-center text-sm text-stone-500">Did you remember?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRecall(false)}
                    className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-lg font-medium hover:bg-stone-200 transition-colors"
                  >
                    Forgot
                  </button>
                  <button
                    onClick={() => handleRecall(true)}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            )}
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
            ← Back
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
                            {formatDate(entry.entry_date)}
                          </span>
                          <span className="text-xs text-stone-300">•</span>
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
                  maxLength={240}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-stone-400">
                    {reflectionText.length}/240
                  </span>
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
