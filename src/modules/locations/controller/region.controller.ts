import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RegionEntity } from "../entities/region.entity";
import { RegionService } from "../service/region.service";

@ApiTags('위치 - 지역 정보')
@Controller('regions')
export class RegionController {
    constructor(
        private regionService: RegionService,
    ) {}
    
    @ApiOperation({
        summary: '시/도지역명',
        description: 
            `서울특별시, 부산광역시, 대구광역시, 인천광역시, 광주광역시, 대전광역시, 
            울산광역시, 세종특별자치시, 경기도, 강원특별자치도, 충청북도, 충청남도, 
            전북특별자치도, 전라남도, 경상북도, 경상남도, 제주특별자치도`
    })
    @ApiResponse({
        status: 200,
        description: '시/도 목록 조회 성공',
        type: RegionEntity,
        isArray: true
    })
    @Get('regions/provinces')
    async getProvinces(): Promise<RegionEntity[]> {
      return this.regionService.findRegionsByType('PROVINCE');
    }
  
    @ApiOperation({
        summary: '시/구/군지역명',
        description: '시/도 이름으로 해당 지역의 시/구/군 목록을 조회합니다.'
    })
    @ApiQuery({
        name: 'province',
        description: '시/도 이름 (예: 경기도, 서울특별시)',
        required: true,
        type: String
    })
    @ApiResponse({
        status: 200,
        description: '시/구/군 목록 조회 성공',
        type: RegionEntity,
        isArray: true
    })
    @Get('regions/cities')
    async getCities(@Query('province') province: string): Promise<RegionEntity[]> {
      if (!province) {
        return [];
      }
      return this.regionService.findCitiesByProvinceName(province);
    }
  
    @ApiOperation({
        summary: '구/군지역명',
        description: '시/구/군 이름으로 해당 지역의 구/군 목록을 조회합니다.'
    })
    @ApiQuery({
        name: 'city',
        description: '시/구/군 이름 (예: 성남시)',
        required: true,
        type: String
    })
    @ApiResponse({
        status: 200,
        description: '구/군 목록 조회 성공',
        type: RegionEntity,
        isArray: true
    })
    @Get('regions/districts')
    async getDistricts(@Query('city') city: string): Promise<RegionEntity[]> {
      if (!city) {
        return [];
      }
      return this.regionService.findDistrictsByCityName(city);
    }

    @ApiOperation({
        summary: '전 지역명',
        description:'하위 시/도 + 시/구/군 + 구/군 전부 출력'
    })
    @ApiResponse({
        status: 200,
        description: '전체 지역 계층 구조 조회 성공',
        type: RegionEntity,
        isArray: true
    })
    @Get('regions/all')
    async getAllRegions() {
      return this.regionService.getAllRegionsHierarchy();
    }   
}