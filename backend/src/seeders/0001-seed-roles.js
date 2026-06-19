'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      {
        id: 1,
        name: 'CUSTOMER',
        description: 'End user who browses and books services',
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'PROVIDER',
        description: 'Professional who fulfills bookings',
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: 'ADMIN',
        description: 'Platform operator managing users, catalog, bookings',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', { id: [1, 2, 3] }, {});
  },
};
