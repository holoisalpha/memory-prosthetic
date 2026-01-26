import { useState } from 'react';
import { useSettings, updateSettings, exportData, exportCSV, deleteAllData } from '../hooks/useMemories';

export function Settings() {
  const settings = useSettings();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  if (!settings) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center">Loading...</div>;
  }

  const handleExportJSON = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-prosthetic-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const data = await exportCSV();
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-prosthetic-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = async () => {
    if (deleteText !== 'DELETE') return;
    await deleteAllData();
    setShowDeleteConfirm(false);
    setDeleteText('');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <h1 className="font-medium text-stone-900">Settings</h1>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Notifications */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-stone-900 text-sm">Gentle reminders</h2>
              <p className="text-xs text-stone-400 mt-1">
                Morning gratitude & evening memory prompts
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications_enabled}
              onChange={(e) => {
                updateSettings({ notifications_enabled: e.target.checked });
                if (e.target.checked && 'Notification' in window) {
                  Notification.requestPermission();
                }
              }}
              className="w-5 h-5"
            />
          </div>

          {settings.notifications_enabled && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-700">Morning gratitude</p>
                  <p className="text-xs text-stone-400">If you haven't logged gratitude</p>
                </div>
                <input
                  type="time"
                  value={settings.morning_reminder_time || '08:00'}
                  onChange={(e) => updateSettings({ morning_reminder_time: e.target.value })}
                  className="px-2 py-1 text-sm border border-stone-200 rounded-lg bg-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-700">Evening memory</p>
                  <p className="text-xs text-stone-400">If you haven't logged anything</p>
                </div>
                <input
                  type="time"
                  value={settings.evening_reminder_time || '20:00'}
                  onChange={(e) => updateSettings({ evening_reminder_time: e.target.value })}
                  className="px-2 py-1 text-sm border border-stone-200 rounded-lg bg-white"
                />
              </div>
            </div>
          )}
        </section>

        {/* Resurfacing */}
        <section className="bg-white rounded-lg border border-stone-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-stone-900 text-sm">Gentle resurfacing</h2>
              <p className="text-xs text-stone-400 mt-1">
                Occasionally see a past memory on the home screen
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.resurfacing_enabled}
              onChange={(e) => updateSettings({ resurfacing_enabled: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
        </section>

        {/* Export */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm">Export your data</h2>
          <p className="text-xs text-stone-400">
            Download all your memories. Your data stays on your device.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              Export CSV
            </button>
          </div>
        </section>

        {/* Delete */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm">Delete all data</h2>
          <p className="text-xs text-stone-400">
            Permanently delete all memories. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="py-2 px-4 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              Delete all data
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-stone-600">Type DELETE to confirm:</p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
                placeholder="DELETE"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                  className="flex-1 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteText !== 'DELETE'}
                  className={`flex-1 py-2 text-sm rounded-lg ${deleteText === 'DELETE' ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-300'}`}
                >
                  Confirm delete
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="text-center text-xs text-stone-400 py-4">
          <p>Memory Prosthetic</p>
          <p className="mt-1">Your memories stay on this device.</p>
        </section>
      </main>
    </div>
  );
}
