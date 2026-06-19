'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('payments', [
      {
        id: 1,
        booking_id: 3,
        amount: 49.99,
        currency: 'USD',
        method: 'MOCK',
        status: 'PAID',
        transaction_ref: 'MOCK-TXN-0001',
        paid_at: '2026-06-10 12:21:00.000',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('payments', { id: [1] }, {});
  },
};
