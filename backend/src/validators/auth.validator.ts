import { z } from 'zod';
import { email, password, personName, phone } from './common.validator';

/**
 * Auth request validators (02 §8.1, §12).
 * Composed from the canonical shared primitives so rules cannot drift.
 */

/** POST /auth/register — self-service signup (always creates a CUSTOMER). */
export const register = {
  body: z.object({
    name: personName,
    email,
    password,
    phone: phone.optional(),
  }),
};

/** POST /auth/login — email + non-empty password. */
export const login = {
  body: z.object({
    email,
    password: z.string().min(1, 'is required'),
  }),
};

export type RegisterBody = z.infer<typeof register.body>;
export type LoginBody = z.infer<typeof login.body>;
