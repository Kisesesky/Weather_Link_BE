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
import { RegisterType } from '../users/entities/user.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    // 이미 가입된 사용자의 로그인 로그 기록 및 마지막 로그인 시간 업데이트
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
    const maxAge = 1 * 60 * 60 * 1000; // 1시간
    const accessToken = this.jwtService.sign(payload, {
      secret: this.appConfigService.jwtSecret,
      expiresIn: maxAge / 1000,
    });
    return {
      accessToken,
      accessOptions: this.setCookieOption(maxAge, requestDomain, false), // httpOnly: false
    };
  }

  setJwtRefreshToken(email: string, requestDomain: string) {
    const payload = { sub: email };
    const maxAge = 30 * 24 * 3600 * 1000; // 30일
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.appConfigService.jwtRefreshSecret,
      expiresIn: maxAge / 1000,
    });
    return {
      refreshToken,
      refreshOptions: this.setCookieOption(maxAge, requestDomain, true), // httpOnly: true
    };
  }

  setCookieOption(
    maxAge: number,
    requestDomain: string,
    isHttpOnly = true, // 파라미터 값 사용
  ): CookieOptions {
    let domain: string | undefined;

    if (
      requestDomain.includes('127.0.0.1') ||
      requestDomain.includes('localhost')
    ) {
      domain = undefined;
    } else {
      try {
        const url = new URL(
          requestDomain.startsWith('http') ? requestDomain : `https://${requestDomain}`,
        );
        domain = url.hostname;
      } catch (e) {
        console.error('Invalid requestDomain for URL parsing:', requestDomain);
        domain = requestDomain.split(':')[0];
      }
    }

    const cookieOptions: CookieOptions = {
      path: '/',
      httpOnly: isHttpOnly, // 파라미터 값 사용
      maxAge,
      secure: true,
      sameSite: 'none',
    };

    if (domain !== undefined) {
      cookieOptions.domain = domain;
    }

    return cookieOptions;
  }

  expireJwtToken(requestDomain: string) {
    // Access Token 쿠키 만료 (httpOnly: false 가정)
    const accessOptions = this.setCookieOption(0, requestDomain, false);
    // Refresh Token 쿠키 만료 (httpOnly: true 가정)
    const refreshOptions = this.setCookieOption(0, requestDomain, true);
    return {
      accessOptions,
      refreshOptions,
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
  async sendPasswordFindEmail(email: string): Promise<string> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('존재하지 않는 이메일입니다.');
    }

    await this.emailService.sendVerificationCode(email, 'password');
    return '인증 코드가 이메일로 발송되었습니다.';
  }

  // 1-2. 이메일 인증 코드 확인
  async verifyPasswordFindCode(email: string, code: string): Promise<string> {
    const isVerified = await this.emailService.verifyCode(email, code);
    if (!isVerified) {
      throw new UnauthorizedException('잘못된 인증 코드입니다.');
    }

    return '인증이 완료되었습니다.';
  }

  // 1-3. 새 비밀번호 설정
  async resetForgottenPassword(
    email: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<string> {
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

    return '비밀번호가 성공적으로 변경되었습니다.';
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<string> {
    const user = await this.usersService.findUserByEmail(email);

    if (!(await comparePassword(currentPassword, user.password))) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('새 비밀번호가 일치하지 않습니다.');
    }

    validatePassword(newPassword);
    const hashedPassword = await encryptPassword(newPassword);
    await this.usersService.updatePassword(email, hashedPassword);

    return '비밀번호가 성공적으로 변경되었습니다.';
  }

  // 임시 토큰 생성 메서드 (소셜 로그인 콜백에서 사용)
  createTemporaryToken(email: string, origin: string) {
    const payload = { sub: email, isTemporary: true };
    const maxAge = 30 * 60 * 1000; // 30분

    const accessToken = this.jwtService.sign(payload, {
      secret: this.appConfigService.jwtSecret,
      expiresIn: maxAge / 1000,
    });

    return {
      accessToken,
      accessOptions: this.setCookieOption(maxAge, origin),
    };
  }

  // 임시 토큰 생성 (신규 사용자용)
  createSocialTemporaryToken(profile: any, origin: string) {
    // profile 객체에는 email, socialId, name, profileImage, registerType 포함됨
    const payload = { profile, isTemporary: true }; // 임시 토큰임을 명시
    const maxAge = 30 * 60 * 1000; // 30분 유효

    const accessToken = this.jwtService.sign(payload, {
      secret: this.appConfigService.jwtSecret,
      expiresIn: maxAge / 1000,
    });

    return {
      accessToken,
      accessOptions: this.setCookieOption(maxAge, origin, false), // httpOnly: false
    };
  }

  // 추가 정보 입력 완료 후 최종 회원가입 처리
  async completeNewSocialUserSignup(
    tempTokenPayload: any, // 임시 토큰에서 추출한 페이로드
    socialSignupDto: SocialSignupDto,
    origin: string, // 쿠키 설정을 위해 필요
  ) {
    this.logger.log(
      `[completeNewSocialUserSignup] 시작: ${tempTokenPayload?.email}`,
    );

    // 1. 약관 동의 검증
    if (
      socialSignupDto.termsAgreed !== true ||
      socialSignupDto.locationAgreed !== true
    ) {
      this.logger.warn(
        `[completeNewSocialUserSignup] 약관 미동의: ${tempTokenPayload?.email}`,
      ); // 약관 미동의 경고 유지
      throw new BadRequestException('모든 필수 약관에 동의해야 합니다.');
    }

    // 2. 위치 찾기
    const location = await this.locationsService.findBySidoGugun(
      socialSignupDto.sido,
      socialSignupDto.gugun,
    );
    if (!location) {
      this.logger.warn(
        `[completeNewSocialUserSignup] 위치 없음: ${socialSignupDto.sido}, ${socialSignupDto.gugun}`,
      ); // 위치 없음 경고 유지
      throw new BadRequestException('유효하지 않은 위치 정보입니다.');
    }

    // 3. 소셜 사용자 생성
    // 토큰에서 프로필 정보와 DTO에서 추가 정보 전달
    const newUser = await this.usersService.createSocialUser(tempTokenPayload, {
      termsAgreed: socialSignupDto.termsAgreed,
      locationAgreed: socialSignupDto.locationAgreed,
      location: location,
    });

    // 4. 신규 사용자 로그인 로그 기록
    const loginLog = await this.loginLogsService.create(newUser.id);
    await this.usersService.updateLastLogin(newUser.id, loginLog.login_time);

    // 5. 최종 JWT 토큰 발행
    return this.makeJwtToken(newUser.email, origin);
  }
}
