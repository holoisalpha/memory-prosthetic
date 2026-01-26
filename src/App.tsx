import { useState, useEffect } from 'react';
import { initSettings } from './lib/db';
import { deleteEntry } from './hooks/useMemories';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { AddMemory } from './screens/AddMemory';
import { Calendar } from './screens/Calendar';
import { DayDetail } from './screens/DayDetail';
import { Archive } from './screens/Archive';
import { Train } from './screens/Train';
import { Settings } from './screens/Settings';
import type { MemoryEntry } from './lib/types';

type Screen = 'home' | 'calendar' | 'archive' | 'train' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MemoryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Initialize settings on mount
  useEffect(() => {
    initSettings();
  }, []);

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
      <AddMemory
        onClose={handleCloseAddMemory}
        editingEntry={editingEntry}
      />
    );
  }

  // Render day detail (from calendar)
  if (selectedDate) {
    return (
      <>
        <DayDetail
          date={selectedDate}
          onBack={handleBackFromDay}
          onEditMemory={handleEditMemory}
          onDeleteMemory={handleDeleteMemory}
        />
        <BottomNav current="calendar" onNavigate={(s) => { setSelectedDate(null); setScreen(s); }} />
      </>
    );
  }

  // Render main screens
  return (
    <>
      {screen === 'home' && (
        <Home
          onAddMemory={handleAddMemory}
          onEditMemory={handleEditMemory}
          onDeleteMemory={handleDeleteMemory}
        />
      )}
      {screen === 'calendar' && (
        <Calendar onSelectDate={handleSelectDate} />
      )}
      {screen === 'archive' && <Archive />}
      {screen === 'train' && <Train />}
      {screen === 'settings' && <Settings />}

      <BottomNav current={screen} onNavigate={setScreen} />
    </>
  );
}
