import { z } from 'zod';

/** `:id` path param — coerced positive integer (02 §12). */
export const idParam = z.object({ id: z.coerce.number().int().positive() });

/** `:providerId` path param for public availability reads (route 43). */
export const providerIdParam = z.object({
  providerId: z.coerce.number().int().positive(),
});

/** Shared pagination + sort-order query (02 §7). */
export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  sort_order: z
    .enum(['asc', 'desc'])
    .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
    .default('desc'),
});

/** Alias kept for callers that import `paginationQuery` by name (03 §10.2). */
export const paginationQuery = pagination;

/**
 * Sort-order primitive (02 §7.1). Per-resource `sort_by` allow-lists are declared
 * in each resource validator; this exposes only the shared `sort_order` enum.
 */
export const sort = z.object({
  sort_order: z
    .enum(['asc', 'desc'])
    .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
    .default('desc'),
});

/**
 * `?include=...` query (routes 23, 30). A comma-separated list of relations
 * (e.g. `category`, or `service,customer,provider,payment`). The service layer
 * validates which relation names are legal for the resource.
 */
export const includeQuery = z.object({
  include: z.string().trim().optional(),
});

/** Canonical shared field primitives (02 §12) — composed by resource validators. */
export const email = z.string().trim().toLowerCase().email().max(190);

export const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/, 'must contain a letter')
  .regex(/[0-9]/, 'must contain a digit');

export const personName = z.string().trim().min(2).max(120);

export const phone = z
  .string()
  .regex(/^\+?[0-9 ()-]{7,30}$/)
  .max(30);
