import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginLog } from './entities/login-log.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { exist } from 'joi';

@Injectable()
export class LoginLogsService {
  constructor(
    @InjectRepository(LoginLog)
    private readonly loginLogsRepository: Repository<LoginLog>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string): Promise<LoginLog> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const existingLog = await this.loginLogsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    // 로그 있을 시 갱신
    if (existingLog) {
      existingLog.login_time = new Date();
      return this.loginLogsRepository.save(existingLog);
    }

    // 로그 없을 시 신규 생성
    const loginLog = this.loginLogsRepository.create({
      user,
      login_time: new Date(),
    });

    return this.loginLogsRepository.save(loginLog);
  }

  // 이력 조회용
  async findAll(): Promise<LoginLog[]> {
    return this.loginLogsRepository.find({ relations: ['user'] });
  }
}
