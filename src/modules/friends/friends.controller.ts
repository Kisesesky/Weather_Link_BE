import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/response-friend-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Friend')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('search')
  @ApiOperation({ summary: '유저 검색' })
  @ApiQuery({ name: 'name', required: true, description: '검색할 닉네임' })
  @ApiResponse({ status: 200, description: '유저 검색 결과 반환' })
  search(@Query('name') name: string) {
    return this.friendsService.searchUsers(name);
  }

  @Post('request')
  @ApiOperation({ summary: '친구 요청 보내기' })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({ status: 201, description: '친구 요청 전송 성공' })
  sendRequest(@Body() body: SendFriendRequestDto, @Req() req) {
    return this.friendsService.sendFriendRequest(req.user.id, body.receiverId);
  }

  @Post('respond')
  @ApiOperation({ summary: '친구 요청 응답 (수락/거절)' })
  @ApiBody({ type: RespondFriendRequestDto })
  @ApiResponse({ status: 200, description: '친구 요청 응답 처리 완료' })
  respond(@Body() body: { requestId: string; accept: boolean }, @Req() req) {
    return this.friendsService.respondToFriendRequest(
      body.requestId,
      req.user.id,
      body.accept,
    );
  }

  @Get()
  @ApiOperation({ summary: '친구 목록 조회' })
  @ApiResponse({ status: 200, description: '나의 친구 목록 반환' })
  getFriends(@Req() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: '내가 받은 친구 요청 목록' })
  @ApiResponse({ status: 200, description: '수신한 친구 요청 목록 반환' })
  getPendingRequests(@Req() req) {
    return this.friendsService.getSentRequests(req.user.id);
  }

  @Get('requests/received')
  @ApiOperation({ summary: '내가 보낸 친구 요청 목록' })
  @ApiResponse({ status: 200, description: '보낸 친구 요청 목록 반환' })
  getReceivedRequests(@Req() req) {
    return this.friendsService.getReceivedRequests(req.user.id);
  }
}
