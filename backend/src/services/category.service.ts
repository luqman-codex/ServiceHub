import { Op, WhereOptions } from 'sequelize';
import { Category } from '../models';
import { CategoryDTO, PaginationMeta } from '../types/dto';
import { RoleName } from '../types/enums';
import { AuthUser } from '../types/jwt';
import { ConflictError, NotFoundError } from '../utils/errors';
import { buildPaginationMeta, toOffsetLimit } from '../utils/pagination';
import { serializeCategory } from '../utils/serializers';

/**
 * Category service (02 §8.4, 03 §13 rows 17–21).
 * ALL business logic lives here: uniqueness pre-checks, public is_active scoping,
 * soft delete. Returns DTO-shaped data via serializers; throws AppError subclasses.
 */

interface ListCategoriesQuery {
  page: number;
  page_size: number;
  sort_by: 'id' | 'name' | 'created_at';
  sort_order: 'asc' | 'desc';
  is_active?: boolean;
  q?: string;
}

interface ListCategoriesResult {
  data: CategoryDTO[];
  meta: PaginationMeta;
}

interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  icon_url?: string | null;
  is_active?: boolean;
}

interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  icon_url?: string | null;
  is_active?: boolean;
}

/** Derive a URL-safe slug from a category name. */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Throws CONFLICT (DUPLICATE_RESOURCE) when name/slug already belongs to another
 * category. `excludeId` lets updates skip the row being edited.
 */
async function assertUnique(
  fields: { name?: string; slug?: string },
  excludeId?: number,
): Promise<void> {
  if (fields.name !== undefined) {
    const where: WhereOptions = { name: fields.name };
    if (excludeId !== undefined) (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    const existing = await Category.findOne({ where });
    if (existing) throw new ConflictError('Category name already exists', 'DUPLICATE_RESOURCE');
  }
  if (fields.slug !== undefined) {
    const where: WhereOptions = { slug: fields.slug };
    if (excludeId !== undefined) (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    const existing = await Category.findOne({ where });
    if (existing) throw new ConflictError('Category slug already exists', 'DUPLICATE_RESOURCE');
  }
}

/** GET /categories — public list with pagination, search, and is_active scoping. */
export async function list(query: ListCategoriesQuery, user?: AuthUser): Promise<ListCategoriesResult> {
  const { limit, offset } = toOffsetLimit({ page: query.page, page_size: query.page_size });
  const isAdmin = user?.role === RoleName.ADMIN;

  const where: WhereOptions = {};
  const conditions = where as Record<string, unknown>;

  // Public/non-admin callers see active categories only. ADMIN may pass is_active
  // (true/false) to narrow, or omit it to see all.
  if (isAdmin) {
    if (query.is_active !== undefined) conditions.is_active = query.is_active;
  } else {
    conditions.is_active = true;
  }

  if (query.q) conditions.name = { [Op.like]: `%${query.q}%` };

  const { rows, count } = await Category.findAndCountAll({
    where,
    limit,
    offset,
    order: [[query.sort_by, query.sort_order]],
  });

  return {
    data: rows.map((row) => serializeCategory(row as unknown as Record<string, unknown>)),
    meta: buildPaginationMeta({ page: query.page, page_size: query.page_size }, count),
  };
}

/** GET /categories/:id — public read. */
export async function getById(id: number): Promise<CategoryDTO> {
  const category = await Category.findByPk(id);
  if (!category) throw new NotFoundError('Category not found');
  return serializeCategory(category as unknown as Record<string, unknown>);
}

/** POST /categories — ADMIN create. */
export async function create(input: CreateCategoryInput): Promise<CategoryDTO> {
  const slug = input.slug ?? slugify(input.name);
  await assertUnique({ name: input.name, slug });

  const category = await Category.create({
    name: input.name,
    slug,
    description: input.description ?? null,
    icon_url: input.icon_url ?? null,
    is_active: input.is_active ?? true,
  });

  return serializeCategory(category as unknown as Record<string, unknown>);
}

/** PATCH /categories/:id — ADMIN update. */
export async function update(id: number, input: UpdateCategoryInput): Promise<CategoryDTO> {
  const category = await Category.findByPk(id);
  if (!category) throw new NotFoundError('Category not found');

  await assertUnique({ name: input.name, slug: input.slug }, id);

  if (input.name !== undefined) category.name = input.name;
  if (input.slug !== undefined) category.slug = input.slug;
  if (input.description !== undefined) category.description = input.description;
  if (input.icon_url !== undefined) category.icon_url = input.icon_url;
  if (input.is_active !== undefined) category.is_active = input.is_active;

  await category.save();

  return serializeCategory(category as unknown as Record<string, unknown>);
}

/** DELETE /categories/:id — ADMIN soft delete (sets is_active = false). */
export async function softDelete(id: number): Promise<{ id: number; is_active: boolean }> {
  const category = await Category.findByPk(id);
  if (!category) throw new NotFoundError('Category not found');

  category.is_active = false;
  await category.save();

  return { id: category.id, is_active: category.is_active };
}
