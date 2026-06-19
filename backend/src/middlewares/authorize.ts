import { RequestHandler } from 'express';
import { RoleName } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const authorize =
  (...allowed: RoleName[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError('Authentication required', 'UNAUTHORIZED'));
    if (!allowed.includes(req.user.role)) return next(new ForbiddenError('Insufficient role', 'FORBIDDEN'));
    next();
  };
