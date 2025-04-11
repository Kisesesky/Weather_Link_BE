import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LogInDto {
  @ApiProperty({
    type: String,
    description: '이메일',
    example: 'test@test.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: '비밀번호',
    example: 'Password123!',
  })
  @IsString()
  password: string;
}
