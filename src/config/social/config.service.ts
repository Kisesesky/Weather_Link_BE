import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SocialConfigService {
  constructor(private configService: ConfigService) {}

  get googleClientId() {
    return this.configService.get<string>('social.googleClientId');
  }

  get googleClientSecret() {
    return this.configService.get<string>('social.googleClientSecret');
  }

  get googleCallbackUrl() {
    return this.configService.get<string>('social.googleCallbackUrl');
  }

  get kakaoClientId() {
    return this.configService.get<string>('social.kakaoClientId');
  }

  get kakaoClientSecret() {
    return this.configService.get<string>('social.kakaoClientSecret');
  }

  get kakaoCallbackUrl() {
    return this.configService.get<string>('social.kakaoCallbackUrl');
  }

  get naverClientId() {
    return this.configService.get<string>('social.naverClientId');
  }

  get naverClientSecret() {
    return this.configService.get<string>('social.naverClientSecret');
  }

  get naverCallbackUrl() {
    return this.configService.get<string>('social.naverCallbackUrl');
  }
}
