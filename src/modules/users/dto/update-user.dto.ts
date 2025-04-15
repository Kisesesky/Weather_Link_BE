import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { Theme } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty({
    type: String,
    description: '이름 (한글, 영문, 숫자 사용 가능, 8글자 이내)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(8, { message: '이름은 8글자 이내여야 합니다.' })
  @Matches(/^[가-힣a-zA-Z0-9]+$/, {
    message: '이름은 한글, 영문, 숫자만 사용 가능합니다.',
  })
  name?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '프로필 이미지 파일',
    required: false,
  })
  @IsOptional()
  profileImage?: Express.Multer.File;

  @ApiProperty({
    type: String,
    description: '위치 정보',
    example: '9bb48bb2-0d6c-43a1-b0b2-406797ca2a93',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    enum: Theme,
    description: '테마 설정 (light 또는 dark)',
    example: Theme.LIGHT,
    required: false,
    default: Theme.LIGHT,
  })
  @IsOptional()
  @IsEnum(Theme, { message: '테마는 light 또는 dark만 선택 가능합니다.' })
  theme?: Theme;
}
