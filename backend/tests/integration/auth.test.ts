/**
 * Integration: auth flow (register -> login -> /auth/me) + error cases.
 */
import { app } from '../helpers';
import request from 'supertest';
import { SEED } from '../setup';

const BASE = '/api/v1';

describe('Auth flow', () => {
  it('registers a new customer -> 201 with access_token + user', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/register`)
      .send({
        name: 'New Customer',
        email: 'new.customer@test.local',
        password: 'Password123',
        phone: '+1 555 0100',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toEqual(expect.any(String));
    expect(res.body.data.token_type).toBe('Bearer');
    expect(res.body.data.user.email).toBe('new.customer@test.local');
    expect(res.body.data.user.role).toBe('CUSTOMER');
    // password hash must never leak
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('logs in a seeded user -> 200 with access_token + user', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: SEED.customer.email, password: SEED.customer.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(SEED.customer.email);
  });

  it('GET /auth/me with a valid token -> 200 with the current user', async () => {
    const loginRes = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: SEED.customer.email, password: SEED.customer.password });
    const token = loginRes.body.data.access_token;

    const res = await request(app)
      .get(`${BASE}/auth/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(SEED.customer.email);
    expect(res.body.data.role).toBe('CUSTOMER');
  });

  it('login with the wrong password -> 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: SEED.customer.email, password: 'totally-wrong-1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('register with an invalid body -> 422 VALIDATION_ERROR with details[]', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/register`)
      .send({ name: 'x', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
    expect(res.body.error.details[0]).toHaveProperty('field');
    expect(res.body.error.details[0]).toHaveProperty('message');
  });
});
