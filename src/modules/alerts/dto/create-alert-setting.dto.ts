import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlertSettingDto {
  @ApiProperty({
    description: '알림 유형 (온도, 습도, 풍속, 미세먼지)',
    example: 'TEMPERATURE',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['TEMPERATURE', 'HUMIDITY', 'WIND', 'AIRQUALITY'])
  type: 'TEMPERATURE' | 'HUMIDITY' | 'WIND' | 'AIRQUALITY';

  @ApiProperty({
    description:
      '임계치 (온도, 습도, 바람은 수치, 미세먼지는 등급: 좋음, 보통, 나쁨, 매우 나쁨)',
    example: 30,
  })
  @IsOptional()
  threshold: number | string;

  @ApiProperty({
    description: '알림 활성화 여부',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
