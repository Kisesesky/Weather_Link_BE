import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionEntity } from 'src/modules/locations/entities/region.entity';

@Injectable()
export class RegionUtils {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionRepository: Repository<RegionEntity>,
  ) {}

  async findRegionWithNxNyByName(
    sido: string,
    gugun?: string,
  ): Promise<RegionEntity | null> {
    return this.regionRepository
      .createQueryBuilder('region')
      .where('region.name = :sido', { sido })
      .orWhere('region.name = :gugun', { gugun })
      .andWhere('region.nx IS NOT NULL')
      .andWhere('region.ny IS NOT NULL')
      .getOne();
  }

  async findRegions(): Promise<RegionEntity[]> {
    return this.regionRepository
      .createQueryBuilder('region')
      .where('region.nx IS NOT NULL')
      .andWhere('region.ny IS NOT NULL')
      .getMany();
  }
}
