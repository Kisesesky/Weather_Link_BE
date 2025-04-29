import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  constructor(@Inject(REQUEST) private request: Request) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext): any {
    const request = context.switchToHttp().getRequest<Request>();
    let origin = request.query.origin as string;

    const allowedOrigins = [
      'http://localhost:3000',
      'https://www.weather-link.site',
      'https://weather-link.site',
    ];
    if (!origin || !allowedOrigins.includes(origin)) {
      console.warn(
        `리다이렉트 주소가 유효하지 않습니다. ${origin}. 기본 주소로 리다이렉트합니다.`,
      );
      origin = 'https://www.weather-link.site';
    }

    const stateObject = {
      origin: origin,
      nonce: Math.random().toString(36).substring(7),
    };
    const encodedState = Buffer.from(JSON.stringify(stateObject)).toString(
      'base64',
    );

    return { state: encodedState };
  }

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
