import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatRoom } from './chatRoom.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.messages, { eager: true })
  sender: User;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages)
  chatRoom: ChatRoom;
}
