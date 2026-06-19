import jwt, { TokenExpiredError, JsonWebTokenError, SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload as AppJwtPayload } from '../types/jwt';
import { UnauthorizedError } from './errors';

type JwtPayload = AppJwtPayload;

export function signAccessToken(p: Omit<JwtPayload, 'iat' | 'exp'>): string {
  // payload claims: sub, email, role, role_id (02 §2.2)
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(p, config.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }) as unknown as JwtPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError)
      throw new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED');
    if (err instanceof JsonWebTokenError)
      throw new UnauthorizedError('Access token is invalid', 'TOKEN_INVALID');
    throw err;
  }
}
