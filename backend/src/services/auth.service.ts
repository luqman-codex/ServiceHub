import { User, Role } from '../models';
import { RoleName } from '../types/enums';
import { AuthUser } from '../types/jwt';
import { AuthResultDTO, UserDTO } from '../types/dto';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { serializeUser } from '../utils/serializers';
import { config } from '../config/env';

/** Inputs (already validated by zod at the edge). */
interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

/** Build the AuthResultDTO (token + user) for register/login (02 §8.1). */
function buildAuthResult(user: User): AuthResultDTO {
  const userDTO = serializeUser(user);
  const access_token = signAccessToken({
    sub: userDTO.id,
    email: userDTO.email,
    role: userDTO.role,
    role_id: userDTO.role_id,
  });
  return {
    access_token,
    token_type: 'Bearer',
    expires_in: config.JWT_EXPIRES_IN,
    user: userDTO,
  };
}

/**
 * POST /auth/register (03 §7.3).
 * Self-signup is ALWAYS a CUSTOMER; PROVIDER/ADMIN are admin-created via POST /users.
 */
export async function register(input: RegisterInput): Promise<AuthResultDTO> {
  const email = input.email; // already lowercased + trimmed by the validator

  // 1) uniqueness pre-check → 409 EMAIL_ALREADY_EXISTS (also guarded by uq_users_email)
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('Email already registered', 'EMAIL_ALREADY_EXISTS');
  }

  // 2) resolve the CUSTOMER role id (roles.name = 'CUSTOMER')
  const role = await Role.findOne({ where: { name: RoleName.CUSTOMER } });
  if (!role) {
    throw new NotFoundError('CUSTOMER role not found');
  }

  // 3) hash + create
  const password_hash = await hashPassword(input.password);
  const created = await User.create({
    role_id: role.id,
    name: input.name,
    email,
    phone: input.phone ?? null,
    password_hash,
    is_active: true,
  });

  // 4) re-load with the role association so the DTO carries roles.name
  const user = await User.findByPk(created.id, {
    include: [{ model: Role, as: 'role' }],
  });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return buildAuthResult(user);
}

/**
 * POST /auth/login (03 §7.4).
 * Same INVALID_CREDENTIALS message for unknown email and wrong password (no enumeration).
 */
export async function login(input: LoginInput): Promise<AuthResultDTO> {
  const email = input.email; // lowercased + trimmed by the validator

  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, as: 'role' }],
  });

  // unknown email OR wrong password → identical 401 INVALID_CREDENTIALS (02 §8.1)
  if (!user) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  const passwordMatches = await verifyPassword(input.password, user.password_hash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // valid creds but deactivated account → 403 ACCOUNT_INACTIVE
  if (!user.is_active) {
    throw new ForbiddenError('Account is deactivated', 'ACCOUNT_INACTIVE');
  }

  return buildAuthResult(user);
}

/**
 * GET /auth/me (03 §7.5).
 * Re-loads the user from the principal so role/active changes are reflected.
 */
export async function getById(principal: AuthUser): Promise<UserDTO> {
  const user = await User.findByPk(principal.id, {
    include: [{ model: Role, as: 'role' }],
  });
  if (!user) {
    throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
  }
  if (!user.is_active) {
    throw new ForbiddenError('Account is deactivated', 'ACCOUNT_INACTIVE');
  }
  return serializeUser(user);
}
