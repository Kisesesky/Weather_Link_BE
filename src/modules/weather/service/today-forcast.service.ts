import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { WeatherConfigService } from "src/config/weather/config.service";
import { Repository } from "typeorm";
import { PrecipitationType, SkyCondition } from "../utils/weather-conditions";
import { RegionEntity } from '../../locations/entities/region.entity';
import { TodayForecastEntity } from '../entities/today-forecast.entity';
import { Cron } from "@nestjs/schedule";
import { ForecastTimeSlot } from "../interface/weather-interface";
import { firstValueFrom } from "rxjs";

@Injectable()
export class TodayForecastService {
    private readonly logger = new Logger(TodayForecastService.name);
    constructor(
        @InjectRepository(RegionEntity)
        private readonly regionRepository: Repository<RegionEntity>,
        @InjectRepository(TodayForecastEntity)
        private readonly todayForecastRepository: Repository<TodayForecastEntity>,
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
            
            // 필요한 카테고리만 필터링
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

    @Cron('0 5 * * *')  // 매일 05시에 실행
    async collectAllRegionsWeather() {
        try {
            // 기존 오늘의 예보 데이터 삭제
            await this.todayForecastRepository.clear();

            const regions = await this.regionRepository
                .createQueryBuilder('region')
                .where('region.nx IS NOT NULL')
                .andWhere('region.ny IS NOT NULL')
                .getMany();

            this.logger.log(`Starting to collect weather data for ${regions.length} regions`);

            for (const region of regions) {
                try {
                    const forecasts = await this.getForecastByRegion(region.nx, region.ny);
                    
                    // 수집된 데이터를 시간별로 저장
                    for (const forecast of forecasts) {
                        await this.todayForecastRepository.save({
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
                    }

                    this.logger.log(`Successfully collected weather data for region: ${region.name}`);
                } catch (error) {
                    this.logger.error(
                        `Error collecting weather for region ${region.name}: ${error.message}`
                    );
                }
            }

            this.logger.log('Completed collecting weather data for all regions');
        } catch (error) {
            this.logger.error(`Error in collectAllRegionsWeather: ${error.message}`);
            throw error;
        }
    }
}