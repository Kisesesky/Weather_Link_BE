import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsEntity } from './entities/location.entity';
import { LocationController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationsEntity])],
  controllers: [LocationController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
