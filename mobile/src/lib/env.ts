// src/lib/env.ts (05 §12.2)
// Resolve the API base URL with a robust fallback chain:
//   1. Constants.expoConfig.extra.apiBaseUrl (injected by app.config.ts)
//   2. process.env.EXPO_PUBLIC_API_BASE_URL (inlined by Expo at bundle time)
// Fail fast with a clear message if neither is set (00 §9 config rule).
import Constants from 'expo-constants';

const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
  ?.apiBaseUrl;
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

export const API_BASE_URL = fromExtra ?? fromEnv ?? '';

if (!API_BASE_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env and set your LAN IP, then restart `expo start`.',
  );
}
