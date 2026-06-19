'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'provider_availability',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        provider_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
        },
        day_of_week: {
          type: Sequelize.ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'),
          allowNull: false,
        },
        start_time: {
          type: Sequelize.TIME,
          allowNull: false,
        },
        end_time: {
          type: Sequelize.TIME,
          allowNull: false,
        },
        is_available: {
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

    await queryInterface.addIndex('provider_availability', ['provider_id'], {
      name: 'idx_pa_provider_id',
    });
    await queryInterface.addConstraint('provider_availability', {
      type: 'unique',
      fields: ['provider_id', 'day_of_week', 'start_time'],
      name: 'uq_pa_provider_day_start',
    });
    await queryInterface.addConstraint('provider_availability', {
      type: 'foreign key',
      fields: ['provider_id'],
      name: 'fk_provider_availability_provider',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_availability');
  },
};
