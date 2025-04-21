import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService {
  constructor(private configService: ConfigService) {}

  get redisHost() {
    return this.configService.get<string>('redis.redisHost.');
  }

  get redisPort() {
    return this.configService.get<number>('redis.redisPort');
  }

  get redisPassword() {
    return this.configService.get<string>('redis.redisPassword');
  }

  get redisTtl() {
    return this.configService.get<number>('redis.redisTtl');
  }

  get redisMax() {
    return this.configService.get<number>('redis.redisMax');
  }
}