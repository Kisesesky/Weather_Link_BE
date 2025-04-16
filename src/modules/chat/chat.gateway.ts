import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessagesService } from './service/message.service';
import { CreateMessageDto } from './dto/create-chat.dto';
import { ChatRoomsService } from './service/chatRoom.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: true, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private chatRoomsService: ChatRoomsService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // const userId = this.getUserIdFromClient(client);
    // if (!userId) {
    //   console.warn('Unauthorized socket connection');
    //   client.disconnect();
    //   return;
    // }

    // const roomIds = await this.chatRoomsService.getChatRoomIdByUser(userId);
    // roomIds.forEach((roomId) => {
    //   client.join(roomId);
    //   console.log(`[AUTO JOIN] ${client.id} joined room ${roomId}`);
    // });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // 클라이언트 방 입장
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    client.emit('joinedRoom', data.roomId);
    console.log(`[JOIN] Client ${client.id} joined room: ${data.roomId}`);
  }

  // 클라이언트 메시지 전송
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // 1. 메시지 DB에 저장
      const savedmessage =
        await this.messagesService.saveMessage(createMessageDto);

      // 2. 같은 roomId를 가진 사용자들에게 메시지 전송
      this.server.to(createMessageDto.roomId).emit('newMessage', savedmessage);
      console.log(`[SEND] Broadcasting to room: ${createMessageDto.roomId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', '메시지 전송에 실패했습니다.');
    }
  }

  // JWT에서 userId 추출
  // private getUserIdFromClient(client: Socket): string | null {
  //   const token = client.handshake.query.token as string;

  //   if (!token) {
  //     console.warn('No token found in handshake');
  //     return null;
  //   }

  //   try {
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
  //     return decoded?.sub || decoded?.id || null;
  //   } catch (err) {
  //     console.error('Invalid token:', err.message);
  //     return null;
  //   }
  // }
}
