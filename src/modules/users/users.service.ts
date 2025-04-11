import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RegisterType, User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from '../auth/dto/sign-up.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(signUpDto: SignUpDto) {
    const user = this.userRepository.create(signUpDto);
    await this.userRepository.save(user);

    const { password, ...rest } = user;
    return rest;
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new UnauthorizedException(
        '이메일 또는 패스워드가 잘못 되었습니다.',
      );
    return user;
  }

  async updateTheme(userId: string, theme: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    user.theme = theme;
    await this.userRepository.save(user);

    const { password, ...rest } = user;
    return rest;
  }
}
