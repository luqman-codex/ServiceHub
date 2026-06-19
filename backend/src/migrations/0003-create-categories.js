'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'categories',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(120),
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(140),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        icon_url: {
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

    await queryInterface.addConstraint('categories', {
      type: 'unique',
      fields: ['name'],
      name: 'uq_categories_name',
    });
    await queryInterface.addConstraint('categories', {
      type: 'unique',
      fields: ['slug'],
      name: 'uq_categories_slug',
    });
    await queryInterface.addIndex('categories', ['is_active'], {
      name: 'idx_categories_is_active',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};
