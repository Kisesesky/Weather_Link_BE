import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { ChatRoomsService } from './chatRoom.service';
import { CreateMessageDto } from '../dto/create-chat.dto';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private chatRoomsService: ChatRoomsService,
    private usersService: UsersService,
  ) {}

  async saveMessage(createMessageDto: CreateMessageDto) {
    const room = await this.chatRoomsService.findRoomById(
      createMessageDto.roomId,
    );
    const sender = await this.usersService.findUserById(
      createMessageDto.userId,
    );

    if (!room || !sender) {
      throw new NotFoundException('채팅방 또는 사용자를 찾을 수 없습니다.');
    }

    // 사용자가 해당 채팅방에 참여되어 있는지 확인
    const isParticipant = room.participants.some(
      (participant) => participant.id === sender.id,
    );

    if (!isParticipant) {
      throw new UnauthorizedException('해당 채팅방에 참여되어 있지 않습니다.');
    }

    const message = this.messagesRepository.create({
      content: createMessageDto.content,
      chatRoom: room,
      sender,
    });

    return await this.messagesRepository.save(message);
  }

  async getMessages(roomId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chatRoom.id = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .select([
        'message.id',
        'message.content',
        'message.createdAt',
        'sender.id',
        'sender.name',
        'sender.profileImage',
      ])
      .getManyAndCount();

    return {
      messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
