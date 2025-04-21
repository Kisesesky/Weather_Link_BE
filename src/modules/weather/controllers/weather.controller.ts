import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { WeatherService } from '../service/weather.service';
import { WeatherAirService } from '../service/weather-air.service';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MidForecastService } from '../service/mid-forecast.service';
import * as moment from 'moment';
import { DailyForecastService } from '../service/daily-forecast.service';
import { TodayForecastService } from '../service/today-forcast.service';
import { WeatherResponseDto } from '../dto/weather-response.dto';
import { WeatherResponseUtil } from '../utils/response.utils';

@ApiTags('날씨 서비스')
@Controller('weather')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly weatherAirService: WeatherAirService,
    private readonly midForecastService: MidForecastService,
    private readonly dailyForecastService: DailyForecastService,
    private readonly todayForecastService: TodayForecastService,
  ) {}

  //현재시각기준 미세먼지 데이터수집
  @ApiOperation({ summary: '미세먼지 데이터 수집' })
  @ApiResponse({ 
    status: 200, 
    description: '미세먼지 데이터 수집 성공',
    type: WeatherResponseDto
  })
  @Get('air-quality')
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

  @ApiOperation({ summary: '주간예보 수집' })
  @ApiResponse({ 
    status: 200, 
    description: '주간예보 데이터 수집 성공',
    type: WeatherResponseDto
  })
  @Get('mid-term-forecast-data')
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

  //안되는지역 수기로수집
  @ApiOperation({ summary: '특정 지역의 주간예보 수집' })
  @ApiParam({ name: 'locationId', description: '지역 아이디', required: true, type: String })
  @ApiResponse({ 
    status: 200, 
    description: '특정 지역의 주간예보 수집 성공',
    type: WeatherResponseDto
  })
  @ApiResponse({ status: 404, description: '정보를 찾을 수 없습니다.' })
  @Get('mid-term-forecast/:locationId')
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

  @ApiOperation({ summary: '주간예보 검색 시/도 구/군' })
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
  @ApiResponse({ 
    status: 200, 
    description: '주간예보 데이터 검색 성공',
    type: WeatherResponseDto
  })
  @Get('transform')
  public async transformForecast(
    @Query('sido') sido: string,
    @Query('gugun') gugun: string,
  ): Promise<WeatherResponseDto<any>> {
    try {
      const data = await this.midForecastService.transformMidTermForecast(sido, gugun);
      return WeatherResponseUtil.success(data, '주간예보 데이터 검색 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '주간예보 데이터 검색 실패'
      );
    }
  }

  @ApiOperation({ summary: '현재 날씨 정보 조회' })
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


  @ApiOperation({ summary: '현재 날씨 정보 수집' })
  @ApiResponse({
    status: 200,
    description: '현재 날씨 정보',
    type: WeatherResponseDto
  })
  @Get('daily-weatherData')
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

  @ApiOperation({ summary: '현재 날씨 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '현재 날씨 정보',
    type: WeatherResponseDto
  })
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
  @ApiQuery({
    name: 'dong',
    description: '동 입력',
    example: '역삼1동',
  })
  @Get('currentWeather')
  async getLocationWeather(
    @Query('sido') sido: string,
    @Query('gugun') gugun?: string,
    @Query('dong') dong?: string,
  ): Promise<WeatherResponseDto<any>> {
    try {
      const data = await this.dailyForecastService.collectLocationWeather(sido, gugun, dong);
      return WeatherResponseUtil.success(data, '현재 날씨 정보 조회 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '현재 날씨 정보 조회 실패'
      );
    }
  }

  @ApiOperation({ summary: '지역별 일기 예보 조회' })
  @ApiQuery({ 
    name: 'sido', 
    type: 'string', 
    required: true,
    description: '시/도 이름 (예: 서울특별시)' 
  })
  @ApiQuery({ 
    name: 'gugun', 
    type: 'string', 
    required: false,
    description: '구/군 이름 (예: 강남구)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '지역별 일기 예보 조회 성공',
    type: WeatherResponseDto
  })
  @ApiResponse({ status: 404, description: '해당 지역의 날씨 정보를 찾을 수 없습니다.' })
  @Get('forecast')
  async getForecast(
    @Query('sido') sido: string,
    @Query('gugun') gugun?: string,
  ): Promise<WeatherResponseDto<any>> {
    try {
      const forecast = await this.todayForecastService.getForecastByRegionName(sido, gugun);
      if (!forecast) {
        return WeatherResponseUtil.error(
          'NOT_FOUND',
          '해당 지역의 날씨 정보를 찾을 수 없습니다.'
        );
      }
      return WeatherResponseUtil.success({
        location: {
          sido,
          gugun,
        },
        forecast,
      }, '지역별 일기 예보 조회 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '지역별 일기 예보 조회 실패'
      );
    }
  }

  @Get('forecast')
    @ApiOperation({ summary: '지역별 날씨 예보 조회' })
    @ApiQuery({ name: 'sido', required: true, description: '시/도 이름' })
    @ApiQuery({ name: 'gugun', required: false, description: '구/군 이름' })
    async getDailyForecast(
        @Query('sido') sido: string,
        @Query('gugun') gugun?: string,
    ): Promise<WeatherResponseDto<any>> {
      try {
        const data = await this.todayForecastService.getForecastByRegionName(sido, gugun);
        return WeatherResponseUtil.success(data, '지역별 날씨 예보 조회 성공');
      } catch (error) {
        return WeatherResponseUtil.error(
          'API_ERROR',
          '지역별 날씨 예보 조회 실패'
        );
      }
    }
}
