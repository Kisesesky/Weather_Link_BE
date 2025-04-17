import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatRoomsService } from './service/chatRoom.service';
import { MessagesService } from './service/message.service';
import { ChatRoom } from './entities/chatRoom.entity';
import { Message } from './entities/message.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatRoomsService: ChatRoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get('rooms')
  @ApiOperation({ summary: '모든 채팅방 조회' })
  @ApiResponse({
    status: 200,
    description: '모든 채팅방 목록을 반환합니다.',
    type: [ChatRoom],
  })
  async getAllRooms(): Promise<ChatRoom[]> {
    return this.chatRoomsService.getAllRooms();
  }

  @Get('rooms/preview')
  @ApiOperation({ summary: '내 채팅방과 최신 메시지 조회' })
  @ApiResponse({
    status: 200,
    description: '내 채팅방과 최신 메시지 2개를 반환합니다.',
    type: ChatRoom,
  })
  async getUserChatRoomWithLatestMessages(@RequestUser() user) {
    const userId = user?.id;
    return this.chatRoomsService.getUserChatRoomWithLatestMessages(userId);
  }

  @Get('rooms/:sido')
  @ApiOperation({ summary: '특정 시도의 채팅방 조회' })
  @ApiResponse({
    status: 200,
    description: '채팅방 정보를 반환합니다.',
    type: ChatRoom,
  })
  async getChatRoom(@Param('sido') sido: string): Promise<ChatRoom> {
    return this.chatRoomsService.findOne(sido);
  }

  @Get(':roomId/messages')
  @ApiOperation({ summary: '채팅방의 메시지 조회' })
  @ApiResponse({
    status: 200,
    description: '채팅방의 메시지 목록을 반환합니다.',
    schema: {
      example: {
        messages: [
          {
            id: 'message-id',
            content: '메시지 내용',
            createdAt: '2024-03-15T12:00:00.000Z',
            sender: {
              id: 'user-id',
              name: '사용자 이름',
              profileImage: '프로필 이미지 URL',
            },
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
        },
      },
    },
  })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.messagesService.getMessages(roomId, page, limit);
  }
}
