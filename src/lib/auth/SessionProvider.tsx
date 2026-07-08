'use client';

import { createContext, useCallback, useMemo } from 'react';
import { Session } from './types';
import { useGetSession } from '@/hooks/auth/useGetSession';

type SessionProvider =
  | null
  | (Session & {
      updateSession: () => void;
    });

export const SessionContext = createContext<SessionProvider | undefined>(undefined);

export function SessionProvider({
  children,
  session: initialSession,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  // استفاده از hook برای دریافت session
  const { session, isLoading } = useGetSession();

  // استفاده از session از hook یا initialSession (برای SSR)
  const currentSession = session !== undefined ? session : initialSession;

  // implement the updateSession function
  // این تابع دیگر لازم نیست چون hook خودش به event ها گوش می‌دهد
  const updateSession = useCallback(() => {
    // Hook خودش به event ها گوش می‌دهد و session را به‌روز می‌کند
    // این تابع فقط برای backward compatibility نگه داشته شده
  }, []);

  // memoize the value of the context
  // so that it only updates when the session or updateSession function changes
  const value = useMemo(() => {
    if (currentSession) {
      return {
        ...currentSession,
        updateSession,
      };
    }
    return null;
  }, [currentSession, updateSession]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
