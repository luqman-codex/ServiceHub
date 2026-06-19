import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/sequelize';
import { Category } from './category.model';

export class Service extends Model<
  InferAttributes<Service>,
  InferCreationAttributes<Service>
> {
  declare id: CreationOptional<number>;
  declare category_id: ForeignKey<Category['id']>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare price: number;
  declare currency: CreationOptional<string>;
  declare duration_minutes: CreationOptional<number | null>;
  declare image_url: CreationOptional<string | null>;
  declare is_active: CreationOptional<boolean>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Service.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'USD' },
    duration_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    image_url: { type: DataTypes.STRING(500), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'services',
    timestamps: true,
    indexes: [{ unique: true, fields: ['category_id', 'name'] }],
  },
);
