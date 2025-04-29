import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { WeatherConfigService } from "src/config/weather/config.service";
import { Repository } from "typeorm";
import { PrecipitationType, SkyCondition } from "../utils/weather-conditions";
import { TodayForecastEntity } from '../entities/today-forecast.entity';
import { ForecastTimeSlot } from "../interface/weather-interface";
import { firstValueFrom } from "rxjs";
import { RegionEntity } from "src/modules/locations/entities/region.entity";

@Injectable()
export class SubTodayCollectService {
    private readonly logger = new Logger(SubTodayCollectService.name);
    constructor(
        @InjectRepository(TodayForecastEntity)
        private readonly todayForecastRepository: Repository<TodayForecastEntity>,
        @InjectRepository(RegionEntity)
        private readonly regionRepository: Repository<RegionEntity>,
        private readonly weatherConfigService: WeatherConfigService,
        private httpService: HttpService,
    ) {}

    private async getSubForecastByRegion(nx: number, ny: number): Promise<ForecastTimeSlot[]> {
        const serviceUrl = this.weatherConfigService.subTodayForecastApiUrl as string;
        const authKey = this.weatherConfigService.subTodayForecastApiKey as string;
        const baseDate = moment().subtract(1, 'days').format('YYYYMMDD');  // 하루 전 날짜로 설정
        const baseTime = '0500';

        try {
            const url = `${serviceUrl}serviceKey=${authKey}&pageNo=1&numOfRows=1000&dataType=json&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
            const { data } = await firstValueFrom(this.httpService.get(url));

            if (data?.response?.header?.resultCode !== '00') {
                this.logger.error(`API Error: ${data?.response?.header?.resultMsg}`);
                throw new Error(data?.response?.header?.resultMsg || 'API 요청 실패');
            }

            const forecastItems = data.response?.body?.items?.item ?? [];
            const categories = ['TMP', 'SKY', 'POP', 'PTY', 'REH', 'SNO'];
            const filtered = forecastItems.filter((item) =>
                categories.includes(item.category)
            );

            // 오늘과 내일 날짜만 필터링
            const today = moment().format('YYYYMMDD');
            const tomorrow = moment().add(1, 'day').format('YYYYMMDD');
            const filteredByDate = filtered.filter(item => 
                item.fcstDate === today || item.fcstDate === tomorrow
            );

            this.logger.log(`Filtered forecast items: ${filteredByDate.length} (from total ${forecastItems.length})`);

            // 시간별로 데이터 그룹화
            const groupedByTime = filteredByDate.reduce((acc, item) => {
                const key = `${item.fcstDate}_${item.fcstTime}`;
                if (!acc[key]) {
                    acc[key] = {
                        forecastDateTime: moment(`${item.fcstDate} ${item.fcstTime}`, 'YYYYMMDD HHmm').format('YYYY-MM-DD HH:mm:ss'),
                        temperature: null,
                        skyCondition: null,
                        rainProbability: null,
                        precipitationType: null,
                        humidity: null,
                        snowfall: null,
                    };
                }

                switch (item.category) {
                    case 'TMP':
                        acc[key].temperature = parseFloat(item.fcstValue);
                        break;
                    case 'SKY':
                        acc[key].skyCondition = SkyCondition[parseInt(item.fcstValue)];
                        break;
                    case 'POP':
                        acc[key].rainProbability = parseFloat(item.fcstValue);
                        break;
                    case 'PTY':
                        acc[key].precipitationType = PrecipitationType[parseInt(item.fcstValue)];
                        break;
                    case 'REH':
                        acc[key].humidity = parseFloat(item.fcstValue);
                        break;
                    case 'SNO':
                        acc[key].snowfall = item.fcstValue;
                        break;
                }

                return acc;
            }, {});

            return Object.values(groupedByTime);
        } catch (error) {
            this.logger.error('날씨 정보 조회 중 오류 발생:', error);
            throw new Error('날씨 정보를 가져오는데 실패했습니다.');
        }
    }
    
    async subCollectAllRegionsWeather() {
        try {
            const regions = await this.regionRepository
                .createQueryBuilder('region')
                .where('region.nx IS NOT NULL')
                .andWhere('region.ny IS NOT NULL')
                .getMany();
    
            const forecastResults = await Promise.allSettled(
                regions.map(async region => {
                    try {
                        const forecasts = await this.getSubForecastByRegion(region.nx, region.ny);
    
                        // 중복 데이터를 걸러내는 로직 추가
                        const forecastEntities: Partial<TodayForecastEntity>[] = [];
                        for (const forecast of forecasts) {
                            // forecastDateTime을 예시로 중복을 확인
                            const forecastDateTime = new Date(forecast.forecastDateTime);
                            const existing = await this.todayForecastRepository.findOne({
                                where: {
                                    region: { id: region.id },
                                    forecastDateTime: forecastDateTime,
                                },
                            });
    
                            if (existing) {
                                existing.temperature = forecast.temperature;
                                existing.skyCondition = forecast.skyCondition;
                                existing.rainProbability = forecast.rainProbability;
                                existing.precipitationType = forecast.precipitationType;
                                existing.humidity = forecast.humidity;
                                existing.snowfall = forecast.snowfall;
                                existing.collectedAt = new Date(); // 수집 시간 최신화

                                this.logger.log(`중복 데이터 갱신 - ${region.name} ${forecastDateTime.toISOString()}`);
                                await this.todayForecastRepository.save(existing);  // 업데이트
                                continue;  // 중복된 데이터는 건너뜀
                            }
    
                            // 중복이 아니면 새로운 데이터를 저장할 리스트에 추가
                            forecastEntities.push({
                                region: region,
                                forecastDateTime: forecastDateTime,
                                temperature: forecast.temperature,
                                skyCondition: forecast.skyCondition,
                                rainProbability: forecast.rainProbability,
                                precipitationType: forecast.precipitationType,
                                humidity: forecast.humidity,
                                snowfall: forecast.snowfall,
                                collectedAt: new Date()
                            });
                        }
    
                        // 수집한 데이터를 일괄 저장
                        if (forecastEntities.length > 0) {
                            const chunkSize = 100;
                            for (let i = 0; i < forecastEntities.length; i += chunkSize) {
                                const chunk = forecastEntities.slice(i, i + chunkSize);
                                await this.todayForecastRepository.save(chunk);
                            }
                        }
    
                        return {
                            region,
                            forecasts,
                            success: true
                        };
    
                    } catch (error) {
                        this.logger.error(
                            `Error collecting weather for region ${region.name}: ${error.message}`
                        );
                        return {
                            region,
                            success: false,
                            error: error.message
                        };
                    }
                })
            );
    
            // 성공한 결과만 필터링
            const successfulForecasts = forecastResults
                .filter((result): result is PromiseFulfilledResult<{
                    region: any;
                    forecasts: any[];
                    success: true;
                }> => result.status === 'fulfilled' && result.value.success)
                .map(result => result.value);
    
            // 실패한 지역 로깅
            const failedRegions = forecastResults
                .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
                .map(result => result.status === 'rejected' ? 
                    { region: null, error: result.reason } : 
                    { region: result.value.region, error: result.value.error }
                );
            
            if (failedRegions.length > 0) {
                this.logger.warn(`Failed to collect data for ${failedRegions.length} regions`);
                failedRegions.forEach(failure => {
                    const regionName = failure.region ? failure.region.name : 'unknown';
                    this.logger.warn(`Failed region ${regionName}: ${failure.error}`);
                });
            }
    
            const result = {
                totalRegions: regions.length,
                successfulRegions: successfulForecasts.length,
                failedRegions: failedRegions.length
            };
    
            this.logger.log(`Completed collecting weather data: ${JSON.stringify(result)}`);
            await this.removeDuplicateWeatherData
            return result;
    
        } catch (error) {
            this.logger.error(`Error in collectAllRegionsWeather: ${error.message}`);
            throw error;
        }
    }

    private async removeDuplicateWeatherData(forecastdatetime: Date, regionid: string): Promise<void> {
        // 1. 중복 데이터 조회 (forecastdatetime과 regionid 기준)
        const duplicateData = await this.todayForecastRepository
          .createQueryBuilder('weatherData')
          .where('weatherData.forecastdatetime = :forecastdatetime', { forecastdatetime })
          .andWhere('weatherData.regionid = :regionid', { regionid })
          .getMany();
    
        if (duplicateData.length > 1) {
          // 2. 중복 데이터에서 createdAt이 가장 최근이 아닌 항목 삭제
          const sortedData = duplicateData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // 내림차순 정렬
          const dataToDelete = sortedData.slice(1); // 가장 최근 데이터를 제외한 나머지 데이터
    
          // 3. 삭제 실행
          for (const data of dataToDelete) {
            await this.todayForecastRepository.remove(data);
          }
        }
      }
    
}
