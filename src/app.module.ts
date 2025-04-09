import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationsModule } from './modules/locations/locations.module';
import { WeatherModule } from './modules/weather/weather.module';
import { FriendsModule } from './modules/friends/friends.module';

@Module({
  imports: [UsersModule, AuthModule, LocationsModule, WeatherModule, FriendsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
