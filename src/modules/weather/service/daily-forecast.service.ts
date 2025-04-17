import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WeatherConfigService } from "src/config/weather/config.service";
import { Repository } from "typeorm";
import { DailyForecastEntity } from "../entities/daily-forecast.entity";
import { HttpService } from '@nestjs/axios';
import { calculatePerceivedTemperature } from "../utils/perceived-temperature.util";
import { firstValueFrom } from "rxjs";
import { LocationsEntity } from "src/modules/locations/entities/location.entity";
import { RegionEntity } from "src/modules/locations/entities/region.entity";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class DailyForecastService {
  private readonly logger = new Logger(DailyForecastService.name)

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
  async getCurrentWeather(nx: number, ny: number) {
    const servicekey = this.weatherConfigService.dayForecastApiKey as string;
    const serviceUrl = this.weatherConfigService.dayForecastApiUrl as string;
    const baseDate = this.getTodayDate();
    const baseTime = this.getBaseTime();
    const url = `${serviceUrl}?pageNo=1&numOfRows=100&dataType=json&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&authKey=${servicekey}`;
    
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
    const perceivedTemp = calculatePerceivedTemperature(temperature, humidity, windSpeed);

    return {
      temperature: result['T1H'] ?? null,
      humidity: result['REH'] ?? null,
      rainfall: result['RN1'] ?? null,
      windSpeed: result['WSD'] ?? null,
      windEastWest: result['UUU'] ?? null,
      windSouthNorth: result['VVV'] ?? null,
      windDirection: result['VEC'] ?? null,
      precipitationType: result['PTY'] ?? null,
      perceivedTemperature: perceivedTemp.toFixed(1) // 소수점 한 자리까지 표시
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
    let min = now.getMinutes();
    if (min < 40) hour -= 1;
    return `${String(hour).padStart(2, '0')}00`;
  }

  // 모든 지역의 날씨 데이터 수집 및 저장
  @Cron('0 */1 * * *') //1시간 간격 자동수집
  async collectAllRegionsWeather() {
    try {
      // 모든 region 데이터 조회 (nx, ny가 있는 것만)
      const regions = await this.regionRepository
        .createQueryBuilder('region')
        .where('region.nx IS NOT NULL')
        .andWhere('region.ny IS NOT NULL')
        .getMany();
    
      if (regions.length === 0) {
        this.logger.warn('날씨 데이터를 수집할 region이 없습니다.');
        return [];
      }
    
      // 각 region에 대해 날씨 데이터 수집 및 저장
      const weatherPromises = regions.map(async (region) => {
        try {
          // 날씨 데이터 조회
          const weatherData = await this.getCurrentWeather(region.nx, region.ny);
              
          // 체감온도 계산
          const perceivedTemp = calculatePerceivedTemperature(
            weatherData.temperature,
            weatherData.humidity,
            weatherData.windSpeed
          );
    
          const weatherEntity = this.dailyForecastRepository.create({
            region: region,
            regionName: region.name,
            temperature: weatherData.temperature || 0,
            humidity: weatherData.humidity || 0,
            rainfall: weatherData.rainfall || 0,
            windSpeed: weatherData.windSpeed || 0,
            windDirection: weatherData.windDirection || 0,
            perceivedTemperature: perceivedTemp || weatherData.temperature || 0,
          });
    
          await this.dailyForecastRepository.save(weatherEntity);
          this.logger.log(`날씨 데이터 저장 완료 - 지역: ${region.name}`);
              
          return weatherEntity;
        } catch (error) {
            this.logger.error(`지역 ${region.name}의 날씨 데이터 수집 실패: ${error.message}`);
            return null;
        }
      });
    
      // 모든 Promise 완료 대기
      const results = await Promise.all(weatherPromises);
          
      // 성공적으로 저장된 데이터 수 계산
      const successCount = results.filter(result => result !== null).length;
      this.logger.log(`전체 ${regions.length}개 지역 중 ${successCount}개 지역의 날씨 데이터 수집 완료`);
          
      return results.filter(result => result !== null);
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
      const weatherData = await this.getCurrentWeather(location.nx, location.ny);
    
      // 체감온도 계산
      const perceivedTemp = calculatePerceivedTemperature(
        weatherData.temperature,
        weatherData.humidity,
        weatherData.windSpeed
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
        perceivedTemperature: perceivedTemp
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
}