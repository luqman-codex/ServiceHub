// src/lib/api/users.ts — Users + provider-profile endpoint functions (02 §8.3, §8.2).
// Calls the shared api client and unwraps the 02 envelope via getData/getPage.
// DTO field names are snake_case to match the wire format verbatim.
import { api, getData, getPage } from './client';
import type { Page, ProviderProfileDTO, RoleName, UserDTO } from '@/types/api';

// --- Query params for GET /users (02 §8.3) ---
export interface UserListParams {
  page?: number;
  page_size?: number;
  q?: string;
  role?: RoleName;
  is_active?: boolean;
  sort_by?: 'id' | 'name' | 'email' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// --- Request bodies (02 §8.3) ---
export interface AdminCreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: RoleName;
  phone?: string;
  is_active?: boolean;
}

export interface AdminUpdateUserRequest {
  name?: string;
  phone?: string | null;
  email?: string;
}

export interface UpdateUserStatusRequest {
  is_active: boolean;
}

export interface UpdateUserRoleRequest {
  role: RoleName;
}

// --- Provider profile upsert (02 §8.2) ---
export interface UpsertProviderProfileRequest {
  bio?: string | null;
  skills?: string | null;
  service_area?: string | null;
  user_id?: number; // ADMIN only; targets another provider
  is_verified?: boolean; // ADMIN only
}

export function listUsers(params: UserListParams): Promise<Page<UserDTO>> {
  return getPage<UserDTO>(api.get('/users', { params }));
}

export function getUser(id: number): Promise<UserDTO> {
  return getData<UserDTO>(api.get(`/users/${id}`));
}

export function createUser(body: AdminCreateUserRequest): Promise<UserDTO> {
  return getData<UserDTO>(api.post('/users', body));
}

export function updateUser(id: number, body: AdminUpdateUserRequest): Promise<UserDTO> {
  return getData<UserDTO>(api.patch(`/users/${id}`, body));
}

export function updateUserStatus(id: number, body: UpdateUserStatusRequest): Promise<UserDTO> {
  return getData<UserDTO>(api.patch(`/users/${id}/status`, body));
}

export function updateUserRole(id: number, body: UpdateUserRoleRequest): Promise<UserDTO> {
  return getData<UserDTO>(api.patch(`/users/${id}/role`, body));
}

// Provider profile: ADMIN reads via ?user_id= and upserts via body user_id.
export function getProviderProfile(userId: number): Promise<ProviderProfileDTO> {
  return getData<ProviderProfileDTO>(
    api.get('/profile/provider', { params: { user_id: userId } }),
  );
}

export function upsertProviderProfile(
  body: UpsertProviderProfileRequest,
): Promise<ProviderProfileDTO> {
  return getData<ProviderProfileDTO>(api.put('/profile/provider', body));
}
