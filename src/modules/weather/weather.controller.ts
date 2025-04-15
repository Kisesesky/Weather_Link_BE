import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { WeatherService } from './service/weather.service';
import { WeatherAirService } from './service/weather-air.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('날씨 서비스')
@Controller('weather')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly weatherAirService: WeatherAirService
    ) {}

  //현재시각기준 미세먼지 데이터수집
  @ApiOperation({ summary: '미세먼지 데이터 수집' })
  @Get('air-quality')
  async getCurrenAirQulity() {
    return await this.weatherAirService.fetchAllAirQuality()
  }

  //위치 ID값을 통한 미세먼지 데이터 확인
  @ApiOperation({ summary: '미세먼지 데이터 확인' })
  @ApiQuery({ name: 'locationId', description: '지역 아이디', required: true, type: String })
  @Get('air-quality/:locationId')
  async getCurrentLocationAirQulity(
    @Param('locationId') locationId: string
  ) {
    const air = await this.weatherAirService.getAirQualityById(locationId)
    if(!air) {
      throw new NotFoundException('정보를 찾을 수 없습니다.')
    }
    return {
      sido: air.sido,
      gugun: air.gugun,
      dataTime: air.dataTime,
      pm10: air.pm10Value,
      pm25: air.pm25Value
    }
  }
}
