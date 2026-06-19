'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('provider_availability', [
      {
        provider_id: 2,
        day_of_week: 'MON',
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: 1,
        created_at: now,
        updated_at: now,
      },
      {
        provider_id: 2,
        day_of_week: 'WED',
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: 1,
        created_at: now,
        updated_at: now,
      },
      {
        provider_id: 2,
        day_of_week: 'FRI',
        start_time: '09:00:00',
        end_time: '13:00:00',
        is_available: 1,
        created_at: now,
        updated_at: now,
      },
      {
        provider_id: 3,
        day_of_week: 'TUE',
        start_time: '10:00:00',
        end_time: '18:00:00',
        is_available: 1,
        created_at: now,
        updated_at: now,
      },
      {
        provider_id: 3,
        day_of_week: 'THU',
        start_time: '10:00:00',
        end_time: '18:00:00',
        is_available: 1,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('provider_availability', { provider_id: [2, 3] }, {});
  },
};
