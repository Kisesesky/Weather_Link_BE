import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class NaverAuthGuard extends AuthGuard('naver') {
  handleRequest(err, user, info) {
    if (err || (!user && !info)) {
      throw err || new UnauthorizedException();
    }
    if (!user && info?.profile) {
      return info.profile;
    }
    return user;
  }
}
