'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'provider_profiles',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
        },
        bio: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        skills: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        service_area: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        rating: {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        is_verified: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 0,
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

    await queryInterface.addConstraint('provider_profiles', {
      type: 'unique',
      fields: ['user_id'],
      name: 'uq_provider_profiles_user_id',
    });
    await queryInterface.addConstraint('provider_profiles', {
      type: 'foreign key',
      fields: ['user_id'],
      name: 'fk_provider_profiles_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('provider_profiles', ['rating'], {
      name: 'idx_provider_profiles_rating',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_profiles');
  },
};
