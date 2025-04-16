import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsEntity } from '../entities/location.entity';
import { RegIdMapping, RegionInfo } from '../interface/region.interface';
import { SIDO_NAME_MAP, REGION_MAPPINGS } from '../utils/region-map';

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);

  constructor(
    @InjectRepository(LocationsEntity)
    private locationRepository: Repository<LocationsEntity>,
  ) {}

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

  // 시도 목록 조회
  async getSidos(): Promise<string[]> {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.level1', 'sido');

    const sidos = await query.getRawMany();

    return sidos.map((s) => s.sido);
  }

  // 특정 시도의 구군 목록 조회
  async getGugunsBySido(sido: string): Promise<string[]> {
    const query = this.locationRepository
      .createQueryBuilder('location')
      .select('DISTINCT location.level2', 'gugun')
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
}
