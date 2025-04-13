import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AppConfigService } from 'src/config/app/config.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private appConfigService: AppConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtSecret as string,
    });
  }

  async validate(payload: any): Promise<unknown> {
    const { sub } = payload;
    const user = await this.usersService.findUserByEmail(sub);
    const { password, ...rest } = user;
    return rest;
  }
}
