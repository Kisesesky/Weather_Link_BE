import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword } from 'class-validator';
import { SendEmailCodeDto } from './send-email-code.dto';

export class PasswordDto extends SendEmailCodeDto {

  @ApiProperty({
    example: 'Test1234!',
    description: '신규 비밀번호',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  newPassword: string;

  @ApiProperty({
    example: 'Test1234!',
    description: '신규 비밀번호확인',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  confirmPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Test1233!',
    description: '현재 비밀번호',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  currentPassword: string;

  @ApiProperty({
    example: 'Test1234!',
    description: '새 비밀번호',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  newPassword: string;

  @ApiProperty({
    example: 'Test1234!',
    description: '새 비밀번호 확인',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  confirmPassword: string;
}