import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fluxgram',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
};
