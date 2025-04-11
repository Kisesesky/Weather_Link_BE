import { Controller, Post, Body, Res, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/log-in.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';
import { ResponseSignUpDto } from './dto/response-sign-up.dto';
import { RequestOrigin } from 'src/common/decorators/request.origin';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { SendEmailCodeDto } from './dto/send-email-code.dto';

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

  @ApiOperation({ summary: '유저 로그아웃' })
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
  
  @ApiOperation({ summary: '이메일 인증코드 발송' })
  @ApiBody({ type: SendEmailCodeDto })
  @Post('sendcode')
  async sendCode(@Body() sendEmailCodeDto: SendEmailCodeDto) {
    await this.authService.sendCode(sendEmailCodeDto.email);
    return { message: '인증 코드 전송 완료!, 제한시간 1분' }
  }

  @ApiOperation({ summary: '이메일 인증코드 검증' })
  @ApiBody({ type: VerifyEmailCodeDto })
  @HttpCode(HttpStatus.OK)
  @Post('verifyCode')
  verifyCode(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    const result = this.authService.verifyCode(verifyEmailCodeDto.email, verifyEmailCodeDto.code)
    if(!result) {
      throw new BadRequestException('인증 코드가 일치하지 않거나 만료된 코드입니다.')
    }
    return { sucess: true, message: '인증완료' }
  }
}
