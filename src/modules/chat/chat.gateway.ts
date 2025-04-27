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

@WebSocketGateway({
  cors: {
    origin: [
      'https://weather-link.site',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: true,
  },
  namespace: '/chat',
  transports: ['websocket'],
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private chatRoomsService: ChatRoomsService,
  ) {}
  //포스트맨에 2번 접속되는게 확인되여 혹시모를 중복접속 방지
  private connectedClients: Set<string> = new Set();

  async handleConnection(client: Socket) {
    if (this.connectedClients.has(client.id)) {
      console.log(`[DUPLICATE] Client already connected: ${client.id}`);
      client.disconnect();
      return;
    }
  
    this.connectedClients.add(client.id);
    console.log(`[CONNECTED] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`[DISCONNECTED] Client disconnected: ${client.id}`);
  }

  // 클라이언트 방 입장
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = data.roomId;
    if(client.rooms.has(roomId)){
      console.log(`[JOIN] Client ${client.id} already in room: ${roomId}`);
      return; // 중복 입장 방지
    }
    client.join(data.roomId);
    client.emit('joinedRoom', data.roomId);
    console.log(`[JOIN] Client ${client.id} joined room: ${data.roomId}`);
  }

  // 클라이언트 메시지 전송
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() rawData: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      let messageData: CreateMessageDto;
      if (typeof rawData === 'string') {
        try {
          messageData = JSON.parse(rawData);
        } catch (e) {
          throw new Error(`Invalid message format: ${e.message}`);
        }
      } else {
        messageData = rawData;
      }
  
      // 데이터 유효성 검사
      if (!messageData.content) {
        throw new Error('Message content is required');
      }
  
      // 1. 메시지 DB에 저장
      const savedMessage =
        await this.messagesService.saveMessage(messageData);
      console.log('[MESSAGE_SAVED]', savedMessage)
      // 2. 응답 데이터 간소화
      const simplifiedMessage = {
        id: savedMessage.id,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        sender: {
          id: savedMessage.sender.id,
          name: savedMessage.sender.name,
          profileImage: savedMessage.sender.profileImage,
        },
      };

      // 3. 같은 roomId를 가진 사용자들에게 메시지 전송
      this.server
        .to(messageData.roomId)
        .emit('newMessage', simplifiedMessage);
      console.log(`[SEND] Broadcasting to room: ${messageData.roomId}`);
    } catch (error) {
      console.error('[MESSAGE_ERROR]', {
        error: error.message,
        stack: error.stack,
        originalData: rawData
      });
      client.emit('error', {
        message: '메시지 전송에 실패했습니다.',
        details: error.message
      });
    }
  }
}
