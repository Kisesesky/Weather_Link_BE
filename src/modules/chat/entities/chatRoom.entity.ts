import { LocationsEntity } from 'src/modules/locations/entities/location.entity';
import { Message } from './message.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => LocationsEntity, (location) => location.chatRooms)
  @JoinColumn({ name: 'locationId' })
  location: LocationsEntity;

  @ManyToMany(() => User, (user) => user.chatRooms, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'chat_room_participants',
    joinColumn: { name: 'chatRoomId' },
    inverseJoinColumn: { name: 'userId' },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.chatRoom)
  messages: Message[];
}
