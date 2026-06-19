// src/hooks/useAuth.tsx (05 §7.2)
// AuthProvider exposes { token, user, isBootstrapping, login, register, logout }.
// On cold start it reads the saved token from SecureStore, calls GET /auth/me (02 §8.1)
// to resolve the UserDTO, and flips isBootstrapping to false.
//
// login()/register() both accept an AuthResultDTO (the unwrapped data from
// POST /auth/login or POST /auth/register) and persist the token + set the user.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getToken, saveToken, clearToken } from '../lib/auth-storage';
import type { UserDTO, AuthResultDTO } from '../types/dto';

interface AuthContextValue {
  token: string | null;
  user: UserDTO | null;
  isBootstrapping: boolean;
  login: (result: AuthResultDTO) => Promise<void>;
  register: (result: AuthResultDTO) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getToken();
        if (saved) {
          setToken(saved);
          const res = await api.get('/auth/me'); // 02 §8.1
          setUser(res.data.data as UserDTO);
        }
      } catch {
        await clearToken(); // token invalid/expired → force re-login
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  // Shared by login and register: both endpoints return an AuthResultDTO and
  // should auto-authenticate the session (05 §9.1, §9.2).
  const applyAuthResult = async (result: AuthResultDTO) => {
    await saveToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);
  };

  const login = async (result: AuthResultDTO) => {
    await applyAuthResult(result);
  };

  const register = async (result: AuthResultDTO) => {
    await applyAuthResult(result);
  };

  const logout = async () => {
    // Best-effort server logout (02 §2.3); the token is cleared client-side regardless.
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — logout is client-side authoritative
    }
    await clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isBootstrapping, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
