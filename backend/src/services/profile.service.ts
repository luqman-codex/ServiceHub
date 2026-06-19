import { User, Role, ProviderProfile } from '../models';
import { RoleName } from '../types/enums';
import { AuthUser } from '../types/jwt';
import {
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors';
import { hashPassword, verifyPassword } from '../utils/password';

/**
 * Profile service (03 §13 rows 6-10). ALL business logic for the self-service
 * profile resource lives here: ownership is implicit (operations target
 * `req.user`), and the provider-profile endpoints add a role/ownership gate.
 */

/** Load the authenticated user's full record with its role eager-loaded. */
async function loadOwnUser(user: AuthUser): Promise<User> {
  const found = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'role' }],
  });
  if (!found) throw new NotFoundError('User not found');
  return found;
}

/** GET /profile — return the authenticated user's own record. */
export async function getOwn(user: AuthUser): Promise<User> {
  return loadOwnUser(user);
}

/** PATCH /profile — update the authenticated user's own name/phone. */
export async function updateOwn(
  input: { name?: string; phone?: string | null },
  user: AuthUser,
): Promise<User> {
  const record = await loadOwnUser(user);

  if (input.name !== undefined) record.name = input.name;
  if (input.phone !== undefined) record.phone = input.phone;

  await record.save();
  return record;
}

/** PATCH /profile/password — change the authenticated user's own password. */
export async function changePassword(
  input: { current_password: string; new_password: string },
  user: AuthUser,
): Promise<{ message: string }> {
  const record = await loadOwnUser(user);

  const matches = await verifyPassword(input.current_password, record.password_hash);
  if (!matches) {
    throw new UnauthorizedError('Current password is incorrect', 'INVALID_CREDENTIALS');
  }

  record.password_hash = await hashPassword(input.new_password);
  await record.save();
  return { message: 'Password updated' };
}

/**
 * Resolve the target user for a provider-profile operation, enforcing the
 * role gate from 02 §8.2 / §5: a PROVIDER may only target themselves; an ADMIN
 * may target any user via `user_id`. The target user must be a PROVIDER.
 */
async function resolveTargetUserId(
  caller: AuthUser,
  requestedUserId: number | undefined,
): Promise<number> {
  if (caller.role === RoleName.ADMIN) {
    const targetId = requestedUserId ?? caller.id;
    const target = await User.findByPk(targetId, {
      include: [{ model: Role, as: 'role' }],
    });
    if (!target) throw new NotFoundError('User not found');
    const targetRole = (target as unknown as { role: { name: RoleName } }).role;
    if (targetRole.name !== RoleName.PROVIDER) {
      throw new ValidationError([
        { field: 'user_id', message: 'referenced user must be a PROVIDER' },
      ]);
    }
    return targetId;
  }

  // PROVIDER: own record only; a supplied user_id targeting someone else is forbidden.
  if (requestedUserId !== undefined && requestedUserId !== caller.id) {
    throw new ForbiddenError('You may only access your own provider profile');
  }
  return caller.id;
}

/** GET /profile/provider — read a provider profile (own, or any for ADMIN via ?user_id=). */
export async function getProviderProfile(
  query: { user_id?: number },
  user: AuthUser,
): Promise<ProviderProfile> {
  const targetUserId = await resolveTargetUserId(user, query.user_id);

  const profile = await ProviderProfile.findOne({ where: { user_id: targetUserId } });
  if (!profile) throw new NotFoundError('Provider profile not found');
  return profile;
}

/**
 * PUT /profile/provider — create or replace a provider profile (upsert).
 * Returns the profile and whether it was created (201) vs updated (200).
 */
export async function upsertProviderProfile(
  input: {
    bio?: string | null;
    skills?: string | null;
    service_area?: string | null;
    user_id?: number;
    is_verified?: boolean;
  },
  user: AuthUser,
): Promise<{ profile: ProviderProfile; created: boolean }> {
  const targetUserId = await resolveTargetUserId(user, input.user_id);
  const isAdmin = user.role === RoleName.ADMIN;

  const existing = await ProviderProfile.findOne({ where: { user_id: targetUserId } });

  if (existing) {
    if (input.bio !== undefined) existing.bio = input.bio;
    if (input.skills !== undefined) existing.skills = input.skills;
    if (input.service_area !== undefined) existing.service_area = input.service_area;
    // `is_verified` is ADMIN-only; ignored for PROVIDER callers (02 §8.2).
    if (isAdmin && input.is_verified !== undefined) existing.is_verified = input.is_verified;
    await existing.save();
    return { profile: existing, created: false };
  }

  const created = await ProviderProfile.create({
    user_id: targetUserId,
    bio: input.bio ?? null,
    skills: input.skills ?? null,
    service_area: input.service_area ?? null,
    is_verified: isAdmin && input.is_verified !== undefined ? input.is_verified : false,
  });
  return { profile: created, created: true };
}
