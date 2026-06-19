import { Op, WhereOptions } from 'sequelize';
import { User, Role } from '../models';
import { RoleName } from '../types/enums';
import { UserDTO, PaginationMeta } from '../types/dto';
import { AuthUser } from '../types/jwt';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { hashPassword } from '../utils/password';
import { serializeUser } from '../utils/serializers';
import {
  buildPaginationMeta,
  toOffsetLimit,
} from '../utils/pagination';

/**
 * Users (admin) service — ALL business logic for rows 11–16 (02 §8.3).
 * Every endpoint is ADMIN-only (route-level `authorize(ADMIN)`); there is no
 * own-record ownership for this resource, but two self-protection rules apply:
 *  - an admin cannot deactivate their own account (PATCH /users/:id/status);
 *  - an admin cannot demote their own account (PATCH /users/:id/role).
 * Both surface as `409 CONFLICT` (02 §8.3).
 *
 * `password_hash` is never serialized — DTOs come from `serializeUser`.
 */

/** Always eager-load the role so `serializeUser` can resolve `roles.name`. */
const WITH_ROLE = { model: Role, as: 'role' } as const;

/** Resolve a role name to its `roles.id`. Throws 422 if the role does not exist. */
async function resolveRoleId(role: RoleName): Promise<number> {
  const found = await Role.findOne({ where: { name: role } });
  if (!found) {
    throw new ValidationError([{ field: 'role', message: 'unknown role' }]);
  }
  return found.id;
}

/** Load a user (with role) by id or throw 404. */
async function findUserOr404(id: number): Promise<User> {
  const user = await User.findByPk(id, { include: [WITH_ROLE] });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

/** Throw 409 if the email already belongs to another (or any) user. */
async function assertEmailAvailable(emailValue: string, exceptId?: number): Promise<void> {
  const existing = await User.findOne({ where: { email: emailValue } });
  if (existing && existing.id !== exceptId) {
    throw new ConflictError('Email already in use', 'EMAIL_ALREADY_EXISTS');
  }
}

export interface ListUsersQuery {
  page: number;
  page_size: number;
  sort_by: 'id' | 'name' | 'email' | 'created_at';
  sort_order: 'asc' | 'desc';
  role?: RoleName;
  is_active?: boolean;
  q?: string;
}

export interface ListUsersResult {
  data: UserDTO[];
  meta: PaginationMeta;
}

/** Row 11 — GET /users: paginated/filtered/sortable list (02 §8.3). */
export async function list(query: ListUsersQuery): Promise<ListUsersResult> {
  const { limit, offset } = toOffsetLimit({
    page: query.page,
    page_size: query.page_size,
  });

  const where: WhereOptions = {};

  if (query.role) {
    // filter by role via the eager-loaded association below
  }
  if (query.is_active !== undefined) {
    (where as Record<string, unknown>).is_active = query.is_active;
  }
  if (query.q) {
    (where as Record<string, unknown>)[Op.or as unknown as string] = [
      { name: { [Op.like]: `%${query.q}%` } },
      { email: { [Op.like]: `%${query.q}%` } },
    ];
  }

  const roleInclude = {
    ...WITH_ROLE,
    ...(query.role ? { where: { name: query.role }, required: true } : {}),
  };

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [roleInclude],
    limit,
    offset,
    order: [[query.sort_by, query.sort_order.toUpperCase()]],
    distinct: true,
  });

  return {
    data: rows.map((u) => serializeUser(u)),
    meta: buildPaginationMeta({ page: query.page, page_size: query.page_size }, count),
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: RoleName;
  phone?: string;
  is_active?: boolean;
}

/** Row 12 — POST /users: admin creates a user with any role (02 §8.3). */
export async function create(input: CreateUserInput): Promise<UserDTO> {
  await assertEmailAvailable(input.email);

  const role_id = await resolveRoleId(input.role);
  const password_hash = await hashPassword(input.password);

  const created = await User.create({
    role_id,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    password_hash,
    is_active: input.is_active ?? true,
  });

  const withRole = await findUserOr404(created.id);
  return serializeUser(withRole);
}

/** Row 13 — GET /users/:id (02 §8.3). */
export async function getById(id: number): Promise<UserDTO> {
  const user = await findUserOr404(id);
  return serializeUser(user);
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  email?: string;
}

/** Row 14 — PATCH /users/:id: update mutable fields (02 §8.3). */
export async function update(id: number, input: UpdateUserInput): Promise<UserDTO> {
  const user = await findUserOr404(id);

  if (input.email !== undefined) {
    await assertEmailAvailable(input.email, id);
    user.email = input.email;
  }
  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;

  await user.save();

  const refreshed = await findUserOr404(id);
  return serializeUser(refreshed);
}

/** Row 15 — PATCH /users/:id/status: activate/deactivate (02 §8.3). */
export async function setStatus(
  id: number,
  is_active: boolean,
  actor: AuthUser,
): Promise<UserDTO> {
  if (actor.id === id && is_active === false) {
    throw new ConflictError('You cannot deactivate your own account', 'CONFLICT');
  }

  const user = await findUserOr404(id);
  user.is_active = is_active;
  await user.save();

  const refreshed = await findUserOr404(id);
  return serializeUser(refreshed);
}

/** Row 16 — PATCH /users/:id/role: change a user's role (02 §8.3). */
export async function setRole(
  id: number,
  role: RoleName,
  actor: AuthUser,
): Promise<UserDTO> {
  if (actor.id === id && role !== RoleName.ADMIN) {
    throw new ConflictError('You cannot change your own role', 'CONFLICT');
  }

  const user = await findUserOr404(id);
  user.role_id = await resolveRoleId(role);
  await user.save();

  const refreshed = await findUserOr404(id);
  return serializeUser(refreshed);
}
