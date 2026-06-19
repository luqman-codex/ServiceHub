'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'bookings',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        customer_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
        },
        provider_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        service_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM(
            'PENDING',
            'ACCEPTED',
            'REJECTED',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
          ),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        scheduled_at: {
          type: 'DATETIME(3)',
          allowNull: false,
        },
        total_price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: Sequelize.CHAR(3),
          allowNull: false,
          defaultValue: 'USD',
        },
        address: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        cancellation_reason: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        accepted_at: {
          type: 'DATETIME(3)',
          allowNull: true,
        },
        started_at: {
          type: 'DATETIME(3)',
          allowNull: true,
        },
        completed_at: {
          type: 'DATETIME(3)',
          allowNull: true,
        },
        cancelled_at: {
          type: 'DATETIME(3)',
          allowNull: true,
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

    await queryInterface.addIndex('bookings', ['customer_id'], {
      name: 'idx_bookings_customer_id',
    });
    await queryInterface.addIndex('bookings', ['provider_id'], {
      name: 'idx_bookings_provider_id',
    });
    await queryInterface.addIndex('bookings', ['service_id'], {
      name: 'idx_bookings_service_id',
    });
    await queryInterface.addIndex('bookings', ['status'], { name: 'idx_bookings_status' });
    await queryInterface.addIndex('bookings', ['scheduled_at'], {
      name: 'idx_bookings_scheduled_at',
    });
    await queryInterface.addIndex('bookings', ['status', 'scheduled_at'], {
      name: 'idx_bookings_status_scheduled',
    });

    await queryInterface.addConstraint('bookings', {
      type: 'foreign key',
      fields: ['customer_id'],
      name: 'fk_bookings_customer',
      references: { table: 'users', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('bookings', {
      type: 'foreign key',
      fields: ['provider_id'],
      name: 'fk_bookings_provider',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('bookings', {
      type: 'foreign key',
      fields: ['service_id'],
      name: 'fk_bookings_service',
      references: { table: 'services', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bookings');
  },
};
