import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsEntity } from './entities/location.entity';
import { LocationController } from './locations.controller';
import { LocationsService } from './service/locations.service';
import { RegionService } from './service/region.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationsEntity])],
  controllers: [LocationController],
  providers: [LocationsService, RegionService],
  exports: [LocationsModule, RegionService]
})
export class LocationsModule {}
