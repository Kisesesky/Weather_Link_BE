import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
    @ApiProperty({
        description: '시/도',
        example: '서울특별시'
    })
    sido: string;

    @ApiProperty({
        description: '구/군',
        example: '강남구'
    })
    gugun: string;
}

export class MidTermTempResponseDto {
    @ApiProperty({
        description: '지역 정보'
    })
    location: LocationDto;

    @ApiProperty({
        description: '예보 일자',
        example: '20250418'
    })
    forecastDate: string;

    @ApiProperty({
        description: '발표 시각',
        example: '202504170600'
    })
    tmFc: string;

    @ApiProperty({
        description: '최저 기온',
        example: 8
    })
    minTemp: number;

    @ApiProperty({
        description: '최고 기온',
        example: 20
    })
    maxTemp: number;
}

export class MidTermTempWithForecastResponseDto extends MidTermTempResponseDto {
    @ApiProperty({
        description: '예보 정보',
        example: {
            morning: {
                skyAndPre: '맑음',
                rnst: '20'
            },
            afternoon: {
                skyAndPre: '구름많음',
                rnst: '30'
            }
        }
    })
    forecast: {
        morning: {
            skyAndPre: string;
            rnst: string;
        };
        afternoon: {
            skyAndPre: string;
            rnst: string;
        };
    };
}
