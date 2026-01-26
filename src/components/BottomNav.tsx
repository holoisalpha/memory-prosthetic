interface Props {
  current: 'home' | 'calendar' | 'archive' | 'train' | 'highlights' | 'bucket' | 'settings';
  onNavigate: (screen: 'home' | 'calendar' | 'archive' | 'train' | 'highlights' | 'bucket' | 'settings') => void;
}

export function BottomNav({ current, onNavigate }: Props) {
  const items = [
    { id: 'home' as const, label: 'Today' },
    { id: 'calendar' as const, label: 'Calendar' },
    { id: 'archive' as const, label: 'Archive' },
    { id: 'train' as const, label: 'Train' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 pb-safe">
      <div className="flex justify-around max-w-md mx-auto">
        {items.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`
              py-3 px-4 text-sm font-medium transition-colors
              ${current === id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
