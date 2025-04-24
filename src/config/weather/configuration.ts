import { registerAs } from '@nestjs/config';

export default registerAs('weather', () => ({
  weatherAirApiKey: process.env.AIR_API_KEY,
  weatherAirApiUrl: process.env.AIR_API_URL,
  midForecastApiKey: process.env.MID_FORECAST_API_KEY,
  midForecastApiUrl: process.env.MID_FORECAST_API_URL,
  midTempApiKey: process.env.MID_TEMP_API_KEY,
  midTempApiUrl: process.env.MID_TEMP_API_URL,
  dayForecastApiKey: process.env.DAY_FORECAST_API_KEY,
  dayForecastApiUrl: process.env.DAY_FORECAST_API_URL,
  dailyForecastApiKey: process.env.DAILY_FORECAST_API_KEY,
  dailyForecastApiUrl: process.env.DAILY_FORECAST_API_URL,
  subDailyForecastApiKey: process.env.SUB_DAILY_FORECAST_API_KEY,
  subDailyForecastApiUrl: process.env.SUB_DAILY_FORECAST_API_URL,
  subDayForecastApiKey: process.env.SUB_DAY_FORECAST_API_KEY,
  subDayForecastApiUrl: process.env.SUB_DAY_FORECAST_API_URL,
}));
