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

export class ProviderProfile extends Model<
  InferAttributes<ProviderProfile>,
  InferCreationAttributes<ProviderProfile>
> {
  declare id: CreationOptional<number>;
  declare user_id: ForeignKey<User['id']>;
  declare bio: CreationOptional<string | null>;
  declare skills: CreationOptional<string | null>;
  declare service_area: CreationOptional<string | null>;
  declare rating: CreationOptional<number>;
  declare is_verified: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

ProviderProfile.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    skills: { type: DataTypes.STRING(500), allowNull: true },
    service_area: { type: DataTypes.STRING(255), allowNull: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0.0 },
    is_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'provider_profiles', timestamps: true },
);
