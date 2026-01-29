import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  return {
    user,
    userId: user?.id ?? null,
    isLoggedIn: !!user,
    loading: !isLoaded,
    signOut,
  };
}
