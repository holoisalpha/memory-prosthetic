import { useState, useEffect, useRef } from 'react';
import { useSettings, updateSettings, exportData, exportCSV, importData, deleteAllData } from '../hooks/useMemories';
import { useAuth } from '../hooks/useAuth';
import { fullSync, uploadAllToCloud, downloadAllFromCloud } from '../lib/sync';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: any) => void>;
  }
}

export function Settings() {
  const settings = useSettings();
  const { user, userId, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('20:00');
  const [resurfacingOn, setResurfacingOn] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setNotificationsOn(settings.notifications_enabled === true);
      setMorningTime(settings.morning_reminder_time || '08:00');
      setEveningTime(settings.evening_reminder_time || '20:00');
      setResurfacingOn(settings.resurfacing_enabled === true);
    }
  }, [settings]);

  // Schedule notifications via API
  const scheduleNotifications = async (morning: string, evening: string) => {
    setScheduleStatus('Scheduling...');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          morning_time: morning,
          evening_time: evening,
          timezone_offset: new Date().getTimezoneOffset()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleStatus('Scheduled!');
        setTimeout(() => setScheduleStatus(''), 2000);
      } else {
        setScheduleStatus('Error: ' + (data.error || 'Failed'));
      }
    } catch (err) {
      console.error('Failed to schedule:', err);
      setScheduleStatus('Error scheduling');
    }
  };

  const cancelNotifications = async () => {
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_only: true })
      });
    } catch (err) {
      console.error('Failed to cancel notifications:', err);
    }
  };

  const toggleNotifications = async () => {
    const newVal = !notificationsOn;

    if (newVal) {
      setScheduleStatus('Requesting permission...');
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          const permission = await OneSignal.Notifications.requestPermission();
          if (permission) {
            setNotificationsOn(true);
            await updateSettings({ notifications_enabled: true });
            // Schedule notifications for today
            await scheduleNotifications(morningTime, eveningTime);
          } else {
            setScheduleStatus('Permission denied');
            setTimeout(() => setScheduleStatus(''), 3000);
          }
        } catch (err) {
          console.error('OneSignal error:', err);
          setScheduleStatus('Error: ' + (err instanceof Error ? err.message : 'Unknown'));
        }
      });
    } else {
      setNotificationsOn(false);
      await updateSettings({ notifications_enabled: false });
      // Cancel all pending notifications when turning off
      await cancelNotifications();
      setScheduleStatus('');
    }
  };

  const updateMorningTime = async (time: string) => {
    setMorningTime(time);
    await updateSettings({ morning_reminder_time: time });
    if (notificationsOn) {
      // Save to OneSignal tags for daily cron
      window.OneSignalDeferred?.push(async (OneSignal) => {
        await OneSignal.User.addTags({ morning_time: time });
      });
      await scheduleNotifications(time, eveningTime);
    }
  };

  const updateEveningTime = async (time: string) => {
    setEveningTime(time);
    await updateSettings({ evening_reminder_time: time });
    if (notificationsOn) {
      // Save to OneSignal tags for daily cron
      window.OneSignalDeferred?.push(async (OneSignal) => {
        await OneSignal.User.addTags({ evening_time: time });
      });
      await scheduleNotifications(morningTime, time);
    }
  };

  const toggleResurfacing = async () => {
    const newVal = !resurfacingOn;
    setResurfacingOn(newVal);
    await updateSettings({ resurfacing_enabled: newVal });
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Importing...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const result = await importData(content);
      if (result.error) {
        setImportStatus(`Error: ${result.error}`);
      } else {
        setImportStatus(`Imported ${result.entries} memories, ${result.bucket} bucket items`);
        setTimeout(() => setImportStatus(''), 3000);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAll = async () => {
    if (deleteText !== 'DELETE') return;
    await deleteAllData();
    window.location.reload();
  };

  if (!settings) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center">Loading...</div>;
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
              <p className="text-xs text-stone-400 mt-1">Morning gratitude & evening memory</p>
            </div>
            <button
              onClick={toggleNotifications}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${notificationsOn ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-600'}`}
            >
              {notificationsOn ? 'On' : 'Off'}
            </button>
          </div>

          {notificationsOn && (
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-700">Morning</span>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => updateMorningTime(e.target.value)}
                  className="px-2 py-1 text-sm border border-stone-200 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-700">Evening</span>
                <input
                  type="time"
                  value={eveningTime}
                  onChange={(e) => updateEveningTime(e.target.value)}
                  className="px-2 py-1 text-sm border border-stone-200 rounded"
                />
              </div>
              {scheduleStatus && (
                <p className={`text-xs ${scheduleStatus.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                  {scheduleStatus}
                </p>
              )}
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
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${resurfacingOn ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-600'}`}
            >
              {resurfacingOn ? 'On' : 'Off'}
            </button>
          </div>
        </section>

        {/* Cloud Sync */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-4">
          <div>
            <h2 className="font-medium text-stone-900 text-sm">Cloud sync</h2>
            <p className="text-xs text-stone-400 mt-1">
              Signed in as {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!userId) return;
                  setSyncStatus('Syncing...');
                  const result = await fullSync(userId);
                  if (result.error) {
                    setSyncStatus(`Error: ${result.error}`);
                  } else {
                    setSyncStatus(`Synced! ↑${result.uploaded} ↓${result.downloaded}`);
                  }
                  setTimeout(() => setSyncStatus(''), 3000);
                }}
                className="flex-1 py-2 text-sm border border-stone-200 rounded"
              >
                Sync now
              </button>
              <button
                onClick={async () => {
                  if (!userId) return;
                  setSyncStatus('Uploading...');
                  const result = await uploadAllToCloud(userId);
                  if (result.error) {
                    setSyncStatus(`Error: ${result.error}`);
                  } else {
                    setSyncStatus(`Uploaded ${result.entries} entries, ${result.bucket} bucket items`);
                  }
                  setTimeout(() => setSyncStatus(''), 3000);
                }}
                className="flex-1 py-2 text-sm border border-stone-200 rounded"
              >
                Upload all
              </button>
            </div>
            <button
              onClick={async () => {
                if (!userId) return;
                setSyncStatus('Downloading...');
                const result = await downloadAllFromCloud(userId);
                if (result.error) {
                  setSyncStatus(`Error: ${result.error}`);
                } else {
                  setSyncStatus(`Downloaded ${result.entries} entries, ${result.bucket} bucket items`);
                }
                setTimeout(() => setSyncStatus(''), 3000);
              }}
              className="w-full py-2 text-sm border border-stone-200 rounded"
            >
              Download from cloud
            </button>
            {syncStatus && (
              <p className={`text-xs ${syncStatus.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                {syncStatus}
              </p>
            )}
            <button
              onClick={() => signOut()}
              className="w-full py-2 text-sm text-red-500 hover:text-red-700"
            >
              Sign out
            </button>
          </div>
        </section>

        {/* Export */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm">Export data</h2>
          <p className="text-xs text-stone-400">Back up your memories regularly</p>
          <div className="flex gap-2">
            <button onClick={handleExportJSON} className="flex-1 py-2 text-sm border border-stone-200 rounded">JSON</button>
            <button onClick={handleExportCSV} className="flex-1 py-2 text-sm border border-stone-200 rounded">CSV</button>
          </div>
        </section>

        {/* Import */}
        <section className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
          <h2 className="font-medium text-stone-900 text-sm">Import data</h2>
          <p className="text-xs text-stone-400">Restore from a JSON backup</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 text-sm border border-stone-200 rounded"
          >
            Choose JSON file
          </button>
          {importStatus && (
            <p className={`text-xs ${importStatus.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
              {importStatus}
            </p>
          )}
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
                className="w-full px-3 py-2 text-sm border rounded"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }} className="flex-1 py-2 text-sm border rounded">Cancel</button>
                <button onClick={handleDeleteAll} disabled={deleteText !== 'DELETE'} className={`flex-1 py-2 text-sm rounded ${deleteText === 'DELETE' ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-300'}`}>Confirm</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
