import { FindOptions, Includeable, Op, Order, WhereOptions } from 'sequelize';
import { Category, Service } from '../models';
import { AuthUser } from '../types/jwt';
import { RoleName } from '../types/enums';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { buildPaginationMeta, toOffsetLimit } from '../utils/pagination';
import { PaginationMeta } from '../types/dto';

/**
 * Service-resource business logic (03 §13 rows 22–27).
 *
 * - GET endpoints are public: a non-ADMIN caller may only see `is_active = true`
 *   rows; ADMIN may override `is_active` (02 §8.5).
 * - Writes are ADMIN-only (route-level `authorize(ADMIN)`); ownership does not
 *   apply to the catalog, so no own-record checks are needed here (02 §5).
 * - `price`/`currency` are snapshotted onto bookings at creation, so changing a
 *   service price never mutates existing bookings (02 §8.5 PATCH /price note).
 */

type ListQuery = {
  page: number;
  page_size: number;
  sort_by: 'id' | 'name' | 'price' | 'created_at';
  sort_order: 'asc' | 'desc';
  category_id?: number;
  is_active?: boolean;
  q?: string;
  price_min?: number;
  price_max?: number;
  include?: string;
};

type CreateInput = {
  category_id: number;
  name: string;
  description?: string | null;
  price: string;
  currency?: string;
  duration_minutes?: number | null;
  image_url?: string | null;
  is_active?: boolean;
};

type UpdateInput = Partial<{
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
}>;

type PriceInput = {
  price: string;
  currency?: string;
};

/** Build the eager-load list from an `?include=` comma string. Only `category` is supported. */
function buildInclude(include?: string): Includeable[] {
  const want = new Set(
    (include ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const inc: Includeable[] = [];
  if (want.has('category')) inc.push({ model: Category, as: 'category' });
  return inc;
}

/** Assert the referenced category exists, else 422 (02 §8.5). */
async function assertCategoryExists(categoryId: number): Promise<void> {
  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw new ValidationError([
      { field: 'category_id', message: 'must reference an existing category' },
    ]);
  }
}

/** Pre-check the (category_id, name) uniqueness (uq_services_category_name) → 409. */
async function assertNameUniqueInCategory(
  categoryId: number,
  name: string,
  excludeId?: number,
): Promise<void> {
  const where: WhereOptions = { category_id: categoryId, name };
  if (excludeId !== undefined) {
    (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
  }
  const existing = await Service.findOne({ where });
  if (existing) {
    throw new ConflictError('A service with this name already exists in the category', 'DUPLICATE_RESOURCE');
  }
}

/** GET /services — paginated, filtered, sorted list (public). */
export async function list(
  query: ListQuery,
  user: AuthUser | undefined,
): Promise<{ rows: Service[]; meta: PaginationMeta }> {
  const { limit, offset } = toOffsetLimit({ page: query.page, page_size: query.page_size });
  const where: WhereOptions = {};
  const conditions = where as Record<string, unknown>;

  // Public callers see only active rows; ADMIN may override via ?is_active.
  const isAdmin = user?.role === RoleName.ADMIN;
  if (isAdmin) {
    if (query.is_active !== undefined) conditions.is_active = query.is_active;
  } else {
    conditions.is_active = true;
  }

  if (query.category_id !== undefined) conditions.category_id = query.category_id;
  if (query.q) conditions.name = { [Op.like]: `%${query.q}%` };

  if (query.price_min !== undefined || query.price_max !== undefined) {
    const priceFilter: { [key: symbol]: number } = {};
    if (query.price_min !== undefined) priceFilter[Op.gte] = query.price_min;
    if (query.price_max !== undefined) priceFilter[Op.lte] = query.price_max;
    conditions.price = priceFilter;
  }

  const order: Order = [[query.sort_by, query.sort_order === 'asc' ? 'ASC' : 'DESC']];
  const options: FindOptions = {
    where,
    limit,
    offset,
    order,
    include: buildInclude(query.include),
  };

  const { rows, count } = await Service.findAndCountAll(options);
  return {
    rows,
    meta: buildPaginationMeta({ page: query.page, page_size: query.page_size }, count),
  };
}

/** GET /services/:id (public). Supports ?include=category. */
export async function getById(id: number, include?: string): Promise<Service> {
  const service = await Service.findByPk(id, { include: buildInclude(include) });
  if (!service) throw new NotFoundError('Service not found');
  return service;
}

/** POST /services (ADMIN). */
export async function create(input: CreateInput): Promise<Service> {
  await assertCategoryExists(input.category_id);
  await assertNameUniqueInCategory(input.category_id, input.name);

  const service = await Service.create({
    category_id: input.category_id,
    name: input.name,
    description: input.description ?? null,
    price: Number(input.price),
    currency: input.currency ?? 'USD',
    duration_minutes: input.duration_minutes ?? null,
    image_url: input.image_url ?? null,
    is_active: input.is_active ?? true,
  });

  return service;
}

/** PATCH /services/:id (ADMIN). Re-checks category existence + name uniqueness. */
export async function update(id: number, input: UpdateInput): Promise<Service> {
  const service = await Service.findByPk(id);
  if (!service) throw new NotFoundError('Service not found');

  const nextCategoryId = input.category_id ?? service.category_id;
  const nextName = input.name ?? service.name;

  if (input.category_id !== undefined) {
    await assertCategoryExists(input.category_id);
  }
  if (input.category_id !== undefined || input.name !== undefined) {
    await assertNameUniqueInCategory(nextCategoryId, nextName, service.id);
  }

  if (input.category_id !== undefined) service.category_id = input.category_id;
  if (input.name !== undefined) service.name = input.name;
  if (input.description !== undefined) service.description = input.description;
  if (input.price !== undefined) service.price = Number(input.price);
  if (input.currency !== undefined) service.currency = input.currency;
  if (input.duration_minutes !== undefined) service.duration_minutes = input.duration_minutes;
  if (input.image_url !== undefined) service.image_url = input.image_url;
  if (input.is_active !== undefined) service.is_active = input.is_active;

  await service.save();
  return service;
}

/** PATCH /services/:id/price (ADMIN). Does not retroactively change bookings. */
export async function updatePrice(id: number, input: PriceInput): Promise<Service> {
  const service = await Service.findByPk(id);
  if (!service) throw new NotFoundError('Service not found');

  service.price = Number(input.price);
  if (input.currency !== undefined) service.currency = input.currency;

  await service.save();
  return service;
}

/** DELETE /services/:id (ADMIN) — soft delete: sets is_active = false. */
export async function softDelete(id: number): Promise<{ id: number; is_active: boolean }> {
  const service = await Service.findByPk(id);
  if (!service) throw new NotFoundError('Service not found');

  service.is_active = false;
  await service.save();

  return { id: service.id, is_active: service.is_active };
}
