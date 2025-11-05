import 'reflect-metadata';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgresuser';
process.env.DB_PASSWORD = 'postgrespassword';
process.env.DB_NAME = 'birthday_app_test';
process.env.WEBHOOK_URL = 'https://eolfa5dxoxzonv1.m.pipedream.net';

// Set timezone for consistent testing
process.env.TZ = 'UTC';