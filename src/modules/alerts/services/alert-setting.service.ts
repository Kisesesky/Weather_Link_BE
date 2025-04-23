import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertSetting } from '../entities/alert_setting.entity';
import { CreateAlertSettingDto } from '../dto/create-alert-setting.dto';
import { UpdateAlertSettingDto } from '../dto/update-alert-setting.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { WeatherAirService } from '../../weather/service/weather-air.service';

@Injectable()
export class AlertSettingService {
  constructor(
    @InjectRepository(AlertSetting)
    private readonly alertSettingRepository: Repository<AlertSetting>,
    private readonly weatherAirService: WeatherAirService,
  ) {}

  // 미세먼지 등급 정의 (유효성 검사 및 변환에 사용)
  private readonly validPmGrades = ['좋음', '보통', '나쁨', '매우 나쁨'];

  // 미세먼지 등급 수치 정의
  private readonly pm10GradeThreshold: Record<string, number> = {
    좋음: 0, // 0 ~ 29
    보통: 30, // 30 ~ 79
    나쁨: 80, // 80 ~ 149
    매우나쁨: 150, // 150 이상
  };

  private convertPm10GradeToValue(grade: string): number {
    return this.pm10GradeThreshold[grade] || 0;
  }

  async create(
    user: User,
    createAlertSettingdto: CreateAlertSettingDto,
  ): Promise<AlertSetting> {
    // 1. userId와 type으로 기존 설정 확인
    const existingSetting = await this.alertSettingRepository.findOne({
      where: { user: { id: user.id }, type: createAlertSettingdto.type },
    });

    // 2. 기존 설정이 있으면 ConflictException 발생
    if (existingSetting) {
      throw new ConflictException(
        `이미 '${createAlertSettingdto.type}' 타입의 알림 설정이 존재합니다.`,
      );
    }

    // 3. 기존 설정이 없으면 새로 생성
    const newSetting = new AlertSetting();
    newSetting.user = user;
    newSetting.type = createAlertSettingdto.type;
    newSetting.active = createAlertSettingdto.active;

    // type에 따라 unit 자동 설정
    switch (newSetting.type) {
      case 'TEMPERATURE':
        newSetting.unit = '°C';
        break;
      case 'HUMIDITY':
        newSetting.unit = '%';
        break;
      case 'WIND':
        newSetting.unit = 'm/s';
        break;
      case 'AIRQUALITY':
        newSetting.unit = 'μg/m³'; // 미세먼지 단위는 일반적으로 μg/m³ 사용
        break;
    }

    // 미세먼지 타입인 경우 등급을 수치로 변환
    if (createAlertSettingdto.type === 'AIRQUALITY') {
      const grade = createAlertSettingdto.threshold as string;
      // 유효한 등급인지 확인
      if (!this.validPmGrades.includes(grade)) {
        throw new BadRequestException(
          `미세먼지 등급은 '${this.validPmGrades.join(', ')}' 중 하나여야 합니다.`,
        );
      }
      newSetting.threshold = this.convertPm10GradeToValue(grade);
    } else {
      // threshold가 숫자인지 확인 (필수는 아님)
      const thresholdNum = Number(createAlertSettingdto.threshold);
      if (isNaN(thresholdNum)) {
        throw new BadRequestException(
          '온도, 습도, 바람 임계치는 숫자여야 합니다.',
        );
      }
      newSetting.threshold = thresholdNum;
    }

    return this.alertSettingRepository.save(newSetting);
  }

  async findAllByUser(userId: string): Promise<AlertSetting[]> {
    return this.alertSettingRepository.find({
      where: { user: { id: userId } },
    });
  }

  async findAllActiveSettings(): Promise<AlertSetting[]> {
    return this.alertSettingRepository.find({
      where: { active: true },
      relations: ['user', 'user.location'],
    });
  }

  async update(
    id: string,
    updateAlertSettingDto: UpdateAlertSettingDto,
  ): Promise<AlertSetting> {
    const setting = await this.alertSettingRepository.findOne({
      where: { id },
    });
    if (!setting) throw new NotFoundException('설정이 존재하지 않습니다.');

    // threshold 업데이트 및 AIRQUALITY 타입 유효성 검사
    if (updateAlertSettingDto.threshold !== undefined) {
      if (setting.type === 'AIRQUALITY') {
        const grade = updateAlertSettingDto.threshold as string;
        // 유효한 등급인지 확인
        if (!this.validPmGrades.includes(grade)) {
          throw new BadRequestException(
            `미세먼지 등급은 '${this.validPmGrades.join(', ')}' 중 하나여야 합니다.`,
          );
        }
        setting.threshold = this.convertPm10GradeToValue(grade);
      } else {
        // threshold가 숫자인지 확인
        const thresholdNum = Number(updateAlertSettingDto.threshold);
        if (isNaN(thresholdNum)) {
          throw new BadRequestException(
            '온도, 습도, 바람 임계치는 숫자여야 합니다.',
          );
        }
        setting.threshold = thresholdNum;
      }
    }

    if (updateAlertSettingDto.active !== undefined)
      setting.active = updateAlertSettingDto.active;

    return this.alertSettingRepository.save(setting);
  }

  async remove(id: string): Promise<void> {
    const setting = await this.alertSettingRepository.findOne({
      where: { id },
    });
    if (!setting) throw new NotFoundException('설정이 존재하지 않습니다.');
    await this.alertSettingRepository.remove(setting);
  }
}
