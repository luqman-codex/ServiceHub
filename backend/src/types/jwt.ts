import { RoleName } from './enums';

/** Signed JWT payload (02 §2.2). `iat`/`exp` are added by jsonwebtoken. */
export interface JwtPayload {
  sub: number;
  email: string;
  role: RoleName;
  role_id: number;
  iat: number;
  exp: number;
}

/** Authenticated principal attached to req.user by the authenticate middleware. */
export interface AuthUser {
  id: number;
  email: string;
  role: RoleName;
  role_id: number;
}
