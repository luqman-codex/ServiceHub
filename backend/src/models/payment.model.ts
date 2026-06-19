import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/sequelize';
import { Booking } from './booking.model';
import { PaymentMethod, PaymentStatus } from '../types/enums';

export class Payment extends Model<
  InferAttributes<Payment>,
  InferCreationAttributes<Payment>
> {
  declare id: CreationOptional<number>;
  declare booking_id: ForeignKey<Booking['id']>;
  declare amount: number;
  declare currency: CreationOptional<string>;
  declare method: CreationOptional<PaymentMethod>;
  declare status: CreationOptional<PaymentStatus>;
  declare transaction_ref: CreationOptional<string | null>;
  declare paid_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Payment.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'USD' },
    method: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
      defaultValue: PaymentMethod.MOCK,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },
    transaction_ref: { type: DataTypes.STRING(80), allowNull: true, unique: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'payments', timestamps: true },
);
