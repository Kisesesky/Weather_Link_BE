import { RegionEntity } from 'src/modules/locations/entities/region.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';

@Entity()
export class DailyForecastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RegionEntity, { eager: true })
  @JoinColumn({ name: 'region_id' })
  region: RegionEntity;

  @Column()
  regionName: string;

  @Column('decimal', { precision: 5, scale: 2 })
  temperature: number;

  @Column('decimal', { precision: 5, scale: 2 })
  humidity: number;

  @Column('decimal', { precision: 5, scale: 2 })
  rainfall: number;

  @Column('decimal', { precision: 5, scale: 2 })
  windSpeed: number;

  @Column('int')
  windDirection: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  perceivedTemperature: number;

  @CreateDateColumn()
  createdAt: Date;
}
