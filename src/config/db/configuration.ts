import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  dbHost: process.env.DATABASE_HOST,
  dbPort: process.env.DATABASE_PORT,
  dbUser: process.env.DATABASE_USER,
  dbPassword: process.env.DATABASE_PASSWORD,
  dbName: process.env.DATABASE_NAME,
  nodeEnv: process.env.NODE_ENV,
}));
