import { registerAs } from '@nestjs/config';

export default registerAs('weather', () => ({
  weatherAirApiKey: process.env.AIR_API_KEY,
  weatherAirApiUrl: process.env.AIR_API_URL,
  midForecastApiKey: process.env.MID_FORECAST_API_KEY,
  midForecastApiUrl: process.env.MID_FORECAST_API_URL,
}));
