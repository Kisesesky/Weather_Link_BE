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
  create(@RequestUser() user: User, @Body() dto: CreateAlertSettingDto) {
    return this.alertsService.create(user, dto);
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
  findAll(@RequestUser() user: User) {
    return this.alertsService.findAllByUser(user.id);
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
  update(@Param('id') id: string, @Body() dto: UpdateAlertSettingDto) {
    return this.alertsService.update(id, dto);
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
  remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }
}
