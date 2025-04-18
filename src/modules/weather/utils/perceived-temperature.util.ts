//체감온도계산
export function calculatePerceivedTemperature(temperature: number, humidity: number, windSpeed: number): number {
    //windSpeedKmh: 풍속 (km/h) 변환
    const windSpeedKmh = windSpeed * 3.6;
  
    // 겨울 체감온도 (Wind Chill) - 적용 조건: 기온 ≤ 10도, 풍속 > 4.8km/h
    //체감온도=13.12+0.6215∗T−11.37∗V^0.16+0.3965∗T∗V^0.16 [T: 기온 (°C) V: 풍속 (km/h)]
    if (temperature <= 10 && windSpeedKmh > 4.8) {
      const windChill =
        13.12 +
        0.6215 * temperature -
        11.37 * Math.pow(windSpeedKmh, 0.16) +
        0.3965 * temperature * Math.pow(windSpeedKmh, 0.16);
      return Math.round(windChill * 10) / 10;
    }
  
    // 여름 체감온도 (Heat Index) - 적용 조건: 기온 ≥ 27도, 습도 ≥ 40%
    //HI=−42.379+2.04901523∗T+10.14333127∗R−0.22475541∗T∗R−0.00683783∗T^2−0.05481717∗R^2+0.00122874∗T^2∗R+0.00085282∗T∗R^2−0.00000199∗T^2∗R^2
    //[T: 기온 (°F) R: 상대 습도 (%)]
    if (temperature >= 27 && humidity >= 40) {
      const tempF = temperature * 1.8 + 32;
      const HI =
        -42.379 +
        2.04901523 * tempF +
        10.14333127 * humidity -
        0.22475541 * tempF * humidity -
        0.00683783 * tempF ** 2 -
        0.05481717 * humidity ** 2 +
        0.00122874 * tempF ** 2 * humidity +
        0.00085282 * tempF * humidity ** 2 -
        0.00000199 * tempF ** 2 * humidity ** 2;
      const heatIndexCelsius = (HI - 32) / 1.8;
      return Math.round(heatIndexCelsius * 10) / 10;
    }

    return temperature;
  }
  