import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alert.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateAlertSettingDto } from './dto/create-alert-setting.dto';
import { UpdateAlertSettingDto } from './dto/update-alert-setting.dto';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';

@ApiTags('알림 설정')
@ApiBearerAuth()
@Controller('alert-settings')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({
    summary: '알림 설정 생성',
    description: '새로운 알림 설정을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '알림 설정이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다.' })
  async create(
    @RequestUser() user: User,
    @Body() dto: CreateAlertSettingDto,
  ): Promise<ResponseDto> {
    const data = await this.alertsService.create(user, dto);
    return new ResponseDto({
      success: true,
      message: '알림 설정이 성공적으로 생성되었습니다.',
      data,
    });
  }

  @Get()
  @ApiOperation({
    summary: '알림 설정 목록 조회',
    description: '사용자의 모든 알림 설정을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '알림 설정 목록을 성공적으로 조회했습니다.',
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다.' })
  async findAll(@RequestUser() user: User): Promise<ResponseDto> {
    const data = await this.alertsService.findAllByUser(user.id);
    return new ResponseDto({
      success: true,
      message: '알림 설정 목록을 성공적으로 조회했습니다.',
      data,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: '알림 설정 수정',
    description: '기존 알림 설정을 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '알림 설정이 성공적으로 수정되었습니다.',
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다.' })
  @ApiResponse({ status: 404, description: '알림 설정을 찾을 수 없습니다.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAlertSettingDto,
  ): Promise<ResponseDto> {
    const data = await this.alertsService.update(id, dto);
    return new ResponseDto({
      success: true,
      message: '알림 설정이 성공적으로 수정되었습니다.',
      data,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: '알림 설정 삭제',
    description: '알림 설정을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '알림 설정이 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다.' })
  @ApiResponse({ status: 404, description: '알림 설정을 찾을 수 없습니다.' })
  async remove(@Param('id') id: string): Promise<ResponseDto> {
    await this.alertsService.remove(id);
    return new ResponseDto({
      success: true,
      message: '알림 설정이 성공적으로 삭제되었습니다.',
    });
  }
}
