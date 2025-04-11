import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateThemeDto {
  @ApiProperty({
    type: String,
    description: '테마 설정 (light 또는 dark)',
    example: 'light',
  })
  @IsString()
  theme: string;
}
