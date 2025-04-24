import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import * as dayjs from 'dayjs';
import * as iconv from 'iconv-lite';
import { WeatherConfigService } from "src/config/weather/config.service";
import { Repository } from "typeorm";
import { MidTermTempEntity } from "../entities/mid-term-temp.entity";
import { LocationsService } from "src/modules/locations/service/locations.service";
import { Between } from "typeorm";
import { MidForecastService } from "./mid-forecast.service";

@Injectable()
export class MidTempService {
    private readonly logger = new Logger(MidTempService.name);

    constructor(
        @InjectRepository(MidTermTempEntity)
        private readonly midTempRepository: Repository<MidTermTempEntity>,
        private readonly weatherConfigService: WeatherConfigService,
        private readonly locationsService: LocationsService,
        private readonly midForecastService: MidForecastService,
    ) {}

    @Cron('0 0 0 * * *') // 매일 자정에 실행
    async deleteOldForecasts() {
        try {
            const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYYMMDD');
            const result = await this.midTempRepository
                .createQueryBuilder()
                .delete()
                .where('forecastDate <= :date', { date: sevenDaysAgo })
                .execute();
            
            if (result.affected && result.affected > 0) {
                this.logger.log(`${result.affected}개의 오래된 기온 예보 데이터가 삭제되었습니다.`);
            } else {
                this.logger.debug('삭제할 오래된 기온 예보 데이터가 없습니다.');
            }
        } catch (error) {
            this.logger.error('오래된 기온 예보 데이터 삭제 중 오류 발생:', error);
        }
    }

    async deleteOldForecastsManually() {
        return this.deleteOldForecasts();
    }

    @Cron('10 */12 * * *') // sub용 12시에 수집 못할경우
    async subMidForecasts() {
        const result = await this.fetchAndSaveMidTempForecasts()
    }
    
    @Cron('0 */12 * * *') //12시간 간격(데이터 12시간 간격으로나옴)
    async fetchAndSaveMidTempForecasts(regionCode?: string): Promise<void> {
        const servicekey = this.weatherConfigService.midTempApiKey as string;
        const serviceUrl = this.weatherConfigService.midTempApiUrl as string;
        const today = dayjs();

        // 발표시각(tmfc) 계산 - 3일 전 데이터부터
        const baseDate = today.subtract(3, 'day');
        const tmfc1 = baseDate.format('YYYYMMDD06');
        const tmfc2 = baseDate.format('YYYYMMDD18');

        // 예보 시작일: 오늘 (YYYYMMDD)
        const tmef1 = today.format('YYYYMMDD');
        // 예보 종료일: 오늘+8일 (YYYYMMDD)
        const tmef2 = today.add(8, 'day').format('YYYYMMDD');

        const url = `${serviceUrl}${regionCode ? `reg=${regionCode}&` : ''}tmfc1=${tmfc1}&tmfc2=${tmfc2}&tmef1=${tmef1}&tmef2=${tmef2}&disp=1&authKey=${servicekey}`;

        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const data = iconv.decode(Buffer.from(response.data), 'utf-8');
            const startIdx = data.indexOf('#START7777');
            const endIdx = data.indexOf('#7777END');

            if (startIdx === -1 || endIdx === -1) {
                this.logger.error('데이터 형식 오류: #START7777 또는 #7777END가 없습니다.');
                throw new Error('데이터 형식 오류');
            }

            const rawData = data.slice(startIdx + '#START7777'.length, endIdx).trim();
            const lines = rawData
                .split('\n')
                .filter(line => line.trim() && !line.startsWith('#'))
                .map(line => line.trim());

            for (const line of lines) {
                const columns = line.split(',');

                const [
                    regId,
                    tmFc,
                    tmEf,
                    mod,
                    stn,
                    c,
                    minTemp,
                    maxTemp,
                    conf,
                    wf,
                    rnSt,
                ] = columns;

                // tmEf에서 날짜 부분만 추출 (YYYYMMDD)
                const forecastDate = tmEf.slice(0, 8);

                if (minTemp === '-999' || maxTemp === '-999') {
                    this.logger.warn(`Invalid temperature for ${regId} at ${forecastDate}`);
                    continue;
                }

                // 중복 확인
                const existsData = await this.midTempRepository.findOne({
                    where: { regId, forecastDate },
                });
                if (existsData) continue;

                const weatherData = this.midTempRepository.create({
                    regId,
                    forecastDate,
                    minTemp: parseFloat(minTemp),
                    maxTemp: parseFloat(maxTemp),
                    tmFc: tmFc.slice(0, 10)
                });

                await this.midTempRepository.save(weatherData);
            }
            this.logger.log(`Mid temperature forecasts 저장 완료 (${regionCode || '전체 지역'})`);
        } catch (err) {
            this.logger.error('수집하지 못하였습니다.:', err.message);
            throw err;
        }
    }

    async getMidTermTempByRegId(regId: string): Promise<MidTermTempEntity[]> {
        return this.midTempRepository.find({
            where: { regId },
            order: { forecastDate: 'ASC' }
        });
    }

    private getRegId(sido: string, gugun: string): string | undefined {
        // 시도와 구군에서 상세 주소(ex: 분당구)를 제외하고 regId 찾기
        const mainGugun = gugun?.split(/[\s,]+/)[0]; // 첫 번째 구군만 사용 (예: "성남시분당구" -> "성남시")
        this.logger.debug(`Looking up regId for sido: ${sido}, mainGugun: ${mainGugun}`);
        return this.locationsService.findRegIdTemp(sido, mainGugun);
    }

    async getForecastsByRegion(regId: string) {
        const today = dayjs().format('YYYYMMDD');
        const nextWeek = dayjs().add(7, 'day').format('YYYYMMDD');

        return this.midTempRepository.find({
            where: {
                regId,
                forecastDate: Between(today, nextWeek),
            },
            order: {
                forecastDate: 'ASC'
            },
        });
    }

    public async getMidTermTempOnly(sido: string, gugun: string) {
        // 원본 주소 저장
        const originalLocation = {
            sido,
            gugun
        };

        // 구군에서 첫 번째 부분만 추출 (예: "성남시분당구" -> "성남시")
        const mainGugun = this.getMainRegion(gugun);
        
        const regId = this.getRegId(sido, mainGugun);
        
        if (!regId) {
            throw new Error(`해당하는 regId를 찾을 수 없습니다. sido: ${sido}, gugun: ${gugun}`);
        }
    
        let tempData = await this.getForecastsByRegion(regId);
        if (!tempData.length) {
            await this.fetchAndSaveMidTempForecasts(regId);
            tempData = await this.getForecastsByRegion(regId);
        }

        // 새로운 응답 형식
        return {
            location: `${originalLocation.sido} ${originalLocation.gugun}`,
            forecasts: tempData.map(temp => ({
                forecastDate: temp.forecastDate,
                minTemp: temp.minTemp,
                maxTemp: temp.maxTemp
            })).sort((a, b) => a.forecastDate.localeCompare(b.forecastDate)) // 날짜순 정렬
        };
    }

    private getMainRegion(gugun: string): string {
        // 구군명이 6글자일 때만 "시"나 "군"을 기준으로 추출
        if (gugun.length === 6) {
            // "시"나 "군"을 기준으로 첫 번째 단위만 추출
            return gugun.split(/(시|군)/)[0] + (gugun.includes('군') ? '군' : '시');
        }
        
        // 그 외에는 그대로 반환 (경기도, 강원도 등)
        return gugun;
    }
    
    

    public async getMidTermTempWithForecast(sido: string, gugun: string) {
        const regId = this.getRegId(sido, gugun);
        
        if (!regId) {
            throw new Error(`해당하는 regId를 찾을 수 없습니다. sido: ${sido}, gugun: ${gugun}`);
        }
    
        // 기온 데이터 조회
        let tempData = await this.getForecastsByRegion(regId);
        if (!tempData.length) {
            await this.fetchAndSaveMidTempForecasts(regId);
            tempData = await this.getForecastsByRegion(regId);
        }

        // 예보 데이터 조회
        const forecastData = await this.midForecastService.transformMidTermForecast(sido, gugun);

        // 날짜별로 데이터 합치기
        const combinedData = tempData.map(temp => {
            // 예보 데이터에서 같은 날짜의 오전/오후 데이터를 모두 찾기
            const forecasts = forecastData.filter(f => f.forecastDate === temp.forecastDate);
            
            const response: any = {
                location: {
                    sido,
                    gugun
                },
                forecastDate: temp.forecastDate,
                tmFc: temp.tmFc,
                temperature: {
                    min: temp.minTemp,
                    max: temp.maxTemp
                }
            };

            // 예보 데이터가 있으면 추가
            if (forecasts.length > 0) {
                response.forecast = {
                    morning: forecasts.find(f => f.forecastTimePeriod === '오전'),
                    afternoon: forecasts.find(f => f.forecastTimePeriod === '오후')
                };
            }

            return response;
        });

        return combinedData;
    }
}
