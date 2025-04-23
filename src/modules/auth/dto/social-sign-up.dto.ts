import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class SocialSignupDto {
  @ApiProperty({
    type: String,
    description: '프로필 이미지 URL',
    required: false,
  })
  @IsString()
  profileImage?: string;

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
    type: String,
    description: '시/도',
    example: '서울특별시',
  })
  @IsString()
  sido: string;

  @ApiProperty({
    type: String,
    description: '구/군',
    example: '강남구',
  })
  @IsString()
  gugun: string;
}
