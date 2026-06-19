// src/lib/api/client.ts (04 §5)
// One shared axios instance. The request interceptor attaches the Bearer token; the
// response interceptor unwraps the 02 success/error envelopes into a typed result/ApiError.
import axios, { AxiosError } from 'axios';
import { tokenStore } from '@/lib/auth/token-store';
import { env } from '@/lib/env';
import { ApiError } from './errors';
import type { ErrorEnvelope, PaginationMeta, Page } from '@/types/api';

export const api = axios.create({
  baseURL: env.apiBaseUrl, // .../api/v1
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// --- Request: attach Authorization ---
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Response: unwrap envelope + normalize errors ---
api.interceptors.response.use(
  (res) => res, // callers read res.data.data via the helpers below
  (err: AxiosError<ErrorEnvelope>) => {
    const status = err.response?.status ?? 0;
    const payload = err.response?.data;
    const code = payload?.error?.code ?? (status === 0 ? 'NETWORK_ERROR' : 'INTERNAL_ERROR');
    const message = payload?.error?.message ?? err.message ?? 'Unexpected error';
    const details = payload?.error?.details;

    // Global auth handling: expired/invalid/inactive → clear + bounce to login.
    if (
      status === 401 ||
      code === 'TOKEN_EXPIRED' ||
      code === 'TOKEN_INVALID' ||
      code === 'ACCOUNT_INACTIVE'
    ) {
      tokenStore.clear();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.assign(`/login?redirect=${redirect}`);
      }
    }
    return Promise.reject(new ApiError({ status, code, message, details }));
  },
);

// Typed unwrap helpers for the 02 envelope.
export async function getData<T>(p: Promise<{ data: { data: T; meta?: unknown } }>): Promise<T> {
  const r = await p;
  return r.data.data;
}

export async function getPage<T>(
  p: Promise<{ data: { data: T[]; meta: PaginationMeta } }>,
): Promise<Page<T>> {
  const r = await p;
  return { items: r.data.data, meta: r.data.meta };
}
