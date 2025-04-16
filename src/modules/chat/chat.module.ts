import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './service/message.service';
import { ChatRoomsService } from './service/chatRoom.service';
import { ChatRoom } from './entities/chatRoom.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { LocationsModule } from '../locations/locations.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, User]),
    LocationsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, MessagesService, ChatRoomsService],
  exports: [ChatGateway, MessagesService, ChatRoomsService],
})
export class ChatModule {}
