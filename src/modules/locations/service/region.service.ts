import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LocationsEntity } from '../entities/location.entity';
import { RegionEntity } from '../entities/region.entity';
import { seedRegions } from '../utils/region';

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);

  constructor(
    @InjectRepository(LocationsEntity)
    private locationRepository: Repository<LocationsEntity>,
    @InjectRepository(RegionEntity)
    private regionRepository: Repository<RegionEntity>,
    private dataSource: DataSource
  ) {}
  
  async initRegionMoudle() {
    try{
      const count = await this.regionRepository.count();
      if (count === 0) {
        this.logger.log('📁 region 데이터를 생성하는 중...');
        await seedRegions(this.dataSource);
        await this.mapLocationsToRegions();
      } else {
        this.logger.log(`📦 region 데이터가 이미 ${count}개 존재합니다.`);
        const regions = await this.regionRepository.find();
        const needsMapping = regions.some(region => region.nx === null || region.ny === null);
        if (needsMapping) {
          this.logger.log('region의 nx, ny 값이 없어서 다시 매핑합니다...');
          await this.mapLocationsToRegions();
        }
      }
    } catch (error) {
      this.logger.error(error.message);
      throw error
    }
  }

  private async mapLocationsToRegions() {
    const locations = await this.locationRepository.find();
    const regionNxNyMap = new Map<string, { nx: number; ny: number }>();
  
    // 1. PROVINCE (시도) 매핑
    for (const location of locations) {
      if (location.nx && location.ny && location.sido) {
        if (!regionNxNyMap.has(location.sido)) {
          regionNxNyMap.set(location.sido, { nx: location.nx, ny: location.ny });
        }
      }
    }
  
    // 2. CITY와 DISTRICT 매핑
    for (const location of locations) {
      if (!location.nx || !location.ny || !location.gugun) continue;
  
      // Case 1: 시 구 패턴 (성남시분당구, 수원시장안구)
      const cityDistrictMatch = location.gugun.match(/^(.+?시)(.+?구)$/);
      if (cityDistrictMatch) {
        const [, cityName, districtName] = cityDistrictMatch;
        if (!regionNxNyMap.has(cityName)) {
          regionNxNyMap.set(cityName, { nx: location.nx, ny: location.ny });
        }
        if (!regionNxNyMap.has(districtName)) {
          regionNxNyMap.set(districtName, { nx: location.nx, ny: location.ny });
        }
        continue;
      }
  
      // Case 2: 단독 구 패턴 (강남구, 해운대구)
      const districtMatch = location.gugun.match(/^(.+?구)$/);
      if (districtMatch) {
        const [, districtName] = districtMatch;
        if (!regionNxNyMap.has(districtName)) {
          regionNxNyMap.set(districtName, { nx: location.nx, ny: location.ny });
        }
        continue;
      }
  
      // Case 3: 군 패턴 (고성군, 양평군)
      const gunMatch = location.gugun.match(/^(.+?군)$/);
      if (gunMatch) {
        const [, gunName] = gunMatch;
        if (!regionNxNyMap.has(gunName)) {
          regionNxNyMap.set(gunName, { nx: location.nx, ny: location.ny });
        }
        continue;
      }
  
      // Case 4: 단독 시 패턴 (성남시, 수원시)
      const cityMatch = location.gugun.match(/^(.+?시)$/);
      if (cityMatch) {
        const [, cityName] = cityMatch;
        if (!regionNxNyMap.has(cityName)) {
          regionNxNyMap.set(cityName, { nx: location.nx, ny: location.ny });
        }
      }
    }
  
    const regions = await this.regionRepository.find();
    let updatedCount = 0;
    for (const region of regions) {
      const coordinates = regionNxNyMap.get(region.name);
      if (coordinates) {
        region.nx = coordinates.nx;
        region.ny = coordinates.ny;
        await this.regionRepository.save(region);
        this.logger.log(`Updated ${region.type}: ${region.name} (nx=${coordinates.nx}, ny=${coordinates.ny})`);
        updatedCount++;
      }
    }
    this.logger.log(`Total updated regions: ${updatedCount}`);
  }

  async findRegionsByType(type: 'PROVINCE' | 'CITY' | 'DISTRICT', parentId?: string): Promise<RegionEntity[]> {
    const where: any = { type };
    if (parentId) {
      where.parentId = parentId;
    }
    return this.regionRepository.find({ where });
  }

  async findRegionByNxNy(nx: number, ny: number): Promise<RegionEntity | null> {
    return this.regionRepository.findOne({
      where: { nx, ny }
    });
  }

  async getAllRegionsHierarchy(): Promise<any[]> {
    // 1. 모든 시/도를 가져옵니다
    const provinces = await this.regionRepository.find({
      where: { type: 'PROVINCE' },
      order: { name: 'ASC' }
    });

    // 2. 각 시/도에 대해 시/군/구와 구/동을 가져와서 계층 구조를 만듭니다
    const result = await Promise.all(provinces.map(async (province) => {
      // 시/군/구 가져오기
      const cities = await this.regionRepository.find({
        where: { type: 'CITY', parentId: province.id },
        order: { name: 'ASC' }
      });

      // 각 시/군/구에 대해 구/동 가져오기
      const citiesWithDistricts = await Promise.all(cities.map(async (city) => {
        const districts = await this.regionRepository.find({
          where: { type: 'DISTRICT', parentId: city.id },
          order: { name: 'ASC' }
        });

        return {
          name: city.name,
          type: city.type,
          districts: districts.map(d => ({
            name: d.name,
            type: d.type
          }))
        };
      }));

      return {
        name: province.name,
        type: province.type,
        cities: citiesWithDistricts
      };
    }));

    return result;
  }

  async findCitiesByProvinceName(provinceName: string): Promise<RegionEntity[]> {
    const province = await this.regionRepository.findOne({
      where: { name: provinceName, type: 'PROVINCE' }
    });

    if (!province) {
      return [];
    }

    return this.regionRepository.find({
      where: { parentId: province.id, type: 'CITY' }
    });
  }

  async findDistrictsByCityName(cityName: string): Promise<RegionEntity[]> {
    const city = await this.regionRepository.findOne({
      where: { name: cityName, type: 'CITY' }
    });

    if (!city) {
      return [];
    }

    return this.regionRepository.find({
      where: { parentId: city.id, type: 'DISTRICT' }
    });
  }
}
