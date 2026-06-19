// src/lib/validation/common.ts — shared zod primitives mirroring 02 §12 rules.
// Feature schemas (login, register, booking, profile, etc.) compose these primitives.
// Server remains the source of truth on 422.
import { z } from 'zod';
import { ApiError } from '@/lib/api/errors';

// Phone: optional; allows empty string (RHF default) or a valid pattern.
export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9 ()-]{7,30}$/, 'must be a valid phone number')
  .optional()
  .or(z.literal(''));

// Password: 8–72 chars, at least one letter and one digit.
export const passwordSchema = z
  .string()
  .min(8, 'must be at least 8 characters')
  .max(72, 'must be at most 72 characters')
  .regex(/[A-Za-z]/, 'needs a letter')
  .regex(/[0-9]/, 'needs a digit');

export const emailSchema = z.string().email('must be a valid email');

export const nameSchema = z
  .string()
  .min(2, 'must be at least 2 characters')
  .max(120, 'must be at most 120 characters');

export const roleEnum = z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN']);

export const dayOfWeekEnum = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

export const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'must be a 3-letter ISO currency code')
  .optional();

export const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'must be HH:mm or HH:mm:ss');

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, numbers and hyphens only')
  .max(140, 'must be at most 140 characters')
  .optional()
  .or(z.literal(''));

export const urlSchema = z
  .string()
  .url('must be a valid URL')
  .max(500, 'must be at most 500 characters')
  .optional()
  .or(z.literal(''));

// Maps an ApiError (422 details / 409 codes) back onto RHF fields, falling back to a toast.
export function applyServerErrors(
  err: unknown,
  setError: (field: string, e: { message: string }) => void,
  fallbackToast: (m: string) => void,
): void {
  if (!(err instanceof ApiError)) {
    fallbackToast(err instanceof Error ? err.message : 'Unexpected error');
    return;
  }

  if (err.code === 'VALIDATION_ERROR' && err.details?.length) {
    err.details.forEach((d) => setError(d.field, { message: d.message }));
  } else if (err.code === 'EMAIL_ALREADY_EXISTS') {
    setError('email', { message: 'This email is already in use' });
  } else {
    // DUPLICATE_RESOURCE, INVALID_STATUS_TRANSITION, PAYMENT_ALREADY_EXISTS, CONFLICT, etc.
    fallbackToast(err.message);
  }
}
