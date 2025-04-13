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
import { S3Service } from '../s3/s3.service';
import { comparePassword, encryptPassword } from 'src/utils/password-util';
import { validatePassword } from 'src/utils/password-validator';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private s3Service: S3Service,
  ) {}

  async createUser(signUpDto: SignUpDto, profileImage?: Express.Multer.File) {
    let profileImageUrl;

    if (profileImage) {
      profileImageUrl = await this.s3Service.uploadImage(
        profileImage,
        'profiles',
      );
    }

    const user = this.userRepository.create({
      ...signUpDto,
      profileImage: profileImageUrl,
    });

    await this.userRepository.save(user);
    const { password, ...rest } = user;
    return rest;
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

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    profileImage?: Express.Multer.File,
  ) {
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

    // 프로필 이미지 업로드 처리
    let profileImageUrl;

    if (profileImage) {
      profileImageUrl = await this.s3Service.uploadImage(
        profileImage,
        'profiles',
      );
    }
    user.profileImage = profileImageUrl;

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

  async updatePassword(email: string, hashedPassword: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    user.password = hashedPassword;
    return this.userRepository.save(user);
  }
}
