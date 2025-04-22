import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsEntity } from './entities/location.entity';
import { LocationController } from './controller/locations.controller';
import { LocationsService } from './service/locations.service';
import { RegionService } from './service/region.service';
import { RegionEntity } from './entities/region.entity';
import { RegionController } from './controller/region.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LocationsEntity, RegionEntity])],
  controllers: [LocationController, RegionController],
  providers: [LocationsService, RegionService],
  exports: [LocationsService, RegionService, TypeOrmModule.forFeature([LocationsEntity, RegionEntity])],
})
export class LocationsModule {}
