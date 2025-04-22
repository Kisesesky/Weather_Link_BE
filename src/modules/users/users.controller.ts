import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ResponseDto } from 'src/common/dto/response.dto';

@ApiTags('사용자')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('myinfo')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '내 정보 조회 성공', type: User })
  async getMe(@RequestUser() user: User) {
    const userInfo = await this.usersService.getMyInfo(user.id);
    return new ResponseDto({
      success: true,
      message: '내 정보 조회 성공',
      data: userInfo,
    });
  }

  @Patch('myinfo')
  @ApiOperation({ summary: '회원 정보 수정' })
  @ApiResponse({ status: 200, description: '회원 정보 수정 성공', type: User })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateUser(
    @RequestUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    try {
      const updatedUser = await this.usersService.updateUser(
        user.id,
        updateUserDto,
        profileImage,
      );
      return new ResponseDto({
        success: true,
        message: '회원 정보 수정 성공',
        data: updatedUser,
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: '회원 정보 수정에 실패했습니다.',
        error: 'Bad Request',
      });
    }
  }

  @Delete('myinfo')
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
  async deleteAccount(@RequestUser() user: User) {
    await this.usersService.deleteUser(user.id);
    return new ResponseDto({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.',
    });
  }

  @Get('location')
  @ApiOperation({ summary: '사용자 위치 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 위치 정보 조회 성공',
    schema: {
      example: {
        id: '9bb48bb2-0d6c-43a1-b0b2-406797ca2a93',
        sido: '서울특별시',
        gugun: '강남구',
        dong: '역삼1동',
        nx: 61,
        ny: 126,
        longitude: 127.0365,
        latitude: 37.5006,
      },
    },
  })
  async getUserLocation(@Request() req) {
    const location = await this.usersService.getUserLocation(req.user.id);
    return new ResponseDto({
      success: true,
      message: '위치 정보 조회 성공',
      data: location,
    });
  }

  @Patch('location')
  @ApiOperation({ summary: '사용자 위치 정보 수정' })
  @ApiResponse({
    status: 200,
    description: '사용자 위치 정보 수정 성공',
    schema: {
      example: {
        id: '9bb48bb2-0d6c-43a1-b0b2-406797ca2a93',
        sido: '서울특별시',
        gugun: '강남구',
        dong: '역삼1동',
        nx: 61,
        ny: 126,
        longitude: 127.0365,
        latitude: 37.5006,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 위치 ID 또는 위치 정보 수정 실패',
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
  })
  async updateUserLocation(
    @Request() req,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    try {
      const location = await this.usersService.updateUserLocation(
        req.user.id,
        updateLocationDto.locationId,
      );
      return new ResponseDto({
        success: true,
        message: '위치 정보 수정 성공',
        data: location,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        statusCode: 400,
        message:
          '위치 정보 수정에 실패했습니다. 올바른 위치 ID를 입력해주세요.',
        error: 'Bad Request',
      });
    }
  }
}
