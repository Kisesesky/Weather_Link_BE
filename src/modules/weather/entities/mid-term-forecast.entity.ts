import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class MidTermForecastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  regId: string;

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