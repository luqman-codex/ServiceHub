import bcrypt from 'bcryptjs';
import { config } from '../config/env';

/** Cost factor 10 (BCRYPT_SALT_ROUNDS). Matches seeder in 01 §10.3. */
export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, config.BCRYPT_SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
