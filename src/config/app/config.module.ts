import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './configuration';
import * as Joi from 'joi';
import { AppConfigService } from './config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        PORT: Joi.number().default(3000),
        FRONTEND_URL: Joi.string().uri().required(),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        JWT_EXPIRES_IN: Joi.string().default('30d'),
      }),
      isGlobal: true,
    }),
  ],
  providers: [ConfigService, AppConfigService],
  exports: [ConfigService, AppConfigService],
})
export class AppConfigModule {}
