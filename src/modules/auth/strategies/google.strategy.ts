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

    this.logger.log('[GoogleStrategy Constructor] Initialized with options:');
    this.logger.log(`  clientID: ${strategyOptions.clientID}`);
    this.logger.log(`  clientSecret loaded: ${!!strategyOptions.clientSecret}`);
    this.logger.log(`  callbackURL: ${strategyOptions.callbackURL}`);
    this.logger.log(`  scope: ${JSON.stringify(strategyOptions.scope)}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.log(
      `[Google Validate] Start validation for profile ID: ${profile.id}`,
    );
    this.logger.debug(`[Google Validate] Profile: ${JSON.stringify(profile)}`);

    const registerType = RegisterType.GOOGLE;
    try {
      this.logger.log(
        `[Google Validate] Finding user by social ID: ${profile.id}`,
      );
      // 1. DB에서 소셜 ID로 사용자 조회
      const user = await this.usersService.findUserBySocialId(
        profile.id,
        registerType,
      );
      this.logger.log(`[Google Validate] User found: ${JSON.stringify(user)}`);

      // 2. 기존 사용자인 경우
      if (user) {
        this.logger.log(
          `[Google Validate] Existing user found. Returning user.`,
        );
        // 사용자 객체를 그대로 반환 (로그인 처리)
        return done(null, user);
      }

      // 3. 신규 사용자인 경우
      this.logger.log(
        `[Google Validate] New user detected. Preparing social profile.`,
      );
      // DB에 저장하지 않고, 소셜 프로필 정보만 추출
      const socialProfile = {
        email: profile._json.email,
        socialId: profile.id,
        name:
          profile.displayName || profile._json.email?.split('@')[0] || '사용자',
        profileImage: profile._json.picture || '',
        registerType: registerType,
      };
      this.logger.log(
        `[Google Validate] Social profile created: ${JSON.stringify(socialProfile)}`,
      );
      // 사용자 객체 대신 false와 함께 프로필 정보를 info 객체로 전달
      this.logger.log(
        `[Google Validate] Returning false (new user) with social profile info.`,
      );
      return done(null, false, { profile: socialProfile });
    } catch (error) {
      this.logger.error(
        `[Google Validate] Error during validation: ${error.message}`,
        error.stack,
      );
      // 에러 발생 시
      return done(error);
    }
  }
}
