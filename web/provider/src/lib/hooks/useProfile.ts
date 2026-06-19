'use client';

// src/lib/hooks/useProfile.ts (04 §4) — React Query hooks for the signed-in PROVIDER's
// own account + provider profile.
//   useProfile / useUpdateProfile / useChangePassword → /profile (02 §8.2 rows 6-8).
//   useProviderProfile / useUpsertProviderProfile → /profile/provider (rows 9-10).
// Account mutations invalidate ['profile'] + ['auth','me']; the provider-profile
// mutation invalidates ['providerProfile','self'] (qk.profile.provider()).
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import {
  getProfile,
  updateProfile,
  changePassword,
  getProviderProfile,
  upsertProviderProfile,
  type UpdateProfileRequest,
  type ChangePasswordRequest,
  type ChangePasswordResultDTO,
  type UpsertProviderProfileRequest,
} from '@/lib/api/profile';
import { ApiError } from '@/lib/api/errors';
import type { ProviderProfileDTO, UserDTO } from '@/types/api';

// --- Account (/profile) ---

export function useProfile(): UseQueryResult<UserDTO, ApiError> {
  return useQuery<UserDTO, ApiError>({
    queryKey: qk.profile.detail(),
    queryFn: getProfile,
  });
}

export function useUpdateProfile(): UseMutationResult<
  UserDTO,
  ApiError,
  UpdateProfileRequest
> {
  const qc = useQueryClient();
  return useMutation<UserDTO, ApiError, UpdateProfileRequest>({
    mutationFn: (body) => updateProfile(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.profile.detail() });
      void qc.invalidateQueries({ queryKey: qk.auth.me() });
    },
  });
}

export function useChangePassword(): UseMutationResult<
  ChangePasswordResultDTO,
  ApiError,
  ChangePasswordRequest
> {
  const qc = useQueryClient();
  return useMutation<ChangePasswordResultDTO, ApiError, ChangePasswordRequest>({
    mutationFn: (body) => changePassword(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.profile.detail() });
      void qc.invalidateQueries({ queryKey: qk.auth.me() });
    },
  });
}

// --- Provider profile (/profile/provider) ---

// GET /profile/provider. A 404 (NOT_FOUND) is a valid "no profile created yet"
// state, so we do not retry it — the screen renders an empty/create form instead.
export function useProviderProfile(): UseQueryResult<ProviderProfileDTO, ApiError> {
  return useQuery<ProviderProfileDTO, ApiError>({
    queryKey: qk.profile.provider(),
    queryFn: getProviderProfile,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.code === 'NOT_FOUND')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUpsertProviderProfile(): UseMutationResult<
  ProviderProfileDTO,
  ApiError,
  UpsertProviderProfileRequest
> {
  const qc = useQueryClient();
  return useMutation<ProviderProfileDTO, ApiError, UpsertProviderProfileRequest>({
    mutationFn: (body) => upsertProviderProfile(body),
    onSuccess: (updated) => {
      qc.setQueryData(qk.profile.provider(), updated);
      void qc.invalidateQueries({ queryKey: qk.profile.provider() });
    },
  });
}
