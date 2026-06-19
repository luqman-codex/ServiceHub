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
import { DayOfWeek } from '../types/enums';

export class ProviderAvailability extends Model<
  InferAttributes<ProviderAvailability>,
  InferCreationAttributes<ProviderAvailability>
> {
  declare id: CreationOptional<number>;
  declare provider_id: ForeignKey<User['id']>;
  declare day_of_week: DayOfWeek;
  declare start_time: string; // 'HH:mm:ss'
  declare end_time: string;
  declare is_available: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

ProviderAvailability.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    provider_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    day_of_week: { type: DataTypes.ENUM(...Object.values(DayOfWeek)), allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'provider_availability',
    timestamps: true,
    indexes: [{ unique: true, fields: ['provider_id', 'day_of_week', 'start_time'] }],
  },
);
