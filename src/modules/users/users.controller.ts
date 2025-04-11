import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
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
import { UpdateThemeDto } from './dto/update-theme.dto';

@ApiTags('사용자')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('myinfo')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공', type: User })
  getMe(@RequestUser() user: User) {
    return user;
  }

  @Patch('theme')
  @ApiOperation({ summary: '테마 설정 변경' })
  @ApiResponse({ status: 200, description: '테마 설정 변경 성공', type: User })
  async updateTheme(
    @RequestUser() user: User,
    @Body() updateThemeDto: UpdateThemeDto,
  ) {
    return this.usersService.updateTheme(user.id, updateThemeDto.theme);
  }
}
