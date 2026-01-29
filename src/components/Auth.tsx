import { SignIn } from '@clerk/clerk-react';

export function Auth() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-medium text-stone-900">Memory Prosthetic</h1>
          <p className="text-sm text-stone-500 mt-1">
            Sign in to access your memories
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border border-stone-200',
            }
          }}
        />
      </div>
    </div>
  );
}
