import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MidTempService } from '../service/mid-temp.service';
import { WeatherResponseDto } from '../dto/weather-response.dto';
import { WeatherResponseUtil } from '../utils/response.utils';
import { MidTermTempWithForecastResponseDto } from '../dto/mid-temp-response.dto';
import { TodayForecastService } from '../service/today-forcast.service';
import { MidForecastService } from '../service/mid-forecast.service';

@ApiTags('날씨서비스 - 예보 조회')
@Controller('weather/forecast')
export class MidTempController {
    constructor(
        private readonly midTempService: MidTempService,
        private readonly todayForecastService: TodayForecastService,
        private readonly midForecastService: MidForecastService,

    ) {}
    @ApiOperation({ summary: '지역별 일간 예보 조회' })
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
      description: '지역별 일간 예보 조회 성공',
      type: WeatherResponseDto
    })
    @ApiResponse({ status: 404, description: '해당 지역의 날씨 정보를 찾을 수 없습니다.' })
    @Get('todayforecast')
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
        }, '지역별 일간 예보 조회 성공');
      } catch (error) {
        return WeatherResponseUtil.error(
          'API_ERROR',
          '지역별 일간 예보 조회 실패'
        );
      }
    }

  @ApiOperation({ summary: '지역별 주간 예보 조회' })
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
  @Get('midtermforecast')
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

    @Get('midtempforecast')
    @ApiOperation({
        summary: '중기 기온과 예보 조회',
        description: '시도와 구군으로 중기 기온과 예보를 조회합니다.'
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
                '중기 기온과 예보 데이터 조회 실패'
            );
        }
    }
}
