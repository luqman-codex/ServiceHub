'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'users',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        role_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'roles', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        name: {
          type: Sequelize.STRING(120),
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING(190),
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
        password_hash: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        is_active: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 1,
        },
        created_at: {
          type: 'DATETIME(3)',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
        },
        updated_at: {
          type: 'DATETIME(3)',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)'),
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
    );

    await queryInterface.addConstraint('users', {
      type: 'foreign key',
      fields: ['role_id'],
      name: 'fk_users_role',
      references: { table: 'roles', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('users', {
      type: 'unique',
      fields: ['email'],
      name: 'uq_users_email',
    });
    await queryInterface.addIndex('users', ['role_id'], { name: 'idx_users_role_id' });
    await queryInterface.addIndex('users', ['phone'], { name: 'idx_users_phone' });
    await queryInterface.addIndex('users', ['is_active'], { name: 'idx_users_is_active' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
