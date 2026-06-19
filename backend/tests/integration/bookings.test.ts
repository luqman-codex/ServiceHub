/**
 * Integration: booking lifecycle + illegal transition + ownership.
 *
 *   customer POST /bookings (PENDING)
 *   -> provider accept (ACCEPTED)
 *   -> provider start (IN_PROGRESS)
 *   -> provider complete (COMPLETED)
 *   accept a COMPLETED booking -> 409 INVALID_STATUS_TRANSITION
 *   customer2 reading customer1's booking -> 403 FORBIDDEN
 */
import { app, login } from '../helpers';
import request from 'supertest';
import { SEED, seeded } from '../setup';

const BASE = '/api/v1';

function futureIso(daysAhead = 7): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
}

describe('Booking lifecycle', () => {
  let customerToken: string;
  let providerToken: string;
  let customer2Token: string;
  let bookingId: number;

  beforeAll(async () => {
    customerToken = await login(SEED.customer.email, SEED.customer.password);
    providerToken = await login(SEED.provider.email, SEED.provider.password);
    customer2Token = await login(SEED.customer2.email, SEED.customer2.password);
  });

  it('customer creates a booking -> 201 PENDING', async () => {
    const res = await request(app)
      .post(`${BASE}/bookings`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ service_id: seeded.serviceId, scheduled_at: futureIso(), address: '1 Test St' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.customer_id).toBe(seeded.customerId);
    expect(res.body.data.total_price).toBe('79.99'); // price snapshot from service
    expect(res.body.data.created_at).toEqual(expect.any(String));
    bookingId = res.body.data.id;
  });

  it('another customer cannot read the booking -> 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get(`${BASE}/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('provider accepts -> ACCEPTED', async () => {
    const res = await request(app)
      .post(`${BASE}/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
    expect(res.body.data.provider_id).toBe(seeded.providerId); // self-claimed
    expect(res.body.data.accepted_at).toEqual(expect.any(String));
  });

  it('provider starts -> IN_PROGRESS', async () => {
    const res = await request(app)
      .post(`${BASE}/bookings/${bookingId}/start`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
    expect(res.body.data.started_at).toEqual(expect.any(String));
  });

  it('provider completes -> COMPLETED', async () => {
    const res = await request(app)
      .post(`${BASE}/bookings/${bookingId}/complete`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.completed_at).toEqual(expect.any(String));
  });

  it('accepting a COMPLETED booking -> 409 INVALID_STATUS_TRANSITION', async () => {
    const res = await request(app)
      .post(`${BASE}/bookings/${bookingId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('the owning customer can read their booking -> 200', async () => {
    const res = await request(app)
      .get(`${BASE}/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(bookingId);
  });
});
