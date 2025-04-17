import { User } from 'src/modules/users/entities/user.entity';
import { BaseEntity, Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class AlertSetting extends BaseEntity {
  @ManyToOne(() => User, (user) => user.alertSettings, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  type: string; // 'rain', 'pm10', etc.

  @Column('double precision')
  threshold: number;

  @Column()
  unit: string;

  @Column()
  condition: string; // '>', '<', '='
}
