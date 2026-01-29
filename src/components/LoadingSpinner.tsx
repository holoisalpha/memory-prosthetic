interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-stone-200 border-t-stone-600 rounded-full animate-spin ${className}`}
    />
  );
}

// Full page loading state
export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="text-stone-400 text-sm mt-3">{message}</p>
    </div>
  );
}
