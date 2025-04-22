import { RegionEntity } from 'src/modules/locations/entities/region.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class MidTermForecastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  regId: string;

  @ManyToOne(() => RegionEntity, { eager: true })
  region: RegionEntity;

  @Column()
  forecastDate: string;

  @Column()
  forecastTime: string;

  @Column()
  sky: string;

  @Column()
  pre: string;

  @Column()
  rnSt: number;
}