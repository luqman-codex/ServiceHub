'use client';

// src/lib/hooks/useJobs.ts (04 §4) — React Query hooks for the PROVIDER jobs feature.
// "Jobs" are the provider's assigned bookings (server-scoped). Queries use the qk key
// factory; the transition mutation invalidates the bookings list + the affected detail.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptBooking,
  completeBooking,
  getBooking,
  listBookings,
  rejectBooking,
  startBooking,
  type BookingListParams,
} from '@/lib/api/bookings';
import { ApiError } from '@/lib/api/errors';
import { qk } from '@/lib/react-query/keys';
import type { BookingDTO, Page } from '@/types/api';

const JOB_LIST_INCLUDE = 'service,customer';
const JOB_DETAIL_INCLUDE = 'service,customer,payment';

// P-1..P-9 — list the provider's jobs with filters/sort/pagination.
export function useJobs(params: BookingListParams) {
  const merged: BookingListParams = { include: JOB_LIST_INCLUDE, ...params };
  return useQuery<Page<BookingDTO>, ApiError>({
    queryKey: qk.bookings.list(merged as Record<string, unknown>),
    queryFn: () => listBookings(merged),
    placeholderData: (prev) => prev,
  });
}

// One job with eager relations (service, customer, payment).
export function useJob(id: number, enabled = true) {
  return useQuery<BookingDTO, ApiError>({
    queryKey: qk.bookings.detail(id),
    queryFn: () => getBooking(id, JOB_DETAIL_INCLUDE),
    enabled: enabled && Number.isFinite(id),
  });
}

// The provider lifecycle actions, gated by current status (02 §9):
// PENDING → accept/reject; ACCEPTED → start; IN_PROGRESS → complete.
export type JobAction = 'accept' | 'reject' | 'start' | 'complete';

export interface JobTransitionVars {
  id: number;
  action: JobAction;
  reason?: string; // only used by 'reject'
}

// useJobTransition — single mutation covering all four transitions. On success it
// writes the returned booking into the detail cache and invalidates ['bookings']
// (all lists) plus ['bookings', id] so queues + detail refetch.
export function useJobTransition() {
  const qc = useQueryClient();
  return useMutation<BookingDTO, ApiError, JobTransitionVars>({
    mutationFn: ({ id, action, reason }) => {
      switch (action) {
        case 'accept':
          return acceptBooking(id);
        case 'reject':
          return rejectBooking(id, reason);
        case 'start':
          return startBooking(id);
        case 'complete':
          return completeBooking(id);
        default: {
          const _exhaustive: never = action;
          throw new Error(`Unknown job action: ${String(_exhaustive)}`);
        }
      }
    },
    onSuccess: (updated, variables) => {
      qc.setQueryData(qk.bookings.detail(variables.id), updated);
      qc.invalidateQueries({ queryKey: qk.bookings.detail(variables.id) });
      qc.invalidateQueries({ queryKey: qk.bookings.all() });
    },
  });
}
