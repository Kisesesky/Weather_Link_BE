import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleAllAlertsDto {
  @ApiProperty({
    description: '전체 알림 활성화 상태 (true: 전체 켜기, false: 전체 끄기)',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty() // 활성화/비활성화 값은 필수
  active: boolean;
}
