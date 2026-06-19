'use strict';

const bcrypt = require('bcryptjs');
const hash = (pw) => bcrypt.hashSync(pw, 10);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        role_id: 3,
        name: 'Platform Admin',
        email: 'admin@servicehub.test',
        phone: '+10000000001',
        password_hash: hash('Admin@12345'),
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        role_id: 2,
        name: 'Pat Provider',
        email: 'provider1@servicehub.test',
        phone: '+10000000002',
        password_hash: hash('Provider@12345'),
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        role_id: 2,
        name: 'Quinn Plumber',
        email: 'provider2@servicehub.test',
        phone: '+10000000003',
        password_hash: hash('Provider@12345'),
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        role_id: 1,
        name: 'Casey Customer',
        email: 'customer1@servicehub.test',
        phone: '+10000000004',
        password_hash: hash('Customer@12345'),
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        role_id: 1,
        name: 'Dana Customer',
        email: 'customer2@servicehub.test',
        phone: '+10000000005',
        password_hash: hash('Customer@12345'),
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { id: [1, 2, 3, 4, 5] }, {});
  },
};
