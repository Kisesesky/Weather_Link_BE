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
import { AlertsModule } from './modules/alerts/alert.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    LoginLogsModule,
    LocationsModule,
    WeatherModule,
    FriendsModule,
    ChatModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
