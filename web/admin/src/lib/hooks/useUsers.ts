'use client';

// src/lib/hooks/useUsers.ts (04 §4) — React Query hooks for users + provider profile.
// Lists/details read via useQuery with the qk key factory; mutations invalidate per
// the §4.3 invalidation matrix.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import {
  createUser,
  getProviderProfile,
  getUser,
  listUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
  upsertProviderProfile,
  type AdminCreateUserRequest,
  type AdminUpdateUserRequest,
  type UpdateUserRoleRequest,
  type UpdateUserStatusRequest,
  type UpsertProviderProfileRequest,
  type UserListParams,
} from '@/lib/api/users';
import type { Page, ProviderProfileDTO, UserDTO } from '@/types/api';

export function useUsers(params: UserListParams) {
  return useQuery<Page<UserDTO>, ApiError>({
    queryKey: qk.users.list(params as Record<string, unknown>),
    queryFn: () => listUsers(params),
    placeholderData: (prev) => prev, // keep last page while paginating/filtering
  });
}

export function useUser(id: number, enabled = true) {
  return useQuery<UserDTO, ApiError>({
    queryKey: qk.users.detail(id),
    queryFn: () => getUser(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<UserDTO, ApiError, AdminCreateUserRequest>({
    mutationFn: (body) => createUser(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all() });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
    },
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation<UserDTO, ApiError, AdminUpdateUserRequest>({
    mutationFn: (body) => updateUser(id, body),
    onSuccess: (user) => {
      qc.setQueryData(qk.users.detail(id), user);
      qc.invalidateQueries({ queryKey: qk.users.all() });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
    },
  });
}

export function useUpdateUserStatus(id: number) {
  const qc = useQueryClient();
  return useMutation<UserDTO, ApiError, UpdateUserStatusRequest>({
    mutationFn: (body) => updateUserStatus(id, body),
    onSuccess: (user) => {
      qc.setQueryData(qk.users.detail(id), user);
      qc.invalidateQueries({ queryKey: qk.users.all() });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
    },
  });
}

export function useUpdateUserRole(id: number) {
  const qc = useQueryClient();
  return useMutation<UserDTO, ApiError, UpdateUserRoleRequest>({
    mutationFn: (body) => updateUserRole(id, body),
    onSuccess: (user) => {
      qc.setQueryData(qk.users.detail(id), user);
      qc.invalidateQueries({ queryKey: qk.users.all() });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
    },
  });
}

// --- Provider profile (02 §8.2) ---

export function useProviderProfile(userId: number, enabled = true) {
  return useQuery<ProviderProfileDTO, ApiError>({
    queryKey: qk.profile.provider(userId),
    queryFn: () => getProviderProfile(userId),
    enabled: enabled && Number.isFinite(userId) && userId > 0,
    // A provider may legitimately have no profile yet (404) — don't hammer retries.
    retry: false,
  });
}

export function useUpsertProviderProfile(userId: number) {
  const qc = useQueryClient();
  return useMutation<ProviderProfileDTO, ApiError, UpsertProviderProfileRequest>({
    mutationFn: (body) => upsertProviderProfile({ ...body, user_id: userId }),
    onSuccess: (profile) => {
      qc.setQueryData(qk.profile.provider(userId), profile);
      qc.invalidateQueries({ queryKey: qk.profile.provider(userId) });
      qc.invalidateQueries({ queryKey: qk.users.detail(userId) });
    },
  });
}
