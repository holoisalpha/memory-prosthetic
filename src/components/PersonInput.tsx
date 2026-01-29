import { useState, useRef, useEffect } from 'react';
import { usePeople, addPerson } from '../hooks/usePeople';
import type { Person } from '../lib/types';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function PersonInput({
  selectedIds,
  onChange,
  placeholder = 'Tag people...'
}: Props) {
  const allPeople = usePeople();
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPeople = allPeople?.filter(p => selectedIds.includes(p.id)) || [];

  const filteredPeople = (allPeople || []).filter(
    p => !selectedIds.includes(p.id) &&
      p.name.toLowerCase().includes(input.toLowerCase())
  );

  const addPersonTag = (person: Person) => {
    onChange([...selectedIds, person.id]);
    setInput('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const removePersonTag = (personId: string) => {
    onChange(selectedIds.filter(id => id !== personId));
  };

  const handleCreateNew = async () => {
    if (!input.trim()) return;
    const newPerson = await addPerson(input.trim());
    addPersonTag(newPerson);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredPeople[highlightedIndex]) {
        addPersonTag(filteredPeople[highlightedIndex]);
      } else if (input.trim() && filteredPeople.length === 0) {
        handleCreateNew();
      }
    } else if (e.key === 'Backspace' && !input && selectedIds.length > 0) {
      removePersonTag(selectedIds[selectedIds.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filteredPeople.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 border border-stone-200 rounded-lg bg-white min-h-[42px]">
        {selectedPeople.map(person => (
          <span
            key={person.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-sm"
          >
            {person.photo_url && (
              <img
                src={person.photo_url}
                alt=""
                className="w-4 h-4 rounded-full object-cover"
              />
            )}
            {person.name}
            <button
              type="button"
              onClick={() => removePersonTag(person.id)}
              className="text-blue-400 hover:text-blue-600"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent"
        />
      </div>

      {showDropdown && (input || filteredPeople.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filteredPeople.map((person, index) => (
            <button
              key={person.id}
              type="button"
              onClick={() => addPersonTag(person)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                index === highlightedIndex
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-xs">
                  {person.name.charAt(0).toUpperCase()}
                </div>
              )}
              {person.name}
            </button>
          ))}

          {input.trim() && filteredPeople.length === 0 && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
            >
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                +
              </span>
              Add "{input.trim()}"
            </button>
          )}

          {!input && filteredPeople.length === 0 && (
            <div className="px-3 py-2 text-sm text-stone-400">
              No people yet. Type a name to add someone.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
