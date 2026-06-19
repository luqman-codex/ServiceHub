// src/lib/api/bookings.ts — booking endpoint functions using the shared api client.
// Covers 02 endpoints rows 29-31, 37-38, 46-47 plus the PROVIDER user lookup used by
// the assign dropdown (GET /users?role=PROVIDER&is_active=true).
import { api, getData, getPage } from './client';
import type {
  BookingDTO,
  BookingStatus,
  PaymentDTO,
  Page,
  UserDTO,
} from '@/types/api';

// --- Query params for GET /bookings (02 §8.6) ---
export type BookingSortBy = 'id' | 'scheduled_at' | 'status' | 'created_at';
export type BookingSortOrder = 'asc' | 'desc';

export interface BookingListParams {
  page?: number;
  page_size?: number;
  sort_by?: BookingSortBy;
  sort_order?: BookingSortOrder;
  status?: BookingStatus;
  service_id?: number;
  customer_id?: number;
  provider_id?: number;
  scheduled_from?: string; // ISO date
  scheduled_to?: string; // ISO date
  include?: string; // comma list: service,customer,provider,payment
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

// Row 29 — GET /bookings (admin sees all).
export function listBookings(params: BookingListParams): Promise<Page<BookingDTO>> {
  return getPage<BookingDTO>(
    api.get('/bookings', { params: cleanParams({ ...params }) }),
  );
}

// Row 30 — GET /bookings/:id.
export function getBooking(id: number, include?: string): Promise<BookingDTO> {
  return getData<BookingDTO>(
    api.get(`/bookings/${id}`, { params: cleanParams({ include }) }),
  );
}

// Row 37 — PATCH /bookings/:id/status (admin sets any legal target status).
export interface AdminSetStatusRequest {
  status: BookingStatus;
  cancellation_reason?: string; // required when target is REJECTED or CANCELLED
}

export function setBookingStatus(
  id: number,
  body: AdminSetStatusRequest,
): Promise<BookingDTO> {
  return getData<BookingDTO>(api.patch(`/bookings/${id}/status`, body));
}

// Row 38 — PATCH /bookings/:id/assign (set/reassign/unassign provider).
export interface AssignProviderRequest {
  provider_id: number | null; // null unassigns
}

export function assignBookingProvider(
  id: number,
  body: AssignProviderRequest,
): Promise<BookingDTO> {
  return getData<BookingDTO>(api.patch(`/bookings/${id}/assign`, body));
}

// Row 47 — GET /bookings/:id/payment (404 when no payment recorded).
export function getBookingPayment(id: number): Promise<PaymentDTO> {
  return getData<PaymentDTO>(api.get(`/bookings/${id}/payment`));
}

// Provider dropdown source for the assign UI (02 §8.2 GET /users).
export interface ProviderListParams {
  role?: 'PROVIDER';
  is_active?: boolean;
  page_size?: number;
}

export function listActiveProviders(): Promise<Page<UserDTO>> {
  return getPage<UserDTO>(
    api.get('/users', {
      params: cleanParams({ role: 'PROVIDER', is_active: true, page_size: 100 }),
    }),
  );
}
