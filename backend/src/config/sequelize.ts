import { Sequelize } from 'sequelize';
import { config } from './env';

export const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD, {
  host: config.DB_HOST,
  port: config.DB_PORT,
  dialect: 'mysql',
  timezone: '+00:00', // store/read in UTC
  define: {
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  logging: config.NODE_ENV === 'development' ? console.log : false,
});
