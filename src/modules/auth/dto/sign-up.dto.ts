import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { RegisterType } from 'src/modules/users/entities/user.entity';

export class SignUpDto {
  @ApiProperty({
    type: String,
    description: '이메일',
    example: 'test@test.com',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({
    type: String,
    description: '비밀번호',
    example: 'Password123!',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  @IsOptional()
  password?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ type: String, description: '이름', example: 'test' })
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  socialId?: string;

  @IsEnum(RegisterType)
  registerType: RegisterType;
}
