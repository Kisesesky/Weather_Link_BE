import { Controller, Get, Post, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import * as path from 'path';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('위치 정보')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationsService: LocationsService) {}

  //서버 시작시 자동으로 업로드 안될시 수동방법
  @ApiOperation({ summary: 'csv데이터 수동 업로드' })
  @Post('import-local')
  async importFromLocalFile() {
    const filePath = path.join(
      process.cwd(),
      'src',
      'databse',
      'csv',
      'AppData.csv',
    );
    await this.locationsService.importLocationsFromCSV(filePath);
    return { message: 'CSV 파일에서 데이터 가져오기 완료!' };
  }

  @ApiOperation({ summary: '모든지역 데이터' })
  @Get()
  async getAllLocation() {
    return this.locationsService.findAll();
  }

  @ApiOperation({ summary: '모든 시/도 지역 데이터' })
  @Get('sido')
  async getSidoList() {
    return this.locationsService.getSidoList();
  }

  @ApiOperation({ summary: '모든 구/군 지역 데이터' })
  @ApiQuery({
    name: 'sido',
    description: '시/도 입력',
    example: '서울특별시',
  })
  @Get('gugun')
  async getGugunList(@Query('sido') sido: string) {
    return this.locationsService.getGugunList(sido);
  }

  @ApiOperation({ summary: '모든 동 지역 데이터' })
  @ApiQuery({
    name: 'sido',
    description: '시/도 입력',
    example: '서울특별시',
  })
  @ApiQuery({
    name: 'gugun',
    description: '구/군 입력',
    example: '강남구',
  })
  @Get('dong')
  async getDongList(
    @Query('sido') sido: string,
    @Query('gugun') gugun: string,
  ) {
    return this.locationsService.getDongList(sido, gugun);
  }

  @ApiOperation({ summary: '위치 ID 조회' })
  @ApiQuery({
    name: 'sido',
    description: '시/도 입력',
    example: '서울특별시',
  })
  @ApiQuery({
    name: 'gugun',
    description: '구/군 입력',
    example: '강남구',
  })
  @ApiQuery({
    name: 'dong',
    description: '동 입력',
    example: '역삼1동',
  })
  @Get('id')
  async getLocationId(
    @Query('sido') sido: string,
    @Query('gugun') gugun: string,
    @Query('dong') dong: string,
  ) {
    return this.locationsService.getLocationId(sido, gugun, dong);
  }
}
