import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DbConfigService {
  constructor(private configService: ConfigService) {}

  get dbHost() {
    return this.configService.get<string>('DATABASE_HOST');
  }

  get dbPort() {
    return this.configService.get<number>('DATABASE_PORT');
  }

  get dbUser() {
    return this.configService.get<string>('DATABASE_USER');
  }

  get dbPassword() {
    return this.configService.get<string>('DATABASE_PASSWORD');
  }

  get dbName() {
    return this.configService.get<string>('DATABASE_NAME');
  }

  get nodeEnv() {
    return this.configService.get<string>('NODE_ENV');
  }
}
