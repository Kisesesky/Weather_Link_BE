import { Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-ioredis';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisConfigModule } from 'src/config/redis/config.module';

@Module({
  imports: [
    RedisConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
        ttl: configService.get('REDIS_TTL'),
        max: configService.get('REDIS_MAX')
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
