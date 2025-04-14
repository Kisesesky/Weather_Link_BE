import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('friends')
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sentRequests)
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedRequests)
  receiver: User;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
