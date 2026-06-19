'use client';

// src/lib/auth/useAuth.ts (04 §3) — auth context + hook.
// The AuthProvider component lives in src/components/auth/AuthProvider.tsx and consumes
// this context; useAuth() is the single accessor used across the app.
import { createContext, useContext } from 'react';
import type { UserDTO } from '@/types/api';

export type AuthStatus = 'loading' | 'authed' | 'guest';

export interface AuthContextValue {
  status: AuthStatus;
  user: UserDTO | null;
  /** Persist a token + user (after a successful login). */
  login: (token: string, user: UserDTO) => void;
  /** Clear token, reset cache, and drop the in-memory session. */
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
