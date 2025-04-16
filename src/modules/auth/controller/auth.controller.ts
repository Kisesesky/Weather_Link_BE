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
} from '@nestjs/common';

import { Response } from 'express';
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
import { User } from '../../users/entities/user.entity';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { KakaoAuthGuard } from '../guards/kakao-auth.guard';
import { NaverAuthGuard } from '../guards/naver-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegisterType } from '../../users/entities/user.entity';

@ApiTags('유저 인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ type: ResponseSignUpDto, status: HttpStatus.CREATED })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiBody({ type: SignUpDto })
  @Post('signup')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ): Promise<ResponseSignUpDto> {
    try {
      signUpDto.registerType = RegisterType.EMAIL;
      return await this.authService.signUp(signUpDto, profileImage);
    } catch (error) {
      throw new BadRequestException('회원가입에 실패했습니다.');
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

      return res.json({
        message: '로그인 성공!',
        accessToken,
        refreshToken,
      });
    } catch (error) {
      throw new BadRequestException('로그인에 실패했습니다.');
    }
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
  async googleCallback(
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, accessOptions, refreshOptions } =
        await this.authService.googleLogin(user.email, origin);

      res.cookie('Authentication', accessToken, accessOptions);
      res.cookie('Refresh', refreshToken, refreshOptions);

      // 리다이렉트 페이지 생성 시 제거
      return res.json({
        message: '로그인 성공!',
        accessToken,
        refreshToken,
      });

      // 프론트 리다이렉트 페이지 생성 후 (약관 동의, 위치 설정 페이지)
      // return res.redirect(`${origin}/login/success`);
    } catch (error) {
      throw new BadRequestException('구글 로그인에 실패했습니다.');
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
  async kakaoCallback(
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, accessOptions, refreshOptions } =
        await this.authService.kakaoLogin(user.email, origin);

      res.cookie('Authentication', accessToken, accessOptions);
      res.cookie('Refresh', refreshToken, refreshOptions);

      // 리다이렉트 페이지 생성 시 제거
      return res.json({
        message: '로그인 성공!',
        accessToken,
        refreshToken,
      });

      // 프론트 리다이렉트 페이지 생성 후 (약관 동의, 위치 설정 페이지)
      // return res.redirect(`${origin}/login/success`);
    } catch (error) {
      throw new BadRequestException('카카오 로그인에 실패했습니다.');
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
  async naverCallback(
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, refreshToken, accessOptions, refreshOptions } =
        await this.authService.naverLogin(user.email, origin);

      res.cookie('Authentication', accessToken, accessOptions);
      res.cookie('Refresh', refreshToken, refreshOptions);

      // 리다이렉트 페이지 생성 시 제거
      return res.json({
        message: '로그인 성공!',
        accessToken,
        refreshToken,
      });

      // 프론트 리다이렉트 페이지 생성 후 (약관 동의, 위치 설정 페이지)
      // return res.redirect(`${origin}/login/success`);
    } catch (error) {
      throw new BadRequestException('네이버 로그인에 실패했습니다.');
    }
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
