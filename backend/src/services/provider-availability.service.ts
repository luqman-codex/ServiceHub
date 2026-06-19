import { Op, WhereOptions } from 'sequelize';
import { ProviderAvailability, User, Role } from '../models';
import { PaginationMeta, ProviderAvailabilityDTO } from '../types/dto';
import { DayOfWeek, RoleName } from '../types/enums';
import { AuthUser } from '../types/jwt';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { buildPaginationMeta, toOffsetLimit } from '../utils/pagination';
import { serializeAvailability } from '../utils/serializers';

interface ListResult {
  rows: ProviderAvailabilityDTO[];
  meta: PaginationMeta;
}

interface ListQuery {
  page: number;
  page_size: number;
  sort_by: 'day_of_week' | 'start_time' | 'created_at';
  sort_order: 'asc' | 'desc';
  provider_id?: number;
  day_of_week?: DayOfWeek;
  is_available?: boolean;
}

interface CreateInput {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  provider_id?: number;
}

interface UpdateInput {
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
}

interface PublicListQuery {
  page: number;
  page_size: number;
  day_of_week?: DayOfWeek;
  is_available?: boolean;
}

/** Resolve the effective provider id for a write, enforcing role rules (02 §8.7). */
async function resolveProviderId(
  user: AuthUser,
  bodyProviderId?: number,
): Promise<number> {
  if (user.role === RoleName.ADMIN) {
    // ADMIN must target a provider explicitly; the user must be a PROVIDER.
    if (bodyProviderId === undefined) {
      throw new ValidationError([
        { field: 'provider_id', message: 'provider_id is required for ADMIN' },
      ]);
    }
    await assertUserIsProvider(bodyProviderId);
    return bodyProviderId;
  }
  // PROVIDER: always own; body provider_id is ignored.
  return user.id;
}

/** Ensure the referenced user exists and has the PROVIDER role (01 §10.6). */
async function assertUserIsProvider(userId: number): Promise<void> {
  const u = await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
  const roleName = (u as unknown as { role?: { name: RoleName } } | null)?.role?.name;
  if (!u || roleName !== RoleName.PROVIDER) {
    throw new ValidationError([
      { field: 'provider_id', message: 'referenced user must be a PROVIDER' },
    ]);
  }
}

/** Compare 'HH:mm:ss' clock strings; returns end > start. */
function isAfter(start: string, end: string): boolean {
  return end > start;
}

/** Reject duplicate (provider_id, day_of_week, start_time) windows (uq_pa_provider_day_start). */
async function assertNoDuplicate(
  providerId: number,
  dayOfWeek: DayOfWeek,
  startTime: string,
  excludeId?: number,
): Promise<void> {
  const where: WhereOptions = {
    provider_id: providerId,
    day_of_week: dayOfWeek,
    start_time: startTime,
  };
  if (excludeId !== undefined) {
    (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
  }
  const existing = await ProviderAvailability.findOne({ where });
  if (existing) {
    throw new ConflictError(
      'An availability window already exists for this day and start time',
      'DUPLICATE_RESOURCE',
    );
  }
}

/**
 * GET /provider-availability (route 39).
 * PROVIDER → own rows (provider_id = self); ADMIN → any (optionally ?provider_id=).
 */
export async function list(query: ListQuery, user: AuthUser): Promise<ListResult> {
  const { limit, offset } = toOffsetLimit({ page: query.page, page_size: query.page_size });

  const where: WhereOptions = {};
  if (user.role === RoleName.ADMIN) {
    if (query.provider_id !== undefined) {
      (where as Record<string, unknown>).provider_id = query.provider_id;
    }
  } else {
    // PROVIDER: own only; provider_id filter is ignored.
    (where as Record<string, unknown>).provider_id = user.id;
  }

  if (query.day_of_week !== undefined) {
    (where as Record<string, unknown>).day_of_week = query.day_of_week;
  }
  if (query.is_available !== undefined) {
    (where as Record<string, unknown>).is_available = query.is_available;
  }

  const { rows, count } = await ProviderAvailability.findAndCountAll({
    where,
    limit,
    offset,
    order: [[query.sort_by, query.sort_order.toUpperCase()]],
  });

  return {
    rows: rows.map(serializeAvailability),
    meta: buildPaginationMeta({ page: query.page, page_size: query.page_size }, count),
  };
}

/**
 * POST /provider-availability (route 40).
 * PROVIDER → own; ADMIN → via body provider_id (must be a PROVIDER).
 */
export async function create(
  input: CreateInput,
  user: AuthUser,
): Promise<ProviderAvailabilityDTO> {
  const providerId = await resolveProviderId(user, input.provider_id);

  if (!isAfter(input.start_time, input.end_time)) {
    throw new ValidationError([
      { field: 'end_time', message: 'end_time must be after start_time' },
    ]);
  }

  await assertNoDuplicate(providerId, input.day_of_week, input.start_time);

  const created = await ProviderAvailability.create({
    provider_id: providerId,
    day_of_week: input.day_of_week,
    start_time: input.start_time,
    end_time: input.end_time,
    is_available: input.is_available ?? true,
  });

  return serializeAvailability(created);
}

/**
 * PATCH /provider-availability/:id (route 41).
 * PROVIDER → own (provider_id = self); ADMIN → any.
 */
export async function update(
  id: number,
  input: UpdateInput,
  user: AuthUser,
): Promise<ProviderAvailabilityDTO> {
  const row = await ProviderAvailability.findByPk(id);
  if (!row) throw new NotFoundError('Availability window not found');

  // Ownership (404-vs-403 rule, 02 §2.4): exists but not owner → 403.
  if (user.role !== RoleName.ADMIN && row.provider_id !== user.id) {
    throw new ForbiddenError('You do not have access to this availability window');
  }

  const nextDay = input.day_of_week ?? row.day_of_week;
  const nextStart = input.start_time ?? row.start_time;
  const nextEnd = input.end_time ?? row.end_time;

  if (!isAfter(nextStart, nextEnd)) {
    throw new ValidationError([
      { field: 'end_time', message: 'end_time must be after start_time' },
    ]);
  }

  // Re-check uniqueness when the tuple (day_of_week, start_time) changes.
  if (input.day_of_week !== undefined || input.start_time !== undefined) {
    await assertNoDuplicate(row.provider_id, nextDay, nextStart, row.id);
  }

  if (input.day_of_week !== undefined) row.day_of_week = input.day_of_week;
  if (input.start_time !== undefined) row.start_time = input.start_time;
  if (input.end_time !== undefined) row.end_time = input.end_time;
  if (input.is_available !== undefined) row.is_available = input.is_available;

  await row.save();
  return serializeAvailability(row);
}

/**
 * DELETE /provider-availability/:id (route 42) — hard delete (01 §0).
 * PROVIDER → own; ADMIN → any.
 */
export async function remove(id: number, user: AuthUser): Promise<void> {
  const row = await ProviderAvailability.findByPk(id);
  if (!row) throw new NotFoundError('Availability window not found');

  if (user.role !== RoleName.ADMIN && row.provider_id !== user.id) {
    throw new ForbiddenError('You do not have access to this availability window');
  }

  await row.destroy();
}

/**
 * GET /providers/:providerId/availability (route 43) — public.
 * The provider must exist AND be a PROVIDER, else 404.
 */
export async function listForProvider(
  providerId: number,
  query: PublicListQuery,
): Promise<ListResult> {
  const provider = await User.findByPk(providerId, {
    include: [{ model: Role, as: 'role' }],
  });
  const roleName = (provider as unknown as { role?: { name: RoleName } } | null)?.role
    ?.name;
  if (!provider || roleName !== RoleName.PROVIDER) {
    throw new NotFoundError('Provider not found');
  }

  const { limit, offset } = toOffsetLimit({ page: query.page, page_size: query.page_size });

  const where: WhereOptions = { provider_id: providerId };
  if (query.day_of_week !== undefined) {
    (where as Record<string, unknown>).day_of_week = query.day_of_week;
  }
  if (query.is_available !== undefined) {
    (where as Record<string, unknown>).is_available = query.is_available;
  }

  const { rows, count } = await ProviderAvailability.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ['day_of_week', 'ASC'],
      ['start_time', 'ASC'],
    ],
  });

  return {
    rows: rows.map(serializeAvailability),
    meta: buildPaginationMeta({ page: query.page, page_size: query.page_size }, count),
  };
}
