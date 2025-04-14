import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { LoginLog } from 'src/modules/auth/entities/login-log.entity';
import { LocationsEntity } from 'src/modules/locations/entities/location.entity';

export enum RegisterType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({
    name: 'register_type',
    type: 'enum',
    enum: RegisterType,
    default: RegisterType.EMAIL,
  })
  registerType: RegisterType;

  @Column({ name: 'social_id', type: 'varchar', length: 255, nullable: true })
  socialId: string;

  @Column({ name: 'profile_image', type: 'text', nullable: true })
  profileImage: string;

  @ManyToOne(()=> LocationsEntity, (location) => location.users, { nullable: true })
  location: LocationsEntity;

  @Column({
    type: 'enum',
    enum: Theme,
    default: Theme.LIGHT,
    comment: '사용자 테마 설정 (light 또는 dark)',
  })
  theme: Theme;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => LoginLog, (loginLog) => loginLog.user)
  loginLogs: LoginLog[];
}
