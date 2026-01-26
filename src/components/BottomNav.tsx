interface Props {
  current: 'home' | 'calendar' | 'archive' | 'settings';
  onNavigate: (screen: 'home' | 'calendar' | 'archive' | 'settings') => void;
}

const icons = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  archive: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
};

export function BottomNav({ current, onNavigate }: Props) {
  const items = [
    { id: 'home' as const, label: 'Home' },
    { id: 'calendar' as const, label: 'Calendar' },
    { id: 'archive' as const, label: 'Archive' },
    { id: 'settings' as const, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 flex justify-center pb-safe">
      <div className="bg-white rounded-full shadow-lg shadow-stone-200/50 px-6 py-2 flex justify-around gap-2 max-w-sm w-full">
        {items.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`
              flex flex-col items-center gap-1 py-2 px-3 rounded-full transition-colors
              ${current === id
                ? 'text-stone-900'
                : 'text-stone-400 hover:text-stone-600'}
            `}
          >
            {icons[id]}
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
