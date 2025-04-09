import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './configuration';
import * as Joi from 'joi';
import { DbConfigService } from './config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().required(),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        NODE_ENV: Joi.string().required(),
      }),
    }),
  ],
  providers: [ConfigService, DbConfigService],
  exports: [ConfigService, DbConfigService],
})
export class DbConfigModule {}
