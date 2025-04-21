import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: process.env.REDIS_PORT || '6379',
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisTtl: process.env.REDIS_TTL || 120,
  redisMax: process.env.REDIS_MAX || 100,
}));