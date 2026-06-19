'use client';

// src/lib/hooks/useBookings.ts (04 §4) — React Query hooks for the admin bookings
// feature. Queries use the qk key factory; mutations invalidate per the §4.3 matrix.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignBookingProvider,
  getBooking,
  getBookingPayment,
  listActiveProviders,
  listBookings,
  setBookingStatus,
  type AdminSetStatusRequest,
  type AssignProviderRequest,
  type BookingListParams,
} from '@/lib/api/bookings';
import { ApiError } from '@/lib/api/errors';
import { qk } from '@/lib/react-query/keys';
import type { BookingDTO, PaymentDTO, Page, UserDTO } from '@/types/api';

const BOOKING_INCLUDE = 'service,customer,provider';
const BOOKING_DETAIL_INCLUDE = 'service,customer,provider,payment';

// A-7 — list bookings with filters/sort/pagination.
export function useBookings(params: BookingListParams) {
  const merged: BookingListParams = { include: BOOKING_INCLUDE, ...params };
  return useQuery<Page<BookingDTO>, ApiError>({
    queryKey: qk.bookings.list(merged as Record<string, unknown>),
    queryFn: () => listBookings(merged),
    placeholderData: (prev) => prev,
  });
}

// A-8/A-9 — one booking with eager relations.
export function useBooking(id: number, enabled = true) {
  return useQuery<BookingDTO, ApiError>({
    queryKey: qk.bookings.detail(id),
    queryFn: () => getBooking(id, BOOKING_DETAIL_INCLUDE),
    enabled: enabled && Number.isFinite(id),
  });
}

// A-11 — the mocked payment for a booking. 404 => "No payment recorded" (empty state),
// so we do not retry on a 404.
export function useBookingPayment(id: number, enabled = true) {
  return useQuery<PaymentDTO, ApiError>({
    queryKey: qk.bookings.payment(id),
    queryFn: () => getBookingPayment(id),
    enabled: enabled && Number.isFinite(id),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}

// Active providers for the assign dropdown.
export function useActiveProviders(enabled = true) {
  return useQuery<Page<UserDTO>, ApiError>({
    queryKey: qk.users.list({ role: 'PROVIDER', is_active: true }),
    queryFn: () => listActiveProviders(),
    enabled,
  });
}

// PATCH /bookings/:id/status — invalidate detail, list, and admin stats (§4.3).
export function useSetBookingStatus(id: number) {
  const qc = useQueryClient();
  return useMutation<BookingDTO, ApiError, AdminSetStatusRequest>({
    mutationFn: (body) => setBookingStatus(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(qk.bookings.detail(id), updated);
      qc.invalidateQueries({ queryKey: qk.bookings.detail(id) });
      qc.invalidateQueries({ queryKey: qk.bookings.all() });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
    },
  });
}

// PATCH /bookings/:id/assign — additionally invalidate the assigned provider (§4.3).
export function useAssignBookingProvider(id: number) {
  const qc = useQueryClient();
  return useMutation<BookingDTO, ApiError, AssignProviderRequest>({
    mutationFn: (body) => assignBookingProvider(id, body),
    onSuccess: (updated, variables) => {
      qc.setQueryData(qk.bookings.detail(id), updated);
      qc.invalidateQueries({ queryKey: qk.bookings.detail(id) });
      qc.invalidateQueries({ queryKey: qk.bookings.all() });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
      if (variables.provider_id != null) {
        qc.invalidateQueries({ queryKey: qk.users.detail(variables.provider_id) });
      }
    },
  });
}
