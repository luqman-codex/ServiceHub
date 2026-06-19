import { z } from 'zod';
import { BookingStatus } from '../types/enums';

/**
 * Zod schemas for the Admin Dashboard & Stats resource (02 §8.8).
 * Each export is shaped as `{ body?, query?, params? }` for the `validate` middleware.
 *
 * Row 44 — GET /admin/stats has no request input (no validator in 03 §13).
 * Row 45 — GET /admin/stats/bookings uses `bookingStatsQuery` below.
 */

/** Bucket granularity for the time-series booking counts (default `day`). */
export const GROUP_BY_VALUES = ['day', 'week', 'month'] as const;
export type GroupBy = (typeof GROUP_BY_VALUES)[number];

/**
 * Row 45 — GET /admin/stats/bookings (time-bucketed booking counts).
 *
 * Query rules (02 §8.8):
 *  - from / to    optional ISO-8601 datetime; default = last 30 days (resolved in service).
 *  - group_by     `day` (default) | `week` | `month`; bad value → 422.
 *  - status       optional BookingStatus filter; bad value → 422.
 */
export const bookingStatsQuery = {
  query: z.object({
    from: z.string().trim().datetime({ offset: true }).optional(),
    to: z.string().trim().datetime({ offset: true }).optional(),
    group_by: z.enum(GROUP_BY_VALUES).default('day'),
    status: z.nativeEnum(BookingStatus).optional(),
  }),
};
