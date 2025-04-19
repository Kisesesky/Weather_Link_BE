import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { LocationsService } from "src/modules/locations/service/locations.service";
import { RegionService } from "src/modules/locations/service/region.service";

@Injectable()
export class InitService implements OnModuleInit {
  private readonly logger = new Logger(InitService.name);

  constructor(
    private readonly regionService: RegionService,
    private readonly locationService: LocationsService,
  ) {}

  async onModuleInit() {
    this.logger.log('🛠 초기화 시작');
    await this.locationService.initLocationMoudle();
    await this.regionService.initRegionMoudle();
    this.logger.log('✅ 초기화 완료');
  }
}
