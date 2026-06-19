import { z } from 'zod';
import { BookingStatus } from '../types/enums';

/** ISO-8601 UTC datetime that must be strictly in the future (02 §8.6, §12). */
const futureIso = z
  .string()
  .datetime({ message: 'must be ISO-8601 UTC' })
  .refine((s) => new Date(s).getTime() > Date.now(), 'must be in the future');

/** POST /bookings — create a booking (row 28). */
export const createBooking = {
  body: z.object({
    service_id: z.coerce.number().int().positive(),
    scheduled_at: futureIso,
    address: z.string().max(500).nullish(),
    notes: z.string().max(5000).nullish(),
    // ADMIN-only; ignored for CUSTOMER (enforced in the service layer)
    provider_id: z.coerce.number().int().positive().nullish(),
    // ADMIN-only; forced to self for CUSTOMER (enforced in the service layer)
    customer_id: z.coerce.number().int().positive().optional(),
  }),
};

/** GET /bookings — role-scoped list (row 29). */
export const listBookings = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['id', 'scheduled_at', 'status', 'created_at']).default('scheduled_at'),
    sort_order: z
      .enum(['asc', 'desc'])
      .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
      .default('desc'),
    status: z.nativeEnum(BookingStatus).optional(),
    service_id: z.coerce.number().int().positive().optional(),
    customer_id: z.coerce.number().int().positive().optional(), // ADMIN only
    provider_id: z.coerce.number().int().positive().optional(), // ADMIN only
    scope: z.enum(['assigned', 'available', 'all']).optional(), // PROVIDER only
    scheduled_from: z.string().datetime().optional(),
    scheduled_to: z.string().datetime().optional(),
    include: z.string().optional(), // 'service,customer,provider,payment'
  }),
};

/** PATCH /bookings/:id — edit mutable details (row 31). */
export const updateBooking = {
  body: z
    .object({
      scheduled_at: futureIso.optional(),
      address: z.string().max(500).nullish(),
      notes: z.string().max(5000).nullish(),
    })
    .refine(
      (b) => Object.keys(b).length > 0,
      'at least one field is required',
    ),
};

/** Optional cancellation reason body for reject/cancel actions (rows 33, 36). */
export const reasonBody = {
  body: z.object({ cancellation_reason: z.string().min(1).max(2000).optional() }),
};

/** PATCH /bookings/:id/status — admin generic transition (row 37). */
export const adminSetStatus = {
  body: z
    .object({
      status: z.nativeEnum(BookingStatus),
      cancellation_reason: z.string().min(1).max(2000).optional(),
    })
    .refine(
      (b) =>
        (b.status !== BookingStatus.REJECTED && b.status !== BookingStatus.CANCELLED) ||
        (typeof b.cancellation_reason === 'string' && b.cancellation_reason.length >= 1),
      {
        path: ['cancellation_reason'],
        message: 'cancellation_reason is required when status is REJECTED or CANCELLED',
      },
    ),
};

/** PATCH /bookings/:id/assign — admin set/reassign provider (row 38). */
export const assign = {
  body: z.object({
    provider_id: z.coerce.number().int().positive().nullable(),
  }),
};
