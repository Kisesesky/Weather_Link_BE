import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { WeatherAirService } from '../service/weather-air.service';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';
import { DailyForecastService } from '../service/daily-forecast.service';
import { TodayForecastService } from '../service/today-forcast.service';
import { WeatherResponseDto } from '../dto/weather-response.dto';
import { WeatherResponseUtil } from '../utils/response.utils';
import { MidTempService } from '../service/mid-temp.service';
import { MidTermTempWithForecastResponseDto } from '../dto/mid-temp-response.dto';

@ApiTags('날씨 서비스 - 조회')
@Controller('weather/search')
export class WeatherController {
  constructor(
    private readonly weatherAirService: WeatherAirService,
    private readonly dailyForecastService: DailyForecastService,
    private readonly midTempService: MidTempService,
    private readonly todayForecastService: TodayForecastService,
  ) {}
  
  //위치 ID값을 통한 미세먼지 데이터 확인
  @ApiOperation({ summary: '미세먼지 데이터 확인' })
  @ApiParam({ name: 'locationId', description: '지역 아이디', required: true, type: String })
  @ApiResponse({ 
    status: 200, 
    description: '특정 지역의 미세먼지 데이터 조회 성공',
    type: WeatherResponseDto
  })
  @ApiResponse({ status: 404, description: '정보를 찾을 수 없습니다.' })
  @Get('air-quality/:locationId')
  async getCurrentLocationAirQulity(
    @Param('locationId') locationId: string
  ): Promise<WeatherResponseDto<any>> {
    try {
      const air = await this.weatherAirService.getAirQualityById(locationId)
      if(!air) {
        throw new NotFoundException('정보를 찾을 수 없습니다.')
      }
      //수집기준 utc를 사용해서 kst로 변환
      const kstTime = moment(air.dataTime).format('YYYY-MM-DD HH:mm');
      return WeatherResponseUtil.success({
        sido: air.sido,
        gugun: air.gugun,
        dataTime: kstTime,
        pm10: air.pm10,
        pm10Grade: air.pm10Level,
        pm25: air.pm25,
        pm25Grade: air.pm25Level
      }, '특정 지역의 미세먼지 데이터 조회 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '특정 지역의 미세먼지 데이터 조회 실패'
      );
    }
  }

  @ApiOperation({ summary: '현재 날씨 정보 조회(좌표용)' })
  @ApiResponse({
    status: 200,
    description: '현재 날씨 정보',
    type: WeatherResponseDto
  })
  @ApiQuery({ name: 'nx', description: '예보지점 X좌표', required: false, type: Number })
  @ApiQuery({ name: 'ny', description: '예보지점 Y좌표', required: false, type: Number })
  @Get('current')
  async getCurrentWeather(
    @Query('nx') nx: number,
    @Query('ny') ny: number,
  ): Promise<WeatherResponseDto<any>> {
    try {
      const data = await this.dailyForecastService.getCurrentWeather(nx, ny);
      return WeatherResponseUtil.success(data, '현재 날씨 정보 조회 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '현재 날씨 정보 조회 실패'
      );
    }
  }

  @ApiOperation({ summary: '지역별 오늘의 날씨 예보 조회' })
  @ApiQuery({ name: 'sido', description: '시/도 이름', required: true })
  @ApiQuery({ name: 'gugun', description: '구/군 이름', required: false })
  @ApiResponse({
      status: 200,
      description: '지역별 오늘의 날씨 예보 조회 성공',
      type: WeatherResponseDto
  })
  @ApiResponse({ status: 404, description: '해당 지역의 날씨 정보를 찾을 수 없습니다.' })
  @Get('todayforecast')
  async getTodayForecast(
    @Query('sido') sido: string,
    @Query('gugun') gugun?: string
  ): Promise<WeatherResponseDto<any>> {
    try {
      const forecast = await this.todayForecastService.getForecastDataByRegionName(sido, gugun);
      return WeatherResponseUtil.success(forecast);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
        throw new NotFoundException('날씨 정보를 조회하는 중 오류가 발생했습니다.');
      }
  }

  @Get('midtemp')
  @ApiOperation({
    summary: '중기 기온 조회',
    description: '시도와 구군으로 중기 기온을 조회합니다.'
  })
  @ApiQuery({ name: 'sido', required: true, description: '시/도 이름', example: '서울특별시', })
  @ApiQuery({ name: 'gugun', required: false, description: '구/군 이름', example: '강남구', })
  @ApiResponse({
    status: 200,
    description: '중기 기온과 예보 조회 성공',
    type: WeatherResponseDto
  })
  async searchMidTermTempWithForecast(
    @Query('sido') sido: string,
    @Query('gugun') gugun: string
  ): Promise<WeatherResponseDto<MidTermTempWithForecastResponseDto>> {
    try {
      if (!sido || !gugun) {
        return WeatherResponseUtil.error(
          'INVALID_PARAMS',
          '시도와 구군 이름이 모두 필요합니다.'
        );
      }

      const result = await this.midTempService.getMidTermTempWithForecast(sido, gugun);
      if (!result || !result.length) {
        return WeatherResponseUtil.error(
          'NOT_FOUND',
          '지역을 찾을 수 없습니다.'
        );
      }

      // 첫 번째 예보 데이터만 사용 (가장 최근 데이터)
      const latestForecast = result[0];
      const response: MidTermTempWithForecastResponseDto = {
        location: {
          sido,
          gugun
        },
        forecastDate: latestForecast.forecastDate,
        tmFc: latestForecast.tmFc,
        minTemp: latestForecast.minTemp,
        maxTemp: latestForecast.maxTemp,
        forecast: latestForecast.forecast
      };

      return WeatherResponseUtil.success(response, '중기 기온과 예보 조회 성공');
    } catch (error) {
        return WeatherResponseUtil.error(
          'API_ERROR',
          '중기 기온 데이터 조회 실패'
        );
    }
  }
}