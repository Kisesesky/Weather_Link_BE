import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { RegisterType, User, Theme } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { S3Service } from '../s3/s3.service';
import { LocationsService } from '../locations/service/locations.service';
import { ChatRoomsService } from '../chat/service/chatRoom.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private s3Service: S3Service,
    private locationsService: LocationsService,
    @Inject(forwardRef(() => ChatRoomsService))
    private chatRoomsService: ChatRoomsService,
  ) {}

  async createUser(signUpDto: SignUpDto, profileImage?: Express.Multer.File) {
    let profileImageUrl;

    // 소셜 로그인의 경우 (registerType이 EMAIL이 아닌 경우)
    if (signUpDto.registerType !== RegisterType.EMAIL) {
      // profileImage가 문자열인 경우 (소셜 로그인)
      if (typeof signUpDto.profileImage === 'string') {
        profileImageUrl = signUpDto.profileImage;
      }
    }
    // 일반 회원가입의 경우
    else if (profileImage) {
      profileImageUrl = await this.s3Service.uploadImage(
        profileImage,
        'profiles',
      );
    }

    // 이메일 중복 체크
    const existingUser = await this.usersRepository.findOne({
      where: { email: signUpDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 이메일입니다.');
    }

    // 닉네임 중복 체크
    const isNameAvailable = await this.isNameAvailable(signUpDto.name);
    if (!isNameAvailable) {
      throw new BadRequestException('이미 사용 중인 닉네임입니다.');
    }

    // profileImage 필드를 제외한 나머지 필드로 객체 생성
    const { profileImage: _, ...restDto } = signUpDto;

    const user = this.usersRepository.create({
      ...restDto,
      profileImage: profileImageUrl,
    });

    await this.usersRepository.save(user);
    const { password, ...rest } = user;
    return rest;
  }

  async isNameAvailable(name: string) {
    const existName = await this.usersRepository.findOne({ where: { name } });
    return !existName;
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user)
      throw new UnauthorizedException(
        '이메일 또는 패스워드가 잘못 되었습니다.',
      );
    return user;
  }

  async findUserById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['location'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async getMyInfo(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
    };
  }

  async findUserBySocialId(socialId: string, registerType: RegisterType) {
    return this.usersRepository.findOne({
      where: { socialId, registerType },
    });
  }

  findUserByName(name: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.name) LIKE LOWER(:name)', { name: `%${name}%` });
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    profileImage?: Express.Multer.File,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 닉네임 중복 검사
    if (updateUserDto.name && updateUserDto.name !== user.name) {
      const isNameAvailable = await this.isNameAvailable(updateUserDto.name);
      if (!isNameAvailable) {
        throw new BadRequestException('이미 사용 중인 닉네임입니다.');
      }
    }

    // 프로필 이미지 업로드 처리
    if (profileImage) {
      user.profileImage = await this.s3Service.uploadImage(
        profileImage,
        'profiles',
      );
    }

    // 사용자 정보 업데이트
    Object.assign(user, updateUserDto);

    const updatedUser = await this.usersRepository.save(user);
    const { password, ...rest } = updatedUser;
    return rest;
  }

  async updateTheme(
    userId: string,
    updateThemeDto: UpdateThemeDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
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
    return this.usersRepository.save(user);
  }

  async updateLastLogin(userId: string, lastLoginAt: Date) {
    await this.usersRepository.update(userId, { lastLoginAt });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        '인증 정보가 없습니다. 로그인 후 이용해주세요.',
      );
    }

    await this.usersRepository.remove(user);
  }

  async updatePassword(email: string, hashedPassword: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    user.password = hashedPassword;
    return this.usersRepository.save(user);
  }

  // 사용자 위치 정보 조회
  async getUserLocation(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['location'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user.location;
  }

  // 이전 위치의 채팅방에서 사용자 제외
  private async removeUserFromOldChatRoom(userId: string, oldSido: string) {
    const oldChatRoom = await this.chatRoomsService.findOne(oldSido);
    if (oldChatRoom) {
      oldChatRoom.participants = oldChatRoom.participants.filter(
        (participant) => participant.id !== userId,
      );
      await this.chatRoomsService.save(oldChatRoom);
    }
  }

  // 새로운 위치의 채팅방에 사용자 참여
  private async addUserToNewChatRoom(userId: string, newSido: string) {
    await this.chatRoomsService.addUserToChatRoom(userId, newSido);
  }

  // 사용자 위치 정보 수정
  async updateUserLocation(userId: string, locationId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['location'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const location = await this.locationsService.findById(locationId);
    if (!location) {
      throw new NotFoundException('선택한 지역을 찾을 수 없습니다.');
    }

    // 이전 위치의 채팅방에서 사용자 제외
    if (user.location) {
      try {
        await this.removeUserFromOldChatRoom(userId, user.location.sido);
      } catch (error) {
        console.log(`이전 채팅방 나가기 중 오류 발생: ${error.message}`);
      }
    }

    // 새로운 위치 설정
    user.location = location;
    await this.usersRepository.save(user);

    // 새로운 위치의 채팅방에 사용자 참여
    try {
      // 채팅방이 없으면 생성
      let chatRoom;
      try {
        chatRoom = await this.chatRoomsService.findOne(location.sido);
      } catch (error) {
        if (error instanceof NotFoundException) {
          chatRoom = await this.chatRoomsService.createChatRoom(location.sido);
        }
      }

      // 사용자를 채팅방에 참여시킴
      if (chatRoom) {
        await this.addUserToNewChatRoom(userId, location.sido);
      }
    } catch (error) {
      console.log(`새로운 채팅방 참여 중 오류 발생: ${error.message}`);
    }

    return location;
  }
}
