import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { ApiBody, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SendEmailCodeDto } from '../dto/send-email-code.dto';
import { VerifyEmailCodeDto } from '../dto/verify-email-code.dto';
import { ChangePasswordDto, PasswordDto } from '../dto/password.dto';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { RequestOrigin } from 'src/common/decorators/request.origin';
import { User } from 'src/modules/users/entities/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('유저 서비스')
@Controller('auth/service')
export class AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '회원가입 이메일 인증코드 발송' })
  @ApiBody({ type: SendEmailCodeDto })
  @Post('signup/sendcode')
  async sendCode(@Body() sendEmailCodeDto: SendEmailCodeDto) {
    await this.authService.sendCode(sendEmailCodeDto.email);
    return { success: true, message: '인증 코드 전송 완료!, 제한시간 2분' };
  }

  @ApiOperation({ summary: '회원가입 이메일 인증코드 검증' })
  @ApiBody({ type: VerifyEmailCodeDto })
  @HttpCode(HttpStatus.OK)
  @Post('signup/verifycode')
  async verifyCode(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    const result = await this.authService.verifyCode(
      verifyEmailCodeDto.email,
      verifyEmailCodeDto.code,
    );
    if (!result) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: '인증 코드가 일치하지 않거나 만료된 코드입니다.',
        error: 'Bad Request',
      });
    }
    return { success: true, message: '인증완료' };
  }

  //비밀번호 찾기
  @ApiOperation({ summary: '비밀번호 찾기 이메일 인증요청' })
  @ApiBody({ type: SendEmailCodeDto })
  @Post('password/find/email')
  async sendPasswordFindEmail(@Body('email') email: string) {
    const message = await this.authService.sendPasswordFindEmail(email);
    return { success: true, message };
  }

  @ApiOperation({ summary: '비밀번호 찾기 이메일 인증코드 검증' })
  @ApiBody({ type: VerifyEmailCodeDto })
  @Post('password/find/verify')
  async verifyPasswordFindCode(
    @Body('email') email: string,
    @Body('code') code: string,
  ) {
    const message = await this.authService.verifyPasswordFindCode(email, code);
    return { success: true, message };
  }

  @ApiOperation({ summary: '비밀번호 찾기 이후 비밀번호 변경' })
  @ApiBody({ type: PasswordDto })
  @Patch('password/find/reset')
  async resetForgottenPassword(@Body() passwordDto: PasswordDto) {
    const message = await this.authService.resetForgottenPassword(
      passwordDto.email,
      passwordDto.newPassword,
      passwordDto.confirmPassword,
    );
    return { success: true, message };
  }

  //로컬비밀번호수정
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그인 유저 비밀번호 변경' })
  @ApiBody({ type: ChangePasswordDto })
  @Patch('password/change')
  async changePassword(
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Body() passwordDto: ChangePasswordDto,
  ) {
    const message = await this.authService.changePassword(
      user.email,
      passwordDto.currentPassword,
      passwordDto.newPassword,
      passwordDto.confirmPassword,
    );

    const { accessToken, refreshToken, accessOptions, refreshOptions } =
      this.authService.makeJwtToken(user.email, origin);

    return {
      success: true,
      message,
      data: {
        accessToken,
        refreshToken,
        accessOptions,
        refreshOptions,
      },
    };
  }
}
