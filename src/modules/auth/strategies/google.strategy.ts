import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { SocialConfigService } from 'src/config/social/config.service';
import { RegisterType } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private socialConfigService: SocialConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: socialConfigService.googleClientId as string,
      clientSecret: socialConfigService.googleClientSecret as string,
      callbackURL: socialConfigService.googleCallbackUrl as string,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const user = await this.usersService.findUserBySocialId(
      profile.id,
      RegisterType.GOOGLE,
    );

    if (user) {
      done(null, user);
      return;
    }

    // 구글 프로필 구조
    const newUser = await this.usersService.createUser({
      email: profile._json.email,
      socialId: profile.id,
      name: profile.displayName || profile._json.email.split('@')[0],
      registerType: RegisterType.GOOGLE,
      profileImage: profile._json.picture || '',
      termsAgreed: false,
      locationAgreed: false,
      sido: '',
      gugun: '',
      dong: '',
    });

    done(null, newUser);
  }
}
