// Skeleton loading components for various UI elements

export function MemoryCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 bg-stone-200 rounded-full" />
        <div className="h-4 w-12 bg-stone-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-stone-100 rounded w-full" />
        <div className="h-4 bg-stone-100 rounded w-3/4" />
      </div>
    </div>
  );
}

export function MemoryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <MemoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 w-24 bg-stone-200 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-stone-100 rounded" />
          <div className="h-8 w-8 bg-stone-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square bg-stone-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export function TagSkeleton() {
  return (
    <div className="h-6 w-16 bg-stone-100 rounded-full animate-pulse" />
  );
}

export function TagListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <TagSkeleton key={i} />
      ))}
    </div>
  );
}
