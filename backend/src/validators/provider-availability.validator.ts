import { z } from 'zod';
import { DayOfWeek } from '../types/enums';

/**
 * Provider-availability validators (02 §8.7).
 *
 * Wire rules:
 *  - `day_of_week` ∈ DayOfWeek enum (MON..SUN).
 *  - `start_time` / `end_time` are 'HH:mm' or 'HH:mm:ss'; normalized to 'HH:mm:ss'.
 *  - `end_time > start_time` is enforced in the service layer (01 §10.6) so a
 *    partial PATCH (which may supply only one of the two) can compare against
 *    the persisted row.
 */

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HH_MM_SS = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

/** Accept 'HH:mm' or 'HH:mm:ss'; emit canonical 'HH:mm:ss'. */
const timeOfDay = z
  .string()
  .trim()
  .refine((s) => HH_MM.test(s) || HH_MM_SS.test(s), {
    message: 'must be a valid time (HH:mm or HH:mm:ss)',
  })
  .transform((s) => (HH_MM.test(s) ? `${s}:00` : s));

/** GET /provider-availability — list own (PROVIDER) or any (ADMIN via provider_id). */
export const listAvailability = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['day_of_week', 'start_time', 'created_at']).default('day_of_week'),
    sort_order: z
      .enum(['asc', 'desc'])
      .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
      .default('asc'),
    provider_id: z.coerce.number().int().positive().optional(), // ADMIN only
    day_of_week: z.nativeEnum(DayOfWeek).optional(),
    is_available: z
      .enum(['true', 'false'])
      .transform((s) => s === 'true')
      .optional(),
  }),
};

/** POST /provider-availability — create a window. */
export const createAvailability = {
  body: z.object({
    day_of_week: z.nativeEnum(DayOfWeek),
    start_time: timeOfDay,
    end_time: timeOfDay,
    is_available: z.boolean().optional(),
    provider_id: z.coerce.number().int().positive().optional(), // ADMIN only
  }),
};

/** PATCH /provider-availability/:id — partial update. */
export const updateAvailability = {
  body: z
    .object({
      day_of_week: z.nativeEnum(DayOfWeek),
      start_time: timeOfDay,
      end_time: timeOfDay,
      is_available: z.boolean(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, {
      message: 'at least one field is required',
    }),
};

/** GET /providers/:providerId/availability — public read filters. */
export const publicAvailQuery = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    day_of_week: z.nativeEnum(DayOfWeek).optional(),
    is_available: z
      .enum(['true', 'false'])
      .transform((s) => s === 'true')
      .optional(),
  }),
};
