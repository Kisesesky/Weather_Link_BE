import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Location 정보를 위한 DTO
class LocationDto {
  @ApiProperty({ description: '시/도', example: '서울특별시' })
  @IsString()
  sido: string;

  @ApiProperty({ description: '구/군', example: '강남구' })
  @IsString()
  gugun: string;
}

// 날씨 정보를 위한 DTO 추가
class WeatherInfoDto {
  @ApiProperty({ description: '온도(°C)', example: 25.5 })
  @IsNumber()
  temp: number;

  @ApiProperty({ description: '날씨 상태', example: '맑음' })
  @IsString()
  description: string;
}

// 기본적인 사용자 정보를 위한 DTO
export class UserBasicInfoDto {
  @ApiProperty({ description: '사용자 ID', example: '...' })
  @IsString()
  id: string;

  @ApiProperty({ description: '사용자 이메일', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'http://example.com/profile.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  profileImage: string | null;

  @ApiProperty({
    description: '사용자 위치 정보',
    type: LocationDto,
    nullable: true,
  })
  @IsOptional()
  location: LocationDto | null;

  @ApiProperty({
    description: '친구의 현재 날씨 정보',
    nullable: true,
    type: WeatherInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeatherInfoDto)
  weather?: WeatherInfoDto | null;

  // User 엔티티를 UserBasicInfoDto로 변환하는 정적 메소드
  static fromUser(user: any): UserBasicInfoDto {
    const dto = new UserBasicInfoDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.profileImage = user.profileImage;
    dto.location = user.location
      ? {
          sido: user.location.sido,
          gugun: user.location.gugun,
        }
      : null;
    return dto;
  }
}
