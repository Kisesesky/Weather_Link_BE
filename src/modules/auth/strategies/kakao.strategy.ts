import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { SocialConfigService } from 'src/config/social/config.service';
import { RegisterType } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  private readonly logger = new Logger(KakaoStrategy.name);

  constructor(
    private socialConfigService: SocialConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: socialConfigService.kakaoClientId as string,
      clientSecret: socialConfigService.kakaoClientSecret as string,
      callbackURL: socialConfigService.kakaoCallbackUrl as string,
      scope: ['profile_nickname', 'profile_image', 'account_email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const registerType = RegisterType.KAKAO;

    try {
      const user = await this.usersService.findUserBySocialId(
        profile.id,
        registerType,
      );

      if (user) {
        return done(null, user);
      }

      const email = profile._json.kakao_account?.email;
      if (!email) {
        this.logger.error('[Kakao Validate] 카카오 프로필에 이메일 없음.');
        return done(
          new UnauthorizedException(
            '카카오 계정에서 이메일 정보를 가져올 수 없습니다.',
          ),
        );
      }

      const socialProfile = {
        email: email,
        socialId: profile.id.toString(),
        name:
          profile.displayName ||
          profile._json.kakao_account?.profile?.nickname ||
          profile._json.properties?.nickname ||
          email.split('@')[0] ||
          '사용자',
        profileImage:
          profile._json.kakao_account?.profile?.profile_image_url ||
          profile._json.properties?.profile_image ||
          '',
        registerType: registerType,
      };
      return done(null, false, { profile: socialProfile });
    } catch (error) {
      this.logger.error(
        `[Kakao Validate] 유효성 검사 중 오류 발생: ${profile.id}: ${error.message}`,
        error.stack,
      );
      return done(error);
    }
  }
}
