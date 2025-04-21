import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RemoveFriendDto {
  @ApiProperty({ description: '삭제할 친구의 ID', example: '...' })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  friendId: string;
}
