import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendFriendRequestDto {
  @ApiProperty({ description: '친구 요청을 받을 유저의 ID' })
  @IsUUID()
  receiverId: string;
}
