import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlertSetting } from './alert_setting.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('alert_logs')
export class AlertLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 어떤 사용자에게 알림이 갔는지
  @ManyToOne(() => User, (user) => user.alertLogs, { onDelete: 'CASCADE' })
  user: User;

  // 어떤 설정 조건에 의해 알림이 발생했는지
  @ManyToOne(() => AlertSetting, (setting) => setting.alertLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  alertSetting: AlertSetting;

  // 발생한 데이터 값 (예: 실제 온도, 습도, 미세먼지 수치)
  @Column('double precision')
  actualValue: number;

  // 단위 (℃, %, ug/m³ 등)
  @Column({ type: 'varchar', length: 10 })
  unit: string;

  // 어떤 종류의 알림인지 명시 (ex: 'temperature', 'humidity')
  @Column({ type: 'varchar', length: 50 })
  type: string;

  // 메시지 내용 (optional, 알림 메시지로 사용)
  @Column({ type: 'text', nullable: true })
  message: string;

  // 알림 발생 시간
  @CreateDateColumn()
  createdAt: Date;
}
