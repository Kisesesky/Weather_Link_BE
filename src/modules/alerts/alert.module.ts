import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertLog } from './entities/alert-log.entity';
import { AlertSetting } from './entities/alert_setting.entity';
import { AlertsService } from './alert.service';
import { AlertController } from './alert.controller';
import { Module } from '@nestjs/common';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [TypeOrmModule.forFeature([AlertSetting, AlertLog]), WeatherModule],
  providers: [AlertsService],
  controllers: [AlertController],
  exports: [AlertsService],
})
export class AlertsModule {}
