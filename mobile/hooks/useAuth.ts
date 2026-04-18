import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { subscribeToAuth } from '@/services/auth';

export interface AuthState {
  user: User | null;
  initializing: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  return { user, initializing };
}
