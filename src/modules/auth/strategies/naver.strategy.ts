import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver';
import { SocialConfigService } from 'src/config/social/config.service';
import { UsersService } from 'src/modules/users/users.service';
import { RegisterType } from 'src/modules/users/entities/user.entity';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
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

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user = await this.usersService.findUserBySocialId(
      profile.id,
      RegisterType.NAVER,
    );

    if (user) {
      return user;
    }

    // 네이버 프로필 구조
    const newUser = await this.usersService.createUser({
      email: profile.emails?.[0]?.value || profile._json.email,
      socialId: profile.id,
      name: profile.displayName || profile._json.name,
      registerType: RegisterType.NAVER,
      profileImage: profile.photos?.[0]?.value || profile._json.profile_image,
      termsAgreed: false,
      locationAgreed: false,
      sido: '서울특별시',
      gugun: '강남구',
      dong: '역삼1동',
    });

    return newUser;
  }
}
