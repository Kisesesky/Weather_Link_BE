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
import { ResponseSignUpDto } from '../auth/dto/response-sign-up.dto';
import { SocialSignupDto } from '../auth/dto/social-sign-up.dto';
import { LocationsEntity } from '../locations/entities/location.entity';

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

  async createUser(
    signUpDto: SignUpDto,
    profileImage?: Express.Multer.File,
  ): Promise<ResponseSignUpDto> {
    const profileImageUrl = await this.getProfileImageUrl(
      signUpDto,
      profileImage,
    );

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

    // 약관 동의 값을 boolean으로 변환
    const termsAgreed =
      typeof restDto.termsAgreed === 'string'
        ? (restDto.termsAgreed as string).toLowerCase() === 'true'
        : !!restDto.termsAgreed;

    const locationAgreed =
      typeof restDto.locationAgreed === 'string'
        ? (restDto.locationAgreed as string).toLowerCase() === 'true'
        : !!restDto.locationAgreed;

    // 위치 정보 찾기 (findBySidoGugun 사용)
    const location = await this.locationsService.findBySidoGugun(
      restDto.sido,
      restDto.gugun,
    );

    if (!location) {
      throw new BadRequestException('존재하지 않는 위치 정보입니다.');
    }

    // 사용자 생성
    const user = this.usersRepository.create({
      ...restDto,
      registerType: RegisterType.EMAIL,
      profileImage: profileImageUrl,
      termsAgreed,
      locationAgreed,
      location,
    });

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
        await this.addUserToNewChatRoom(user.id, location.sido);
      }
    } catch (error) {
      console.log(`새로운 채팅방 참여 중 오류 발생: ${error.message}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      registerType: user.registerType,
      theme: user.theme,
      location: {
        sido: user.location.sido,
        gugun: user.location.gugun,
      },
    };
  }

  async getProfileImageUrl(
    signUpDto: SignUpDto,
    profileImage?: Express.Multer.File,
  ) {
    const DEFAULT_PROFILE_IMAGE =
      'https://i.postimg.cc/ZRBFR9bq/profile-Image-default.png';

    // 일반 회원가입
    if (signUpDto.registerType === RegisterType.EMAIL) {
      if (profileImage) {
        try {
          const url = await this.s3Service.uploadImage(
            profileImage,
            'profiles',
          );
          return url;
        } catch (error) {
          console.error('S3 업로드 실패:', error);
          return DEFAULT_PROFILE_IMAGE;
        }
      }
      return DEFAULT_PROFILE_IMAGE;
    }

    // 소셜 로그인 (GOOGLE, KAKAO, NAVER)
    if (
      signUpDto.registerType === RegisterType.GOOGLE ||
      signUpDto.registerType === RegisterType.KAKAO ||
      signUpDto.registerType === RegisterType.NAVER
    ) {
      // 소셜 로그인에서 제공한 프로필 이미지 URL이 있는 경우
      if (
        typeof signUpDto.profileImage === 'string' &&
        signUpDto.profileImage
      ) {
        return signUpDto.profileImage;
      }
      // 소셜 로그인에서 프로필 이미지를 제공하지 않은 경우
      return DEFAULT_PROFILE_IMAGE;
    }

    // 위의 모든 조건에 해당하지 않는 경우 (예상치 못한 경우)
    return DEFAULT_PROFILE_IMAGE;
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
      relations: ['location'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      registerType: user.registerType,
      theme: user.theme,
      location: user.location
        ? {
            sido: user.location.sido,
            gugun: user.location.gugun,
          }
        : null,
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
    profileImage?: Express.Multer.File | string,
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
      if (typeof profileImage === 'string') {
        // 문자열인 경우 (URL) 그대로 사용
        user.profileImage = profileImage;
      } else {
        // File 객체인 경우 S3에 업로드
        // 기존 프로필 이미지가 있고 기본 이미지가 아닌 경우 삭제
        if (
          user.profileImage &&
          !user.profileImage.includes('profile-default.png')
        ) {
          await this.s3Service.deleteImage(user.profileImage);
        }
        user.profileImage = await this.s3Service.uploadImage(
          profileImage,
          'profiles',
        );
      }
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
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['chatRooms'],
    });

    if (!user) {
      throw new UnauthorizedException(
        '인증 정보가 없습니다. 로그인 후 이용해주세요.',
      );
    }

    // 사용자가 참여 중인 모든 채팅방에서 제거
    if (user.chatRooms && user.chatRooms.length > 0) {
      for (const chatRoom of user.chatRooms) {
        try {
          // 채팅방에서 사용자 제거
          chatRoom.participants = chatRoom.participants.filter(
            (participant) => participant.id !== userId,
          );
          await this.chatRoomsService.save(chatRoom);
        } catch (error) {
          console.error(
            `채팅방 ${chatRoom.id}에서 사용자 제거 중 오류 발생:`,
            error,
          );
        }
      }
    }

    // 사용자 삭제
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

  async completeSocialSignup(
    userId: string,
    completeSocialSignupDto: SocialSignupDto,
    location: LocationsEntity,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 프로필 이미지 업데이트
    if (completeSocialSignupDto.profileImage) {
      user.profileImage = completeSocialSignupDto.profileImage;
    }

    // 약관 동의 및 위치 정보 업데이트
    user.termsAgreed = completeSocialSignupDto.termsAgreed;
    user.locationAgreed = completeSocialSignupDto.locationAgreed;
    user.location = location;

    const updatedUser = await this.usersRepository.save(user);

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
        await this.addUserToNewChatRoom(updatedUser.id, location.sido);
      }
    } catch (error) {
      console.log(`새로운 채팅방 참여 중 오류 발생: ${error.message}`);
    }

    const { password, ...rest } = updatedUser;
    return rest;
  }
}
