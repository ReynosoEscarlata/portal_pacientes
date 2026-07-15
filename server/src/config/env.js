import 'dotenv/config';

const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number.parseInt(process.env.PORT ?? '4000', 10),
  DATA_SOURCE: process.env.DATA_SOURCE === 'postgres' ? 'postgres' : 'mock',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? '',
  SEED_MOCK: process.env.SEED_MOCK === 'true',
  LEGACY_ENABLED: process.env.LEGACY_ENABLED === 'true',
  PG: {
    host: process.env.PGHOST ?? 'localhost',
    port: Number.parseInt(process.env.PGPORT ?? '5432', 10),
    database: process.env.PGDATABASE ?? 'clinicconnect',
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? ''
  }
};

export default env;
