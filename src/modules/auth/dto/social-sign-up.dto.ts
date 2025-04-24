import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SocialSignupDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '프로필 이미지 파일 (선택)',
    required: false,
  })
  @IsOptional()
  profileImage?: Express.Multer.File;

  @ApiProperty({
    type: Boolean,
    description: '서비스 이용 약관 동의',
    example: true,
  })
  @IsBoolean({ message: '약관 동의 여부는 boolean 값이어야 합니다.' })
  @IsNotEmpty({ message: '약관 동의 여부를 입력해주세요.' })
  @Type(() => Boolean)
  termsAgreed: boolean;

  @ApiProperty({
    type: Boolean,
    description: '위치 정보 동의',
    example: true,
  })
  @IsBoolean({ message: '위치 정보 동의 여부는 boolean 값이어야 합니다.' })
  @IsNotEmpty({ message: '위치 정보 동의 여부를 입력해주세요.' })
  @Type(() => Boolean)
  locationAgreed: boolean;

  @ApiProperty({
    type: String,
    description: '시/도',
    example: '서울특별시',
  })
  @IsString()
  @IsNotEmpty({ message: '시/도를 입력해주세요.' })
  sido: string;

  @ApiProperty({
    type: String,
    description: '구/군',
    example: '강남구',
  })
  @IsString()
  @IsNotEmpty({ message: '구/군을 입력해주세요.' })
  gugun: string;
}
