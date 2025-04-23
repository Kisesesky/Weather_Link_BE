export interface AirQualityItem {
    sido: string;
    gugun: string;
    pm10Value: string;
    pm25Value: string;
    dataTime: Date;
  }
  
export interface ApiResponse {
  response: {
    body: {
      items: any[];
    };
  };
}

export interface ForecastTimeSlot {
  forecastDateTime: string;
  temperature: number | null;
  skyCondition: string | null;
  rainProbability: number | null;
  precipitationType: string | null;
  humidity: number | null;
  snowfall: string | null;
  windSpeed: number | null;
}
