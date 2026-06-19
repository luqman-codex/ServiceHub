// src/lib/api/profile.ts — own-profile endpoint functions using the shared api client.
// GET/PATCH /profile + PATCH /profile/password (02 §8.2). Customer C-10 profile management.
import { api, getData } from './client';
import type { UserDTO } from '@/types/api';

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

export function getProfile(): Promise<UserDTO> {
  return getData<UserDTO>(api.get('/profile'));
}

export function updateProfile(body: UpdateProfileRequest): Promise<UserDTO> {
  return getData<UserDTO>(api.patch('/profile', body));
}

export function changePassword(
  body: ChangePasswordRequest,
): Promise<ChangePasswordResultDTO> {
  return getData<ChangePasswordResultDTO>(api.patch('/profile/password', body));
}
