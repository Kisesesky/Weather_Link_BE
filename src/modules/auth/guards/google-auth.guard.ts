import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err, user, info) {
    // err가 있거나 user가 false인데 info도 없는 경우 (예상치 못한 오류) -> 기본 오류 처리
    if (err || (!user && !info)) {
      throw err || new UnauthorizedException();
    }
    // user가 false이지만 info가 있는 경우 (신규 사용자) -> user 대신 info.profile을 반환
    if (!user && info?.profile) {
      // info와 info.profile 존재 여부 확인
      // 컨트롤러에서 @RequestUser()가 profile 객체를 받도록 함
      return info.profile;
    }
    // user가 있는 경우 (기존 사용자) -> user 반환
    return user;
  }
}
