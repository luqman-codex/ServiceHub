// src/lib/api/bookings.ts — booking endpoint functions for the PROVIDER portal using
// the shared api client. The server scopes GET /bookings + GET /bookings/:id to the
// caller's assigned jobs (02 §5 rows 29-30, RBAC "O"). Transition actions are the
// provider lifecycle moves (02 §9 rows 32-35).
import { api, getData, getPage } from './client';
import type { BookingDTO, BookingStatus, Page } from '@/types/api';

// --- Query params for GET /bookings (02 §8.6); provider-scoped server-side ---
export type BookingSortBy = 'id' | 'scheduled_at' | 'status' | 'created_at';
export type BookingSortOrder = 'asc' | 'desc';

export interface BookingListParams {
  page?: number;
  page_size?: number;
  sort_by?: BookingSortBy;
  sort_order?: BookingSortOrder;
  status?: BookingStatus;
  service_id?: number;
  scheduled_from?: string; // ISO date
  scheduled_to?: string; // ISO date
  include?: string; // comma list: service,customer,payment
}

// Strip undefined/empty values so we never send blank query params to the API.
function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

// Row 29 — GET /bookings (provider sees their assigned/open jobs).
export function listBookings(params: BookingListParams): Promise<Page<BookingDTO>> {
  return getPage<BookingDTO>(
    api.get('/bookings', { params: cleanParams({ ...params }) }),
  );
}

// Row 30 — GET /bookings/:id (own scope).
export function getBooking(id: number, include?: string): Promise<BookingDTO> {
  return getData<BookingDTO>(
    api.get(`/bookings/${id}`, { params: cleanParams({ include }) }),
  );
}

// --- Provider transition actions (02 §9 rows 32-35) ---

// Row 32 — POST /bookings/:id/accept (PENDING → ACCEPTED).
export function acceptBooking(id: number): Promise<BookingDTO> {
  return getData<BookingDTO>(api.post(`/bookings/${id}/accept`));
}

// Row 33 — POST /bookings/:id/reject (PENDING → REJECTED).
// Body: { cancellation_reason?: string } per 02 §9.
export function rejectBooking(id: number, reason?: string): Promise<BookingDTO> {
  const body = reason ? { cancellation_reason: reason } : {};
  return getData<BookingDTO>(api.post(`/bookings/${id}/reject`, body));
}

// Row 34 — POST /bookings/:id/start (ACCEPTED → IN_PROGRESS).
export function startBooking(id: number): Promise<BookingDTO> {
  return getData<BookingDTO>(api.post(`/bookings/${id}/start`));
}

// Row 35 — POST /bookings/:id/complete (IN_PROGRESS → COMPLETED).
export function completeBooking(id: number): Promise<BookingDTO> {
  return getData<BookingDTO>(api.post(`/bookings/${id}/complete`));
}
