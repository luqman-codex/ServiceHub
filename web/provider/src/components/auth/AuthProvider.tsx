'use client';

// src/components/auth/AuthProvider.tsx (04 §3.1) — PROVIDER-aware.
// On boot: read token from localStorage; if present, GET /auth/me to validate + hydrate.
// 401/inactive → clear token → guest. Exposes login/logout via AuthContext.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { me as fetchMe, logout as logoutApi } from '@/lib/api/auth';
import { tokenStore } from '@/lib/auth/token-store';
import { AuthContext, type AuthStatus } from '@/lib/auth/useAuth';
import type { UserDTO } from '@/types/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const token = tokenStore.get();
    if (!token) {
      setStatus('guest');
      return;
    }

    let cancelled = false;
    fetchMe()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus('authed');
      })
      .catch(() => {
        // Invalid/expired/inactive — the client interceptor already clears the token.
        if (cancelled) return;
        tokenStore.clear();
        setUser(null);
        setStatus('guest');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((token: string, nextUser: UserDTO) => {
    tokenStore.set(token);
    setUser(nextUser);
    setStatus('authed');
  }, []);

  const logout = useCallback(() => {
    void logoutApi(); // best-effort server ack (02 §2.3)
    tokenStore.clear();
    queryClient.clear();
    setUser(null);
    setStatus('guest');
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
