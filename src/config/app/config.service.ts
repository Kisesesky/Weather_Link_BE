import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get jwtSecret() {
    return this.configService.get<string>('app.jwtSecret');
  }

  get jwtRefreshSecret() {
    return this.configService.get<string>('app.jwtRefreshSecret');
  }

  get port() {
    return this.configService.get<number>('app.port');
  }

  get googleClientId() {
    return this.configService.get<string>('app.googleClientId');
  }

  get googleClientSecret() {
    return this.configService.get<string>('app.googleClientSecret');
  }

  get googleCallbackUrl() {
    return this.configService.get<string>('app.googleCallbackUrl');
  }
}
