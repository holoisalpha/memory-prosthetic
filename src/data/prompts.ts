import type { Prompt } from '../lib/types';

// Prompts rotate daily based on day-of-year
// Tone: gentle, neutral, optional — never motivational

export const prompts: Prompt[] = [
  { id: '1', text: 'Something I noticed today', type: 'moment' },
  { id: '2', text: 'A thought that stayed with me', type: 'thought' },
  { id: '3', text: 'Something I\'m quietly grateful for', type: 'gratitude' },
  { id: '4', text: 'A small thing that went well', type: 'win' },
  { id: '5', text: 'Something that caught my attention', type: 'moment' },
  { id: '6', text: 'An idea I had', type: 'thought' },
  { id: '7', text: 'Something that made today different', type: 'moment' },
  { id: '8', text: 'A quiet moment', type: 'moment' },
  { id: '9', text: 'Something I learned', type: 'thought' },
  { id: '10', text: 'Something I appreciated', type: 'gratitude' },
  { id: '11', text: 'Something I did that I\'m glad about', type: 'win' },
  { id: '12', text: 'A feeling I noticed', type: 'thought' },
  { id: '13', text: 'Something ordinary that felt good', type: 'moment' },
  { id: '14', text: 'A thought I want to remember', type: 'thought' },
  { id: '15', text: 'Something I finished', type: 'win' },
  { id: '16', text: 'Something I saw', type: 'moment' },
  { id: '17', text: 'Something I\'m thankful for today', type: 'gratitude' },
  { id: '18', text: 'A realization I had', type: 'thought' },
  { id: '19', text: 'Something that worked out', type: 'win' },
  { id: '20', text: 'A small thing I enjoyed', type: 'moment' },
  { id: '21', text: 'Something on my mind', type: 'thought' },
  { id: '22', text: 'Something I handled well', type: 'win' },
  { id: '23', text: 'Something I\'m glad exists', type: 'gratitude' },
  { id: '24', text: 'Something I want to hold onto', type: 'moment' },
  { id: '25', text: 'A shift in how I see something', type: 'thought' },
  { id: '26', text: 'Something I accomplished', type: 'win' },
  { id: '27', text: 'Someone I appreciated today', type: 'gratitude' },
  { id: '28', text: 'Something worth remembering', type: 'moment' },
  { id: '29', text: 'An internal shift', type: 'thought' },
  { id: '30', text: 'Something I\'m proud of', type: 'win' },
  { id: '31', text: 'Something simple I\'m grateful for', type: 'gratitude' },
];

export function getTodaysPrompt(): Prompt {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return prompts[dayOfYear % prompts.length];
}
