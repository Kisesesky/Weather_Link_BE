import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  Matches,
  IsBoolean,
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

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '프로필 이미지 파일',
    required: false,
  })
  @IsOptional()
  profileImage?: Express.Multer.File;

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

  @ApiProperty({
    type: Boolean,
    description: '서비스 이용 약관 동의',
    required: true,
  })
  @IsBoolean()
  termsAgreed: boolean;

  @ApiProperty({
    type: Boolean,
    description: '위치정보 수집 동의',
    required: true,
  })
  @IsBoolean()
  locationAgreed: boolean;

  @ApiProperty({
    description: '시/도',
    example: '서울특별시',
  })
  @IsString()
  sido: string;

  @ApiProperty({
    description: '구/군',
    example: '강남구',
  })
  @IsString()
  gugun: string;

  @ApiProperty({
    description: '동',
    example: '역삼1동',
  })
  @IsString()
  dong: string;
}
