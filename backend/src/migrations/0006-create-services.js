'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'services',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        category_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(160),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: Sequelize.CHAR(3),
          allowNull: false,
          defaultValue: 'USD',
        },
        duration_minutes: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        image_url: {
          type: Sequelize.STRING(500),
          allowNull: true,
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

    await queryInterface.addIndex('services', ['category_id'], {
      name: 'idx_services_category_id',
    });
    await queryInterface.addIndex('services', ['is_active'], {
      name: 'idx_services_is_active',
    });
    await queryInterface.addIndex('services', ['name'], { name: 'idx_services_name' });
    await queryInterface.addConstraint('services', {
      type: 'unique',
      fields: ['category_id', 'name'],
      name: 'uq_services_category_name',
    });
    await queryInterface.addConstraint('services', {
      type: 'foreign key',
      fields: ['category_id'],
      name: 'fk_services_category',
      references: { table: 'categories', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('services');
  },
};
