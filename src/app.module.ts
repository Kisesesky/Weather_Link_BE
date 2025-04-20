import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from 'src/ormconfig';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationsModule } from './modules/locations/locations.module';
import { WeatherModule } from './modules/weather/weather.module';
import { FriendsModule } from './modules/friends/friends.module';
import { ChatModule } from './modules/chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { LoginLogsModule } from './modules/login-logs/login-logs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { InitService } from './init/init.service';
import { LocationsService } from './modules/locations/service/locations.service';
import { RegionService } from './modules/locations/service/region.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    // ScheduleModule.forRoot(), //api호출 테스트 아닐시에는 주석처리부탁드립니다.
    UsersModule,
    AuthModule,
    LoginLogsModule,
    LocationsModule,
    WeatherModule,
    FriendsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, InitService, LocationsService, RegionService],
})
export class AppModule {
  constructor(private readonly initService: InitService) {}
}
