import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { RegisterType, User, Theme } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(signUpDto: SignUpDto) {
    try {
      // 이메일 중복 체크
      const existingUser = await this.userRepository.findOne({
        where: { email: signUpDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('이미 사용 중인 이메일입니다.');
      }

      const user = this.userRepository.create(signUpDto);
      await this.userRepository.save(user);

      const { password, ...rest } = user;
      return rest;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('사용자 생성 중 오류가 발생했습니다.');
    }
  }

  async isNameAvailable(name: string) {
    const existName = await this.userRepository.findOne({ where: { name } });
    return !existName;
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new UnauthorizedException(
        '이메일 또는 패스워드가 잘못 되었습니다.',
      );
    return user;
  }

  findUserBySocialId(socialId: string, registerType: RegisterType) {
    return this.userRepository.findOne({
      where: { socialId, registerType },
    });
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 닉네임 변경 시 중복 검사
    if (updateUserDto.name && updateUserDto.name !== user.name) {
      const isNameAvailable = await this.isNameAvailable(updateUserDto.name);
      if (!isNameAvailable) {
        throw new BadRequestException('이미 사용 중인 닉네임입니다.');
      }
    }

    // 테마 값 검증
    if (updateUserDto.theme !== undefined) {
      if (!Object.values(Theme).includes(updateUserDto.theme)) {
        throw new BadRequestException(
          '테마는 light 또는 dark만 선택 가능합니다.',
        );
      }
    }

    // 사용자 정보 업데이트 (이메일 제외)
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    const { password, ...rest } = user;
    return rest;
  }

  async updateTheme(
    userId: string,
    updateThemeDto: UpdateThemeDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 테마 값 검증
    if (!Object.values(Theme).includes(updateThemeDto.theme)) {
      throw new BadRequestException(
        '테마는 light 또는 dark만 선택 가능합니다.',
      );
    }

    user.theme = updateThemeDto.theme;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        '인증 정보가 없습니다. 로그인 후 이용해주세요.',
      );
    }

    await this.userRepository.remove(user);
  }
}
