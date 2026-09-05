import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nocturne',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'nocturne-access-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'nocturne-refresh-secret-change-in-production',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiry: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
};