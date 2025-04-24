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
    const registerType = RegisterType.GOOGLE;
    try {
      const user = await this.usersService.findUserBySocialId(
        profile.id,
        registerType,
      );

      if (user) {
        return done(null, user);
      }

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
