import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { clearToken, getToken, setToken } from '@shared/api/api';
import { SessionService } from '../api/service';
import type { User } from './types';

interface SessionContextValue {
  user: User | null;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    SessionService.me()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      setSession: (token, nextUser) => {
        setToken(token);
        setUser(nextUser);
      },
      clearSession: () => {
        clearToken();
        setUser(null);
      }
    }),
    [loading, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return value;
}

