import { RegionEntity } from "src/modules/locations/entities/region.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
@Unique(['regId','forecastDate'])
export class MidTermTempEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    regId: string;

    @ManyToOne(() => RegionEntity, { eager: true })
    region: RegionEntity;

    @Column({ length: 8 }) // YYYYMMDD 형식
    forecastDate: string;

    @Column({ type: 'float' })
    minTemp : number;

    @Column({ type: 'float' })
    maxTemp : number;

    @Column({ length: 10 }) // YYYYMMDDHH 형식
    tmFc: string;
}