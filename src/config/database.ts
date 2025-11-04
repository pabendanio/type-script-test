import { DataSource } from 'typeorm';
import { User, BirthdayMessage } from '../entities/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'birthday_app',
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in development
  logging: process.env.NODE_ENV === 'development',
  entities: [User, BirthdayMessage],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});