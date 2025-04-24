import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { AppConfigService } from 'src/config/app/config.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private appConfigService: AppConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          console.log(
            '[JwtStrategy Extractor] Request Cookies:',
            request.cookies,
          );
          const token = request?.cookies?.Authentication;
          console.log('[JwtStrategy Extractor] Token from Cookie:', token);
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtSecret as string,
    });
  }

  async validate(payload: any): Promise<any> {
    this.logger.log(
      `[JwtValidate] Start validation. Payload: ${JSON.stringify(payload)}`,
    );
    const { sub, isTemporary } = payload;

    if (isTemporary) {
      this.logger.log('[JwtValidate] Detected temporary token.');
      if (!sub) {
        this.logger.error('[JwtValidate] Temporary token missing sub (email).');
        throw new UnauthorizedException('Invalid temporary token payload');
      }
      const result = { email: sub };
      this.logger.log(
        `[JwtValidate] Returning for temporary token: ${JSON.stringify(result)}`,
      );
      return result;
    } else {
      this.logger.log('[JwtValidate] Detected final token.');
      if (!sub) {
        this.logger.error('[JwtValidate] Final token missing sub (email).');
        throw new UnauthorizedException('Invalid token payload');
      }
      this.logger.log(`[JwtValidate] Finding user by email: ${sub}`);
      const user = await this.usersService.findUserByEmail(sub);
      if (!user) {
        this.logger.warn(`[JwtValidate] User not found for email: ${sub}`);
        throw new UnauthorizedException('User not found for this token');
      }
      const { password, ...rest } = user;
      this.logger.log(
        `[JwtValidate] Returning user data for final token: ${JSON.stringify(rest)}`,
      );
      return rest;
    }
  }
}
