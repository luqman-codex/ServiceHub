'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('bookings', [
      {
        id: 1,
        customer_id: 4,
        provider_id: null,
        service_id: 1,
        status: 'PENDING',
        scheduled_at: '2026-06-25 10:00:00.000',
        total_price: 79.99,
        currency: 'USD',
        address: '12 Maple St',
        notes: 'Please bring eco supplies',
        cancellation_reason: null,
        accepted_at: null,
        started_at: null,
        completed_at: null,
        cancelled_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        customer_id: 4,
        provider_id: 2,
        service_id: 2,
        status: 'ACCEPTED',
        scheduled_at: '2026-06-26 14:00:00.000',
        total_price: 29.99,
        currency: 'USD',
        address: '12 Maple St',
        notes: null,
        cancellation_reason: null,
        accepted_at: '2026-06-19 09:30:00.000',
        started_at: null,
        completed_at: null,
        cancelled_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        customer_id: 5,
        provider_id: 3,
        service_id: 3,
        status: 'COMPLETED',
        scheduled_at: '2026-06-10 11:00:00.000',
        total_price: 49.99,
        currency: 'USD',
        address: '88 Oak Ave',
        notes: 'Kitchen sink leak',
        cancellation_reason: null,
        accepted_at: '2026-06-09 12:00:00.000',
        started_at: '2026-06-10 11:05:00.000',
        completed_at: '2026-06-10 12:20:00.000',
        cancelled_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', { id: [1, 2, 3] }, {});
  },
};
