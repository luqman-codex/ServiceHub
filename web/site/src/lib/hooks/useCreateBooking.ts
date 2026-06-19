'use client';

// src/lib/hooks/useCreateBooking.ts (04 §4) — booking-flow mutations for C-6/C-11.
// POST /bookings invalidates ['bookings'] (+ admin stats) per the §4.3 matrix; the bonus
// POST /bookings/:id/payment invalidates the payment + detail (+ admin payments/stats).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBooking,
  createBookingPayment,
  type CreateBookingRequest,
  type CreatePaymentRequest,
} from '@/lib/api/bookings';
import { ApiError } from '@/lib/api/errors';
import { qk } from '@/lib/react-query/keys';
import type { BookingDTO, PaymentDTO } from '@/types/api';

// C-6 — create a booking. Starts PENDING; invalidates the bookings list (§4.3).
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation<BookingDTO, ApiError, CreateBookingRequest>({
    mutationFn: (body) => createBooking(body),
    onSuccess: (created) => {
      qc.setQueryData(qk.bookings.detail(created.id), created);
      qc.invalidateQueries({ queryKey: qk.bookings.all() });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
    },
  });
}

// C-11 (bonus) — record the mocked payment for a booking. Invalidates the booking's
// payment + detail, plus admin payments/stats (§4.3).
export function useCreateBookingPayment(bookingId: number) {
  const qc = useQueryClient();
  return useMutation<PaymentDTO, ApiError, CreatePaymentRequest | void>({
    mutationFn: (body) => createBookingPayment(bookingId, body ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bookings.payment(bookingId) });
      qc.invalidateQueries({ queryKey: qk.bookings.detail(bookingId) });
      qc.invalidateQueries({ queryKey: qk.bookings.all() });
      qc.invalidateQueries({ queryKey: qk.payments.list({}) });
      qc.invalidateQueries({ queryKey: qk.admin.stats() });
    },
  });
}
