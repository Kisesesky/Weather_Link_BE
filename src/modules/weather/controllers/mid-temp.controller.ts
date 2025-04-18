import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MidTempService } from '../service/mid-temp.service';
import { MidTermTempEntity } from '../entities/mid-term-temp.entity';

@ApiTags('날씨 - 중기 기온 예보')
@Controller('weather/mid-temp')
export class MidTempController {
    constructor(
        private readonly midTempService: MidTempService
    ) {}

    @ApiOperation({
        summary: '중기 기온 예보 데이터 수집',
        description: '전국의 중기 기온 예보 데이터를 수집합니다.'
    })
    @ApiResponse({
        status: 200,
        description: '중기 기온 예보 데이터 수집 성공',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    })
    @ApiResponse({ 
        status: 500, 
        description: '서버 에러',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '중기 기온 데이터 수집 실패' },
                error: { type: 'string' }
            }
        }
    })
    @Get('data')
    async fetchData() {
        try {
            return await this.midTempService.fetchAndSaveMidTempForecasts();
        } catch (error) {
            throw new HttpException({
                message: '중기 기온 예보 데이터 수집 실패',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiOperation({
        summary: '특정 지역의 중기 기온 예보 데이터 수집',
        description: '특정 지역의 중기 기온 예보 데이터를 수집합니다.'
    })
    @ApiQuery({
        name: 'regionCode',
        description: '지역 코드',
        required: true,
        type: String
    })
    @ApiResponse({
        status: 200,
        description: '특정 지역의 중기 기온 예보 데이터 수집 성공',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    })
    @ApiResponse({ 
        status: 400, 
        description: '잘못된 요청',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '지역 코드가 필요합니다.' }
            }
        }
    })
    @ApiResponse({ 
        status: 500, 
        description: '서버 에러',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '중기 기온 데이터 수집 실패' },
                error: { type: 'string' }
            }
        }
    })
    @Get('data/region')
    async fetchRegionData(@Query('regionCode') regionCode: string) {
        try {
            if (!regionCode) {
                throw new HttpException('지역 코드가 필요합니다.', HttpStatus.BAD_REQUEST);
            }
            return await this.midTempService.fetchAndSaveMidTempForecasts(regionCode);
        } catch (error) {
            throw new HttpException({
                message: '중기 기온 예보 데이터 수집 실패',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiOperation({
        summary: '시도/구군으로 중기 기온 조회',
        description: '시도와 구군 이름으로 해당 지역의 중기 기온을 조회합니다.'
    })
    @ApiQuery({
        name: 'sido',
        description: '시도 이름 (예: 서울특별시)',
        required: true,
        type: String
    })
    @ApiQuery({
        name: 'gugun',
        description: '구군 이름 (예: 강남구)',
        required: true,
        type: String
    })
    @ApiResponse({
        status: 200,
        description: '중기 기온 조회 성공',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    location: {
                        type: 'object',
                        properties: {
                            sido: { type: 'string', example: '서울특별시' },
                            gugun: { type: 'string', example: '강남구' }
                        }
                    },
                    forecastDate: { type: 'string', example: '20250418' },
                    tmFc: { type: 'string', example: '202504170600' },
                    minTemp: { type: 'number', example: 8 },
                    maxTemp: { type: 'number', example: 20 }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: '지역을 찾을 수 없습니다.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '지역을 찾을 수 없습니다.' },
                error: { type: 'string', example: '해당하는 regId를 찾을 수 없습니다. sido: 서울특별시, gugun: 강남구' }
            }
        }
    })
    @ApiResponse({ 
        status: 400, 
        description: '잘못된 요청',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '시도와 구군 이름이 모두 필요합니다.' }
            }
        }
    })
    @ApiResponse({ 
        status: 500, 
        description: '서버 에러',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '중기 기온 데이터 조회 실패' },
                error: { type: 'string' }
            }
        }
    })
    @Get('temp')
    async searchMidTermTempOnly(
        @Query('sido') sido: string,
        @Query('gugun') gugun: string
    ) {
        try {
            if (!sido || !gugun) {
                throw new HttpException('시도와 구군 이름이 모두 필요합니다.', HttpStatus.BAD_REQUEST);
            }
            return await this.midTempService.getMidTermTempOnly(sido, gugun);
        } catch (error) {
            if (error.message.includes('regId를 찾을 수 없습니다')) {
                throw new HttpException({
                    message: '지역을 찾을 수 없습니다.',
                    error: error.message
                }, HttpStatus.NOT_FOUND);
            }
            throw new HttpException({
                message: '중기 기온 데이터 조회 실패',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiOperation({
        summary: '시도/구군으로 중기 기온과 예보 조회',
        description: '시도와 구군 이름으로 해당 지역의 중기 기온과 날씨 예보를 함께 조회합니다.'
    })
    @ApiQuery({
        name: 'sido',
        description: '시도 이름 (예: 서울특별시)',
        required: true,
        type: String
    })
    @ApiQuery({
        name: 'gugun',
        description: '구군 이름 (예: 강남구)',
        required: true,
        type: String
    })
    @ApiResponse({
        status: 200,
        description: '중기 기온과 예보 조회 성공',
        schema: {
            type: 'object',
            properties: {
                location: {
                    type: 'object',
                    properties: {
                        sido: { type: 'string', example: '서울특별시' },
                        gugun: { type: 'string', example: '강남구' }
                    }
                },
                forecastDate: { type: 'string', example: '20250418' },
                tmFc: { type: 'string', example: '202504170600' },
                minTemp: { type: 'number', example: 8 },
                maxTemp: { type: 'number', example: 20 },
                forecast: {
                    type: 'object',
                    properties: {
                        morning: {
                            type: 'object',
                            properties: {
                                skyAndPre: { type: 'string', example: '맑음' },
                                rnst: { type: 'string', example: '20' }
                            }
                        },
                        afternoon: {
                            type: 'object',
                            properties: {
                                skyAndPre: { type: 'string', example: '구름많음' },
                                rnst: { type: 'string', example: '30' }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: '지역을 찾을 수 없습니다.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '지역을 찾을 수 없습니다.' },
                error: { type: 'string', example: '해당하는 regId를 찾을 수 없습니다. sido: 서울특별시, gugun: 강남구' }
            }
        }
    })
    @ApiResponse({ 
        status: 400, 
        description: '잘못된 요청',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '시도와 구군 이름이 모두 필요합니다.' }
            }
        }
    })
    @ApiResponse({ 
        status: 500, 
        description: '서버 에러',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '중기 기온과 예보 데이터 조회 실패' },
                error: { type: 'string' }
            }
        }
    })
    @Get('search')
    async searchMidTermTempWithForecast(
        @Query('sido') sido: string,
        @Query('gugun') gugun: string
    ) {
        try {
            if (!sido || !gugun) {
                throw new HttpException('시도와 구군 이름이 모두 필요합니다.', HttpStatus.BAD_REQUEST);
            }
            return await this.midTempService.getMidTermTempWithForecast(sido, gugun);
        } catch (error) {
            if (error.message.includes('regId를 찾을 수 없습니다')) {
                throw new HttpException({
                    message: '지역을 찾을 수 없습니다.',
                    error: error.message
                }, HttpStatus.NOT_FOUND);
            }
            throw new HttpException({
                message: '중기 기온과 예보 데이터 조회 실패',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiOperation({
        summary: '오래된 중기 기온 예보 데이터 삭제',
        description: '7일이 지난 중기 기온 예보 데이터를 삭제합니다.'
    })
    @ApiResponse({
        status: 200,
        description: '오래된 데이터 삭제 성공',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' }
            }
        }
    })
    @ApiResponse({ 
        status: 500, 
        description: '서버 에러',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: '오래된 데이터 삭제 실패' },
                error: { type: 'string' }
            }
        }
    })
    @Get('cleanup')
    async cleanupOldData() {
        try {
            await this.midTempService.deleteOldForecastsManually();
            return { message: '오래된 기온 예보 데이터가 삭제되었습니다.' };
        } catch (error) {
            throw new HttpException({
                message: '오래된 데이터 삭제 실패',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
