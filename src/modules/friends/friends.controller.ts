import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
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
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { RemoveFriendDto } from './dto/remove-friend.dto';
import { SearchFriendsDto } from './dto/search-friends.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';

@ApiTags('친구 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('search')
  @ApiOperation({ summary: '유저 검색' })
  @ApiQuery({ name: 'name', required: true, description: '검색할 닉네임' })
  @ApiQuery({ name: 'skip', required: false, description: '건너뛸 항목 수' })
  @ApiQuery({ name: 'take', required: false, description: '가져올 항목 수' })
  @ApiResponse({
    status: 200,
    description: '유저 검색 성공',
    type: ResponseDto,
  })
  async search(
    @Query() query: SearchUsersQueryDto,
    @Req() req,
  ): Promise<ResponseDto> {
    const data = await this.friendsService.searchUsers(
      query.name,
      query,
      req.user.id,
    );
    return new ResponseDto({
      success: true,
      message: '유저 검색 성공',
      data,
    });
  }

  @Post('request')
  @ApiOperation({ summary: '친구 요청 보내기' })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({
    status: 201,
    description: '친구 요청 성공',
    type: ResponseDto,
  })
  async sendRequest(
    @Body() body: SendFriendRequestDto,
    @Req() req,
  ): Promise<ResponseDto> {
    const data = await this.friendsService.sendFriendRequest(
      req.user.id,
      body.receiverId,
    );
    return new ResponseDto({
      success: true,
      message: '친구 요청 성공',
      data,
    });
  }

  @Post('respond')
  @ApiOperation({ summary: '친구 요청 응답 (수락/거절)' })
  @ApiBody({ type: RespondFriendRequestDto })
  @ApiResponse({
    status: 200,
    description: '친구 요청 응답 처리 성공',
    type: ResponseDto,
  })
  async respond(
    @Body() body: { requestId: string; accept: boolean },
    @Req() req,
  ): Promise<ResponseDto> {
    const data = await this.friendsService.respondToFriendRequest(
      body.requestId,
      req.user.id,
      body.accept,
    );
    return new ResponseDto({
      success: true,
      message: '친구 요청 응답 처리 성공',
      data,
    });
  }

  @Get()
  @ApiOperation({ summary: '친구 목록 조회' })
  @ApiQuery({ name: 'skip', required: false, description: '건너뛸 항목 수' })
  @ApiQuery({ name: 'take', required: false, description: '가져올 항목 수' })
  @ApiResponse({
    status: 200,
    description: '친구 목록 조회 성공',
    type: ResponseDto,
  })
  async getFriends(
    @Req() req,
    @Query() paginationDto: PaginationDto,
  ): Promise<ResponseDto> {
    const data = await this.friendsService.getFriendsList(
      req.user.id,
      paginationDto,
    );
    return new ResponseDto({
      success: true,
      message: '친구 목록 조회 성공',
      data,
    });
  }

  @Get('requests/pending')
  @ApiOperation({ summary: '내가 보낸 친구 요청 목록' })
  @ApiResponse({
    status: 200,
    description: '보낸 친구 요청 목록 조회 성공',
    type: ResponseDto,
  })
  async getPendingRequests(@Req() req): Promise<ResponseDto> {
    const data = await this.friendsService.getSentRequests(req.user.id);
    return new ResponseDto({
      success: true,
      message: '보낸 친구 요청 목록 조회 성공',
      data,
    });
  }

  @Get('requests/received')
  @ApiOperation({ summary: '내가 받은 친구 요청 목록' })
  @ApiResponse({
    status: 200,
    description: '받은 친구 요청 목록 조회 성공',
    type: ResponseDto,
  })
  async getReceivedRequests(@Req() req): Promise<ResponseDto> {
    const data = await this.friendsService.getReceivedRequests(req.user.id);
    return new ResponseDto({
      success: true,
      message: '받은 친구 요청 목록 조회 성공',
      data,
    });
  }

  @Delete('remove')
  @ApiOperation({ summary: '친구 삭제' })
  @ApiBody({ type: RemoveFriendDto })
  @ApiResponse({
    status: 200,
    description: '친구 삭제 성공',
    type: ResponseDto,
  })
  async removeFriend(
    @Req() req,
    @Body() removeFriendDto: RemoveFriendDto,
  ): Promise<ResponseDto> {
    await this.friendsService.removeFriend(
      req.user.id,
      removeFriendDto.friendId,
    );
    return new ResponseDto({
      success: true,
      message: '친구 삭제 성공',
    });
  }

  @Get('search/friends')
  @ApiOperation({ summary: '친구 목록에서 검색' })
  @ApiResponse({
    status: 200,
    description: '친구 검색 성공',
    type: ResponseDto,
  })
  async searchFriends(
    @Req() req,
    @Query() searchFriendsDto: SearchFriendsDto,
  ): Promise<ResponseDto> {
    const data = await this.friendsService.searchFriends(
      req.user.id,
      searchFriendsDto.name,
      searchFriendsDto,
    );
    return new ResponseDto({
      success: true,
      message: '친구 검색 성공',
      data,
    });
  }
}
