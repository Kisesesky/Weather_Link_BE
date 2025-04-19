import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertSetting } from './entities/alert_setting.entity';
import { CreateAlertSettingDto } from './dto/create-alert-setting.dto';
import { UpdateAlertSettingDto } from './dto/update-alert-setting.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { WeatherAirService } from '../weather/service/weather-air.service';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertSetting)
    private readonly alertSettingRepository: Repository<AlertSetting>,
    private readonly weatherAirService: WeatherAirService,
  ) {}

  // 미세먼지 등급을 수치로 변환하는 함수
  private convertPm10GradeToValue(grade: string): number {
    switch (grade) {
      case '좋음':
        return 0; // 0 ~ 29
      case '보통':
        return 30; // 30 ~ 79
      case '나쁨':
        return 80; // 80 ~ 149
      case '매우 나쁨':
        return 150; // 150 이상
      default:
        return 0;
    }
  }

  async create(
    user: User,
    createAlertSettingdto: CreateAlertSettingDto,
  ): Promise<AlertSetting> {
    const setting = new AlertSetting();
    setting.user = user;
    setting.type = createAlertSettingdto.type;
    setting.unit = createAlertSettingdto.unit;
    setting.condition = createAlertSettingdto.condition;
    setting.active = createAlertSettingdto.active;

    // 미세먼지 타입인 경우 등급을 수치로 변환
    if (createAlertSettingdto.type === 'AIRQUALITY') {
      setting.threshold = this.convertPm10GradeToValue(
        createAlertSettingdto.threshold as string,
      );
    } else {
      setting.threshold = Number(createAlertSettingdto.threshold);
    }

    return this.alertSettingRepository.save(setting);
  }

  async findAllByUser(userId: string): Promise<AlertSetting[]> {
    return this.alertSettingRepository.find({
      where: { user: { id: userId } },
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

    // 미세먼지 타입인 경우 등급을 수치로 변환
    if (setting.type === 'AIRQUALITY' && updateAlertSettingDto.threshold) {
      setting.threshold = this.convertPm10GradeToValue(
        updateAlertSettingDto.threshold as string,
      );
    } else if (updateAlertSettingDto.threshold !== undefined) {
      setting.threshold = Number(updateAlertSettingDto.threshold);
    }

    if (updateAlertSettingDto.unit) setting.unit = updateAlertSettingDto.unit;
    if (updateAlertSettingDto.condition)
      setting.condition = updateAlertSettingDto.condition;
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
