import { RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User, Role } from '../models';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { RoleName } from '../types/enums';

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');

    const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
    const user = await User.findByPk(payload.sub, { include: [{ model: Role, as: 'role' }] });
    if (!user) throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    if (!user.is_active) throw new ForbiddenError('Account is deactivated', 'ACCOUNT_INACTIVE');

    // role is read from the FRESH DB record, not just the token, so a role change
    // by an admin takes effect immediately on the next request.
    const role = (user as unknown as { role: { name: RoleName } }).role;
    req.user = {
      id: user.id,
      email: user.email,
      role: role.name,
      role_id: user.role_id,
    };
    next();
  } catch (err) {
    next(err);
  }
};
