import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ChatRoom } from '../entities/chatRoom.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsService } from 'src/modules/locations/service/locations.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class ChatRoomsService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomsRepository: Repository<ChatRoom>,
    private locationsService: LocationsService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}
  async createChatRoom(sido: string) {
    const location = await this.locationsService.findBySido(sido);
    if (!location) {
      throw new NotFoundException(`${sido} 지역을 찾을 수 없습니다.`);
    }

    const chatRoom = this.chatRoomsRepository.create({
      name: `${sido} 날씨 이야기`,
      location,
      participants: [],
    });
    return await this.chatRoomsRepository.save(chatRoom);
  }

  async findOne(sido: string): Promise<ChatRoom> {
    const chatRoom = await this.chatRoomsRepository.findOne({
      where: { name: `${sido} 날씨 이야기` },
      relations: ['participants'],
    });

    if (!chatRoom) {
      throw new NotFoundException(`${sido} 지역의 채팅방을 찾을 수 없습니다.`);
    }

    return chatRoom;
  }

  async save(chatRoom: ChatRoom): Promise<ChatRoom> {
    return this.chatRoomsRepository.save(chatRoom);
  }

  // 특정 채팅방의 전체 정보 조회
  async findRoomById(roomId: string) {
    return this.chatRoomsRepository.findOne({
      where: { id: roomId },
      relations: ['participants', 'messages'],
    });
  }

  // 특정 사용자가 참여한 모든 채팅방 ID 조회
  async getChatRoomIdsByUser(userId: string): Promise<string[]> {
    const rooms = await this.chatRoomsRepository
      .createQueryBuilder('room')
      .leftJoin('room.participants', 'participant')
      .where('participant.id = :userId', { userId })
      .getMany();

    return rooms.map((room) => room.id);
  }

  async getAllRooms() {
    return this.chatRoomsRepository.find({
      relations: ['location', 'participants'],
    });
  }

  async addUserToChatRoom(userId: string, sido: string) {
    // 사용자 정보 조회
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 해당 지역의 채팅방 조회
    let chatRoom = await this.findOne(sido);

    // 채팅방이 없으면 생성
    if (!chatRoom) {
      chatRoom = await this.createChatRoom(sido);
    }

    // 사용자가 이미 참여 중인지 확인
    const isAlreadyParticipant = chatRoom.participants.some(
      (participant) => participant.id === userId,
    );

    // 참여 중이 아니면 추가
    if (!isAlreadyParticipant) {
      chatRoom.participants = [...chatRoom.participants, user];
      await this.chatRoomsRepository.save(chatRoom);
    }

    return chatRoom;
  }

  async getUserChatRoomWithLatestMessages(userId: string) {
    // 사용자 정보 조회
    const user = await this.usersService.findUserById(userId);
    if (!user || !user.location) {
      throw new NotFoundException(
        '사용자 정보 또는 위치 정보를 찾을 수 없습니다.',
      );
    }

    // 사용자 위치의 kmaRegionCode로 Location조회
    const userLocation = await this.locationsService.findById(user.location.id);
    if (!userLocation?.kmaRegionCode) {
      throw new NotFoundException('위치 정보를 찾을 수 없습니다.');
    }

    const targetLocation = await this.locationsService.findByKmaRegionCode(
      userLocation.kmaRegionCode,
    );
    if (!targetLocation) {
      throw new NotFoundException('해당 지역의 위치 정보를 찾을 수 없습니다.');
    }

    // 해당 Location ID로 채팅방 찾기
    const room = await this.chatRoomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.messages', 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('room.location.id = :locationId', {
        locationId: targetLocation.id,
      })
      .orderBy('message.createdAt', 'DESC')
      .select([
        'room.id',
        'room.name',
        'message.id',
        'message.content',
        'message.createdAt',
        'sender.id',
        'sender.name',
        'sender.profileImage',
      ])
      .getOne();

    if (!room) {
      throw new NotFoundException('해당 지역의 채팅방을 찾을 수 없습니다.');
    }

    // 참여자 수 조회
    const participantCount = await this.chatRoomsRepository
      .createQueryBuilder('room')
      .leftJoin('room.participants', 'participant')
      .where('room.id = :roomId', { roomId: room.id })
      .getCount();

    // 최신 메시지 2개만 선택
    const latestMessages = room.messages.slice(0, 2);

    return {
      id: room.id,
      name: room.name,
      participantCount,
      messages: latestMessages,
    };
  }
}