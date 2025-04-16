import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@Index(['sido', 'gugun', 'dataTime'], { unique: true })
export class WeatherAirEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    sido: string

    @Column()
    gugun: string

    @Column()
    dataTime: Date
    
    @Column()
    pm10Value: string

    @Column()
    pm25Value: string

    @CreateDateColumn()
    createdAt: Date
}
