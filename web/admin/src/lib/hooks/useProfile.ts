'use client';

// src/lib/hooks/useProfile.ts — React Query hooks for the signed-in admin's own
// profile (04 §4, §A.2.12). Mutations invalidate ['profile'] and ['auth','me']
// per the §4.3 invalidation matrix.
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
  type UpdateProfileRequest,
  type ChangePasswordRequest,
  type ChangePasswordResultDTO,
} from '@/lib/api/profile';
import type { ApiError } from '@/lib/api/errors';
import type { UserDTO } from '@/types/api';

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
      // §4.3: PATCH /profile invalidates ['profile'] and ['auth','me'].
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
      // §4.3: PATCH /profile/password invalidates ['profile'] and ['auth','me'].
      void qc.invalidateQueries({ queryKey: qk.profile.detail() });
      void qc.invalidateQueries({ queryKey: qk.auth.me() });
    },
  });
}
