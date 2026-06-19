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
import { Booking } from './booking.model';
import { NotificationType } from '../types/enums';

export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<number>;
  declare user_id: ForeignKey<User['id']>;
  declare booking_id: CreationOptional<ForeignKey<Booking['id']> | null>;
  declare type: NotificationType;
  declare title: string;
  declare body: CreationOptional<string | null>;
  declare is_read: CreationOptional<boolean>;
  declare read_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Notification.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    booking_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    type: { type: DataTypes.ENUM(...Object.values(NotificationType)), allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'notifications', timestamps: true },
);
