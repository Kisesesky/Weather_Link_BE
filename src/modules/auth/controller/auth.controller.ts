import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  Get,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';

import { Response, Request } from 'express';
import { AuthService } from '../auth.service';
import { LogInDto } from '../dto/log-in.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SignUpDto } from '../dto/sign-up.dto';
import { ResponseSignUpDto } from '../dto/response-sign-up.dto';
import { RequestOrigin } from 'src/common/decorators/request.origin';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User, RegisterType } from '../../users/entities/user.entity';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { KakaoAuthGuard } from '../guards/kakao-auth.guard';
import { NaverAuthGuard } from '../guards/naver-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SocialSignupDto } from '../dto/social-sign-up.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { AppConfigService } from 'src/config/app/config.service';

// socialProfile 타입
interface SocialProfile {
  email: string;
  socialId: string;
  name: string;
  profileImage: string;
  registerType: RegisterType;
}

@ApiTags('유저 인증')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ type: ResponseSignUpDto, status: HttpStatus.CREATED })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiBody({ type: SignUpDto })
  @Post('signup')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ): Promise<ResponseDto<ResponseSignUpDto>> {
    try {
      const user = await this.authService.signUp(signUpDto, profileImage);
      return new ResponseDto({
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: user,
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: '회원가입에 실패했습니다.',
        error: 'Bad Request',
      });
    }
  }

  @ApiOperation({ summary: '로그인' })
  @ApiBody({ type: LogInDto })
  @Post('login')
  async logIn(
    @Body() logInDto: LogInDto,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, accessOptions, refreshOptions } =
        await this.authService.logIn(logInDto, origin);

      res.cookie('Authentication', accessToken, accessOptions);
      res.cookie('Refresh', refreshToken, refreshOptions);

      return res.json(
        new ResponseDto({
          success: true,
          message: '로그인 성공!',
          data: {
            accessToken,
            refreshToken,
          },
        }),
      );
    } catch (error) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '이메일 또는 패스워드가 잘못되었습니다.',
        error: 'Unauthorized',
      });
    }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인' })
  @ApiResponse({
    status: 200,
    description: 'Google 로그인 페이지로 리다이렉트',
  })
  async googleLogin() {
    // Guard가 리다이렉트하므로 비워둠
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @RequestUser() userOrProfile: User | SocialProfile,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const frontendUrl = this.appConfigService.frontendUrl;
      const socialSignupRedirectUrl = `${frontendUrl}/sign-up/social`

      if (userOrProfile && 'id' in userOrProfile) {
        const user = userOrProfile;
        const { accessToken, refreshToken, accessOptions, refreshOptions } =
          this.authService.makeJwtToken(user.email, origin);

        res.cookie('Authentication', accessToken, accessOptions);
        res.cookie('Refresh', refreshToken, refreshOptions);

        return res.redirect(`${frontendUrl}/signup/social/complete`);
      } else if (userOrProfile && 'email' in userOrProfile) {
        const socialProfile = userOrProfile;
        const { accessToken, accessOptions } =
          this.authService.createSocialTemporaryToken(socialProfile, origin);

        res.cookie('Authentication', accessToken, accessOptions);

        return res.redirect(socialSignupRedirectUrl);
      } else {
        throw new Error('유효하지 않은 사용자 또는 프로필 정보입니다.');
      }
    } catch (error) {
      console.error('Google callback error:', error);
      throw new BadRequestException({
        statusCode: 400,
        message: '구글 로그인 처리 중 오류가 발생했습니다.',
        error: error.message || 'Bad Request',
      });
    }
  }

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({ summary: 'Kakao 로그인' })
  @ApiResponse({
    status: 200,
    description: 'Kakao 로그인 성공',
  })
  async kakaoLogin() {
    // Kakao 로그인 페이지로 리다이렉트
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  kakaoCallback(
    @RequestUser() userOrProfile: User | SocialProfile,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const frontendUrl = this.appConfigService.frontendUrl;
      const socialSignupRedirectUrl = `${frontendUrl}/sign-up/social`

      if (userOrProfile && 'id' in userOrProfile) {
        const user = userOrProfile;
        const { accessToken, refreshToken, accessOptions, refreshOptions } =
          this.authService.makeJwtToken(user.email, origin);
        res.cookie('Authentication', accessToken, accessOptions);
        res.cookie('Refresh', refreshToken, refreshOptions);

        return res.redirect(`${frontendUrl}/signup/social/complete`);
      } else if (userOrProfile && 'email' in userOrProfile) {
        const socialProfile = userOrProfile;
        const { accessToken, accessOptions } =
          this.authService.createSocialTemporaryToken(socialProfile, origin);
        res.cookie('Authentication', accessToken, accessOptions);

        return res.redirect(socialSignupRedirectUrl);
      } else {
        throw new Error('유효하지 않은 사용자 또는 프로필 정보입니다.');
      }
    } catch (error) {
      console.error('Kakao callback error:', error);
      throw new BadRequestException({
        statusCode: 400,
        message: '카카오 로그인 처리 중 오류가 발생했습니다.',
        error: error.message || 'Bad Request',
      });
    }
  }

  @Get('naver')
  @UseGuards(NaverAuthGuard)
  @ApiOperation({ summary: 'Naver 로그인' })
  @ApiResponse({
    status: 200,
    description: 'Naver 로그인 성공',
  })
  async naverLogin() {
    // Naver 로그인 페이지로 리다이렉트
  }

  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  naverCallback(
    @RequestUser() userOrProfile: User | SocialProfile,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const frontendUrl = this.appConfigService.frontendUrl;
      const socialSignupRedirectUrl = `${frontendUrl}/sign-up/social`

      if (userOrProfile && 'id' in userOrProfile) {
        const user = userOrProfile;
        const { accessToken, refreshToken, accessOptions, refreshOptions } =
          this.authService.makeJwtToken(user.email, origin);
        res.cookie('Authentication', accessToken, accessOptions);
        res.cookie('Refresh', refreshToken, refreshOptions);
        return res.redirect(`${frontendUrl}`);
      } else if (userOrProfile && 'email' in userOrProfile) {
        const socialProfile = userOrProfile;
        const { accessToken, accessOptions } =
          this.authService.createSocialTemporaryToken(socialProfile, origin);
        res.cookie('Authentication', accessToken, accessOptions);

        return res.redirect(socialSignupRedirectUrl);
      } else {
        throw new Error('유효하지 않은 사용자 또는 프로필 정보입니다.');
      }
    } catch (error) {
      console.error('Naver callback error:', error);
      throw new BadRequestException({
        statusCode: 400,
        message: '네이버 로그인 처리 중 오류가 발생했습니다.',
        error: error.message || 'Bad Request',
      });
    }
  }

  @Post('social/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '소셜 로그인 추가 정보 입력 완료' })
  @ApiResponse({
    status: 200,
    description: '소셜 로그인 추가 정보 입력 완료 및 최종 로그인 토큰 반환',
  })
  async completeSocialSignup(
    @RequestUser() userProfile: SocialProfile,
    @Body() socialSignupDto: SocialSignupDto,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, accessOptions, refreshOptions } =
        await this.authService.completeNewSocialUserSignup(
          userProfile,
          socialSignupDto,
          origin,
        );

      res.cookie('Authentication', accessToken, accessOptions);
      res.cookie('Refresh', refreshToken, refreshOptions);

      return res.status(HttpStatus.OK).json(
        new ResponseDto({
          success: true,
          message: '소셜 회원가입 및 로그인 성공!',
          data: {
            accessToken,
            refreshToken,
          },
        }),
      );
    } catch (error) {
      console.error('Social signup completion error:', error);
      throw new BadRequestException({
        statusCode: error.status || 400,
        message: error.message || '추가 정보 입력 처리 중 오류가 발생했습니다.',
        error: error.response?.error || 'Bad Request',
      });
    }
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout(@Res() res: Response, @RequestOrigin() origin: string) {
    try {
      const { accessOptions, refreshOptions } =
        this.authService.expireJwtToken(origin);

      res.cookie('Authentication', '', accessOptions);
      res.cookie('Refresh', '', refreshOptions);

      return res.redirect('https://www.weather-link.site/login');

    } catch (error) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '로그아웃에 실패했습니다.',
        error: 'Unauthorized',
      });
    }
  }
}
