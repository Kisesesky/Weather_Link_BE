import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import moment from "moment";
import { LocationsEntity } from "src/modules/locations/entities/location.entity";
import { LessThan, Repository } from "typeorm";
import { WeatherAirEntity } from "../entities/weather-air.entity";
import { AirQualityItem, ApiResponse } from "../interface/weather-interface";
import { SIDO_NAME_MAP } from "../../locations/utils/region-map";
import { WeatherConfigService } from './../../../config/weather/config.service';
import { AirQualityResponseDto } from "../dto/weather-air.dto";

@Injectable()
export class WeatherAirService {
  private readonly logger = new Logger(WeatherAirService.name);
    constructor(
    @InjectRepository(WeatherAirEntity)
    private airQulityRepository: Repository<WeatherAirEntity>,
    @InjectRepository(LocationsEntity)
    private locationRepository: Repository<LocationsEntity>,
    private readonly weatherConfigService: WeatherConfigService
  ) {}

  @Cron('15 */2 * * *') //2시간 15분 간격... 정각에 바로 데이터가 업데이트되지 않을수도잇음
  async handleAirQualityJob() {
    this.logger.log('미세먼지 데이터 수집')
    const result = await this.fetchAllAirQuality()
    //일주일 지난 데이터는 삭제
    const deleteDay = moment().subtract(7, 'days').startOf('day').toDate()
    const deleteResult = await this.airQulityRepository.delete({
        dataTime: LessThan(deleteDay)
    })
  }

  async fetchAllAirQuality() {
    const servicekey = this.weatherConfigService.weatherAirApiKey as string
    const serviceUrl = this.weatherConfigService.weatherAirApiUrl as string
    const results: AirQualityItem[] = [];
    const sidoList = Object.keys(SIDO_NAME_MAP);

    for (const sidoName of sidoList) {
      try {
        const { data } = await axios.get<ApiResponse>(serviceUrl, {
          params: {
            serviceKey: servicekey,
            returnType: 'json',
            numOfRows: 10000,
            pageNo: 1,
            sidoName,
            searchCondition: 'HOUR'
          }
        });

        const items = data?.response?.body?.items ?? [];
        const dataMap = items.map(item => ({
          sido: SIDO_NAME_MAP[item.sidoName] || item.sidoName,
          gugun: item.cityName,
          dataTime: new Date(item.dataTime),
          pm10Value: item.pm10Value || '1',
          pm25Value: item.pm25Value || '1'
        }))

        if (dataMap.length > 0) {
          await this.airQulityRepository
            .createQueryBuilder()
            .insert()
            .into(WeatherAirEntity)
            .values(dataMap)
            .orUpdate(
              ['pm10Value', 'pm25Value'],
              ['sido', 'gugun', 'dataTime'],
              { skipUpdateIfNoValuesChanged: true }
            )
            .execute()
           results.push(...dataMap);
        }
      } catch (error) {
        this.logger.error(`${sidoName} 수집 실패`, error.message);
      }
    }
    this.logger.log(`총 ${results.length}건의 미세먼지 데이터 수집이 되었습니다.`)
    return results;
  }

  async getAirQualityById(id: string) {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException('위치를 찾을 수 없습니다.');
    }

    const { sido, gugun } = location;

    const airQuality = await this.airQulityRepository.findOne({
      where: { sido, gugun },
      order: { dataTime: 'DESC' }
    });

    if(!airQuality) {
        throw new NotFoundException('미세먼지 데이터를 찾을 수 없습니다.')
    }
    return new AirQualityResponseDto(airQuality)
  }
}  