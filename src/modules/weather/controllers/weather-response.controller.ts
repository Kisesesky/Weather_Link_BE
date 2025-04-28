import { Controller, Get, NotFoundException, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiGugunQuery, ApiSidoQuery } from "src/docs/swagger/weather/weather-query-decorator.swagger";
import { ApiWeatherResponse } from "src/docs/swagger/weather/weather-response-decorator.swagger";
import { todayForecast, todayWeather, weeklyForecast, weeklyTemp } from "src/docs/swagger/weather/weather.swagger";
import { SIDO_NAME_MAP } from "src/modules/locations/utils/region-map";
import { WeatherResponseDto } from "../dto/weather-response.dto";
import { DailyForecastService } from "../service/daily-forecast.service";
import { MidForecastService } from "../service/mid-forecast.service";
import { MidTempService } from "../service/mid-temp.service";
import { TodayForecastService } from "../service/today-forcast.service";
import { WeatherAirService } from "../service/weather-air.service";
import { WeatherResponseUtil } from "../utils/response.utils";

@ApiTags('날씨 서비스 - 통합')
@Controller('weather')
export class WeatherResponseController {
    constructor(
        private readonly weatherAirService: WeatherAirService,
        private readonly dailyForecastService: DailyForecastService,
        private readonly midTempService: MidTempService,
        private readonly midForecastService: MidForecastService,
        private readonly todayForecastService: TodayForecastService,
      ) {}
      
    @todayWeather()
    @ApiSidoQuery()
    @ApiGugunQuery()
    @ApiWeatherResponse()
    @Get('todayweather')
    async getTodayWeather(
      @Query('sido') sido: string,
      @Query('gugun') gugun?: string
    ): Promise<WeatherResponseDto<any>> {
      try {
        const [currentWeather, todayForecast, location] = await Promise.all([
          this.dailyForecastService.getCurrentWeatherByRegionName(sido, gugun),
          this.todayForecastService.getForecastDataByRegionName(sido, gugun),
          this.weatherAirService.findLocationByRegionName(sido)
        ]);
    
        if (!location) {
          throw new NotFoundException('해당 지역을 찾을 수 없습니다.');
        }
        const airQuality = await this.weatherAirService.getAirQualityById(location.id);
  
        const response = {
          location: gugun ? `${sido} ${gugun}` : sido,
          currentWeather: {
            temperature:currentWeather.temperature,
            perceivedTemperature: currentWeather.perceivedTemperature,
            humidity: currentWeather.humidity,
            windSpeed: currentWeather.windSpeed,
            rainfall: currentWeather.rainfall,
            airQuality: {
              pm10: airQuality.pm10,
              pm10Grade: airQuality.pm10Level,
              pm25: airQuality.pm25,
              pm25Grade: airQuality.pm25Level
            }
          },
          forecast: {
            skyCondition: todayForecast.skyCondition,
            precipitationType: todayForecast.precipitationType,
          }
        };
  
        return WeatherResponseUtil.success(response, '오늘의 날씨 정보 조회 성공');
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        return WeatherResponseUtil.error(
          'API_ERROR',
          '오늘의 날씨 정보 조회 실패'
        );
      }
    }

    @todayForecast()
    @ApiSidoQuery()
    @ApiGugunQuery()
    @ApiWeatherResponse()
    @Get('todayforecast')
    async getTodayForecast(
        @Query('sido') sido: string,
        @Query('gugun') gugun: string
    ): Promise<WeatherResponseDto<any>> {
        try {
        const result = await this.todayForecastService.getForecastDataByRegionNameAfterCurrentTime(sido, gugun);
        if (!result) {
            return WeatherResponseUtil.error(
            'NOT_FOUND',
            '해당 지역의 예보 데이터를 찾을 수 없습니다.'
            );
        }
        return WeatherResponseUtil.success(result, '오늘의 날씨 예보 조회');
        } catch (error) {
        return WeatherResponseUtil.error(
            'SERVER_ERROR',
            error.message
        );
        }
    }

    @weeklyForecast()
    @ApiSidoQuery()
    @ApiGugunQuery()
    @ApiWeatherResponse()
    @Get('midtermforecast')
    public async getWeeklyForecast(
      @Query('sido') sido: string,
      @Query('gugun') gugun: string,
    ): Promise<WeatherResponseDto<any>> {
      try {
        let normalizedSido = sido.replace(/(특별시|광역시|특별자치시|특별자치도)$/, '');
        const reverseSidoMap = Object.fromEntries(
          Object.entries(SIDO_NAME_MAP).map(([key, value]) => [value, key])
        );
      
        if (reverseSidoMap[sido]) {
          normalizedSido = reverseSidoMap[sido];
        } else if (reverseSidoMap[normalizedSido]) {
          normalizedSido = reverseSidoMap[normalizedSido];
        }
        const forecasts = await this.midForecastService.transformMidTermForecast(normalizedSido, gugun);
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

    @weeklyTemp()
    @ApiSidoQuery()
    @ApiGugunQuery()
    @ApiWeatherResponse()
    @Get('mid-temp')
    async getWeeklytemp(
        @Query('sido') sido: string,
        @Query('gugun') gugun: string
    ): Promise<WeatherResponseDto<any>> {
        try {
          const result = await this.midTempService.getMidTermTempOnly(sido, gugun);
          if (!result) {
            return WeatherResponseUtil.error(
              'NOT_FOUND',
              '지역을 찾을 수 없습니다.'
            );
          }
    
          return WeatherResponseUtil.success(result, '중기 기온 조회 성공');
        } catch (error) {
          return WeatherResponseUtil.error(
            'API_ERROR',
            '중기 기온 예보 조회 실패'
          );
        }
    }
}