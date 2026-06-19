'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('provider_profiles', [
      {
        id: 1,
        user_id: 2,
        bio: 'Experienced home cleaning professional.',
        skills: 'deep-cleaning,kitchen,bathroom',
        service_area: 'Downtown',
        rating: 4.8,
        is_verified: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        user_id: 3,
        bio: 'Licensed plumber, 8 years experience.',
        skills: 'leak-repair,installation,drainage',
        service_area: 'Uptown',
        rating: 4.6,
        is_verified: 1,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('provider_profiles', { id: [1, 2] }, {});
  },
};
