import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '../types/enums';

/**
 * Payment validators (02 §8.9, §12).
 *
 * Wire rules:
 *  - `method` ∈ PaymentMethod enum (CARD|CASH|WALLET|MOCK), default MOCK (service layer).
 *  - `status` ∈ PaymentStatus enum (PENDING|PAID|FAILED|REFUNDED), default PAID (service layer).
 *  - `transaction_ref` ≤80 chars; uniqueness (uq_payments_transaction_ref) is enforced
 *    in the service/DB layer → 409 DUPLICATE_RESOURCE.
 *  - `amount` / `currency` are server-set from the booking and are NOT accepted from the client.
 */

/** POST /bookings/:id/payment — create/record a mocked payment for a booking. */
export const createPayment = {
  body: z.object({
    method: z.nativeEnum(PaymentMethod).optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    transaction_ref: z.string().trim().max(80).nullish(),
  }),
};

/** GET /payments — admin list with filters, pagination & sorting (02 §8.9). */
export const listPayments = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['id', 'created_at', 'paid_at']).default('created_at'),
    sort_order: z
      .enum(['asc', 'desc'])
      .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
      .default('desc'),
    status: z.nativeEnum(PaymentStatus).optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    booking_id: z.coerce.number().int().positive().optional(),
  }),
};

export type CreatePaymentBody = z.infer<typeof createPayment.body>;
export type ListPaymentsQuery = z.infer<typeof listPayments.query>;
