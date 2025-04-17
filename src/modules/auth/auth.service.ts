import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ResponseSignUpDto } from './dto/response-sign-up.dto';
import { LogInDto } from './dto/log-in.dto';
import { comparePassword, encryptPassword } from 'src/utils/password-util';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from 'src/config/app/config.service';
import { CookieOptions } from 'express';
import { EmailService } from './email/email.service';
import { validatePassword } from 'src/utils/password-validator';
import { LoginLogsService } from '../login-logs/login-logs.service';
import { LocationsService } from '../locations/service/locations.service';
import { SocialSignupDto } from './dto/social-sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private appConfigService: AppConfigService,
    private emailService: EmailService,
    private loginLogsService: LoginLogsService,
    private locationsService: LocationsService,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
    profileImage?: Express.Multer.File,
  ): Promise<ResponseSignUpDto> {
    // 약관 동의 검증 (swagger boolean값 문자열로 전달됨)
    if (
      String(signUpDto.termsAgreed) !== 'true' ||
      String(signUpDto.locationAgreed) !== 'true'
    ) {
      throw new BadRequestException('약관 동의가 필요합니다.');
    }

    // 닉네임 중복 검증
    const isNameAvailable = await this.usersService.isNameAvailable(
      signUpDto.name,
    );
    if (!isNameAvailable)
      throw new BadRequestException('이미 사용 중인 닉네임입니다.');

    // 이메일 인증 확인
    const isVerified = await this.emailService.isEmailVerified(signUpDto.email);
    if (!isVerified) {
      throw new UnauthorizedException('이메일 인증이 필요합니다.');
    }

    return this.usersService.createUser(signUpDto, profileImage);
  }

  async logIn(logInDto: LogInDto, origin: string) {
    const user = await this.usersService.findUserByEmail(logInDto.email);

    if (!(await comparePassword(logInDto.password, user.password)))
      throw new UnauthorizedException(
        '이메일 또는 패스워드가 잘못 되었습니다.',
      );

    // 로그인 성공 시 로그인 로그 저장
    const loginLog = await this.loginLogsService.create(user.id);
    await this.usersService.updateLastLogin(user.id, loginLog.login_time);

    return this.makeJwtToken(logInDto.email, origin);
  }

  async logAndMakeToken(email: string, origin: string) {
    const user = await this.usersService.findUserByEmail(email);
    const loginLog = await this.loginLogsService.create(user.id);
    await this.usersService.updateLastLogin(user.id, loginLog.login_time);

    return this.makeJwtToken(email, origin);
  }

  async googleLogin(email: string, origin: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      // 아직 가입되지 않은 사용자
      throw new UnauthorizedException('추가 약관 동의가 필요합니다.');
    }
    return this.logAndMakeToken(email, origin);
  }

  async kakaoLogin(email: string, origin: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      // 아직 가입되지 않은 사용자
      throw new UnauthorizedException('추가 약관 동의가 필요합니다.');
    }
    return this.logAndMakeToken(email, origin);
  }

  async naverLogin(email: string, origin: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      // 아직 가입되지 않은 사용자
      throw new UnauthorizedException('추가 약관 동의가 필요합니다.');
    }
    return this.logAndMakeToken(email, origin);
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

  //email code
  async sendCode(email: string) {
    await this.emailService.sendVerificationCode(email);
  }

  verifyCode(email: string, code: string) {
    return this.emailService.verifyCode(email, code);
  }

  // 1. 비밀번호 찾기 이메일 발송
  // 1-1.이메일 발송
  async sendPasswordFindEmail(email: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('존재하지 않는 이메일입니다.');
    }

    await this.emailService.sendVerificationCode(email, 'password');
    return { message: '인증 코드가 이메일로 발송되었습니다.' };
  }

  // 1-2. 이메일 인증 코드 확인
  async verifyPasswordFindCode(email: string, code: string) {
    const isVerified = await this.emailService.verifyCode(email, code);
    if (!isVerified) {
      throw new UnauthorizedException('잘못된 인증 코드입니다.');
    }

    return { message: '인증이 완료되었습니다.' };
  }

  // 1-3. 새 비밀번호 설정
  async resetForgottenPassword(
    email: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const isVerified = await this.emailService.isEmailVerified(email);
    if (!isVerified) {
      throw new UnauthorizedException('이메일 인증이 필요합니다.');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
    }

    validatePassword(newPassword);
    const hashedPassword = await encryptPassword(newPassword);
    await this.usersService.updatePassword(email, hashedPassword);

    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const user = await this.usersService.findUserByEmail(email);
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('새 비밀번호가 일치하지 않습니다.');
    }

    validatePassword(newPassword);
    const hashedPassword = await encryptPassword(newPassword);
    await this.usersService.updatePassword(email, hashedPassword);

    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }

  async SocialSignup(userId: string, socialSignupDto: SocialSignupDto) {
    // 약관 동의 검증
    if (!socialSignupDto.termsAgreed || !socialSignupDto.locationAgreed) {
      throw new BadRequestException('약관 동의가 필요합니다.');
    }

    // 위치 정보 찾기 (테스트용 임시 하드코딩)
    const sido = '서울특별시';
    const gugun = '강남구';
    const dong = '역삼1동';

    console.log('위치 정보 조회:', { sido, gugun, dong });

    const location = await this.locationsService.findBySidoGugunDong(
      // completeSocialSignupDto.sido,
      // completeSocialSignupDto.gugun,
      // completeSocialSignupDto.dong,
      sido,
      gugun,
      dong,
    );

    if (!location) {
      throw new BadRequestException('존재하지 않는 위치 정보입니다.');
    }

    // 사용자 정보 업데이트
    const updatedUser = await this.usersService.completeSocialSignup(
      userId,
      socialSignupDto,
      location,
    );

    // 약관 동의와 위치 설정이 완료된 사용자인지 확인
    if (
      !updatedUser.termsAgreed ||
      !updatedUser.locationAgreed ||
      !updatedUser.location
    ) {
      throw new BadRequestException('약관 동의와 위치 설정이 필요합니다.');
    }

    return updatedUser;
  }

  // 임시 토큰 생성 메서드 (소셜 로그인 콜백에서 사용)
  createTemporaryToken(email: string, origin: string) {
    const payload = { sub: email, isTemporary: true };
    const maxAge = 30 * 60 * 1000; // 30분

    const accessToken = this.jwtService.sign(payload, {
      secret: this.appConfigService.jwtSecret,
      expiresIn: maxAge,
    });

    return {
      accessToken,
      accessOptions: this.setCookieOption(maxAge, origin),
    };
  }
}
