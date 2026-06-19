// src/hooks/mutations.ts (05 §8.4)
// React Query mutations. Each wraps useMutation, unwraps the 02 §3.1 success envelope,
// and invalidates the right query keys (05 §8.4 invalidation rules):
//   Create Booking   → invalidate ['bookings']
//   Cancel booking   → invalidate ['bookings'] and ['booking', id]
//   Update profile    → invalidate ['profile']
//   Change password   → invalidate ['profile']
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AuthResultDTO, BookingDTO, UserDTO } from '../types/dto';

// --- Auth (02 §8.1) ---

export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login → AuthResultDTO. Caller passes the result to auth.login(). */
export function useLogin(): UseMutationResult<AuthResultDTO, unknown, LoginRequest> {
  return useMutation<AuthResultDTO, unknown, LoginRequest>({
    mutationFn: async (body) => {
      const res = await api.post('/auth/login', body);
      return res.data.data as AuthResultDTO;
    },
  });
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/** POST /auth/register → AuthResultDTO (always a CUSTOMER, 02 §8.1). */
export function useRegister(): UseMutationResult<
  AuthResultDTO,
  unknown,
  RegisterRequest
> {
  return useMutation<AuthResultDTO, unknown, RegisterRequest>({
    mutationFn: async (body) => {
      const res = await api.post('/auth/register', body);
      return res.data.data as AuthResultDTO;
    },
  });
}

// --- Bookings (02 §8.6, §9.1) ---

export interface CreateBookingRequest {
  service_id: number;
  scheduled_at: string; // ISO-8601 UTC, must be strictly in the future
  address?: string | null;
  notes?: string | null;
}

/** POST /bookings — create a PENDING booking; invalidates ['bookings'] (05 §8.4). */
export function useCreateBooking(): UseMutationResult<
  BookingDTO,
  unknown,
  CreateBookingRequest
> {
  const qc = useQueryClient();
  return useMutation<BookingDTO, unknown, CreateBookingRequest>({
    mutationFn: async (body) => {
      const res = await api.post('/bookings', body);
      return res.data.data as BookingDTO;
    },
    onSuccess: (created) => {
      qc.setQueryData(['booking', created.id], created);
      void qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export interface CancelBookingVariables {
  id: number;
  cancellation_reason?: string;
}

/**
 * POST /bookings/:id/cancel — cancel within policy; invalidates ['bookings'] and
 * ['booking', id] (05 §8.4).
 */
export function useCancelBooking(): UseMutationResult<
  BookingDTO,
  unknown,
  CancelBookingVariables
> {
  const qc = useQueryClient();
  return useMutation<BookingDTO, unknown, CancelBookingVariables>({
    mutationFn: async ({ id, cancellation_reason }) => {
      const res = await api.post(`/bookings/${id}/cancel`, {
        cancellation_reason,
      });
      return res.data.data as BookingDTO;
    },
    onSuccess: (updated) => {
      qc.setQueryData(['booking', updated.id], updated);
      void qc.invalidateQueries({ queryKey: ['booking', updated.id] });
      void qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// --- Profile (02 §8.2) ---

export interface UpdateProfileRequest {
  name?: string;
  phone?: string | null;
}

/** PATCH /profile — update name/phone; invalidates ['profile'] (05 §8.4). */
export function useUpdateProfile(): UseMutationResult<
  UserDTO,
  unknown,
  UpdateProfileRequest
> {
  const qc = useQueryClient();
  return useMutation<UserDTO, unknown, UpdateProfileRequest>({
    mutationFn: async (body) => {
      const res = await api.patch('/profile', body);
      return res.data.data as UserDTO;
    },
    onSuccess: (updated) => {
      qc.setQueryData(['profile'], updated);
      void qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResultDTO {
  message: string;
}

/** PATCH /profile/password — change password; invalidates ['profile'] (05 §8.4). */
export function useChangePassword(): UseMutationResult<
  ChangePasswordResultDTO,
  unknown,
  ChangePasswordRequest
> {
  const qc = useQueryClient();
  return useMutation<ChangePasswordResultDTO, unknown, ChangePasswordRequest>({
    mutationFn: async (body) => {
      const res = await api.patch('/profile/password', body);
      return res.data.data as ChangePasswordResultDTO;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
