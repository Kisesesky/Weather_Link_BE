import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WeatherConfigService {
  constructor(private configService: ConfigService) {}

  get weatherAirApiKey() {
    return this.configService.get<string>('weather.weatherAirApiKey');
  }

  get weatherAirApiUrl() {
    return this.configService.get<string>('weather.weatherAirApiUrl');
  }
}
