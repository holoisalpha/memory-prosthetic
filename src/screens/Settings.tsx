import { useState, useEffect } from 'react';
import { useSettings, updateSettings, exportData, exportCSV, deleteAllData } from '../hooks/useMemories';

export function Settings() {
  const dbSettings = useSettings();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  // Local state for immediate UI response
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [resurfacingOn, setResurfacingOn] = useState(false);
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('20:00');

  // Sync local state with database when it loads
  useEffect(() => {
    if (dbSettings) {
      setNotificationsOn(dbSettings.notifications_enabled === true);
      setResurfacingOn(dbSettings.resurfacing_enabled === true);
      setMorningTime(dbSettings.morning_reminder_time || '08:00');
      setEveningTime(dbSettings.evening_reminder_time || '20:00');
    }
  }, [dbSettings]);

  const toggleNotifications = () => {
    const newVal = !notificationsOn;
    setNotificationsOn(newVal);
    updateSettings({ notifications_enabled: newVal });
    if (newVal && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const toggleResurfacing = () => {
    const newVal = !resurfacingOn;
    setResurfacingOn(newVal);
    updateSettings({ resurfacing_enabled: newVal });
  };

  const changeMorningTime = (t: string) => {
    setMorningTime(t);
    updateSettings({ morning_reminder_time: t });
  };

  const changeEveningTime = (t: string) => {
    setEveningTime(t);
    updateSettings({ evening_reminder_time: t });
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

  if (!dbSettings) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">Loading...</div>;
  }

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
              <p className="text-xs text-stone-400 mt-1">8am ET / 8pm ET</p>
            </div>
            <button
              onClick={toggleNotifications}
              className={`px-3 py-1 rounded text-sm ${notificationsOn ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-600'}`}
            >
              {notificationsOn ? 'On' : 'Off'}
            </button>
          </div>

          {notificationsOn && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-700">Morning gratitude</p>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => changeMorningTime(e.target.value)}
                  className="px-2 py-1 text-sm border border-stone-200 rounded bg-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-700">Evening memory</p>
                <input
                  type="time"
                  value={eveningTime}
                  onChange={(e) => changeEveningTime(e.target.value)}
                  className="px-2 py-1 text-sm border border-stone-200 rounded bg-white"
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
              <p className="text-xs text-stone-400 mt-1">See past memories on home</p>
            </div>
            <button
              onClick={toggleResurfacing}
              className={`px-3 py-1 rounded text-sm ${resurfacingOn ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-600'}`}
            >
              {resurfacingOn ? 'On' : 'Off'}
            </button>
          </div>
        </section>

        {/* Export */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm">Export data</h2>
          <div className="flex gap-2">
            <button onClick={handleExportJSON} className="flex-1 py-2 text-sm border border-stone-200 rounded hover:bg-stone-50">
              JSON
            </button>
            <button onClick={handleExportCSV} className="flex-1 py-2 text-sm border border-stone-200 rounded hover:bg-stone-50">
              CSV
            </button>
          </div>
        </section>

        {/* Delete */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm">Delete all data</h2>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="py-2 px-4 text-sm text-red-600 border border-red-200 rounded">
              Delete all
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }} className="flex-1 py-2 text-sm border rounded">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteText !== 'DELETE'}
                  className={`flex-1 py-2 text-sm rounded ${deleteText === 'DELETE' ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-300'}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
