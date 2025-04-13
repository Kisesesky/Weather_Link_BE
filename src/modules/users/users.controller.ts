import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';

@ApiTags('사용자')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('myinfo')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공', type: User })
  getMe(@RequestUser() user: User) {
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: '회원 정보 수정' })
  @ApiResponse({ status: 200, description: '회원 정보 수정 성공', type: User })
  async updateUser(
    @RequestUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
  async deleteAccount(@RequestUser() user: User) {
    await this.usersService.deleteUser(user.id);
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }
}
