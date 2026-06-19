import { z } from 'zod';

/**
 * Service resource validators (02 §8.5).
 *
 * Composes shared primitives where applicable; encodes the per-field rules of
 * `02` §8.5 verbatim. The `validate` middleware overwrites `req.body|query|params`
 * with the parsed+coerced output, so controllers receive clean, typed data.
 */

/**
 * Price: required, >= 0, <= 99999999.99, max 2 decimals. Accepts a number or a
 * numeric string on the wire (02 §1.1 — money may arrive as a string), and is
 * normalized to a 2-decimal string the service layer can persist to DECIMAL(10,2).
 */
const priceField = z
  .union([z.number(), z.string()])
  .superRefine((val, ctx) => {
    const str = typeof val === 'number' ? String(val) : val.trim();
    if (str === '' || !/^\d+(\.\d{1,2})?$/.test(str)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must be a number with at most 2 decimal places',
      });
      return;
    }
    const num = Number(str);
    if (!Number.isFinite(num)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid number' });
      return;
    }
    if (num < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be >= 0' });
    }
    if (num > 99999999.99) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be <= 99999999.99' });
    }
  })
  .transform((val) => {
    const str = typeof val === 'number' ? String(val) : val.trim();
    return Number(str).toFixed(2);
  });

/** ISO 4217 currency code: exactly 3 uppercase letters. */
const currencyField = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/, 'must be a 3-letter ISO 4217 code');

const serviceName = z.string().trim().min(2).max(160);

const description = z.string().max(10000).nullish();

const durationMinutes = z.coerce.number().int().min(1).nullish();

const imageUrl = z.string().trim().url().max(500).nullish();

/** GET /services — list/browse (public). */
export const listServices = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['id', 'name', 'price', 'created_at']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    category_id: z.coerce.number().int().positive().optional(),
    is_active: z
      .enum(['true', 'false'])
      .transform((s) => s === 'true')
      .optional(),
    q: z.string().trim().max(255).optional(),
    price_min: z.coerce.number().min(0).optional(),
    price_max: z.coerce.number().min(0).optional(),
    include: z.string().trim().optional(),
  }),
};

/** POST /services — create (ADMIN). */
export const createService = {
  body: z.object({
    category_id: z.coerce.number().int().positive(),
    name: serviceName,
    description,
    price: priceField,
    currency: currencyField.optional(),
    duration_minutes: durationMinutes,
    image_url: imageUrl,
    is_active: z.boolean().optional(),
  }),
};

/** PATCH /services/:id — update (ADMIN); any subset, at least one field. */
export const updateService = {
  body: z
    .object({
      category_id: z.coerce.number().int().positive(),
      name: serviceName,
      description,
      price: priceField,
      currency: currencyField,
      duration_minutes: durationMinutes,
      image_url: imageUrl,
      is_active: z.boolean(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'at least one field is required',
    }),
};

/** PATCH /services/:id/price — update only price (ADMIN). */
export const updatePrice = {
  body: z.object({
    price: priceField,
    currency: currencyField.optional(),
  }),
};
