import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertLog } from './entities/alert-log.entity';
import { AlertSetting } from './entities/alert_setting.entity';
import { Module } from '@nestjs/common';
import { WeatherModule } from '../weather/weather.module';
import { AlertsSchedulerService } from './services/alerts.scheduler.service';
import { AlertSettingService } from './services/alert-setting.service';
import { AlertSettingController } from './controllers/alert-setting.controller';
import { AlertLogService } from './services/alert-log.service';
import { AlertLogController } from './controllers/alert-log.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertSetting, AlertLog]),
    WeatherModule,
    AuthModule,
  ],
  providers: [AlertSettingService, AlertsSchedulerService, AlertLogService],
  controllers: [AlertSettingController, AlertLogController],
})
export class AlertsModule {}
