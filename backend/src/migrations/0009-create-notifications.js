'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'notifications',
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
        booking_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
        },
        type: {
          type: Sequelize.ENUM(
            'BOOKING_CREATED',
            'BOOKING_ACCEPTED',
            'BOOKING_REJECTED',
            'BOOKING_IN_PROGRESS',
            'BOOKING_COMPLETED',
            'BOOKING_CANCELLED',
            'PAYMENT',
            'SYSTEM',
          ),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(160),
          allowNull: false,
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        is_read: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 0,
        },
        read_at: {
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

    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'idx_notifications_user_id',
    });
    await queryInterface.addIndex('notifications', ['booking_id'], {
      name: 'idx_notifications_booking_id',
    });
    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
      name: 'idx_notifications_user_unread',
    });

    await queryInterface.addConstraint('notifications', {
      type: 'foreign key',
      fields: ['user_id'],
      name: 'fk_notifications_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('notifications', {
      type: 'foreign key',
      fields: ['booking_id'],
      name: 'fk_notifications_booking',
      references: { table: 'bookings', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
