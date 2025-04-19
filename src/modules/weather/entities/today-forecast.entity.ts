import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RegionEntity } from "src/modules/locations/entities/region.entity";

@Entity()
export class TodayForecastEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RegionEntity, { eager: true })
    region: RegionEntity;

    @Column({ type: 'timestamp' })
    forecastDateTime: Date;

    @Column({ type: 'float', nullable: true })
    temperature: number | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    skyCondition: string | null;

    @Column({ type: 'float', nullable: true })
    rainProbability: number | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    precipitationType: string | null;

    @Column({ type: 'float', nullable: true })
    humidity: number | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    snowfall: string | null;

    @Column({ type: 'timestamp' })
    collectedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}