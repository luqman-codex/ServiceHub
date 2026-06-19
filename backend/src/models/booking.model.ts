import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/sequelize';
import { User } from './user.model';
import { Service } from './service.model';
import { BookingStatus } from '../types/enums';

export class Booking extends Model<
  InferAttributes<Booking>,
  InferCreationAttributes<Booking>
> {
  declare id: CreationOptional<number>;
  declare customer_id: ForeignKey<User['id']>;
  declare provider_id: CreationOptional<ForeignKey<User['id']> | null>;
  declare service_id: ForeignKey<Service['id']>;
  declare status: CreationOptional<BookingStatus>;
  declare scheduled_at: Date;
  declare total_price: number;
  declare currency: CreationOptional<string>;
  declare address: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;
  declare cancellation_reason: CreationOptional<string | null>;
  declare accepted_at: CreationOptional<Date | null>;
  declare started_at: CreationOptional<Date | null>;
  declare completed_at: CreationOptional<Date | null>;
  declare cancelled_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Booking.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    customer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    provider_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(BookingStatus)),
      allowNull: false,
      defaultValue: BookingStatus.PENDING,
    },
    scheduled_at: { type: DataTypes.DATE, allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'USD' },
    address: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    cancellation_reason: { type: DataTypes.TEXT, allowNull: true },
    accepted_at: { type: DataTypes.DATE, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'bookings', timestamps: true },
);
