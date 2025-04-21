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
import { SocialSignupDto } from '../dto/social-sign-up.dto';
import { ResponseDto } from 'src/common/dto/response.dto';

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
    try {
      const { accessToken, accessOptions } =
        this.authService.createTemporaryToken(user.email, origin);

      res.cookie('Authentication', accessToken, accessOptions);

      return res.redirect(`${origin}/signup/social/complete`);
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: '구글 로그인에 실패했습니다.',
        error: 'Bad Request',
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
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, accessOptions } =
        this.authService.createTemporaryToken(user.email, origin);

      res.cookie('Authentication', accessToken, accessOptions);

      return res.redirect(`${origin}/signup/social/complete`);
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: '카카오 로그인에 실패했습니다.',
        error: 'Bad Request',
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
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const { accessToken, accessOptions } =
        this.authService.createTemporaryToken(user.email, origin);

      res.cookie('Authentication', accessToken, accessOptions);

      return res.redirect(`${origin}/signup/social/complete`);
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: '네이버 로그인에 실패했습니다.',
        error: 'Bad Request',
      });
    }
  }

  @Post('social/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '소셜 로그인 추가 정보 입력 완료' })
  @ApiResponse({
    status: 200,
    description: '소셜 로그인 추가 정보 입력 완료',
  })
  async completeSocialSignup(
    @RequestUser() user: User,
    @Body() socialSignupDto: SocialSignupDto,
    @RequestOrigin() origin: string,
    @Res() res: Response,
  ) {
    try {
      const completedUser = await this.authService.SocialSignup(
        user.id,
        socialSignupDto,
      );

      const { accessToken, refreshToken, accessOptions, refreshOptions } =
        this.authService.makeJwtToken(completedUser.email, origin);

      res.cookie('Authentication', accessToken, accessOptions);
      res.cookie('Refresh', refreshToken, refreshOptions);

      return res.redirect(`${origin}/main`);
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: '추가 정보 입력에 실패했습니다.',
        error: 'Bad Request',
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

      return res.json(
        new ResponseDto({
          success: true,
          message: '로그아웃 완료!',
        }),
      );
    } catch (error) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '로그아웃에 실패했습니다.',
        error: 'Unauthorized',
      });
    }
  }
}
