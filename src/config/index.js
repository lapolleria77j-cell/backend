import { dbConfig, getPool, query, closePool, testConnection } from './database.js';

export default {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  db: {
    config: dbConfig,
    getPool,
    query,
    closePool,
    testConnection,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_cambiar_en_produccion',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
      : '*',
  },
};
