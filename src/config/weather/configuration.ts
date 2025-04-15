import { registerAs } from '@nestjs/config';

export default registerAs('weather', () => ({
  weatherAirApiKey: process.env.AIR_API_KEY,
  weatherAirApiUrl: process.env.AIR_API_URL,
}));
