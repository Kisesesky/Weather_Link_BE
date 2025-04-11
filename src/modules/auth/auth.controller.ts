import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/log-in.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';
import { ResponseSignUpDto } from './dto/response-sign-up.dto';
import { RequestOrigin } from 'src/common/decorators/request.origin';

@ApiTags('유저 인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '유저인증' })
  @ApiResponse({ type: ResponseSignUpDto, status: HttpStatus.CREATED })
  @ApiBody({ type: SignUpDto })
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<ResponseSignUpDto> {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({ summary: '유저 로그인' })
  @ApiBody({ type: LogInDto })
  @Post('login')
  async logIn(
    @Body() logInDto: LogInDto,
    @RequestOrigin() origin,
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

  @Post('signout')
  signOut(@Res() res: Response, @RequestOrigin() origin: string) {
    const { accessOptions, refreshOptions } =
      this.authService.expireJwtToken(origin);
    res.cookie('Authentication', '', accessOptions);
    res.cookie('Refresh', '', refreshOptions);

    return res.json({
      message: '로그아웃 완료!',
    });
  }
}
