import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { Between, Repository } from "typeorm";
import * as dayjs from 'dayjs';
import * as iconv from 'iconv-lite';
import { preMap, weeklySky } from "../utils/weather-conditions";
import { Cron } from "@nestjs/schedule";
import { MidTermForecastEntity } from "../entities/mid-term-forecast.entity";
import { TransformedMidTermForecastDto } from "../dto/mid-forecast.dto";
import { WeatherConfigService } from "src/config/weather/config.service";
import { LocationsService } from "src/modules/locations/service/locations.service";

@Injectable()
export class MidForecastService {
  private readonly logger = new Logger(MidForecastService.name);

  constructor(
    @InjectRepository(MidTermForecastEntity)
    private midTermForecastRepository: Repository<MidTermForecastEntity>,
    private locationsService: LocationsService,
    private readonly weatherConfigService: WeatherConfigService
  ) {}
  
  @Cron('0 0 0 * * *') // 매일 자정에 실행
  async deleteOldForecasts() {
    try {
      const today = dayjs().format('YYYYMMDD');
      const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYYMMDD');
      const result = await this.midTermForecastRepository
        .createQueryBuilder()
        .delete()
        .where('forecastDate <= :date', { date: sevenDaysAgo })
        .execute();
      
      if (result.affected && result.affected > 0) {
        this.logger.log(`${result.affected}개의 오래된 예보 데이터가 삭제되었습니다.`);
      } else {
        this.logger.debug('삭제할 오래된 예보 데이터가 없습니다.');
      }
    } catch (error) {
      this.logger.error('오래된 예보 데이터 삭제 중 오류 발생:', error);
    }
  }
  
  async deleteOldForecastsManually() {
    return this.deleteOldForecasts();
  }

  @Cron('0 */12 * * *') //12시간 간격(데이터 12시간 간격으로나옴)
  async fetchAndSaveMidForecasts(regionCode?: string): Promise<void> {
    const servicekey = this.weatherConfigService.midForecastApiKey as string;
    const serviceUrl = this.weatherConfigService.midForecastApiUrl as string;
    const today = dayjs();

    // 첫 번째 API 호출 (기준일 ~ 4일)
    const baseDate1 = today.subtract(3, 'day');
    const tmfc1 = baseDate1.format('YYYYMMDD06');
    const tmfc2 = baseDate1.format('YYYYMMDD18');
    const tmef1 = today.format('YYYYMMDD');
    const tmef2 = today.add(8, 'day').format('YYYYMMDD');

    const url1 = `${serviceUrl}${regionCode ? `reg=${regionCode}&` : ''}tmfc1=${tmfc1}&tmfc2=${tmfc2}&tmef1=${tmef1}&tmef2=${tmef2}&disp=1&authKey=${servicekey}`;
    await this.fetchAndSaveForecasts(url1);

    // 두 번째 API 호출 (오늘 기준으로 3일치데이터)
    const baseDate2 = today;
    const tmfc3 = baseDate2.format('YYYYMMDD06');
    const tmfc4 = baseDate2.format('YYYYMMDD18');
    const tmef3 = today.add(5, 'day').format('YYYYMMDD');
    const tmef4 = today.add(10, 'day').format('YYYYMMDD');

    const url2 = `${serviceUrl}${regionCode ? `reg=${regionCode}&` : ''}tmfc1=${tmfc3}&tmfc2=${tmfc4}&tmef1=${tmef3}&tmef2=${tmef4}&disp=1&authKey=${servicekey}`;
    await this.fetchAndSaveForecasts(url2);

    this.logger.log(`Mid forecasts 저장 완료 (${regionCode || '전체 지역'})`);
  }

  private async fetchAndSaveForecasts(url: string) {
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
        const [regId, tmFc, tmEf, mod, stn, c, sky, pre, conf, wf, rnSt] = columns;

        const forecastDate = tmEf.slice(0, 8);
        const forecastTime = tmEf.slice(8);
        const rnStValue = parseInt(rnSt, 10);

        if (isNaN(rnStValue)) {
          this.logger.warn(`Invalid rnSt for ${regId} at ${forecastDate}${forecastTime}`);
          continue;
        }

        // 중복 확인
        const exists = await this.midTermForecastRepository.findOne({
          where: {
            regId,
            forecastDate,
            forecastTime
          }
        });
        if (exists) continue;

        const forecast = this.midTermForecastRepository.create({
          regId,
          forecastDate,
          forecastTime,
          sky,
          pre,
          rnSt: rnStValue
        });

        await this.midTermForecastRepository.save(forecast);
      }
    } catch (err) {
      this.logger.error('데이터 수집 실패:', err.message);
      throw err;
    }
  }

  async getForecastsByRegion(regId: string) {
    const today = dayjs().format('YYYYMMDD');
    const nextWeek = dayjs().add(7, 'day').format('YYYYMMDD');

    return this.midTermForecastRepository.find({
      where: {
        regId,
        forecastDate: Between(today, nextWeek),
      },
      order: {
        forecastDate: 'ASC',
        forecastTime: 'ASC',
      },
    });
  }

  async findByRegId(regId: string): Promise<MidTermForecastEntity[]> {
    return this.midTermForecastRepository.find({
      where: { regId },
      order: {
        forecastDate: 'ASC',
        forecastTime: 'ASC'
      }
    });
  }

  private getRegId(sido: string, gugun: string): string | undefined {
    this.logger.debug(`Looking up regId for sido: ${sido}, gugun: ${gugun}`);
    return this.locationsService.findRegId(sido, gugun);
  }

  private transformForecastTime(forecastTime: string): string {
    return forecastTime === '1200' ? '오후' : '오전';
  }

  private transformSkyAndPre(sky: string, pre: string): string {
    const skyDesc = weeklySky[sky] || '';
    const preDesc = preMap[pre] || '';
    return preDesc ? `${skyDesc}, ${preDesc}` : skyDesc;
  }

  public async transformMidTermForecast(sido: string, gugun: string): Promise<TransformedMidTermForecastDto[]> {
    const regId = this.getRegId(sido, gugun);
    
    if (!regId) {
      throw new Error(`해당하는 regId를 찾을 수 없습니다. sido: ${sido}, gugun: ${gugun}`);
    }
  
    let forecastData = await this.findByRegId(regId);
    if (!forecastData.length) {
      await this.fetchAndSaveMidForecasts(regId);
      forecastData = await this.findByRegId(regId);
    }
  
    return forecastData.map(forecast => ({
      regId: forecast.regId,
      forecastDate: forecast.forecastDate,
      forecastTimePeriod: this.transformForecastTime(forecast.forecastTime),
      skyAndPre: this.transformSkyAndPre(forecast.sky, forecast.pre),
      rnst: forecast.rnSt.toString()
    }));
  }
}