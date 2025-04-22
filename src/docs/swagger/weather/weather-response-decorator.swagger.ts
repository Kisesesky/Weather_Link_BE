import { ApiResponse } from '@nestjs/swagger';
import { WeatherResponseDto } from 'src/modules/weather/dto/weather-response.dto';

export const ApiWeatherResponse = () =>
  ApiResponse({
    status: 200,
    description: '오늘의 날씨 정보 조회 성공',
    type: WeatherResponseDto,
  });
