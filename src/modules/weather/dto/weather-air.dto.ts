import { ApiProperty } from "@nestjs/swagger";

export class AirQualityResponseDto {
    @ApiProperty({ example: '서울특별시' })
    sido: string;
    
    @ApiProperty({ example: '강남구' })
    gugun: string;

    @ApiProperty({ example: '2025-04-15T14:00:00.000Z' })
    dataTime: Date;

    @ApiProperty({ example: '45' })
    pm10: string;

    @ApiProperty({ example: '보통', enum: ['좋음', '보통', '나쁨', '매우 나쁨'] })
    pm10Level: string;

    @ApiProperty({ example: '20' })
    pm25: string;

    @ApiProperty({ example: '보통', enum: ['좋음', '보통', '나쁨', '매우 나쁨'] })
    pm25Level: string;
  
    constructor(data: {
      sido: string;
      gugun: string;
      dataTime: Date;
      pm10Value: string;
      pm25Value: string;
    }) {
      this.sido = data.sido;
      this.gugun = data.gugun;
      this.dataTime = data.dataTime;
      this.pm10 = data.pm10Value;
      this.pm25 = data.pm25Value;
      this.pm10Level = this.getPm10Level(Number(data.pm10Value));
      this.pm25Level = this.getPm25Level(Number(data.pm25Value));
    }
  
    private getPm10Level(pm10: number | null): string {
      if (pm10 === null) return '보통';
      if (pm10 >= 150) return '매우 나쁨';
      if (pm10 >= 80) return '나쁨';
      if (pm10 >= 30) return '보통';
      return '좋음';
    }
  
    private getPm25Level(pm25: number | null): string {
      if (pm25 === null) return '보통';
      if (pm25 >= 75) return '매우 나쁨';
      if (pm25 >= 35) return '나쁨';
      if (pm25 >= 16) return '보통';
      return '좋음';
    }
  }