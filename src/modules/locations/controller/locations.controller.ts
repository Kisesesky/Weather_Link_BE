import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import * as path from 'path';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LocationsService } from '../service/locations.service';
import { ResponseDto } from 'src/common/dto/response.dto';

@ApiTags('위치 정보')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationsService: LocationsService) {}

    @ApiOperation({ summary: 'LocationId로 시도/구군 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '시도(sido)와 구군(gugun) 정보 반환',
    type: ResponseDto
  })
  @Get(':id')
  async getLocationById(@Param('id') id: string) {
    return this.locationsService.findByIdLocation(id);
}

  //서버 시작시 자동으로 업로드 안될시 수동방법
  @ApiOperation({ summary: 'csv데이터 수동 업로드' })
  @ApiResponse({
    status: 201,
    description: 'CSV 데이터 업로드 성공',
    type: ResponseDto,
  })
  @Post('import-local')
  async importFromLocalFile(): Promise<ResponseDto> {
    const filePath = path.join(
      process.cwd(),
      'src',
      'databse',
      'csv',
      'AppData.csv',
    );
    await this.locationsService.importLocationsFromCSV(filePath);
    return new ResponseDto({
      success: true,
      message: 'CSV 파일에서 데이터 가져오기 완료!',
    });
  }

  @ApiOperation({ summary: '모든지역 데이터' })
  @ApiResponse({
    status: 200,
    description: '모든 지역 데이터 조회 성공',
    type: ResponseDto,
  })
  @Get()
  async getAllLocation(): Promise<ResponseDto> {
    const data = await this.locationsService.findAll();
    return new ResponseDto({
      success: true,
      message: '모든 지역 데이터 조회 성공',
      data,
    });
  }

  @ApiOperation({ summary: '모든 시/도 지역 데이터' })
  @ApiResponse({
    status: 200,
    description: '모든 시/도 목록 조회 성공',
    type: ResponseDto,
  })
  @Get('sido')
  async getSidoList(): Promise<ResponseDto> {
    const data = await this.locationsService.getSidoList();
    return new ResponseDto({
      success: true,
      message: '모든 시/도 목록 조회 성공',
      data,
    });
  }

  @ApiOperation({ summary: '특정 시도의 구/군 지역 데이터' })
  @ApiQuery({
    name: 'sido',
    description: '시/도 입력',
    example: '서울특별시',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '특정 시도의 구/군 목록 조회 성공',
    type: ResponseDto,
  })
  @Get('gugun')
  async getGugunList(@Query('sido') sido: string): Promise<ResponseDto> {
    const data = await this.locationsService.getGugunList(sido);
    return new ResponseDto({
      success: true,
      message: '특정 시도의 구/군 목록 조회 성공',
      data,
    });
  }

  @ApiOperation({ summary: '특정 구/군의 동 지역 데이터' })
  @ApiQuery({
    name: 'sido',
    description: '시/도 입력',
    example: '서울특별시',
    required: true,
  })
  @ApiQuery({
    name: 'gugun',
    description: '구/군 입력',
    example: '강남구',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '특정 구/군의 동 목록 조회 성공',
    type: ResponseDto,
  })
  @Get('dong')
  async getDongList(
    @Query('sido') sido: string,
    @Query('gugun') gugun: string,
  ): Promise<ResponseDto> {
    const data = await this.locationsService.getDongList(sido, gugun);
    return new ResponseDto({
      success: true,
      message: '특정 구/군의 동 목록 조회 성공',
      data,
    });
  }

  // @ApiOperation({ summary: '위치 ID 조회' })
  // @ApiQuery({
  //   name: 'sido',
  //   description: '시/도 입력',
  //   example: '서울특별시',
  // })
  // @ApiQuery({
  //   name: 'gugun',
  //   description: '구/군 입력',
  //   example: '강남구',
  // })
  // @ApiQuery({
  //   name: 'dong',
  //   description: '동 입력',
  //   example: '역삼1동',
  // })
  // @Get('id')
  // async getLocationId(
  //   @Query('sido') sido: string,
  //   @Query('gugun') gugun: string,
  //   @Query('dong') dong: string,
  // ) {
  //   return this.locationsService.getLocationId(sido, gugun, dong);
  // }
}
