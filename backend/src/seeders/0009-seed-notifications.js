'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('notifications', [
      {
        user_id: 4,
        booking_id: 1,
        type: 'BOOKING_CREATED',
        title: 'Booking placed',
        body: 'Your Deep Home Cleaning request is pending.',
        is_read: 0,
        read_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 4,
        booking_id: 2,
        type: 'BOOKING_ACCEPTED',
        title: 'Booking accepted',
        body: 'Pat Provider accepted your Bathroom Cleaning.',
        is_read: 0,
        read_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 5,
        booking_id: 3,
        type: 'BOOKING_COMPLETED',
        title: 'Service completed',
        body: 'Your Leak Repair is complete.',
        is_read: 1,
        read_at: now,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('notifications', { user_id: [4, 5] }, {});
  },
};
