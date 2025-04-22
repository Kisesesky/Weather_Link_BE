import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './controller/auth.controller';
import { AuthServiceController } from './controller/auth-service.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from 'src/config/app/config.module';
import { SocialConfigModule } from 'src/config/social/config.module';
import { AppConfigService } from 'src/config/app/config.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.starategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { EmailService } from './email/email.service';
import { S3Module } from '../s3/s3.module';
import { LoginLogsModule } from '../login-logs/login-logs.module';
import { RedisCacheModule } from 'src/common/cache/redis-cache.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    AppConfigModule,
    SocialConfigModule,
    UsersModule,
    S3Module,
    LoginLogsModule,
    RedisCacheModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: (appConfigService: AppConfigService) => ({
        secret: appConfigService.jwtSecret,
        signOptions: { expiresIn: '1h' },
      }),
      inject: [AppConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    LocationsModule,
  ],
  controllers: [AuthController, AuthServiceController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    EmailService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
