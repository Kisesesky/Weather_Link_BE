import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { LocationsEntity } from './location.entity';

@Entity()
export class RegionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: 'PROVINCE' | 'CITY' | 'DISTRICT';

  @Column({ nullable: true })
  parentId: string;

  @Column({ type: 'int', nullable: true })
  nx: number;

  @Column({ type: 'int', nullable: true })
  ny: number;

  @OneToMany(() => LocationsEntity, location => location.region)
  locations: LocationsEntity[];
}
