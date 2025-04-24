import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver';
import { SocialConfigService } from 'src/config/social/config.service';
import { UsersService } from 'src/modules/users/users.service';
import { RegisterType } from 'src/modules/users/entities/user.entity';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  private readonly logger = new Logger(NaverStrategy.name);

  constructor(
    private readonly socialConfigService: SocialConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: socialConfigService.naverClientId,
      clientSecret: socialConfigService.naverClientSecret,
      callbackURL: socialConfigService.naverCallbackUrl,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const registerType = RegisterType.NAVER;

    try {
      const user = await this.usersService.findUserBySocialId(
        profile.id,
        registerType,
      );

      if (user) {
        return done(null, user);
      }

      const email = profile.emails?.[0]?.value || profile._json?.email;
      if (!email) {
        this.logger.error('[Naver Validate] Naver profile missing email.');
        return done(
          new UnauthorizedException(
            '네이버 계정에서 이메일 정보를 가져올 수 없습니다.',
          ),
        );
      }

      const socialProfile = {
        email: email,
        socialId: profile.id,
        name:
          profile.displayName ||
          profile._json?.nickname ||
          profile._json?.name ||
          email.split('@')[0] ||
          '사용자',
        profileImage:
          profile.photos?.[0]?.value || profile._json?.profile_image || '',
        registerType: registerType,
      };
      return done(null, false, { profile: socialProfile });
    } catch (error) {
      this.logger.error(
        `[Naver Validate] Error during validation for profile ID ${profile.id}: ${error.message}`,
        error.stack,
      );
      return done(error);
    }
  }
}
