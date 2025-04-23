import { ApiOperation } from '@nestjs/swagger';

export const todayWeather = () => {
  return ApiOperation({
    summary: '오늘의 날씨 정보 조회',
    description:`
        응답 예시:
            {
            "location": "경기도 성남시분당구",        // 요청한 지역 정보
            "currentWeather": {                      // 현재 날씨
                "temperature": "17.7",               // 현재 기온 (°C)
                "perceivedTemperature": "17.7",      // 체감 온도 (°C)
                "humidity": "99",                    // 습도 (%)
                "windSpeed": "0.6",                  // 풍속 (m/s)
                "rainfall": "3",                     // 강수량 (mm)

                "airQuality": {                      // 대기질 정보
                "pm10": "1",                         // 미세먼지 (㎍/㎥)
                "pm10Grade": "좋음",                 // 미세먼지 등급
                "pm25": "11",                        // 초미세먼지 (㎍/㎥)
                "pm25Grade": "좋음"                  // 초미세먼지 등급
                }
            },
            "forecast": {                            // 예보 정보
                "skyCondition": "흐림",              // 하늘 상태 (맑음, 보통, 구름많음, 흐림)
                "precipitationType": "비"            // 강수 형태 (없음, 비, 비/눈, 눈, 소나기)
            }
        }
        `
  })
}
export const todayForecast = () => {
    return ApiOperation({
      summary: '오늘의 날씨 정보 오늘의 날씨 예보 조회',
      description: `
        응답 예시:
            {
                "location": "서울특별시 강남구",         // 요청한 지역 정보
                "forecasts": [
                {
                    "time": "17:00",                    // 예보 시간 (24시간제)
                    "temperature": 18,                  // 기온 (°C)
                    "rainfall": 60,                     // 강수 확률 (%)
                    "skyCondition": "흐림",             // 하늘 상태 (맑음, 보통, 구름많음, 흐림)
                    "precipitationType": "비"           // 강수 형태 (없음, 비, 비/눈, 눈, 소나기)
                },
                {
                    "time": "18:00",
                    "temperature": 18,
                    "rainfall": 60,
                    "skyCondition": "흐림",
                    "precipitationType": "비"
                }
                ]
            }
        `
    })
}
export const weeklyForecast = () => {
    return ApiOperation({
      summary: '주간 예보 조회',
      description: `
        응답 예시:
            {
                "location": "서울특별시 강남구",    // 요청한 지역 정보
                "forecasts": [
                {
                    "forecastDate": "20250423",   // 예보 날짜 (YYYYMMDD)
                    "morning": {
                    "skyAndPre": "구름많음",      // 하늘 상태 및 강수 형태
                    "rnst": "20"                 // 강수 확률 (%)
                    },
                    "afternoon": {
                    "skyAndPre": "맑음",
                    "rnst": "10"
                    }
                },
                {
                    "forecastDate": "20250424",
                    "morning": {
                    "skyAndPre": "맑음",
                    "rnst": "10"
                    },
                    "afternoon": {
                    "skyAndPre": "맑음",
                    "rnst": "10"
                    }
                }
                ]
            }
        `
    }) 
}
export const weeklyTemp = () => {
    return ApiOperation({
      summary: '주간 예보 조회',
      description: `
        응답 예시:
            {
                "location": "서울특별시 강남구",  // 요청한 지역 정보
                "forecasts": [
                {
                    "forecastDate": "20250423",  // 예보 날짜 (YYYYMMDD)
                    "minTemp": 12,               // 최저 기온 (°C)
                    "maxTemp": 22                // 최고 기온 (°C)
                },
                {
                    "forecastDate": "20250424",
                    "minTemp": 10,
                    "maxTemp": 19
                },
                {
                    "forecastDate": "20250425",
                    "minTemp": 8,
                    "maxTemp": 17
                }
                ]
            }

        `
    })
}