import { z } from 'zod';
import { password, personName, phone } from './common.validator';

/**
 * Profile validators (02 §8.2; 03 §13 rows 6-10).
 *
 * `email` and `role` are intentionally NOT editable via the profile resource
 * (email is immutable; role changes go through the admin users resource).
 */

/**
 * PATCH /profile — update own profile (02 §8.2).
 * `name` 2–120 if present; `phone` matches the phone regex or is `null`.
 * At least one field must be provided (else 422).
 */
export const updateProfile = {
  body: z
    .object({
      name: personName.optional(),
      phone: phone.nullable().optional(),
    })
    .strict()
    .refine((data) => data.name !== undefined || data.phone !== undefined, {
      message: 'at least one field is required',
    }),
};

/**
 * PATCH /profile/password — change own password (02 §8.2).
 * `current_password` required; `new_password` 8–72 with ≥1 letter & ≥1 digit;
 * the new password must differ from the current one.
 */
export const changePassword = {
  body: z
    .object({
      current_password: z.string().min(1, 'is required'),
      new_password: password,
    })
    .refine((data) => data.new_password !== data.current_password, {
      message: 'must differ from the current password',
      path: ['new_password'],
    }),
};

/**
 * GET /profile/provider — read own provider profile (02 §8.2).
 * `user_id` is honored for ADMIN only (service layer enforces the role gate).
 */
export const getProviderProfile = {
  query: z.object({
    user_id: z.coerce.number().int().positive().optional(),
  }),
};

/**
 * PUT /profile/provider — create/replace own provider profile (upsert, 02 §8.2).
 * `bio` free text; `skills` ≤500 (CSV); `service_area` ≤255.
 * `user_id` (target) and `is_verified` are ADMIN-only (service layer enforces).
 */
export const upsertProviderProfile = {
  body: z.object({
    bio: z.string().nullable().optional(),
    skills: z.string().max(500).nullable().optional(),
    service_area: z.string().max(255).nullable().optional(),
    user_id: z.coerce.number().int().positive().optional(),
    is_verified: z.boolean().optional(),
  }),
};
