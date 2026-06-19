import { z } from 'zod';

/**
 * Category validators (02 §8.4).
 *
 * Field rules:
 *  - name        required, 2–120, unique (uq_categories_name).
 *  - slug        2–140, URL-safe `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unique (uq_categories_slug);
 *                auto-derived from name when omitted on create.
 *  - description text, nullable.
 *  - icon_url    valid URL, ≤500, nullable.
 *  - is_active   boolean (default true on create).
 */

const name = z.string().trim().min(2).max(120);

const slug = z
  .string()
  .trim()
  .min(2)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a URL-safe slug');

const description = z.string().max(5000).nullish();

const iconUrl = z.string().url().max(500).nullish();

/** GET /categories — list/search (public). sort_by allow-list: id, name, created_at. */
export const listCategories = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['id', 'name', 'created_at']).default('name'),
    sort_order: z
      .enum(['asc', 'desc'])
      .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
      .default('asc'),
    is_active: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    q: z.string().trim().max(120).optional(),
  }),
};

/** POST /categories — create (ADMIN). */
export const createCategory = {
  body: z.object({
    name,
    slug: slug.optional(),
    description,
    icon_url: iconUrl,
    is_active: z.boolean().optional(),
  }),
};

/** PATCH /categories/:id — update (ADMIN). At least one field required. */
export const updateCategory = {
  body: z
    .object({
      name: name.optional(),
      slug: slug.optional(),
      description,
      icon_url: iconUrl,
      is_active: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'at least one field is required',
    }),
};
