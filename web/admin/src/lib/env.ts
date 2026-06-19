// src/lib/env.ts — reads + validates NEXT_PUBLIC_* (fail fast if missing), per 04 §9.x / 00 §9.
// NEXT_PUBLIC_* vars are inlined at build time and readable in the browser, so they
// must be non-secret (the API base URL and a storage-key name are safe).

function requireEnv(k: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing required env var: ${k}`);
  return v;
}

export const env = {
  // Reference process.env.<KEY> directly so Next can statically inline the value.
  apiBaseUrl: requireEnv('NEXT_PUBLIC_API_BASE_URL', process.env.NEXT_PUBLIC_API_BASE_URL),
  tokenKey: process.env.NEXT_PUBLIC_TOKEN_KEY ?? 'servicehub.token',
};
