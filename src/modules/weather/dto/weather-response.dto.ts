import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';

export class WeatherResponseDto<T> extends ResponseDto<T> {
  @ApiProperty({
    description: '에러 정보',
    required: false,
    example: {
      code: 'WEATHER_001',
      message: '날씨 데이터를 찾을 수 없습니다.'
    }
  })
  error?: {
    code: string;
    message: string;
  };

  constructor(partial: Partial<WeatherResponseDto<T>>) {
    super(partial);
    Object.assign(this, partial);
  }
}
