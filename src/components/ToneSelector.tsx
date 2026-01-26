import type { Tone } from '../lib/types';

interface Props {
  selected: Tone;
  onChange: (tone: Tone) => void;
}

const tones: { value: Tone; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'heavy', label: 'Heavy' }
];

export function ToneSelector({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {tones.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`
            px-4 py-2 rounded-full text-sm transition-colors
            ${selected === value
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
