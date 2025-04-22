import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertSettingService } from './alert-setting.service';
import { AlertLogService } from './alert-log.service';
import { AlertSetting } from '../entities/alert_setting.entity';
import { TodayForecastService } from '../../weather/service/today-forcast.service';
import { WeatherAirService } from '../../weather/service/weather-air.service';

// 날씨 데이터 타입 정의
interface WeatherData {
  temperature?: number; // TodayForecastService
  humidity?: number; // TodayForecastService
  windSpeed?: number; // TodayForecastService
  precipitationType?: string; // TodayForecastService
  skyCondition?: string; // TodayForecastService
  pm10Value?: number; // WeatherAirService
  // pm25Value?: number;     // WeatherAirService
}

// 알림 데이터 타입 정의
interface AlertData {
  message: string;
  type: string;
}

@Injectable()
export class AlertsSchedulerService {
  private readonly logger = new Logger(AlertsSchedulerService.name);

  constructor(
    private readonly alertSettingService: AlertSettingService,
    private readonly alertLogService: AlertLogService,
    private readonly todayForecastService: TodayForecastService,
    private readonly weatherAirService: WeatherAirService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'checkWeatherAlerts' })
  async handleCron() {
    this.logger.log('날씨 알림 체크 시작');
    const activeSettings =
      await this.alertSettingService.findAllActiveSettings();
    this.logger.debug(
      `알림 설정 조회 완료: ${activeSettings.length}개의 활성 알림 설정 조회`,
    );

    for (const setting of activeSettings) {
      try {
        // 1. 위치 정보 확인
        const location = setting.user?.location;
        if (
          !location ||
          !location.sido ||
          location.nx === null ||
          location.ny === null
        ) {
          // 상세 로그 추가: 사용자 ID와 location 객체 내용을 포함하여 출력
          const userId = setting.user?.id; // 사용자 ID 가져오기
          this.logger.warn(
            `알림 설정 ${setting.id} 건너뜀. 사용자 ID: ${userId}. 이유: 위치 정보 누락. 위치 정보: ${JSON.stringify(location)}`,
          );
          continue;
        }

        // 2. 각 서비스에서 데이터 조회
        let currentForecast: any = null;
        let airQuality: any = null;

        try {
          const forecasts =
            await this.todayForecastService.getForecastByRegionName(
              location.sido,
              location.gugun,
            );
          currentForecast = forecasts?.[0];
        } catch (error) {
          this.logger.error(
            `예보 데이터 조회 오류. 설정 ID: ${setting.id}. 시도: ${location.sido}, 군구: ${location.gugun}. 오류 메시지: ${error.message}`,
          );
        }

        try {
          // WeatherAirService returns a DTO, access its properties
          const airQualityDto = await this.weatherAirService.getAirQualityById(
            location.id,
          );
          airQuality = airQualityDto; // Assuming DTO has pm10Value etc.
        } catch (error) {
          this.logger.error(
            `미세먼지 데이터 조회 오류. 설정 ID: ${setting.id}. 위치 ID: ${location.id}. 오류 메시지: ${error.message}`,
          );
        }

        // 3. 데이터 취합 (WeatherData 형태로)
        const weatherData: WeatherData = {
          temperature: currentForecast?.temperature,
          humidity: currentForecast?.humidity,
          windSpeed: currentForecast?.windSpeed,
          precipitationType: currentForecast?.precipitationType,
          skyCondition: currentForecast?.skyCondition,
          pm10Value: airQuality?.pm10Value, // AirQualityResponseDto
        };

        // 4. 알림 조건 확인
        const actualValue = this.getActualValue(setting.type, weatherData);
        const shouldTrigger = this.checkAlertCondition(
          setting,
          weatherData,
          actualValue,
        );

        if (
          shouldTrigger &&
          actualValue !== null &&
          actualValue !== undefined
        ) {
          this.logger.log(`알림 발생: ${setting.id} 설정 (${setting.type})`);

          // 알림 메시지 생성 개선
          const conditionText = { above: '이상', below: '이하', equal: '같음' }[
            setting.condition
          ];
          const thresholdText =
            setting.type === 'AIRQUALITY'
              ? this.getPmGradeFromValue(setting.threshold)
              : `${setting.threshold}${setting.unit ?? ''}`;
          const actualValueText =
            setting.type === 'AIRQUALITY'
              ? `${actualValue}${setting.unit ?? ''} (${this.getPmGradeFromValue(actualValue)})`
              : `${actualValue}${setting.unit ?? ''}`;

          const alertData: AlertData = {
            message: `[${setting.type}] ${conditionText} ${thresholdText} 조건 충족 (현재: ${actualValueText})`,
            type: setting.type,
          };

          await this.alertLogService.createLog(
            setting.user.id,
            setting.id,
            actualValue,
            setting.unit,
            alertData.message,
            alertData.type,
          );
          this.alertLogService.sendAlertToUser(setting.user.id, alertData);
        }
      } catch (error) {
        this.logger.error(
          `Error processing setting ${setting.id}: ${error.stack}`,
        );
      }
    }
    this.logger.log('날씨 알림 체크 완료');
  }

  private checkAlertCondition(
    setting: AlertSetting,
    weatherData: WeatherData,
    actualValue: number | undefined | null,
  ): boolean {
    this.logger.debug(
      `Checking condition for setting ${setting.id}: ${JSON.stringify(weatherData)}`,
    );
    const { type, condition, threshold } = setting;

    if (actualValue === undefined || actualValue === null) {
      this.logger.warn(
        'No actual value available for type ' +
          type +
          ' in setting ' +
          setting.id,
      );
      return false;
    }

    try {
      switch (type) {
        case 'TEMPERATURE':
          return condition === 'above'
            ? actualValue > threshold
            : condition === 'below'
              ? actualValue < threshold
              : actualValue === threshold;
        case 'HUMIDITY':
          return condition === 'above'
            ? actualValue > threshold
            : condition === 'below'
              ? actualValue < threshold
              : actualValue === threshold;
        case 'WIND':
          return condition === 'above'
            ? actualValue > threshold
            : condition === 'below'
              ? actualValue < threshold
              : actualValue === threshold;
        case 'AIRQUALITY':
          return condition === 'above'
            ? actualValue >= threshold
            : condition === 'below'
              ? actualValue < threshold
              : false;
        default:
          this.logger.warn(`Unsupported alert type: ${type}`);
          return false;
      }
    } catch (e) {
      this.logger.error(
        `Error in checkAlertCondition for setting ${setting.id}: ${e.message}`,
      );
      return false;
    }
  }

  private getActualValue(
    type: string,
    data: WeatherData,
  ): number | undefined | null {
    switch (type) {
      case 'TEMPERATURE':
        return data.temperature;
      case 'HUMIDITY':
        return data.humidity;
      case 'WIND':
        return data.windSpeed;
      case 'AIRQUALITY':
        return data.pm10Value;
      default:
        return undefined;
    }
  }

  private getPmGradeFromValue(value: number): string {
    if (value >= 150) return '매우 나쁨';
    if (value >= 80) return '나쁨';
    if (value >= 30) return '보통';
    if (value >= 0) return '좋음';
    return '알 수 없음';
  }
}
