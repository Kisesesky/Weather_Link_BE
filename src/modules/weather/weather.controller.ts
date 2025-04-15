import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { WeatherService } from './service/weather.service';
import { WeatherAirService } from './service/weather-air.service';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MidForecastService } from './service/mid-forecast.service';
import { TransformedMidTermForecastDto } from './dto/mid-forecast.dto';

@ApiTags('날씨 서비스')
@Controller('weather')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly weatherAirService: WeatherAirService,
    private readonly midForecastService: MidForecastService
    ) {}

  //현재시각기준 미세먼지 데이터수집
  @ApiOperation({ summary: '미세먼지 데이터 수집' })
  @Get('air-quality')
  async getCurrenAirQulity() {
    return await this.weatherAirService.fetchAllAirQuality()
  }

  //위치 ID값을 통한 미세먼지 데이터 확인
  @ApiOperation({ summary: '미세먼지 데이터 확인' })
  @ApiParam({ name: 'locationId', description: '지역 아이디', required: true, type: String })
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
      pm10: air.pm10,
      pm10Grade: air.pm10Level,
      pm25: air.pm25,
      pm25Grade: air.pm25Level
    }
  }

  @ApiOperation({ summary: '주간예보 수집' })
  @Get('mid-term-forecast-data')
  async allData() {
    return this.midForecastService.fetchAndSaveMidForecasts();
  }

  //안되는지역 수기로수집
  @ApiOperation({ summary: '주간예보 수집: locationId' })
  @ApiQuery({ name: 'locationId', description: '지역 아이디', required: true, type: String })
  @Get('mid-term-forecast/:locationId')
  async fetchManual(@Query('locationId') locationId?: string) {
    return this.midForecastService.fetchAndSaveMidForecasts(locationId);
  }

  @ApiOperation({ summary: '주간예보 검색 시도/구군' })
  @ApiQuery({
    name: 'sido',
    description: '시/도 입력',
    example: '서울특별시',
  })
  @ApiQuery({
    name: 'gugun',
    description: '구/군 입력',
    example: '강남구',
  })
  @Get('transform')
  public async transformForecast(
    @Query('sido') sido: string,
    @Query('gugun') gugun: string,
  ): Promise<TransformedMidTermForecastDto[]> {
    return this.midForecastService.transformMidTermForecast(sido, gugun);
  }

  
}
