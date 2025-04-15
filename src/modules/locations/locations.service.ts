import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { LocationsEntity } from './entities/location.entity';
import { Theme } from '../users/entities/user.entity';

@Injectable()
export class LocationsService implements OnModuleInit {
  private readonly logger = new Logger(LocationsService.name);
  constructor(
    @InjectRepository(LocationsEntity)
    private locationsRepository: Repository<LocationsEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.locationsRepository.count();
    if (count === 0) {
      this.logger.log('📁 location 데이터가 없어서 CSV에서 불러오는 중...');
      const filePath = './src/database/csv/AppData.csv';
      await this.importLocationsFromCSV(filePath);
    } else {
      this.logger.log(`📦 location 데이터가 이미 ${count}개 존재합니다.`);
    }
  }

  async importLocationsFromCSV(filePath: string): Promise<void> {
    const results: Partial<LocationsEntity>[] = [];

    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        this.logger.error(`❌ 파일이 존재하지 않습니다: ${filePath}`);
        return;
      }
      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
        .on('data', (row) => {
          const kmaRegionCode = row['기상청행정구역코드']?.trim();
          const alertRegionCode = row['특보구역코드']?.trim();
          const stationCode = row['지점소']?.trim();
          const forecastCode = row['예보구역코드']?.trim();
          const forecastStationCode = row['지점번호']?.trim();
          
          if (!kmaRegionCode || !alertRegionCode || !stationCode || !forecastCode || !forecastStationCode) return;

          const nx = parseInt(row['격자 X'], 10);
          const ny = parseInt(row['격자 Y'], 10);
          const longitude = parseFloat(row['경도(초/100)']);
          const latitude = parseFloat(row['위도(초/100)']);

          results.push(
            this.locationsRepository.create({
              kmaRegionCode,
              alertRegionCode,
              stationCode,
              forecastCode,
              forecastStationCode,
              sido: row['1단계']?.trim(),
              gugun: row['2단계']?.trim() || undefined,
              dong: row['3단계']?.trim() || undefined,
              nx: isNaN(nx) ? undefined : nx,
              ny: isNaN(ny) ? undefined : ny,
              longitude: isNaN(longitude) ? undefined : longitude,
              latitude: isNaN(latitude) ? undefined : latitude,
            }),
          );
        })
        .on('end', async () => {
          this.logger.log(`📦 총 ${results.length}개의 location을 저장합니다.`);
          if (results.length > 0) {
            await this.locationsRepository.save(results);
          }
          this.logger.log('✅ CSV import 완료!');
          resolve();
        })
        .on('error', (error) => reject(error));
    });
  }

  async findAll(): Promise<LocationsEntity[]> {
    return this.locationsRepository.find();
  }

  async getSidoList() {
    const rows = await this.locationsRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.sido', 'sido')
      .getRawMany();
    return rows.map((r) => r.sido);
  }

  async getGugunList(sido: string) {
    const rows = await this.locationsRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.gugun', 'gugun')
      .where('location.sido = :sido', { sido })
      .andWhere('location.gugun IS NOT NULL')
      .getRawMany();
    return rows.map((r) => r.gugun);
  }

  async getDongList(sido: string, gugun: string) {
    const rows = await this.locationsRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.dong', 'dong')
      .where('location.sido = :sido AND location.gugun = :gugun', {
        sido,
        gugun,
      })
      .andWhere('location.dong IS NOT NULL')
      .getRawMany();
    return rows.map((r) => r.dong);
  }

  async getLocationId(sido: string, gugun: string, dong: string) {
    const location = await this.locationsRepository
      .createQueryBuilder('location')
      .select('location.id')
      .where('location.sido = :sido', { sido })
      .andWhere('location.gugun = :gugun', { gugun })
      .andWhere('location.dong = :dong', { dong })
      .getOne();
    if (!location) {
      throw new NotFoundException('해당 위치를 찾을 수 없습니다.');
    }
    return location.id;
  }

  async compareWeatherByLocation(
    userLocationId: string,
    compareSido: string,
    compareGugun: string,
    compareDong: string,
  ) {
    const userLocation = await this.locationsRepository.findOne({
      where: { id: userLocationId },
    });

    if (!userLocation) {
      throw new NotFoundException('사용자 위치를 찾을 수 없습니다.');
    }

    const compareLocation = await this.locationsRepository.findOne({
      where: {
        sido: compareSido,
        gugun: compareGugun,
        dong: compareDong,
      },
    });

    if (!compareLocation) {
      throw new NotFoundException('비교할 위치를 찾을 수 없습니다.');
    }

    // const userWeather = await this.getWeatherData(userLocation.id);
    // const compareWeather = await this.getWeatherData(compareLocation.id);

    return {
      userLocation,
      compareLocation,
    };
  }
}
