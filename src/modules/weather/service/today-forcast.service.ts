import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { WeatherConfigService } from "src/config/weather/config.service";
import { Raw, Repository } from "typeorm";
import { PrecipitationType, SkyCondition } from "../utils/weather-conditions";
import { TodayForecastEntity } from '../entities/today-forecast.entity';
import { ForecastTimeSlot } from "../interface/weather-interface";
import { firstValueFrom } from "rxjs";
import { RegionEntity } from "src/modules/locations/entities/region.entity";

@Injectable()
export class TodayForecastService {
    private readonly logger = new Logger(TodayForecastService.name);
    constructor(
        @InjectRepository(TodayForecastEntity)
        private readonly todayForecastRepository: Repository<TodayForecastEntity>,
        @InjectRepository(RegionEntity)
        private readonly regionRepository: Repository<RegionEntity>,
        private readonly weatherConfigService: WeatherConfigService,
        private httpService: HttpService,
    ) {}

    async getForecastByRegionName(sido: string, gugun?: string) {
        const region = await this.regionRepository
            .createQueryBuilder('region')
            .where('region.name = :sido', { sido })
            .orWhere('region.name = :gugun', { gugun })
            .andWhere('region.nx IS NOT NULL')
            .andWhere('region.ny IS NOT NULL')
            .getOne();

        if (!region) {
            throw new NotFoundException('해당 지역의 날씨 정보를 찾을 수 없습니다.');
        }

        return this.getForecastByRegion(region.nx, region.ny);
    }

    private async getForecastByRegion(nx: number, ny: number): Promise<ForecastTimeSlot[]> {
        const authKey = this.weatherConfigService.dailyForecastApiKey;
        const serviceUrl = this.weatherConfigService.dailyForecastApiUrl;
        const baseDate = moment().format('YYYYMMDD');
        const baseTime = '0500';

        try {
            const url = `${serviceUrl}?pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&authKey=${authKey}`;
            const { data } = await firstValueFrom(this.httpService.get(url));

            if (data?.response?.header?.resultCode !== '00') {
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

    // @Cron('0 5 * * *')  // 매일 05시에 실행
    async collectAllRegionsWeather() {
        try {
            const regions = await this.regionRepository
                .createQueryBuilder('region')
                .where('region.nx IS NOT NULL')
                .andWhere('region.ny IS NOT NULL')
                .getMany();

            this.logger.log(`Starting to collect weather data for ${regions.length} regions`);

            // 각 지역별 예보 데이터 수집을 병렬로 처리
            const forecastResults = await Promise.allSettled(
                regions.map(async region => {
                    try {
                        const forecasts = await this.getForecastByRegion(region.nx, region.ny);
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

            // 성공한 데이터만 일괄 저장
            const forecastEntities: Partial<TodayForecastEntity>[] = [];
            for (const { region, forecasts } of successfulForecasts) {
                forecasts.forEach(forecast => {
                    forecastEntities.push({
                        region: region,
                        forecastDateTime: new Date(forecast.forecastDateTime),
                        temperature: forecast.temperature,
                        skyCondition: forecast.skyCondition,
                        rainProbability: forecast.rainProbability,
                        precipitationType: forecast.precipitationType,
                        humidity: forecast.humidity,
                        snowfall: forecast.snowfall,
                        collectedAt: new Date()
                    });
                });
            }

            if (forecastEntities.length > 0) {
                const chunkSize = 100;
                for (let i = 0; i < forecastEntities.length; i += chunkSize) {
                    const chunk = forecastEntities.slice(i, i + chunkSize);
                    await this.todayForecastRepository.save(chunk);
                }
            }

            const result = {
                totalRegions: regions.length,
                successfulRegions: successfulForecasts.length,
                failedRegions: failedRegions.length,
                totalForecasts: forecastEntities.length
            };

            this.logger.log(`Completed collecting weather data: ${JSON.stringify(result)}`);
            return result;

        } catch (error) {
            this.logger.error(`Error in collectAllRegionsWeather: ${error.message}`);
            throw error;
        }
    }

    async getForecastDataByRegionName(sido: string, gugun?: string) {
        const region = await this.regionRepository
            .createQueryBuilder('region')
            .where('region.name = :sido', { sido })
            .orWhere('region.name = :gugun', { gugun })
            .andWhere('region.nx IS NOT NULL')
            .andWhere('region.ny IS NOT NULL')
            .getOne();

        if (!region) {
            throw new NotFoundException('해당 지역을 찾을 수 없습니다.');
        }

        const today = moment().format('YYYY-MM-DD');
        const forecast = await this.todayForecastRepository.findOne({
            where: {
                region: { id: region.id },
                forecastDateTime: Raw(alias => `DATE(${alias}) = CURRENT_DATE`)
            },
            order: { 
                createdAt: 'DESC'
            }
        });

        if (!forecast) {
            throw new NotFoundException('해당 지역의 오늘 날씨 예보 데이터가 없습니다.');
        }

        return forecast;
    }

    async getForecastDataByRegionNameAfterCurrentTime(sido: string, gugun: string) {
        try {
            // 구군에서 시/군 단위만 추출 (예: "수원시팔달구" -> "수원시")
            const mainGugun = gugun.match(/(.*?[시군구])/)?.[1] || gugun;
            
            // region 찾기
            const region = await this.regionRepository
                .createQueryBuilder('region')
                .where('region.name = :sido', { sido })
                .orWhere('region.name = :mainGugun', { mainGugun })
                .andWhere('region.nx IS NOT NULL')
                .andWhere('region.ny IS NOT NULL')
                .getOne();

            if (!region) {
                throw new NotFoundException('해당 지역을 찾을 수 없습니다.');
            }

            // 현재 시각 이후의 예보 데이터 조회
            const now = new Date();
            const forecasts = await this.todayForecastRepository.find({
                where: {
                    region: { id: region.id },
                    forecastDateTime: Raw(alias => `${alias} >= :now`, { now })
                },
                order: {
                    forecastDateTime: 'ASC'
                },
                relations: ['region']
            });

            if (!forecasts || forecasts.length === 0) {
                return null;
            }

            return {
                location: `${sido} ${gugun}`,
                forecasts: forecasts.map(forecast => ({
                    time: forecast.forecastDateTime.toLocaleTimeString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }),
                    temperature: forecast.temperature,
                    rainfall: forecast.rainProbability,
                    sky: SkyCondition[this.getSkyConditionCode(forecast.skyCondition)],
                    rainType: PrecipitationType[this.getPrecipitationTypeCode(forecast.precipitationType)]
                }))
            };
        } catch (error) {
            this.logger.error(`Error in getForecastDataByRegionNameAfterCurrentTime: ${error.message}`);
            throw error;
        }
    }

    private getSkyConditionCode(skyCondition: string | null): number {
        if (!skyCondition) return 1;
        switch (skyCondition.toLowerCase()) {
            case '맑음': return 1;
            case '구름많음': return 3;
            case '흐림': return 4;
            default: return 1;
        }
    }

    private getPrecipitationTypeCode(precipitationType: string | null): number {
        if (!precipitationType) return 0;
        switch (precipitationType.toLowerCase()) {
            case '없음': return 0;
            case '비': return 1;
            case '비/눈': return 2;
            case '눈': return 3;
            case '소나기': return 4;
            default: return 0;
        }
    }
}
