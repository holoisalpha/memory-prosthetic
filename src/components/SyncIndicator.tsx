import { useState, useEffect } from 'react';
import { getPendingSyncCount, processSyncQueue, isOnline } from '../lib/syncQueue';
import type { SyncStatus } from '../lib/types';

interface Props {
  userId: string | null;
  className?: string;
}

export function SyncIndicator({ userId, className = '' }: Props) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(isOnline());

  // Check pending count periodically
  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingSyncCount();
      setPendingCount(count);
      if (count > 0 && online) {
        setStatus('syncing');
      } else if (!online) {
        setStatus('offline');
      } else {
        setStatus('idle');
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [online]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      if (userId && pendingCount > 0) {
        setStatus('syncing');
        processSyncQueue(userId).then(() => {
          setStatus('idle');
          getPendingSyncCount().then(setPendingCount);
        });
      }
    };

    const handleOffline = () => {
      setOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, pendingCount]);

  const handleRetry = async () => {
    if (!userId || !online) return;
    setStatus('syncing');
    try {
      await processSyncQueue(userId);
      const count = await getPendingSyncCount();
      setPendingCount(count);
      setStatus(count > 0 ? 'error' : 'idle');
    } catch {
      setStatus('error');
    }
  };

  // Don't show anything if everything is synced
  if (status === 'idle' && pendingCount === 0) {
    return null;
  }

  return (
    <button
      onClick={handleRetry}
      disabled={status === 'syncing' || !online}
      className={`flex items-center gap-1.5 text-xs ${className}`}
    >
      {status === 'syncing' && (
        <>
          <div className="w-3 h-3 border border-stone-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-stone-500">Syncing...</span>
        </>
      )}

      {status === 'offline' && (
        <>
          <div className="w-2 h-2 bg-amber-400 rounded-full" />
          <span className="text-amber-600">Offline</span>
          {pendingCount > 0 && (
            <span className="text-stone-400">({pendingCount} pending)</span>
          )}
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-2 h-2 bg-red-400 rounded-full" />
          <span className="text-red-600">Sync error</span>
          <span className="text-stone-400 underline">Retry</span>
        </>
      )}

      {status === 'idle' && pendingCount > 0 && (
        <>
          <div className="w-2 h-2 bg-stone-300 rounded-full" />
          <span className="text-stone-500">{pendingCount} pending</span>
        </>
      )}
    </button>
  );
}
