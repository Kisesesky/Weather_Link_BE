import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { SocialConfigService } from 'src/config/social/config.service';
import { RegisterType } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { LocationsEntity } from 'src/modules/locations/entities/location.entity';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
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

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user = await this.usersService.findUserBySocialId(
      profile.id,
      RegisterType.KAKAO,
    );

    if (user) {
      return user;
    }

    // 카카오 프로필 구조
    const newUser = await this.usersService.createUser({
      email: profile._json.kakao_account?.email || profile._json.account_email,
      socialId: profile._json.id.toString(),
      name:
        profile._json.kakao_account?.profile?.nickname ||
        profile._json.properties?.nickname,
      registerType: RegisterType.KAKAO,
      profileImage:
        profile._json.kakao_account?.profile?.profile_image_url ||
        profile._json.profile_image,
      termsAgreed: false,
      locationAgreed: false,
      sido: '서울특별시',
      gugun: '강남구',
      dong: '역삼1동',
    });

    return newUser;
  }
}
