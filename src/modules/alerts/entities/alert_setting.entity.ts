import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlertLog } from './alert-log.entity';

@Entity('alert_settings')
export class AlertSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.alertSettings, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  type: 'TEMPERATURE' | 'HUMIDITY' | 'WIND' | 'AIRQUALITY';

  @Column('double precision')
  threshold: number; // 임계치

  @Column()
  unit: string; // 단위

  @Column()
  active: boolean;

  @OneToMany(() => AlertLog, (alertLog) => alertLog.alertSetting)
  alertLogs: AlertLog[];
}
