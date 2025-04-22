import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { ChatRoom } from 'src/modules/chat/entities/chatRoom.entity';
import { RegionEntity } from './region.entity';

@Entity()
export class LocationsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kmaRegionCode: string;

  @Column()
  alertRegionCode: string;

  @Column()
  stationCode: string;

  @Column()
  forecastCode: string;

  @Column()
  forecastStationCode: string;

  @Column()
  sido: string;

  @Column({ nullable: true })
  gugun: string;

  @Column({ nullable: true })
  dong: string;

  @Column({ type: 'int', nullable: true })
  nx: number;

  @Column({ type: 'int', nullable: true })
  ny: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @OneToMany(() => User, (user) => user.location)
  users: User[];

  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.location)
  chatRooms: ChatRoom[];

  @ManyToOne(() => RegionEntity, region => region.locations)
  region: RegionEntity;
}
