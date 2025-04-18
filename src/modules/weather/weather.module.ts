import { Module } from '@nestjs/common';
import { WeatherService } from './service/weather.service';
import { WeatherController } from './controllers/weather.controller';
import { WeatherAirService } from './service/weather-air.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherAirEntity } from './entities/weather-air.entity';
import { LocationsEntity } from '../locations/entities/location.entity';
import { WeatherConfigService } from 'src/config/weather/config.service';
import { WeatherConfigModule } from 'src/config/weather/config.module';
import { MidForecastService } from './service/mid-forecast.service';
import { MidTermForecastEntity } from './entities/mid-term-forecast.entity';
import { LocationsModule } from '../locations/locations.module';
import { MidTermTempEntity } from './entities/mid-term-temp.entity';
import { MidTempService } from './service/mid-temp.service';
import { MidTempController } from './controllers/mid-temp.controller';
import { DailyForecastEntity } from './entities/daily-forecast.entity';
import { DailyForecastService } from './service/daily-forecast.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherAirEntity, LocationsEntity, MidTermForecastEntity, MidTermTempEntity, DailyForecastEntity]), WeatherConfigModule, LocationsModule, HttpModule],
  controllers: [WeatherController, MidTempController],
  providers: [WeatherService, WeatherAirService, WeatherConfigService, MidForecastService, MidTempService, DailyForecastService],
  exports: [WeatherAirService]
})
export class WeatherModule {}
