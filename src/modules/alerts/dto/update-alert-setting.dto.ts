import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  ValidateIf,
  IsNumber,
} from 'class-validator';

// Define the possible types and conditions directly or import them
const alertTypes = ['TEMPERATURE', 'HUMIDITY', 'WIND', 'AIRQUALITY'] as const;
type AlertType = (typeof alertTypes)[number];

const alertConditions = ['above', 'below', 'equal'] as const;
type AlertCondition = (typeof alertConditions)[number];

const airQualityGrades = ['좋음', '보통', '나쁨', '매우 나쁨'] as const;
type AirQualityGrade = (typeof airQualityGrades)[number];

export class UpdateAlertSettingDto {
  // Type is usually not updatable, but include if needed
  // @ApiProperty({ description: '알림 유형', example: 'TEMPERATURE', required: false, enum: alertTypes })
  // @IsOptional()
  // @IsEnum(alertTypes)
  // type?: AlertType;

  @ApiProperty({
    description:
      '업데이트할 임계치 (온도/습도/바람: 숫자, 미세먼지: 등급 문자열)',
    example: 25,
    required: false, // Mark as not required in Swagger
  })
  @IsOptional() // Make it optional
  @ValidateIf((o) => o.type !== 'AIRQUALITY') // Validate as number if not AIRQUALITY
  @IsNumber()
  @ValidateIf((o) => o.type === 'AIRQUALITY') // Validate as string enum if AIRQUALITY
  @IsEnum(airQualityGrades)
  threshold?: number | AirQualityGrade; // Allow number or specific string grades

  @ApiProperty({
    description: '업데이트할 알림 조건',
    example: 'above',
    required: false,
    enum: alertConditions,
  })
  @IsOptional()
  @IsEnum(alertConditions)
  condition?: AlertCondition;

  @ApiProperty({
    description: '업데이트할 알림 활성화 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
