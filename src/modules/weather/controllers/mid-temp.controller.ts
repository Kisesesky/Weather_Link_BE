import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MidTempService } from '../service/mid-temp.service';
import { WeatherResponseDto } from '../dto/weather-response.dto';
import { WeatherResponseUtil } from '../utils/response.utils';
import { MidTermTempResponseDto, MidTermTempWithForecastResponseDto } from '../dto/mid-temp-response.dto';

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
        type: WeatherResponseDto
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
    async fetchData(): Promise<WeatherResponseDto<void>> {
        try {
            await this.midTempService.fetchAndSaveMidTempForecasts();
            return WeatherResponseUtil.success(undefined, '중기 기온 예보 데이터 수집 성공');
        } catch (error) {
            return WeatherResponseUtil.error(
                'API_ERROR',
                '중기 기온 예보 데이터 수집 실패'
            );
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
        type: WeatherResponseDto
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
    async fetchRegionData(@Query('regionCode') regionCode: string): Promise<WeatherResponseDto<void>> {
        try {
            if (!regionCode) {
                return WeatherResponseUtil.error(
                    'INVALID_PARAMS',
                    '지역 코드가 필요합니다.'
                );
            }
            await this.midTempService.fetchAndSaveMidTempForecasts(regionCode);
            return WeatherResponseUtil.success(undefined, '특정 지역의 중기 기온 예보 데이터 수집 성공');
        } catch (error) {
            return WeatherResponseUtil.error(
                'API_ERROR',
                '중기 기온 예보 데이터 수집 실패'
            );
        }
    }

    @ApiOperation({
        summary: '중기 기온 조회',
        description: '시도와 구군으로 중기 기온을 조회합니다.'
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
        type: WeatherResponseDto
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
    @Get('search')
    async searchMidTermTempOnly(
        @Query('sido') sido: string,
        @Query('gugun') gugun: string
    ): Promise<WeatherResponseDto<MidTermTempResponseDto[]>> {
        try {
            if (!sido || !gugun) {
                return WeatherResponseUtil.error(
                    'INVALID_PARAMS',
                    '시도와 구군 이름이 모두 필요합니다.'
                );
            }

            const result = await this.midTempService.getMidTermTempOnly(sido, gugun);
            if (!result || result.length === 0) {
                return WeatherResponseUtil.error(
                    'NOT_FOUND',
                    '지역을 찾을 수 없습니다.'
                );
            }

            const response: MidTermTempResponseDto[] = result.map(forecast => ({
                location: {
                    sido,
                    gugun
                },
                forecastDate: forecast.forecastDate,
                tmFc: forecast.tmFc,
                minTemp: forecast.minTemp,
                maxTemp: forecast.maxTemp
            }));

            return WeatherResponseUtil.success(response, '중기 기온 조회 성공');
        } catch (error) {
            return WeatherResponseUtil.error(
                'API_ERROR',
                '중기 기온 데이터 조회 실패'
            );
        }
    }

    @Get('search/forecast')
    @ApiOperation({
        summary: '중기 기온과 예보 조회',
        description: '시도와 구군으로 중기 기온과 예보를 조회합니다.'
    })
    @ApiResponse({
        status: 200,
        description: '중기 기온과 예보 조회 성공',
        type: WeatherResponseDto
    })
    async searchMidTermTempWithForecast(
        @Query('sido') sido: string,
        @Query('gugun') gugun: string
    ): Promise<WeatherResponseDto<MidTermTempWithForecastResponseDto>> {
        try {
            if (!sido || !gugun) {
                return WeatherResponseUtil.error(
                    'INVALID_PARAMS',
                    '시도와 구군 이름이 모두 필요합니다.'
                );
            }

            const result = await this.midTempService.getMidTermTempWithForecast(sido, gugun);
            if (!result || !result.length) {
                return WeatherResponseUtil.error(
                    'NOT_FOUND',
                    '지역을 찾을 수 없습니다.'
                );
            }

            // 첫 번째 예보 데이터만 사용 (가장 최근 데이터)
            const latestForecast = result[0];
            const response: MidTermTempWithForecastResponseDto = {
                location: {
                    sido,
                    gugun
                },
                forecastDate: latestForecast.forecastDate,
                tmFc: latestForecast.tmFc,
                minTemp: latestForecast.minTemp,
                maxTemp: latestForecast.maxTemp,
                forecast: latestForecast.forecast
            };

            return WeatherResponseUtil.success(response, '중기 기온과 예보 조회 성공');
        } catch (error) {
            return WeatherResponseUtil.error(
                'API_ERROR',
                '중기 기온과 예보 데이터 조회 실패'
            );
        }
    }

    @ApiOperation({
        summary: '오래된 중기 기온 예보 데이터 삭제',
        description: '7일이 지난 중기 기온 예보 데이터를 삭제합니다.'
    })
    @ApiResponse({
        status: 200,
        description: '오래된 데이터 삭제 성공',
        type: WeatherResponseDto
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
    async cleanupOldData(): Promise<WeatherResponseDto<void>> {
        try {
            await this.midTempService.deleteOldForecastsManually();
            return WeatherResponseUtil.success(undefined, '오래된 기온 예보 데이터가 삭제되었습니다.');
        } catch (error) {
            return WeatherResponseUtil.error(
                'API_ERROR',
                '오래된 데이터 삭제 실패'
            );
        }
    }
}
