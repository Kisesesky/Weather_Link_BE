import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  Matches,
} from 'class-validator';
import { RegisterType } from 'src/modules/users/entities/user.entity';
import { LocationsEntity } from './../../locations/entities/location.entity';

export class SignUpDto {
  @ApiProperty({
    type: String,
    description: '이메일',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({
    type: String,
    description: '비밀번호',
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
  location?: LocationsEntity;

  @ApiProperty({ type: String, description: '이름' })
  @IsString()
  @MaxLength(8)
  @Matches(/^[가-힣a-zA-Z0-9]+$/)
  name: string;

  @IsString()
  @IsOptional()
  socialId?: string;

  @IsEnum(RegisterType)
  registerType: RegisterType;
}
