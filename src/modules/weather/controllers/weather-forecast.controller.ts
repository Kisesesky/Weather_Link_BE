import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MidTempService } from '../service/mid-temp.service';
import { WeatherResponseDto } from '../dto/weather-response.dto';
import { WeatherResponseUtil } from '../utils/response.utils';
import { MidTermTempResponseDto } from '../dto/mid-temp-response.dto';
import { MidForecastService } from '../service/mid-forecast.service';

@ApiTags('Test - 날씨 서비스 - 예보 조회')
@Controller('weather/forecast')
export class MidTempController {
    constructor(
        private readonly midTempService: MidTempService,
        private readonly midForecastService: MidForecastService,
    ) {}

  @ApiOperation({ summary: '지역별 주간 예보 조회' })
  @ApiQuery({
    name: 'sido',
    description: '시/도 입력',
    example: '서울특별시',
  })
  @ApiQuery({
    name: 'gugun',
    description: '구/군 입력 (표시용)',
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
      // sido에서 특별시/광역시/도 등의 suffix 제거
      const normalizedSido = sido.replace(/(특별시|광역시|특별자치시|도|특별자치도)$/, '');
      
      // 기존 로직 사용 (RegionEntity 기반)
      const forecasts = await this.midForecastService.transformMidTermForecast(normalizedSido, gugun);
      
      // 날짜별로 데이터 그룹화
      const groupedForecasts = forecasts.reduce((acc, forecast) => {
        if (!acc[forecast.forecastDate]) {
          acc[forecast.forecastDate] = {
            forecastDate: forecast.forecastDate,
            morning: null,
            afternoon: null
          };
        }
        
        if (forecast.forecastTimePeriod === '오전') {
          acc[forecast.forecastDate].morning = {
            skyAndPre: forecast.skyAndPre,
            rnst: forecast.rnst
          };
        } else {
          acc[forecast.forecastDate].afternoon = {
            skyAndPre: forecast.skyAndPre,
            rnst: forecast.rnst
          };
        }
        
        return acc;
      }, {});

      const transformedData = Object.values(groupedForecasts);
      
      // 응답에 전체 지역명 포함
      return WeatherResponseUtil.success({
        location: gugun ? `${sido} ${gugun}` : sido,
        forecasts: transformedData
      }, '주간예보 데이터 검색 성공');
    } catch (error) {
      return WeatherResponseUtil.error(
        'API_ERROR',
        '주간예보 데이터 검색 실패'
      );
    }
  }

  // @ApiOperation({
  //   summary: '중기 기온 예보 조회',
  //   description: '시도와 구군으로 중기 기온 예보를 조회합니다.'
  // })
  // @ApiQuery({
  //   name: 'sido',
  //   description: '시도 이름 (예: 서울특별시)',
  //   required: true,
  //   example: '서울특별시',
  //   type: String
  // })
  // @ApiQuery({
  //   name: 'gugun',
  //   description: '구군 이름 (표시용)',
  //   required: true,
  //   example: '강남구',
  //   type: String
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: '중기 기온 조회 성공',
  //   type: WeatherResponseDto
  // })
  // @Get('mid-temp')
  // async searchMidTermTempOnly(
  //   @Query('sido') sido: string,
  //   @Query('gugun') gugun: string
  // ): Promise<WeatherResponseDto<MidTermTempResponseDto[]>> {
  //   try {
  //     // sido에서 특별시/광역시/도 등의 suffix 제거
  //     const normalizedSido = sido.replace(/(특별시|광역시|특별자치시|도|특별자치도)$/, '');
      
  //     const result = await this.midTempService.getMidTermTempOnly(normalizedSido, gugun);
  //     if (!result || result.length === 0) {
  //       return WeatherResponseUtil.error(
  //         'NOT_FOUND',
  //         '지역을 찾을 수 없습니다.'
  //       );
  //     }

  //     const response: MidTermTempResponseDto[] = result.map(forecast => ({
  //       location: {
  //         sido,
  //         gugun
  //       },
  //       forecastDate: forecast.forecastDate,
  //       tmFc: forecast.tmFc,
  //       minTemp: forecast.minTemp,
  //       maxTemp: forecast.maxTemp
  //     }));

  //     return WeatherResponseUtil.success(response, '중기 기온 예보 조회 성공');
  //   } catch (error) {
  //     return WeatherResponseUtil.error(
  //       'API_ERROR',
  //       '중기 기온 예보 조회 실패'
  //     );
  //   }
  // }
}
