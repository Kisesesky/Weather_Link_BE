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
          const token = request?.cookies?.Authentication;
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtSecret as string,
    });
  }

  async validate(payload: any): Promise<any> {
    const { profile, isTemporary, sub } = payload;

    if (isTemporary && profile) {
      if (!profile.email) {
        this.logger.error(
          '[JwtValidate] 임시 토큰 프로필 이메일 누락.',
        );
        throw new UnauthorizedException(
          '임시 토큰 프로필 페이로드 유효하지 않음',
        );
      }
      const result = profile;
      return result;
    } else if (!isTemporary && sub) {
      if (!sub) {
        this.logger.error('[JwtValidate] 최종 토큰 이메일 누락.');
        throw new UnauthorizedException('유효하지 않은 토큰 페이로드');
      }
      const user = await this.usersService.findUserByEmail(sub);
      if (!user) {
        this.logger.warn(`[JwtValidate] 이메일로 사용자 찾기 실패: ${sub}`);
        throw new UnauthorizedException('이 토큰에 해당하는 사용자 찾기 실패');
      }
      const { password, ...rest } = user;
      return rest;
    } else {
      this.logger.error(
        `[JwtValidate] 유효하지 않은 페이로드 구조: ${JSON.stringify(payload)}`,
      );
      throw new UnauthorizedException('유효하지 않은 토큰 페이로드 구조');
    }
  }
}
