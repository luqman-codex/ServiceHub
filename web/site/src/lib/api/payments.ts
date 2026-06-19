// src/lib/api/payments.ts — customer booking-action + payment endpoint functions using
// the shared api client. Covers the C-9 cancel action (POST /bookings/:id/cancel) and the
// C-11 mocked payment read/create (GET/POST /bookings/:id/payment, 02 §8.9, §9).
//
// The POST-create payment also lives in lib/api/bookings.ts (createBookingPayment) for the
// C-6 book flow; this module re-exports a thin alias so the detail screen's pay action and
// the GET read sit together. The GET returns 404 when no payment is recorded (treated as the
// "No payment recorded" empty state by PaymentCard).
import { api, getData } from './client';
import type { BookingDTO, PaymentDTO, PaymentMethod, PaymentStatus } from '@/types/api';

// --- GET /bookings/:id/payment (02 §8.9) — 404 when no payment exists. ---
export function getBookingPayment(id: number): Promise<PaymentDTO> {
  return getData<PaymentDTO>(api.get(`/bookings/${id}/payment`));
}

// --- POST /bookings/:id/payment (02 §8.9, bonus) — record the mocked payment. ---
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

// --- POST /bookings/:id/cancel (02 §9) — customer cancels own booking. ---
// PENDING → CANCELLED any time; ACCEPTED → CANCELLED only within the policy window
// (scheduled_at in the future). The server is the source of truth and may return
// 409 INVALID_STATUS_TRANSITION when outside the window or on a terminal state.
export interface CancelBookingRequest {
  cancellation_reason?: string;
}

export function cancelBooking(
  id: number,
  body: CancelBookingRequest = {},
): Promise<BookingDTO> {
  return getData<BookingDTO>(api.post(`/bookings/${id}/cancel`, body));
}
