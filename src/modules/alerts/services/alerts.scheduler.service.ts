import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertSettingService } from './alert-setting.service';
import { AlertLogService } from './alert-log.service';
import { AlertSetting } from '../entities/alert_setting.entity';
import { TodayForecastService } from '../../weather/service/today-forcast.service';
import { WeatherAirService } from '../../weather/service/weather-air.service';

// 날씨 데이터 타입 정의
interface WeatherData {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitationType?: string;
  skyCondition?: string;
  pm10Value?: number;
}

// 알림 데이터 타입 정의
interface AlertData {
  message: string;
  type: string;
}

@Injectable()
export class AlertsSchedulerService {
  private readonly logger = new Logger(AlertsSchedulerService.name);
  // 캐시 및 마지막 조회 시간 저장을 위한 속성 추가
  private activeSettingsCache: AlertSetting[] | null = null;
  private lastFetchedAt: Date | null = null;

  constructor(
    private readonly alertSettingService: AlertSettingService,
    private readonly alertLogService: AlertLogService,
    private readonly todayForecastService: TodayForecastService,
    private readonly weatherAirService: WeatherAirService,
  ) {}

  // 10분마다 알림 체크 (배포 시 변경 가능)
  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'checkWeatherAlerts' })
  async handleCron() {
    this.logger.log('날씨 알림 체크 시작');
    const now = new Date();

    // 캐시 로직 추가: 캐시가 없거나, 10분 이상 지났으면 DB에서 다시 조회
    if (
      !this.activeSettingsCache ||
      !this.lastFetchedAt ||
      now.getTime() - this.lastFetchedAt.getTime() > 10 * 60 * 1000
    ) {
      this.logger.log('DB에서 활성 알림 설정 새로 조회합니다.');
      this.activeSettingsCache =
        await this.alertSettingService.findAllActiveSettings();
      this.lastFetchedAt = now;
      this.logger.debug(
        `알림 설정 DB 조회 완료: ${this.activeSettingsCache?.length ?? 0}개의 활성 알림 설정 조회`,
      );
    } else {
      this.logger.log(
        `메모리 캐시 사용: 활성 알림 설정 조회 스킵 (${this.activeSettingsCache?.length ?? 0}개).`,
      );
    }

    // 캐시된 데이터를 사용
    const activeSettings = this.activeSettingsCache;

    // 기존 로직: 활성화된 설정이 없으면 스킵
    if (!activeSettings || activeSettings.length === 0) {
      this.logger.log('활성화된 알림 설정 없음. 체크 작업 스킵.');
      return;
    }

    // 기존 로직 실행 (activeSettings 순회)
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
          const userId = setting.user?.id;
          this.logger.warn(
            `알림 설정 ${setting.id} 건너뜀. 사용자 ID: ${userId}. 이유: 위치 정보 누락. 위치 정보: ${JSON.stringify(
              location,
            )}`,
          );
          continue;
        }

        let actualValue: number | null | undefined = null;

        // 2. 설정 타입에 따라 필요한 데이터 조회
        try {
          if (['TEMPERATURE', 'HUMIDITY', 'WIND'].includes(setting.type)) {
            const forecasts =
              await this.todayForecastService.getForecastByRegionName(
                location.sido,
                location.gugun,
              );
            const currentForecast = forecasts?.[0];

            if (currentForecast) {
              switch (setting.type) {
                case 'TEMPERATURE':
                  actualValue = currentForecast.temperature;
                  break;
                case 'HUMIDITY':
                  actualValue = currentForecast.humidity;
                  break;
                case 'WIND':
                  actualValue = currentForecast.windSpeed;
                  break;
              }
            } else {
              this.logger.warn(`예보 데이터 없음. 설정 ID: ${setting.id}.`);
            }
          } else if (setting.type === 'AIRQUALITY') {
            const airQualityDto =
              await this.weatherAirService.getAirQualityById(location.id);
            if (
              airQualityDto &&
              airQualityDto.pm10 !== undefined &&
              airQualityDto.pm10 !== null
            ) {
              actualValue = parseFloat(airQualityDto.pm10);
            } else {
              this.logger.warn(
                `미세먼지 데이터 없음 또는 pm10 값 누락. 설정 ID: ${setting.id}.`,
              );
            }
          } else {
            this.logger.warn(
              `알 수 없는 알림 타입: ${setting.type}. 설정 ID: ${setting.id}`,
            );
            continue;
          }
        } catch (error) {
          this.logger.error(
            `${setting.type} 데이터 조회 오류. 설정 ID: ${setting.id}. 오류: ${error.stack}`,
          );
          continue;
        }

        // 3. 알림 조건 확인
        const shouldTrigger = this.shouldTriggerAlert(setting, actualValue);

        // 4. 알림 발생 로직 (shouldTrigger가 true이고 actualValue가 number일 때만 실행)
        if (shouldTrigger && typeof actualValue === 'number') {
          this.logger.log(`알림 발생: ${setting.id} 설정 (${setting.type})`);

          // 알림 메시지 생성
          const thresholdText =
            setting.type === 'AIRQUALITY'
              ? this.getPmGradeFromValue(setting.threshold)
              : `${setting.threshold}${setting.unit ?? ''}`;
          const actualValueText =
            setting.type === 'AIRQUALITY'
              ? `${actualValue}${setting.unit ?? ''} (${this.getPmGradeFromValue(
                  actualValue,
                )})`
              : `${actualValue}${setting.unit ?? ''}`;

          const alertData: AlertData = {
            message: `[${setting.type}] ${thresholdText} 기준 도달/초과 (현재: ${actualValueText})`,
            type: setting.type,
          };

          // 알림 로그 생성 및 발송
          await this.alertLogService.createLog(
            setting.user.id,
            setting.id,
            actualValue,
            setting.unit,
            alertData.message,
            alertData.type,
          );
          this.alertLogService.sendAlertToUser(setting.user.id, alertData);
        } else if (shouldTrigger && typeof actualValue !== 'number') {
          this.logger.error(
            `알림 트리거 로직 오류. 설정 ID: ${setting.id}, 값: ${actualValue}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `알림 처리 중 예외 발생. 설정 ID: ${setting.id}. 오류: ${error.stack}`,
        );
      }
    }
    this.logger.log('날씨 알림 체크 완료');
  }

  private shouldTriggerAlert(
    setting: AlertSetting,
    actualValue: number | undefined | null,
  ): boolean {
    this.logger.debug(
      `임계치 확인 중: 설정 ID: ${setting.id}, 타입: ${setting.type}, 임계치: ${setting.threshold}, 실제 값: ${actualValue}`,
    );
    const { threshold } = setting;

    if (actualValue === undefined || actualValue === null) {
      return false;
    }
    try {
      return actualValue >= threshold;
    } catch (e) {
      this.logger.error(
        `알림 조건 비교 오류. 설정 ID: ${setting.id}. 오류: ${e.message}`,
      );
      return false;
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
