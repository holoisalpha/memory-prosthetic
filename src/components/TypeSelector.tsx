import type { MemoryType } from '../lib/types';

interface TypeOption {
  type: MemoryType;
  label: string;
  description: string;
}

const types: TypeOption[] = [
  { type: 'moment', label: 'Moment', description: 'Something noticed or experienced' },
  { type: 'thought', label: 'Thought', description: 'An idea or realization' },
  { type: 'win', label: 'Win', description: 'A small achievement' },
  { type: 'gratitude', label: 'Gratitude', description: 'Something appreciated' }
];

interface Props {
  selected: MemoryType;
  onChange: (type: MemoryType) => void;
  disabledTypes?: MemoryType[];
}

export function TypeSelector({ selected, onChange, disabledTypes = [] }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {types.map(({ type, label, description }) => {
        const disabled = disabledTypes.includes(type);
        const isSelected = selected === type;

        return (
          <button
            key={type}
            onClick={() => !disabled && onChange(type)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border text-left transition-colors
              ${isSelected
                ? 'border-stone-900 bg-stone-900 text-white'
                : disabled
                  ? 'border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
              }
            `}
          >
            <div className="font-medium text-sm">{label}</div>
            <div className={`text-xs mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
              {description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
