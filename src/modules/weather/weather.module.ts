import { Module } from '@nestjs/common';
import { WeatherService } from './service/weather.service';
import { WeatherController } from './weather.controller';
import { WeatherAirService } from './service/weather-air.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherAirEntity } from './entities/weather-air.entity';
import { LocationsEntity } from '../locations/entities/location.entity';
import { WeatherConfigService } from 'src/config/weather/config.service';
import { WeatherConfigModule } from 'src/config/weather/config.module';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherAirEntity, LocationsEntity]), WeatherConfigModule],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherAirService, WeatherConfigService],
  exports: [WeatherAirService]
})
export class WeatherModule {}
