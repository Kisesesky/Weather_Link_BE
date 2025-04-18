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
import { LocationsEntity } from '../entities/location.entity';
import { RegIdMapping, RegionInfo } from '../interface/region.interface';
import { REGION_MAPPINGS, REGION_MAPS, SIDO_NAME_MAP } from '../utils/region-map';

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

          if (
            !kmaRegionCode ||
            !alertRegionCode ||
            !stationCode ||
            !forecastCode ||
            !forecastStationCode
          )
            return;

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
      throw new NotFoundException('해당 위치를 찾을 수 없습니다.');
    }

    // const userWeather = await this.getWeatherData(userLocation.id);
    // const compareWeather = await this.getWeatherData(compareLocation.id);

    return {
      userLocation,
      compareLocation,
    };
  }

  async findById(id: string): Promise<LocationsEntity> {
    const location = await this.locationsRepository.findOne({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException('해당 위치를 찾을 수 없습니다.');
    }
    return location;
  }

  async getDistinctSido(): Promise<string[]> {
    const result = await this.locationsRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.sido', 'sido')
      .getRawMany();

    return result.map((item) => item.sido);
  }

  async findBySido(sido: string): Promise<LocationsEntity | null> {
    return this.locationsRepository.findOne({
      where: { sido },
    });
  }

  async findByKmaRegionCode(
    kmaRegionCode: string,
  ): Promise<LocationsEntity | null> {
    return this.locationsRepository.findOne({
      where: { kmaRegionCode },
    });
  }

  async findBySidoGugunDong(
    sido: string,
    gugun: string,
    dong: string,
  ): Promise<LocationsEntity | null> {
    this.logger.debug(`위치 정보 조회: ${sido} ${gugun} ${dong}`);

    const location = await this.locationsRepository.findOne({
      where: {
        sido,
        gugun,
        dong,
      },
    });

    if (!location) {
      this.logger.warn(
        `위치 정보를 찾을 수 없습니다: ${sido} ${gugun} ${dong}`,
      );
    } else {
      this.logger.debug(`위치 정보를 찾았습니다: ${location.id}`);
    }

    return location;
  }

  // 시도 목록 조회
  async getSidos(): Promise<string[]> {
    const query = this.locationsRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.sido', 'sido');

    const sidos = await query.getRawMany();

    return sidos.map((s) => s.sido);
  }

  // 특정 시도의 구군 목록 조회
  async getGugunsBySido(sido: string): Promise<string[]> {
    const query = this.locationsRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.gugun', 'gugun')
      .where('location.level1 = :sido', { sido });

    const guguns = await query.getRawMany();
    const result = guguns.map((g) => g.gugun).filter(Boolean);

    return result;
  }

  // 전체 매핑 확인용 엔드포인트
  async checkMappings(): Promise<RegionInfo[]> {
    const sidos = await this.getSidos();

    const result: RegionInfo[] = [];
    for (const sido of sidos) {
      const guguns = await this.getGugunsBySido(sido);
      result.push({ sido, guguns });
    }
    return result;
  }

  // regId 매핑 조회
  async getRegIdMappings(): Promise<RegIdMapping[]> {
    const sidos = await this.getSidos();
    const result: RegIdMapping[] = [];

    for (const sido of sidos) {
      const guguns = await this.getGugunsBySido(sido);
      for (const gugun of guguns) {
        const regId = this.findRegId(sido, gugun);
        if (regId) {
          result.push({ regId, sido, gugun });
        } else {
          this.logger.warn(`지역 아이디를 찾을수 없습니다. ${sido} ${gugun}`);
        }
      }
    }
    return result;
  }
  
  // 시도 이름 정규화 (DB의 공식 이름 -> 짧은 이름) '시', '도' 등의 접미사 제거
  private normalizeSido(sido: string): string {
    for (const [shortName, fullName] of Object.entries(SIDO_NAME_MAP)) {
      if (fullName === sido) {
        return shortName;
      }
    }

    const cleanedSido = sido.replace(
      /(시|도|특별시|광역시|특별자치시|특별자치도)$/,
      '',
    );
    return cleanedSido;
  }

  // 구군 이름 정규화, '시', '군', '구' 접미사 처리
  private normalizeGugun(gugun: string): string {
    return gugun.replace(/(시|군|구)$/, '');
  }

  // regId 찾기
  findRegId(sido: string, gugun: string): string | undefined {
    const normalizedSido = this.normalizeSido(sido);
    const normalizedGugun = this.normalizeGugun(gugun);

    // 각 regId 매핑을 확인
    for (const mapping of REGION_MAPPINGS) {
      for (const region of mapping.regions) {
        if (region.sido === normalizedSido) {
          if (region.guguns) {
            const normalizedGuguns = region.guguns.map((g) =>
              this.normalizeGugun(g),
            );
            if (normalizedGuguns.includes(normalizedGugun)) {
              return mapping.regId;
            }
          } else {
            return mapping.regId;
          }
        }
      }
    }
    this.logger.warn(
      `regId를 찾을 수 없습니다. 시/도: ${normalizedSido}, 구/군: ${normalizedGugun}`,
    );
    return undefined;
  }

  findRegIdTemp(sido: string, gugun: string): string | undefined {
    const normalizedSido = this.normalizeSido(sido);
    const normalizedGugun = this.normalizeGugun(gugun);

    // 각 regId 매핑을 확인
    for (const mapping of REGION_MAPS) {
      for (const region of mapping.regions) {
        if (region.sido === normalizedSido) {
          if (region.guguns) {
            const normalizedGuguns = region.guguns.map((g) =>
              this.normalizeGugun(g),
            );
            if (normalizedGuguns.includes(normalizedGugun)) {
              return mapping.regId;
            }
          } else {
            return mapping.regId;
          }
        }
      }
    }
    this.logger.warn(
      `regId를 찾을 수 없습니다. 시/도: ${normalizedSido}, 구/군: ${normalizedGugun}`,
    );
    return undefined;
  }
}
