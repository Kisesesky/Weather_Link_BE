export const WEATHER_ERROR_CODES = {
  NOT_FOUND: 'WEATHER_001',      // 데이터를 찾을 수 없음
  API_ERROR: 'WEATHER_002',      // 외부 API 호출 실패
  INVALID_PARAMS: 'WEATHER_003', // 잘못된 파라미터
  SERVER_ERROR: 'WEATHER_004',   // 서버 내부 오류
  DATA_PARSE_ERROR: 'WEATHER_005', // 데이터 파싱 오류
} as const;

// 타입 추출
export type WeatherErrorCode = keyof typeof WEATHER_ERROR_CODES;
