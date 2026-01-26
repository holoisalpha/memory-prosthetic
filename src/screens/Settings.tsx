import { useState } from 'react';
import { useSettings, updateSettings, exportData, exportCSV, deleteAllData } from '../hooks/useMemories';
import { requestNotificationPermission, setOptedIn, updateReminderTimes } from '../lib/notifications';

export function Settings() {
  const settings = useSettings();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  const handleToggleNotifications = async () => {
    const newValue = !settings?.notifications_enabled;
    console.log('Toggle notifications:', { current: settings?.notifications_enabled, newValue });

    // Update local settings first (so UI responds immediately)
    await updateSettings({
      notifications_enabled: newValue,
      morning_reminder_time: settings?.morning_reminder_time || '08:00',
      evening_reminder_time: settings?.evening_reminder_time || '20:00'
    });

    // Then handle OneSignal
    if (newValue) {
      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          await setOptedIn(true);
          await updateReminderTimes(
            settings?.morning_reminder_time || '08:00',
            settings?.evening_reminder_time || '20:00'
          );
        }
      } catch (err) {
        console.error('OneSignal error:', err);
      }
    } else {
      try {
        await setOptedIn(false);
      } catch (err) {
        console.error('OneSignal error:', err);
      }
    }
  };

  const handleMorningTimeChange = async (time: string) => {
    await updateSettings({ morning_reminder_time: time });
    await updateReminderTimes(time, settings?.evening_reminder_time);
  };

  const handleEveningTimeChange = async (time: string) => {
    await updateSettings({ evening_reminder_time: time });
    await updateReminderTimes(settings?.morning_reminder_time, time);
  };

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

  const notificationsEnabled = settings?.notifications_enabled ?? false;

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
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); handleToggleNotifications(); }}
              className={`
                w-14 h-8 rounded-full transition-colors relative cursor-pointer touch-manipulation
                ${notificationsEnabled ? 'bg-stone-900' : 'bg-stone-200'}
              `}
            >
              <span
                className={`
                  absolute top-1.5 w-5 h-5 rounded-full bg-white transition-transform shadow
                  ${notificationsEnabled ? 'left-8' : 'left-1'}
                `}
              />
            </button>
          </div>

          {notificationsEnabled && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-700">Morning gratitude</p>
                  <p className="text-xs text-stone-400">If you haven't logged gratitude</p>
                </div>
                <input
                  type="time"
                  value={settings?.morning_reminder_time || '08:00'}
                  onChange={(e) => handleMorningTimeChange(e.target.value)}
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
                  value={settings?.evening_reminder_time || '20:00'}
                  onChange={(e) => handleEveningTimeChange(e.target.value)}
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
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); updateSettings({ resurfacing_enabled: !settings?.resurfacing_enabled }); }}
              className={`
                w-14 h-8 rounded-full transition-colors relative cursor-pointer touch-manipulation
                ${settings?.resurfacing_enabled ? 'bg-stone-900' : 'bg-stone-200'}
              `}
            >
              <span
                className={`
                  absolute top-1.5 w-5 h-5 rounded-full bg-white transition-transform shadow
                  ${settings?.resurfacing_enabled ? 'left-8' : 'left-1'}
                `}
              />
            </button>
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
              <p className="text-xs text-stone-600">
                Type DELETE to confirm:
              </p>
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
                  className={`
                    flex-1 py-2 text-sm rounded-lg
                    ${deleteText === 'DELETE'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                    }
                  `}
                >
                  Confirm delete
                </button>
              </div>
            </div>
          )}
        </section>

        {/* About */}
        <section className="text-center text-xs text-stone-400 py-4">
          <p>Memory Prosthetic</p>
          <p className="mt-1">Your memories stay on this device.</p>
        </section>
      </main>
    </div>
  );
}
