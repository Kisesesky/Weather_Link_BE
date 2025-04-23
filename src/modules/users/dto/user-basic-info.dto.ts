import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

// Location 정보를 위한 DTO
class LocationDto {
  @ApiProperty({ description: '시/도', example: '서울특별시' })
  @IsString()
  sido: string;

  @ApiProperty({ description: '구/군', example: '강남구' })
  @IsString()
  gugun: string;
}

// 기본적인 사용자 정보를 위한 DTO
export class UserBasicInfoDto {
  @ApiProperty({ description: '사용자 ID', example: '...' })
  @IsString() // 실제로는 UUID지만, string으로 처리해도 무방
  id: string;

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
    type: LocationDto, // Swagger 문서화를 위해 타입 명시
    nullable: true,
  })
  @IsOptional() // 위치 정보는 선택적일 수 있음
  location: LocationDto | null;

  // User 엔티티를 UserBasicInfoDto로 변환하는 정적 메소드 (선택적이지만 유용함)
  static fromUser(user: any): UserBasicInfoDto {
    const dto = new UserBasicInfoDto();
    dto.id = user.id;
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
