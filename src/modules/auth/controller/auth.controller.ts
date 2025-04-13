import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';

import { Response } from 'express';
import { AuthService } from '../auth.service';
import { LogInDto } from '../dto/log-in.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignUpDto } from '../dto/sign-up.dto';
import { ResponseSignUpDto } from '../dto/response-sign-up.dto';
import { RequestOrigin } from 'src/common/decorators/request.origin';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../../users/entities/user.entity';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { KakaoAuthGuard } from '../guards/kakao-auth.guard';
import { NaverAuthGuard } from '../guards/naver-auth.guard';

@ApiTags('유저 인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ type: ResponseSignUpDto, status: HttpStatus.CREATED })
  @ApiBody({ type: SignUpDto })
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<ResponseSignUpDto> {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({ summary: '로그인' })
  @ApiBody({ type: LogInDto })
  @Post('login')
  async logIn(
    @Body() logInDto: LogInDto,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken, accessOptions, refreshOptions } =
      await this.authService.logIn(logInDto, origin);

    res.cookie('Authentication', accessToken, accessOptions);
    res.cookie('Refresh', refreshToken, refreshOptions);

    return res.json({
      message: '로그인 성공!',
      accessToken,
      refreshToken,
    });
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인' })
  @ApiResponse({
    status: 200,
    description: 'Google 로그인 성공',
  })
  async googleLogin() {
    // Google 로그인 페이지로 리다이렉트
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken, accessOptions, refreshOptions } =
      this.authService.googleLogin(user.email, origin);

    res.cookie('Authentication', accessToken, accessOptions);
    res.cookie('Refresh', refreshToken, refreshOptions);

    return res.json({
      message: '로그인 성공!',
      accessToken,
      refreshToken,
    });
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
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken, accessOptions, refreshOptions } =
      this.authService.kakaoLogin(user.email, origin);

    res.cookie('Authentication', accessToken, accessOptions);
    res.cookie('Refresh', refreshToken, refreshOptions);

    return res.json({
      message: '로그인 성공!',
      accessToken,
      refreshToken,
    });
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
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken, accessOptions, refreshOptions } =
      this.authService.naverLogin(user.email, origin);

    res.cookie('Authentication', accessToken, accessOptions);
    res.cookie('Refresh', refreshToken, refreshOptions);

    return res.json({
      message: '로그인 성공!',
      accessToken,
      refreshToken,
    });
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  logout(@Res() res: Response, @RequestOrigin() origin: string) {
    const { accessOptions, refreshOptions } =
      this.authService.expireJwtToken(origin);

    res.cookie('Authentication', '', accessOptions);
    res.cookie('Refresh', '', refreshOptions);

    return res.json({
      message: '로그아웃 완료!',
    });
  }
}
