import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class RespondFriendRequestDto {
  @ApiProperty({ description: '친구 요청 ID' })
  @IsUUID()
  requestId: string;

  @ApiProperty({ description: '수락 여부 (true = 수락, false = 거절)' })
  @IsBoolean()
  accept: boolean;
}
