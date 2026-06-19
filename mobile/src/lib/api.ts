// src/lib/api.ts (05 §8.2)
// One shared axios instance for the whole app.
//  - request interceptor attaches the Bearer JWT (02 §2.1)
//  - response interceptor clears the token on 401 so RootNavigator returns to Login (02 §10)
//  - apiErrorMessage normalizes the 02 §3.2 error envelope into a friendly message
import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './env';
import { getToken, clearToken } from './auth-storage';

export const api = axios.create({
  baseURL: API_BASE_URL, // e.g. http://192.168.1.20:4000/api/v1
  timeout: 15000,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

// Attach JWT on every request (02 §2.1: Authorization: Bearer <jwt>).
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 (expired/invalid token, 02 §10) clear it so the app returns to Login.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  },
);

// Normalize the API error envelope (02 §3.2) into a friendly message.
export function apiErrorMessage(error: unknown): string {
  const e = error as AxiosError<{ error?: { message?: string } }>;
  return e.response?.data?.error?.message ?? 'Something went wrong. Please try again.';
}
