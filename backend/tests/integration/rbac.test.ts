/**
 * Integration: RBAC on an ADMIN-only endpoint (GET /admin/stats).
 */
import { app, login } from '../helpers';
import request from 'supertest';
import { SEED } from '../setup';

const BASE = '/api/v1';

describe('RBAC — GET /admin/stats', () => {
  it('a CUSTOMER token is rejected -> 403 FORBIDDEN', async () => {
    const token = await login(SEED.customer.email, SEED.customer.password);
    const res = await request(app)
      .get(`${BASE}/admin/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('a missing token is rejected -> 401 UNAUTHORIZED', async () => {
    const res = await request(app).get(`${BASE}/admin/stats`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('an ADMIN token is allowed -> 200', async () => {
    const token = await login(SEED.admin.email, SEED.admin.password);
    const res = await request(app)
      .get(`${BASE}/admin/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
