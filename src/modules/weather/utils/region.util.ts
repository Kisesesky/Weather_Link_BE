
import { Repository } from 'typeorm';
import { RegionEntity } from 'src/modules/locations/entities/region.entity';

export class RegionUtils extends Repository<RegionEntity> {
    async findRegionWithNxNyByName(sido: string, gugun?: string): Promise<RegionEntity | null> {
        return this.createQueryBuilder('region')
          .where('region.name = :sido', { sido })
          .orWhere('region.name = :gugun', { gugun })
          .andWhere('region.nx IS NOT NULL')
          .andWhere('region.ny IS NOT NULL')
          .getOne();
    }

    async findRegions(): Promise<RegionEntity[]> {
        return this.createQueryBuilder('region')
          .where('region.nx IS NOT NULL')
          .andWhere('region.ny IS NOT NULL')
          .getMany();
    }
}