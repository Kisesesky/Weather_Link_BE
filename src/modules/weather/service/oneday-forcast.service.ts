import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { Repository } from "typeorm";
import { PrecipitationType, SkyCondition } from "../utils/weather-conditions";
import { RegionEntity } from '../../locations/entities/region.entity';
import { WeatherConfigService } from "src/config/weather/config.service";

@Injectable()
export class OnedayForecastService {
  private readonly logger = new Logger(OnedayForecastService.name);
    constructor(
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

    private async getForecastByRegion(nx: number, ny: number) {
        const authKey = this.weatherConfigService.dailyForecastApiKey as string;
        const serviceUrl = this.weatherConfigService.dailyForecastApiUrl as string;
        const baseDate = moment().format('YYYYMMDD');
        const baseTime = '0500';

        try {
            const { data } = await this.httpService.axiosRef.get(serviceUrl, {
                params: {
                    pageNo: 1,
                    numOfRows: 1500,
                    dataType: 'JSON',
                    base_date: baseDate,
                    base_time: baseTime,
                    nx,
                    ny,
                    authKey,
                },
            });

            const forecastItems = data.response?.body?.items?.item ?? [];
            
            // 필요한 카테고리만 필터링
            const categories = ['TMP', 'SKY', 'POP', 'PTY', 'REH', 'SNO'];
            const filtered = forecastItems.filter((item) =>
                categories.includes(item.category)
            );

            // 시간별로 데이터 그룹화
            const groupedByTime = filtered.reduce((acc, item) => {
                const key = `${item.fcstDate}_${item.fcstTime}`;
                if (!acc[key]) {
                    acc[key] = {
                        forecastDateTime: moment(`${item.fcstDate} ${item.fcstTime}`, 'YYYYMMDD HHmm').format('YYYY-MM-DD HH:mm'),
                        temperature: null,        // TMP
                        skyCondition: null,      // SKY
                        rainProbability: null,   // POP
                        precipitationType: null, // PTY
                        humidity: null,          // REH
                        snowfall: null,          // SNO
                    };
                }

                switch (item.category) {
                    case 'TMP':
                        acc[key].temperature = parseInt(item.fcstValue);
                        break;
                    case 'SKY':
                        acc[key].skyCondition = SkyCondition[parseInt(item.fcstValue)];
                        break;
                    case 'POP':
                        acc[key].rainProbability = parseInt(item.fcstValue);
                        break;
                    case 'PTY':
                        acc[key].precipitationType = PrecipitationType[parseInt(item.fcstValue)];
                        break;
                    case 'REH':
                        acc[key].humidity = parseInt(item.fcstValue);
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

}