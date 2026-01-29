import { useState, useEffect } from 'react';
import { initSettings } from './lib/db';
import { deleteEntry, setCurrentUserId } from './hooks/useMemories';
import { useAuth } from './hooks/useAuth';
import { setupOnlineListener, processSyncQueue } from './lib/syncQueue';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { AddMemory } from './screens/AddMemory';
import { Calendar } from './screens/Calendar';
import { DayDetail } from './screens/DayDetail';
import { Archive } from './screens/Archive';
import { Train } from './screens/Train';
import { Highlights } from './screens/Highlights';
import { Bucket } from './screens/Bucket';
import { People } from './screens/People';
import { Settings } from './screens/Settings';
import { Auth } from './components/Auth';
import { LoadingSpinner } from './components/LoadingSpinner';
import type { MemoryEntry } from './lib/types';

type Screen = 'home' | 'calendar' | 'archive' | 'train' | 'highlights' | 'bucket' | 'people' | 'settings';

export default function App() {
  const { isLoggedIn, userId, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MemoryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Initialize settings on mount
  useEffect(() => {
    initSettings();
  }, []);

  // Set user ID for auto-sync and setup online listener
  useEffect(() => {
    setCurrentUserId(userId);

    if (userId) {
      // Process any pending syncs
      processSyncQueue(userId).catch(console.error);

      // Setup listener for when app comes back online
      const cleanup = setupOnlineListener(userId);
      return cleanup;
    }
  }, [userId]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Require authentication
  if (!isLoggedIn) {
    return (
      <ErrorBoundary>
        <Auth />
      </ErrorBoundary>
    );
  }

  const handleAddMemory = () => {
    setEditingEntry(null);
    setShowAddMemory(true);
  };

  const handleEditMemory = (entry: MemoryEntry) => {
    setEditingEntry(entry);
    setShowAddMemory(true);
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteEntry(id);
  };

  const handleCloseAddMemory = () => {
    setShowAddMemory(false);
    setEditingEntry(null);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const handleBackFromDay = () => {
    setSelectedDate(null);
  };

  // Render add/edit modal
  if (showAddMemory) {
    return (
      <ErrorBoundary>
        <AddMemory
          onClose={handleCloseAddMemory}
          editingEntry={editingEntry}
        />
      </ErrorBoundary>
    );
  }

  // Render day detail (from calendar)
  if (selectedDate) {
    return (
      <ErrorBoundary>
        <DayDetail
          date={selectedDate}
          onBack={handleBackFromDay}
          onEditMemory={handleEditMemory}
          onDeleteMemory={handleDeleteMemory}
        />
        <BottomNav current="calendar" onNavigate={(s) => { setSelectedDate(null); setScreen(s); }} />
      </ErrorBoundary>
    );
  }

  // Render main screens
  return (
    <ErrorBoundary>
      {screen === 'home' && (
        <Home
          onAddMemory={handleAddMemory}
          onEditMemory={handleEditMemory}
          onDeleteMemory={handleDeleteMemory}
          onNavigateToBucket={() => setScreen('bucket')}
          onNavigateToHighlights={() => setScreen('highlights')}
          onNavigateToPeople={() => setScreen('people')}
          onNavigateToSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'calendar' && (
        <Calendar onSelectDate={handleSelectDate} />
      )}
      {screen === 'archive' && <Archive />}
      {screen === 'train' && <Train />}
      {screen === 'highlights' && (
        <Highlights
          onBack={() => setScreen('home')}
          onEditMemory={handleEditMemory}
          onDeleteMemory={handleDeleteMemory}
        />
      )}
      {screen === 'bucket' && <Bucket onBack={() => setScreen('home')} />}
      {screen === 'people' && (
        <People
          onBack={() => setScreen('home')}
          onEditMemory={handleEditMemory}
          onDeleteMemory={handleDeleteMemory}
        />
      )}
      {screen === 'settings' && <Settings />}

      <BottomNav current={screen} onNavigate={setScreen} />
    </ErrorBoundary>
  );
}
