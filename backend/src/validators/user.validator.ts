import { z } from 'zod';
import { RoleName } from '../types/enums';
import { email, password, personName, phone } from './common.validator';

/**
 * Zod schemas for the Users (admin) resource (02 §8.3, validation rules).
 * Each export is shaped as `{ body?, query?, params? }` for the `validate` middleware.
 * Shared field primitives (email/password/personName/phone) are composed from
 * `common.validator.ts` so rules cannot drift between endpoints (03 §10.2).
 */

const sortOrder = z
  .enum(['asc', 'desc'])
  .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
  .default('desc');

const trueFalse = z
  .enum(['true', 'false'])
  .transform((s) => s === 'true')
  .or(z.boolean());

/** Row 11 — GET /users (list/search). */
export const listUsers = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['id', 'name', 'email', 'created_at']).default('created_at'),
    sort_order: sortOrder,
    role: z.nativeEnum(RoleName).optional(),
    is_active: trueFalse.optional(),
    q: z.string().trim().min(1).optional(),
  }),
};

/** Row 12 — POST /users (admin creates a user with any role). */
export const adminCreateUser = {
  body: z.object({
    name: personName,
    email,
    password,
    role: z.nativeEnum(RoleName),
    phone: phone.optional(),
    is_active: z.boolean().optional(),
  }),
};

/** Row 14 — PATCH /users/:id (update mutable fields; at least one). */
export const adminUpdateUser = {
  body: z
    .object({
      name: personName.optional(),
      phone: phone.nullable().optional(),
      email: email.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, {
      message: 'at least one field is required',
    }),
};

/** Row 15 — PATCH /users/:id/status (activate/deactivate). */
export const setStatus = {
  body: z.object({
    is_active: z.boolean(),
  }),
};

/** Row 16 — PATCH /users/:id/role (change role). */
export const setRole = {
  body: z.object({
    role: z.nativeEnum(RoleName),
  }),
};
