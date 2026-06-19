'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('categories', [
      {
        id: 1,
        name: 'Cleaning',
        slug: 'cleaning',
        description: 'Home and office cleaning services',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'Plumbing',
        slug: 'plumbing',
        description: 'Repairs and installations',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: 'Salon at Home',
        slug: 'salon-at-home',
        description: 'Beauty and grooming at home',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        name: 'Electrical',
        slug: 'electrical',
        description: 'Electrical repairs and fittings',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', { id: [1, 2, 3, 4] }, {});
  },
};
