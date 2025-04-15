import { Module } from '@nestjs/common';
import { WeatherService } from './service/weather.service';
import { WeatherController } from './weather.controller';
import { WeatherAirService } from './service/weather-air.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherAirEntity } from './entities/weather-air.entity';
import { LocationsEntity } from '../locations/entities/location.entity';
import { WeatherConfigService } from 'src/config/weather/config.service';
import { WeatherConfigModule } from 'src/config/weather/config.module';
import { MidForecastService } from './service/mid-forecast.service';
import { MidTermForecastEntity } from './entities/mid-term-forecast.entity';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherAirEntity, LocationsEntity, MidTermForecastEntity]), WeatherConfigModule, LocationsModule],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherAirService, WeatherConfigService, MidForecastService],
  exports: [WeatherAirService]
})
export class WeatherModule {}
