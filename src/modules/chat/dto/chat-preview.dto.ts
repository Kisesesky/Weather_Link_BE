import { ApiProperty } from '@nestjs/swagger';

export class MessagePreviewDto {
  @ApiProperty({ description: '메시지 ID' })
  id: string;

  @ApiProperty({ description: '메시지 내용' })
  content: string;

  @ApiProperty({ description: '메시지 생성 시간' })
  createdAt: Date;

  @ApiProperty({
    description: '메시지 발신자 정보',
    type: 'object',
    properties: {
      id: { type: 'string', description: '발신자 ID' },
      name: { type: 'string', description: '발신자 이름' },
      profileImage: { type: 'string', description: '발신자 프로필 이미지 URL' },
    },
  })
  sender: {
    id: string;
    name: string;
    profileImage: string;
  };
}

export class ChatRoomPreviewDto {
  @ApiProperty({ description: '채팅방 ID' })
  id: string;

  @ApiProperty({ description: '채팅방 이름' })
  name: string;

  @ApiProperty({ description: '참여자 수' })
  participantCount: number;

  @ApiProperty({ type: [MessagePreviewDto], description: '최신 메시지 2개' })
  messages: MessagePreviewDto[];
}
