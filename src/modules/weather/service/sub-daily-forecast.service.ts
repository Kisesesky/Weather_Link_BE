import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WeatherConfigService } from 'src/config/weather/config.service';
import { Between, Repository } from 'typeorm';
import { DailyForecastEntity } from '../entities/daily-forecast.entity';
import { HttpService } from '@nestjs/axios';
import { calculatePerceivedTemperature } from '../utils/perceived-temperature.util';
import { firstValueFrom } from 'rxjs';
import { LocationsEntity } from 'src/modules/locations/entities/location.entity';
import { RegionEntity } from 'src/modules/locations/entities/region.entity';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import pLimit from 'p-limit';

@Injectable()
export class SubDailyForecastService {
  private readonly logger = new Logger(SubDailyForecastService.name);

  constructor(
    @InjectRepository(RegionEntity)
    private regionRepository: Repository<RegionEntity>,
    @InjectRepository(DailyForecastEntity)
    private dailyForecastRepository: Repository<DailyForecastEntity>,
    private readonly weatherConfigService: WeatherConfigService,
    private httpService: HttpService,
    @InjectRepository(LocationsEntity)
    private locationsRepository: Repository<LocationsEntity>,
  ) {}

  // 날씨 조회하기 nx,ny
  async getSubCurrentWeather(nx: number, ny: number) {
    const serviceUrl = this.weatherConfigService.subDailyForecastApiUrl as string;
    const servicekey = this.weatherConfigService.subDailyForecastApiKey as string;
    const baseDate = this.getTodayDate();
    const baseTime = this.getBaseTime();
    
    const url = `${serviceUrl}serviceKey=${servicekey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`
    try {
      const { data } = await firstValueFrom(this.httpService.get(url));

      if (data?.response?.header?.resultCode !== '00') {
        throw new Error(data?.response?.header?.resultMsg || 'API 요청 실패');
      }

      return this.parseWeather(data.response.body.items.item);
    } catch (error) {
      this.logger.error(`날씨 데이터 요청 실패: ${error.message}`);
      throw error;
    }
  }

  // 날씨 데이터 파싱
  private parseWeather(items: any[]) {
    const result: any = {};

    items.forEach((item) => {
      result[item.category] = item.obsrValue;
    });
    // 각 값을 숫자로 변환
    const temperature = parseFloat(result['T1H']) || 0;
    const humidity = parseFloat(result['REH']) || 0;
    const windSpeed = parseFloat(result['WSD']) || 0;

    // 체감온도 계산
    const perceivedTemp = calculatePerceivedTemperature(
      temperature,
      humidity,
      windSpeed,
    );

    return {
      temperature: result['T1H'] ?? null,
      humidity: result['REH'] ?? null,
      rainfall: result['RN1'] ?? null,
      windSpeed: result['WSD'] ?? null,
      windEastWest: result['UUU'] ?? null,
      windSouthNorth: result['VVV'] ?? null,
      windDirection: result['VEC'] ?? null,
      precipitationType: result['PTY'] ?? null,
      perceivedTemperature: perceivedTemp.toFixed(1), // 소수점 한 자리까지 표시
    };
  }

  // 오늘 날짜 구하기
  private getTodayDate(): string {
    const today = new Date();
    return `${today.getFullYear()}${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
  }

  // 기준 시간 구하기
  private getBaseTime(): string {
    const now = new Date();
    let hour = now.getHours();
    const min = now.getMinutes();
    if (min < 40) hour -= 1;
    return `${String(hour).padStart(2, '0')}00`;
  }

  @Cron('0 0 0 * * *') // 매일 자정에 실행
  async deleteOldForecasts() {
      try {
          const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYYMMDD');
          const result = await this.dailyForecastRepository
              .createQueryBuilder()
              .delete()
              .where('createdAt <= :date', { date: sevenDaysAgo })
              .execute();
          
          if (result.affected && result.affected > 0) {
              this.logger.log(`${result.affected}개의 오래된 일기 예보 데이터가 삭제되었습니다.`);
          } else {
              this.logger.debug('삭제할 오래된 일기 예보 데이터가 없습니다.');
          }
      } catch (error) {
          this.logger.error('오래된 일기 예보 데이터 삭제 중 오류 발생:', error);
      }
  }
  
  @Cron('10 */1 * * *') // 매 1시간마다 10분에 실행
  async subCollectAllRegionsWeather() {
    try {
      const regions = await this.regionRepository
        .createQueryBuilder('region')
        .where('region.nx IS NOT NULL')
        .andWhere('region.ny IS NOT NULL')
        .getMany();

      if (regions.length === 0) {
        this.logger.warn('날씨 데이터를 수집할 region이 없습니다.');
        return [];
      }

      const now = new Date();
      const hourStart = new Date(now);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(now);
      hourEnd.setMinutes(59, 59, 999);

      const limit = pLimit(5);
      const failedRegions: typeof regions = [];

      const processRegion = async (region) => {
        try {
          const existing = await this.dailyForecastRepository.findOne({
            where: {
              regionName: region.name,
              createdAt: Between(hourStart, hourEnd),
            },
          });

          if (existing) {
            this.logger.log(
              `중복 데이터 감지 - ${region.name} ${hourStart.toISOString()} ~ ${hourEnd.toISOString()}`,
            );
            return null;
          }

          const weatherData = await this.getSubCurrentWeather(region.nx, region.ny);
          const perceivedTemp = calculatePerceivedTemperature(
            weatherData.temperature,
            weatherData.humidity,
            weatherData.windSpeed,
          );

          const weatherEntity = this.dailyForecastRepository.create({
            region,
            regionName: region.name,
            temperature: weatherData.temperature || 0,
            humidity: weatherData.humidity || 0,
            rainfall: weatherData.rainfall || 0,
            windSpeed: weatherData.windSpeed || 0,
            windDirection: weatherData.windDirection || 0,
            perceivedTemperature: perceivedTemp ?? weatherData.temperature ?? 0,
          });

          await this.dailyForecastRepository.save(weatherEntity);
          this.logger.log(`날씨 데이터 저장 완료 - 지역: ${region.name}`);
          return weatherEntity;
        } catch (error) {
          this.logger.error(`지역 ${region.name}의 날씨 수집 실패: ${error.message}`);
          failedRegions.push(region);
          return null;
        }
      };

      const weatherPromises = regions.map((region) => limit(() => processRegion(region)));
      let results = await Promise.all(weatherPromises);

      if (failedRegions.length > 0) {
        this.logger.warn(`재시도 대상 지역 ${failedRegions.length}개`);
        const retryPromises = failedRegions.map((region) =>
          limit(() => processRegion(region)),
        );
        const retryResults = await Promise.all(retryPromises);
        results = [...results, ...retryResults];
      }

      const successCount = results.filter((r) => r !== null).length;
      this.logger.log(
        `전체 ${regions.length}개 지역 중 ${successCount}개 지역의 날씨 데이터 수집 완료`,
      );

      return results.filter((r) => r !== null);
    } catch (error) {
      this.logger.error(`날씨 데이터 수집 중 오류 발생: ${error.message}`);
      throw error;
    }
  }


  // 특정 지역(시/군/구/동)의 날씨 데이터 수집
  async collectLocationWeather(sido: string, gugun?: string, dong?: string) {
    try {
      // LocationEntity에서 해당하는 위치 찾기
      const queryBuilder = this.locationsRepository
        .createQueryBuilder('location')
        .where('location.sido = :sido', { sido });

      if (gugun) {
        queryBuilder.andWhere('location.gugun = :gugun', { gugun });
      }

      if (dong) {
        queryBuilder.andWhere('location.dong = :dong', { dong });
      }

      const location = await queryBuilder.getOne();

      if (!location) {
        throw new NotFoundException('해당하는 지역을 찾을 수 없습니다.');
      }

      if (!location.nx || !location.ny) {
        throw new NotFoundException('해당 지역의 기상 좌표가 없습니다.');
      }

      // 날씨 데이터 조회
      const weatherData = await this.getSubCurrentWeather(
        location.nx,
        location.ny,
      );

      // 체감온도 계산
      const perceivedTemp = calculatePerceivedTemperature(
        weatherData.temperature,
        weatherData.humidity,
        weatherData.windSpeed,
      );

      // 지역 이름 생성
      const regionName = [location.sido, location.gugun, location.dong]
        .filter(Boolean)
        .join(' ');

      const weatherEntity = this.dailyForecastRepository.create({
        region: location.region,
        regionName: regionName,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfall: weatherData.rainfall,
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        perceivedTemperature: perceivedTemp,
      });

      await this.dailyForecastRepository.save(weatherEntity);
      this.logger.log(`날씨 데이터 저장 완료 - 지역: ${regionName}`);
      return weatherEntity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`날씨 데이터 수집 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  // 시도/구군으로 현재 날씨 조회
  async getCurrentWeatherByRegionName(sido: string, gugun?: string) {
    try {
      // 1. LocationEntity에서 nx, ny 값을 이용하여 RegionEntity 조회
      const locationQuery = this.locationsRepository
        .createQueryBuilder('location')
        .where('location.sido = :sido', { sido });
    
      if (gugun) {
        locationQuery.andWhere('location.gugun = :gugun', { gugun });
      }
    
      const locationEntity = await locationQuery.getOne();
    
      if (!locationEntity) {
        throw new NotFoundException('해당 지역을 찾을 수 없습니다.');
      }
  
      // 2. LocationEntity에서 nx, ny 값으로 RegionEntity를 찾기
      const regionEntity = await this.regionRepository
        .createQueryBuilder('region')
        .where('region.nx = :nx', { nx: locationEntity.nx })
        .andWhere('region.ny = :ny', { ny: locationEntity.ny })
        .getOne();
    
      if (!regionEntity) {
        throw new NotFoundException('해당 지역의 Region 정보를 찾을 수 없습니다.');
      }
  
      // 3. RegionId로 daily_forecast 조회 (region 객체를 사용)
      const dailyForecast = await this.dailyForecastRepository
        .createQueryBuilder('forecast')
        .where('forecast.region_id = :region_id', { region_id: regionEntity.id })  // regionId를 기준으로 조회
        .orderBy('forecast.createdAt', 'DESC')  // 최신 데이터부터 조회
        .getOne();
    
      if (!dailyForecast) {
        throw new NotFoundException('해당 지역의 최신 날씨 데이터가 없습니다.');
      }
    
      // 4. 날씨 데이터 반환
      return {
        temperature: dailyForecast.temperature,
        humidity: dailyForecast.humidity,
        rainfall: dailyForecast.rainfall,
        windSpeed: dailyForecast.windSpeed,
        windDirection: dailyForecast.windDirection,
        perceivedTemperature: dailyForecast.perceivedTemperature,
      };
    } catch (error) {
      this.logger.error(`날씨 데이터 요청 실패: ${error.message}`);
      throw error;
    }
  }
}
