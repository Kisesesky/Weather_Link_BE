import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginLog } from './entities/login-log.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class LoginLogsService {
  constructor(
    @InjectRepository(LoginLog)
    private readonly loginLogRepository: Repository<LoginLog>,
    private readonly userService: UsersService,
  ) {}

  async create(userId: string): Promise<LoginLog> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const loginLog = this.loginLogRepository.create({
      user,
      login_time: new Date(),
    });

    return this.loginLogRepository.save(loginLog);
  }

  // 이력 조회용
  async findAll(): Promise<LoginLog[]> {
    return this.loginLogRepository.find({ relations: ['user'] });
  }
}
