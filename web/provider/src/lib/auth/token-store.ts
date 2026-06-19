// src/lib/auth/token-store.ts (04 §3.2)
// Stores the JWT in localStorage under a per-app key, accessed only through this module.
// Logout is client-side deletion (matches 02 §2.3: stateless, no server blacklist).
import { env } from '@/lib/env';

const KEY = env.tokenKey;

export const tokenStore = {
  get: (): string | null =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(KEY),
  set: (t: string): void => {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, t);
  },
  clear: (): void => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
  },
};
