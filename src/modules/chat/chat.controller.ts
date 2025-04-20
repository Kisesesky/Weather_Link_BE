import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatRoomsService } from './service/chatRoom.service';
import { MessagesService } from './service/message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { ResponseDto } from 'src/common/dto/response.dto';

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
    description: '모든 채팅방 목록 조회 성공',
    type: ResponseDto,
  })
  async getAllRooms(): Promise<ResponseDto> {
    const data = await this.chatRoomsService.getAllRooms();
    return new ResponseDto({
      success: true,
      message: '모든 채팅방 목록 조회 성공',
      data,
    });
  }

  @Get('rooms/preview')
  @ApiOperation({ summary: '내 채팅방과 최신 메시지 조회' })
  @ApiResponse({
    status: 200,
    description: '내 채팅방과 최신 메시지 조회 성공',
    type: ResponseDto,
  })
  async getUserChatRoomWithLatestMessages(
    @RequestUser() user,
  ): Promise<ResponseDto> {
    const userId = user?.id;
    const data =
      await this.chatRoomsService.getUserChatRoomWithLatestMessages(userId);
    return new ResponseDto({
      success: true,
      message: '내 채팅방과 최신 메시지 조회 성공',
      data,
    });
  }

  @Get('rooms/:sido')
  @ApiOperation({ summary: '특정 시도의 채팅방 조회' })
  @ApiResponse({
    status: 200,
    description: '특정 시도 채팅방 조회 성공',
    type: ResponseDto,
  })
  async getChatRoom(@Param('sido') sido: string): Promise<ResponseDto> {
    const data = await this.chatRoomsService.findOne(sido);
    return new ResponseDto({
      success: true,
      message: '특정 시도 채팅방 조회 성공',
      data: {
        id: data.id,
        sido: data.location.sido,
      },
    });
  }

  @Get(':roomId/messages')
  @ApiOperation({ summary: '채팅방의 메시지 조회' })
  @ApiResponse({
    status: 200,
    description: '채팅방 메시지 목록 조회 성공',
    type: ResponseDto,
  })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ResponseDto> {
    const data = await this.messagesService.getMessages(roomId, page, limit);
    return new ResponseDto({
      success: true,
      message: '채팅방 메시지 목록 조회 성공',
      data,
    });
  }
}
