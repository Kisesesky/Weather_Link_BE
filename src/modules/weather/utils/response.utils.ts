import { WeatherResponseDto } from '../dto/weather-response.dto';
import { WEATHER_ERROR_CODES, WeatherErrorCode } from '../constants/error-codes';

export class WeatherResponseUtil {
  /**
   * @param data 응답 데이터
   * @param message 성공 메시지
   */
  static success<T>(data: T, message: string = '요청이 성공적으로 처리되었습니다.') {
    return new WeatherResponseDto<T>({
      success: true,
      message,
      data,
      error: undefined
    });
  }

  /**
   * @param code 에러 코드
   * @param message 에러 메시지
   */
  static error<T>(code: WeatherErrorCode, message: string) {
    return new WeatherResponseDto<T>({
      success: false,
      message: `[${WEATHER_ERROR_CODES[code]}] ${message}`,
      data: undefined,
      error: {
        code: WEATHER_ERROR_CODES[code],
        message
      }
    });
  }

  /**
   * 외부 API 에러를 처리합니다.
   * @param error 에러 객체
   */
  static handleApiError<T>(error: any) {
    return this.error<T>(
      'API_ERROR',
      error?.message || '외부 API 호출 중 오류가 발생했습니다.'
    );
  }
}
