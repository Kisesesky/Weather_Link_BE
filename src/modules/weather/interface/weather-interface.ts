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
