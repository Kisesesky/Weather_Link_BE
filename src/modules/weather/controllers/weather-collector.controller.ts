import { Controller, Delete, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { WeatherResponseDto } from "../dto/weather-response.dto";
import { DailyForecastService } from "../service/daily-forecast.service";
import { MidForecastService } from "../service/mid-forecast.service";
import { MidTempService } from "../service/mid-temp.service";
import { TodayForecastService } from "../service/today-forcast.service";
import { WeatherAirService } from "../service/weather-air.service";
import { WeatherResponseUtil } from "../utils/response.utils";


@ApiTags('날씨 서비스 - 수집')
@Controller('weather/collector')
export class WeatherCollectiorController {
  constructor(
    private readonly weatherAirService: WeatherAirService,
    private readonly midForecastService: MidForecastService,
    private readonly dailyForecastService: DailyForecastService,
    private readonly midTempService: MidTempService,
    private readonly todayForecastService: TodayForecastService,
  ) {}

  //현재시각기준 미세먼지 데이터수집
  @ApiOperation({ summary: '미세먼지 데이터 수집' })
  @ApiResponse({ 
    status: 200, 
    description: '미세먼지 데이터 수집 성공',
    type: WeatherResponseDto
  })
  @Post('air-qualitydata')
  async getCurrenAirQulity(): Promise<WeatherResponseDto<any>> {
    try {
      const data = await this.weatherAirService.fetchAllAirQuality();
      return WeatherResponseUtil.success(data, '미세먼지 데이터 수집 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '미세먼지 데이터 수집 실패'
      );
    }
  }

  @ApiOperation({ summary: '주간예보 수집' })
  @ApiResponse({ 
    status: 200, 
    description: '주간예보 데이터 수집 성공',
    type: WeatherResponseDto
  })
  @Post('mid-termdata')
  async allData(): Promise<WeatherResponseDto<any>> {
    try {
      const data = await this.midForecastService.fetchAndSaveMidForecasts();
      return WeatherResponseUtil.success(data, '주간예보 데이터 수집 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '주간예보 데이터 수집 실패'
      );
    }
  }

  //안되는지역 주간예보 수기로수집
  @ApiOperation({ summary: '특정 지역의 주간예보 수집' })
  @ApiParam({ name: 'locationId', description: '지역 아이디', required: true, type: String })
  @ApiResponse({ 
    status: 200, 
    description: '특정 지역의 주간예보 수집 성공',
    type: WeatherResponseDto
  })
  @ApiResponse({ status: 404, description: '정보를 찾을 수 없습니다.' })
  @Post('mid-termdata/:locationId')
  async getData(
    @Query('locationId') locationId?: string
  ): Promise<WeatherResponseDto<any>> {
    try {
      const data = await this.midForecastService.fetchAndSaveMidForecasts(locationId);
      return WeatherResponseUtil.success(data, '특정 지역의 주간예보 수집 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '특정 지역의 주간예보 수집 실패'
      );
    }
  }
  
  @ApiOperation({ summary: '현재 날씨 정보 수집' })
  @ApiResponse({
    status: 200,
    description: '현재 날씨 정보',
    type: WeatherResponseDto
  })
  @Post('daily-data')
  async collectAllRegionsWeather(): Promise<WeatherResponseDto<any>> {
    try {
      const data = await this.dailyForecastService.collectAllRegionsWeather();
      return WeatherResponseUtil.success(data, '현재 날씨 정보 수집 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '현재 날씨 정보 수집 실패'
      );
    }
  }

  @ApiOperation({ summary: '오늘 날씨 예보 정보 수집' })
  @ApiResponse({
    status: 200,
    description: '오늘 날씨 예보 정보',
    type: WeatherResponseDto
  })
  @Post('today-data')
  async collectAllRegionsForecastWeather(): Promise<WeatherResponseDto<any>> {
    try {
        const data = await this.todayForecastService.collectAllRegionsWeather();
        return WeatherResponseUtil.success(data, '오늘 날씨 예보 정보 수집 성공');
    } catch (error) {
        return WeatherResponseUtil.error(
          'API_ERROR',
          '오늘 날씨 예보 정보 수집 실패'
        );
      }
  }

  @ApiOperation({
    summary: '중기 기온 예보 데이터 수집',
    description: '전국의 중기 기온 예보 데이터를 수집합니다.'
  })
  @ApiResponse({
    status: 200,
    description: '중기 기온 예보 데이터 수집 성공',
    type: WeatherResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 에러',
    schema: {
        type: 'object',
        properties: {
            message: { type: 'string', example: '중기 기온 데이터 수집 실패' },
            error: { type: 'string' }
        }
    }
  })

  @Post('mid-tempdata')
  async fetchData(): Promise<WeatherResponseDto<void>> {
    try {
        await this.midTempService.fetchAndSaveMidTempForecasts();
        return WeatherResponseUtil.success(undefined, '중기 기온 예보 데이터 수집 성공');
    } catch (error) {
        return WeatherResponseUtil.error(
            'API_ERROR',
            '중기 기온 예보 데이터 수집 실패'
        );
    }
  }

  @ApiOperation({
    summary: '특정 지역의 중기 기온 예보 데이터 수집',
    description: '특정 지역의 중기 기온 예보 데이터를 수집합니다.'
  })
  @ApiQuery({
    name: 'regionCode',
    description: '지역 코드',
    required: true,
    type: String
  })
  @ApiResponse({
    status: 200,
    description: '특정 지역의 중기 기온 예보 데이터 수집 성공',
    type: WeatherResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청',
    schema: {
        type: 'object',
        properties: {
            message: { type: 'string', example: '지역 코드가 필요합니다.' }
        }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 에러',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '중기 기온 데이터 수집 실패' },
        error: { type: 'string' }
      }
    }
  })
  @Post('mid-tempdata/region')
  async fetchRegionData(@Query('regionCode') regionCode: string): Promise<WeatherResponseDto<void>> {
    try {
      if (!regionCode) {
        return WeatherResponseUtil.error(
            'INVALID_PARAMS',
            '지역 코드가 필요합니다.'
        );
      }
        await this.midTempService.fetchAndSaveMidTempForecasts(regionCode);
        return WeatherResponseUtil.success(undefined, '특정 지역의 중기 기온 예보 데이터 수집 성공');
    } catch (error) {
        return WeatherResponseUtil.error(
            'API_ERROR',
            '중기 기온 예보 데이터 수집 실패'
        );
    }
  }
  @ApiOperation({
    summary: '오래된 중기 기온 예보 데이터 삭제',
    description: '7일이 지난 중기 기온 예보 데이터를 삭제합니다.'
  })
  @ApiResponse({
    status: 200,
    description: '오래된 데이터 삭제 성공',
    type: WeatherResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 에러',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '오래된 데이터 삭제 실패' },
        error: { type: 'string' }
      }
    }
  })
  @Delete('mid-tempdata/cleanup')
  async cleanupOldData(): Promise<WeatherResponseDto<void>> {
    try {
        await this.midTempService.deleteOldForecastsManually();
        return WeatherResponseUtil.success(undefined, '오래된 기온 예보 데이터가 삭제되었습니다.');
    } catch (error) {
        return WeatherResponseUtil.error(
            'API_ERROR',
            '오래된 데이터 삭제 실패'
        );
    }
  }
}
