import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Theme } from '../entities/user.entity';

export class UpdateThemeDto {
  @ApiProperty({
    enum: Theme,
    description: '테마 설정 (light 또는 dark)',
    example: Theme.LIGHT,
  })
  @IsEnum(Theme, { message: '테마는 light 또는 dark만 선택 가능합니다.' })
  theme: Theme;
}
