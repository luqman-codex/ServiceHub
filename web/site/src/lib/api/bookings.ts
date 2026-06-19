// src/lib/api/bookings.ts — booking-flow endpoint functions using the shared api client.
// Covers the customer C-6 booking flow (02 §8.6 POST /bookings, GET /services/:id for the
// price preview) plus the bonus mocked payment (02 §8.9 POST /bookings/:id/payment).
import { api, getData, getPage } from './client';
import type {
  BookingDTO,
  BookingStatus,
  PaymentDTO,
  PaymentMethod,
  PaymentStatus,
  ServiceDTO,
  Page,
} from '@/types/api';

// Strip undefined/empty values so we never send blank query params to the API.
function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

// --- Service (price preview) — GET /services/:id (02 §8.5) ---
// The booking form reads the service to snapshot name/price/currency/duration for the
// PriceSummary; the server is the source of truth for the booking's total_price.
export function getService(id: number, include = 'category'): Promise<ServiceDTO> {
  return getData<ServiceDTO>(
    api.get(`/services/${id}`, { params: cleanParams({ include }) }),
  );
}

// --- GET /bookings (02 §8.6) — customer sees own (server scopes to customer_id = self) ---
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
  include?: string; // comma list: service,customer,provider,payment
}

export function listBookings(params: BookingListParams): Promise<Page<BookingDTO>> {
  return getPage<BookingDTO>(
    api.get('/bookings', { params: cleanParams({ ...params }) }),
  );
}

// GET /bookings/:id (02 §8.6).
export function getBooking(id: number, include?: string): Promise<BookingDTO> {
  return getData<BookingDTO>(
    api.get(`/bookings/${id}`, { params: cleanParams({ include }) }),
  );
}

// --- POST /bookings (02 §8.6) — create a booking for the current customer ---
// total_price/currency are server-set from the service; provider_id/customer_id are
// ADMIN-only and intentionally omitted here.
export interface CreateBookingRequest {
  service_id: number;
  scheduled_at: string; // ISO-8601 UTC, must be strictly in the future
  address?: string | null;
  notes?: string | null;
}

export function createBooking(body: CreateBookingRequest): Promise<BookingDTO> {
  return getData<BookingDTO>(api.post('/bookings', body));
}

// --- POST /bookings/:id/payment (02 §8.9, bonus) — record the mocked payment ---
// amount/currency are server-set from the booking; method defaults MOCK, status PAID.
export interface CreatePaymentRequest {
  method?: PaymentMethod;
  status?: PaymentStatus;
  transaction_ref?: string | null;
}

export function createBookingPayment(
  id: number,
  body: CreatePaymentRequest = {},
): Promise<PaymentDTO> {
  return getData<PaymentDTO>(api.post(`/bookings/${id}/payment`, body));
}
