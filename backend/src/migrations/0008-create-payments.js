'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'payments',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        booking_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
        },
        amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: Sequelize.CHAR(3),
          allowNull: false,
          defaultValue: 'USD',
        },
        method: {
          type: Sequelize.ENUM('CARD', 'CASH', 'WALLET', 'MOCK'),
          allowNull: false,
          defaultValue: 'MOCK',
        },
        status: {
          type: Sequelize.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        transaction_ref: {
          type: Sequelize.STRING(80),
          allowNull: true,
        },
        paid_at: {
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

    await queryInterface.addConstraint('payments', {
      type: 'unique',
      fields: ['booking_id'],
      name: 'uq_payments_booking_id',
    });
    await queryInterface.addConstraint('payments', {
      type: 'unique',
      fields: ['transaction_ref'],
      name: 'uq_payments_transaction_ref',
    });
    await queryInterface.addIndex('payments', ['status'], { name: 'idx_payments_status' });
    await queryInterface.addConstraint('payments', {
      type: 'foreign key',
      fields: ['booking_id'],
      name: 'fk_payments_booking',
      references: { table: 'bookings', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  },
};
