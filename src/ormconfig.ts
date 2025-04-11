import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { DbConfigService } from 'src/config/db/config.service';
import 'dotenv/config';
import { DataSource } from 'typeorm';


// entity, migration, subscriber 해당 위치에서 호출
const entity = join(__dirname, '/**/*.entity{.ts,.js}');
const migration = join(__dirname, './database/migrations/**/*{.ts,.js}');
const subscriber = join(__dirname, '/modules/**/subscribers/*.subscriber.{ts,js}')
const dbConfigService = new DbConfigService(new ConfigService());

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfigService.dbHost,
  port: dbConfigService.dbPort,
  username: dbConfigService.dbUser,
  password: dbConfigService.dbPassword,
  database: dbConfigService.dbName,

  synchronize: false, // 마이그레이션 시 false 고정
  entities: [entity],
  migrations: [migration],
  subscribers: [subscriber],
});
