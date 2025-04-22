export class DailyForecastDto {
    id: string;
    regionId: string;
    regionName: string;
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    windDirection: number;
    perceivedTemperature: number;
    createdAt: Date;
  }
  
  export class CreateDailyForecastDto {
    regionId: string;
    regionName: string;
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    windDirection: number;
    perceivedTemperature: number;
  }
  