import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ResponseSignUpDto } from './dto/response-sign-up.dto';
import { LogInDto } from './dto/log-in.dto';
import { comparePassword } from 'src/utils/password-util';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from 'src/config/app/config.service';
import { CookieOptions } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private appConfigService: AppConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<ResponseSignUpDto> {
    const isNameAvailable = await this.usersService.isNameAvailable(
      signUpDto.name,
    );
    if (!isNameAvailable)
      throw new BadRequestException('이미 사용 중인 닉네임입니다.');

    return this.usersService.createUser(signUpDto);
  }

  async logIn(logInDto: LogInDto, origin: string) {
    const user = await this.usersService.findUserByEmail(logInDto.email);

    if (!(await comparePassword(logInDto.password, user.password)))
      throw new UnauthorizedException(
        '이메일 또는 패스워드가 잘못 되었습니다.',
      );
    return this.makeJwtToken(logInDto.email, origin);
  }

  googleLogin(email: string, origin: string) {
    return this.makeJwtToken(email, origin);
  }

  kakaoLogin(email: string, origin: string) {
    return this.makeJwtToken(email, origin);
  }

  naverLogin(email: string, origin: string) {
    return this.makeJwtToken(email, origin);
  }

  logout(origin: string) {
    const cookieOptions = this.setCookieOption(0, origin);

    return {
      accessOptions: cookieOptions,
      refreshOptions: cookieOptions,
    };
  }

  makeJwtToken(email: string, origin: string) {
    const { accessToken, accessOptions } = this.setJwtAccessToken(
      email,
      origin,
    );

    const { refreshToken, refreshOptions } = this.setJwtRefreshToken(
      email,
      origin,
    );

    return {
      accessToken,
      refreshToken,
      accessOptions,
      refreshOptions,
    };
  }

  setJwtAccessToken(email: string, requestDomain: string) {
    const payload = { sub: email };
    const maxAge = 3600 * 1000;
    const accessToken = this.jwtService.sign(payload, {
      secret: this.appConfigService.jwtSecret,
      expiresIn: maxAge,
    });
    return {
      accessToken,
      accessOptions: this.setCookieOption(maxAge, requestDomain),
    };
  }

  setJwtRefreshToken(email: string, requestDomain: string) {
    const payload = { sub: email };
    const maxAge = 30 * 24 * 3600 * 1000;
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.appConfigService.jwtSecret,
      expiresIn: maxAge,
    });
    return {
      refreshToken,
      refreshOptions: this.setCookieOption(maxAge, requestDomain),
    };
  }

  setCookieOption(maxAge: number, requestDomain: string): CookieOptions {
    let domain: string;

    if (
      requestDomain.includes('127.0.0.1') ||
      requestDomain.includes('localhost')
    )
      domain = 'localhost';
    else {
      domain = requestDomain.split(':')[0];
    }

    return {
      domain,
      path: '/',
      httpOnly: true,
      maxAge,
      sameSite: 'lax',
    };
  }

  expireJwtToken(requestDomain: string) {
    return {
      accessOptions: this.setCookieOption(0, requestDomain),
      refreshOptions: this.setCookieOption(0, requestDomain),
    };
  }
}
