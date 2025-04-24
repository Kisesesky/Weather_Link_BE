import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { SocialConfigService } from 'src/config/social/config.service';
import { RegisterType } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private socialConfigService: SocialConfigService,
    private usersService: UsersService,
  ) {
    const strategyOptions = {
      clientID: socialConfigService.googleClientId as string,
      clientSecret: socialConfigService.googleClientSecret as string,
      callbackURL: socialConfigService.googleCallbackUrl as string,
      scope: ['email', 'profile'],
    };

    super(strategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.log(
      `[Google Validate] 프로필 ID로 유효성 검사 시작: ${profile.id}`,
    );

    const registerType = RegisterType.GOOGLE;
    try {
      this.logger.log(
        `[Google Validate] 소셜 ID로 사용자 조회: ${profile.id}`,
      );
      const user = await this.usersService.findUserBySocialId(
        profile.id,
        registerType,
      );

      if (user) {
        this.logger.log(
          `[Google Validate] 기존 사용자 발견: ${user.email}`,
        );
        return done(null, user);
      }

      this.logger.log(
        `[Google Validate] 새로운 사용자 감지: ${profile._json.email}`,
      );
      const socialProfile = {
        email: profile._json.email,
        socialId: profile.id,
        name:
          profile.displayName || profile._json.email?.split('@')[0] || '사용자',
        profileImage: profile._json.picture || '',
        registerType: registerType,
      };
      return done(null, false, { profile: socialProfile });
    } catch (error) {
      this.logger.error(
        `[Google Validate] 에러 발생 시 에러 메시지: ${error.message}`,
        error.stack,
      );
      return done(error);
    }
  }
}
