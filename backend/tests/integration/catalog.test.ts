/**
 * Integration: public catalog reads (GET /categories, GET /services) return the
 * success envelope { success, data, meta } without authentication.
 */
import { app } from '../helpers';
import request from 'supertest';

const BASE = '/api/v1';

describe('Public catalog', () => {
  it('GET /categories is public -> 200 with { success, data[], meta }', async () => {
    const res = await request(app).get(`${BASE}/categories`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta).toHaveProperty('total_items');
    expect(res.body.meta).toHaveProperty('page');
    // seeded category
    expect(res.body.data.some((c: { slug: string }) => c.slug === 'home-cleaning')).toBe(true);
  });

  it('GET /services is public -> 200 with { success, data[], meta }', async () => {
    const res = await request(app).get(`${BASE}/services`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta).toHaveProperty('total_items');
    // DECIMAL price serialized as a string
    expect(typeof res.body.data[0].price).toBe('string');
  });
});
