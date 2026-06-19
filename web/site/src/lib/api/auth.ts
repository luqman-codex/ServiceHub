// src/lib/api/auth.ts — auth endpoint functions using the shared api client (02 §8.1).
import { api, getData } from './client';
import type { AuthResultDTO, UserDTO } from '@/types/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export function login(body: LoginRequest): Promise<AuthResultDTO> {
  return getData<AuthResultDTO>(api.post('/auth/login', body));
}

// Self-service signup always creates a CUSTOMER (02 §8.1).
export function register(body: RegisterRequest): Promise<AuthResultDTO> {
  return getData<AuthResultDTO>(api.post('/auth/register', body));
}

export function me(): Promise<UserDTO> {
  return getData<UserDTO>(api.get('/auth/me'));
}

// Logout is client-side per 02 §2.3; the server call is best-effort and may not exist.
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // best-effort; token is cleared client-side regardless
  }
}
