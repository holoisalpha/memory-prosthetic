# Memory Prosthetic - Technical Architecture

## Overview

A mobile-first, local-first PWA for capturing and browsing personal memories. All data stays on-device in IndexedDB.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **Styling:** Tailwind CSS 4
- **Storage:** Dexie.js (IndexedDB wrapper)
- **PWA:** vite-plugin-pwa + Workbox

## Project Structure

```
src/
├── App.tsx                 # Root component, screen routing
├── main.tsx               # Entry point
├── styles.css             # Tailwind imports + custom styles
├── lib/
│   ├── types.ts           # TypeScript interfaces (MemoryEntry, Settings, etc.)
│   └── db.ts              # Dexie database setup + helpers
├── data/
│   └── prompts.ts         # Daily prompt rotation (31 prompts)
├── hooks/
│   └── useMemories.ts     # All data operations (CRUD, export, resurfacing)
├── components/
│   ├── MemoryCard.tsx     # Single memory display card
│   ├── TypeSelector.tsx   # Memory type picker (moment/thought/win/gratitude)
│   ├── ToneSelector.tsx   # Tone picker (light/neutral/heavy)
│   └── BottomNav.tsx      # Tab navigation
└── screens/
    ├── Home.tsx           # Today view + prompt + resurfacing
    ├── AddMemory.tsx      # Create/edit memory flow
    ├── Calendar.tsx       # Monthly calendar grid
    ├── DayDetail.tsx      # Single day's memories
    ├── Archive.tsx        # Filtered browsing
    └── Settings.tsx       # Resurfacing toggle, export, delete
```

## Data Model

```typescript
MemoryEntry {
  id: string              // UUID
  created_at: string      // ISO timestamp
  entry_date: string      // YYYY-MM-DD (local)
  type: "moment" | "thought" | "win" | "gratitude"
  content: string         // max 240 chars
  tone: "neutral" | "light" | "heavy"
  photo_url?: string      // base64 data URL, max 1/day
}

Settings {
  id: string              // always "default"
  resurfacing_enabled: boolean
  last_resurfaced_date?: string
}
```

## Constraints (Enforced in Code)

| Constraint | Location |
|------------|----------|
| Max 3 entries/day | `useMemories.ts:addEntry()` |
| Max 1 gratitude/day | `useMemories.ts:addEntry()` |
| Max 1 photo/day | `useMemories.ts:addEntry()` |
| Max 240 chars | `AddMemory.tsx` + `useMemories.ts` |
| Edit lock after midnight | `db.ts:isEntryEditable()` |

## Screen Flow

```
[Home] ←→ [Add Memory]
   ↓
[Calendar] → [Day Detail] → [Add Memory (edit)]
   ↓
[Archive]
   ↓
[Settings]
```

## Resurfacing Logic

When enabled (opt-in only):
1. Check if already resurfaced today
2. Look for entries from same calendar day in past years
3. Fall back to random past entry
4. Show max 1 per day, inline on Home screen

## Local Storage

IndexedDB tables (via Dexie):
- `entries`: All memory entries, indexed by entry_date, type, tone, created_at
- `settings`: Single row with resurfacing preferences

Photos are stored as base64 data URLs within the entry record.

## PWA Features

- Offline-first: Service worker caches all assets
- Installable: Full manifest with icons
- iOS optimized: Safe area insets, tap highlight removal

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Assumptions

1. Single-user only (no auth in MVP)
2. Photos stored as base64 (simple, but limits size)
3. No cloud sync (entirely local)
4. Browser supports IndexedDB (all modern browsers)

## Open Questions

1. **Photo size limits:** Currently no explicit limit beyond browser storage
2. **Import functionality:** Export exists, import would enable backup restore
3. **Migration path:** If schema changes, Dexie versioning handles it
4. **Notification opt-in:** Spec mentions "unless explicitly enabled" — not yet implemented
