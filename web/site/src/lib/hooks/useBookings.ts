'use client';

// src/lib/hooks/useBookings.ts (04 §4) — React Query read hooks for the customer
// booking flow. Queries use the qk key factory. Mutations live in useCreateBooking.ts.
import { useQuery } from '@tanstack/react-query';
import {
  getBooking,
  listBookings,
  type BookingListParams,
} from '@/lib/api/bookings';
import { ApiError } from '@/lib/api/errors';
import { qk } from '@/lib/react-query/keys';
import type { BookingDTO, Page } from '@/types/api';

// NOTE: `useService` (the service backing the booking form, C-6) is owned by the services
// feature — import it from '@/lib/hooks/useServices'. It is intentionally NOT redefined here.

const BOOKING_DETAIL_INCLUDE = 'service,provider,payment';
const BOOKING_LIST_INCLUDE = 'service';

// C-7 — list the customer's own bookings (server scopes to customer_id = self).
export function useBookings(params: BookingListParams) {
  const merged: BookingListParams = { include: BOOKING_LIST_INCLUDE, ...params };
  return useQuery<Page<BookingDTO>, ApiError>({
    queryKey: qk.bookings.list(merged as Record<string, unknown>),
    queryFn: () => listBookings(merged),
    placeholderData: (prev) => prev,
  });
}

// C-8/C-9/C-11 — one booking with eager relations.
export function useBooking(id: number, enabled = true) {
  return useQuery<BookingDTO, ApiError>({
    queryKey: qk.bookings.detail(id),
    queryFn: () => getBooking(id, BOOKING_DETAIL_INCLUDE),
    enabled: enabled && Number.isFinite(id),
  });
}
