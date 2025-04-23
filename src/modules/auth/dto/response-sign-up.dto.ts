import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RegisterType, Theme } from 'src/modules/users/entities/user.entity';

class LocationResponseDto {
  @ApiProperty({ description: '시/도', example: '서울특별시' })
  sido: string;

  @ApiProperty({ description: '구/군', example: '강남구' })
  gugun: string;
}

export class ResponseSignUpDto {
  @ApiProperty({ description: '생성된 사용자 ID (UUID)', example: '...' })
  id: string;

  @ApiProperty({ description: '사용자 이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://...',
    nullable: true,
  })
  profileImage: string | null;

  @ApiProperty({
    description: '가입 유형',
    example: 'EMAIL',
    enum: RegisterType,
  })
  registerType: string;
  @ApiProperty({
    description: '사용자 테마',
    example: 'light',
    enum: Theme,
  })
  theme: Theme;

  @ApiProperty({ type: LocationResponseDto, description: '선택된 위치 정보' })
  @Type(() => LocationResponseDto) // 중첩 객체 타입 명시
  location: LocationResponseDto;
}
