// src/lib/api/profile.ts — own-profile + own provider-profile endpoint functions for
// the PROVIDER portal using the shared api client.
//   GET /profile, PATCH /profile, PATCH /profile/password (02 §8.2, rows 6-8).
//   GET /profile/provider, PUT /profile/provider (02 §8.2, rows 9-10) — own scope.
// The server scopes these to the authenticated provider; `user_id`/`is_verified`
// are ADMIN-only and intentionally NOT sent from this portal.
import { api, getData } from './client';
import type { ProviderProfileDTO, UserDTO } from '@/types/api';

// --- Account (UserDTO) ---

export interface UpdateProfileRequest {
  name?: string;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResultDTO {
  message: string;
}

// Row 6 — GET /profile (own UserDTO).
export function getProfile(): Promise<UserDTO> {
  return getData<UserDTO>(api.get('/profile'));
}

// Row 7 — PATCH /profile ({ name?, phone? }).
export function updateProfile(body: UpdateProfileRequest): Promise<UserDTO> {
  return getData<UserDTO>(api.patch('/profile', body));
}

// Row 8 — PATCH /profile/password ({ current_password, new_password }).
export function changePassword(
  body: ChangePasswordRequest,
): Promise<ChangePasswordResultDTO> {
  return getData<ChangePasswordResultDTO>(api.patch('/profile/password', body));
}

// --- Provider profile (ProviderProfileDTO) ---

// Provider-scoped upsert body. `rating` + `is_verified` are read-only display
// (server-managed / ADMIN-only) and are never sent from this portal.
export interface UpsertProviderProfileRequest {
  bio?: string | null;
  skills?: string | null; // CSV
  service_area?: string | null;
}

// Row 9 — GET /profile/provider (own provider_profiles row).
export function getProviderProfile(): Promise<ProviderProfileDTO> {
  return getData<ProviderProfileDTO>(api.get('/profile/provider'));
}

// Row 10 — PUT /profile/provider (create/replace own provider profile, upsert).
export function upsertProviderProfile(
  body: UpsertProviderProfileRequest,
): Promise<ProviderProfileDTO> {
  return getData<ProviderProfileDTO>(api.put('/profile/provider', body));
}
