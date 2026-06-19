/**
 * Integration-test helpers: a supertest agent against createApp() (no port bind)
 * and a login helper that returns an access_token for a seeded user.
 */
import request from 'supertest';
import { createApp } from '../src/app';
import { SEED } from './setup';

export const app = createApp();
export const api = () => request(app);

/** Log a seeded user in and return their bearer access token. */
export async function login(email: string, password = SEED.admin.password): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.access_token as string;
}

export const auth = (token: string): string => `Bearer ${token}`;
