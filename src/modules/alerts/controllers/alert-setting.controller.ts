import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AlertSettingService } from '../services/alert-setting.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { CreateAlertSettingDto } from '../dto/create-alert-setting.dto';
import { UpdateAlertSettingDto } from '../dto/update-alert-setting.dto';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { ToggleAllAlertsDto } from '../dto/toggle-all-alerts.dto';

@ApiTags('알림 설정')
@ApiBearerAuth()
@Controller('alert-settings')
@UseGuards(JwtAuthGuard)
export class AlertSettingController {
  constructor(private readonly alertsService: AlertSettingService) {}

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
  @ApiResponse({ status: 409, description: '이미 존재하는 설정입니다.' })
  async create(
    @RequestUser() user: User,
    @Body() dto: CreateAlertSettingDto,
  ): Promise<ResponseDto> {
    try {
      const data = await this.alertsService.create(user, dto);
      return new ResponseDto({
        success: true,
        message: '알림 설정이 성공적으로 생성되었습니다.',
        data,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({
          statusCode: 409,
          message: error.message,
          error: 'Conflict',
        });
      }
      throw new BadRequestException({
        statusCode: 400,
        message: error.message || '알림 설정 생성에 실패했습니다.',
        error: 'Bad Request',
      });
    }
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
    try {
      const data = await this.alertsService.update(id, dto);
      return new ResponseDto({
        success: true,
        message: '알림 설정이 성공적으로 수정되었습니다.',
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException({
          statusCode: 404,
          message: error.message || '해당 알림 설정을 찾을 수 없습니다.',
          error: 'Not Found',
        });
      }
      throw new BadRequestException({
        statusCode: 400,
        message: error.message || '알림 설정 수정에 실패했습니다.',
        error: 'Bad Request',
      });
    }
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
    try {
      await this.alertsService.remove(id);
      return new ResponseDto({
        success: true,
        message: '알림 설정이 성공적으로 삭제되었습니다.',
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException({
          statusCode: 404,
          message: error.message || '해당 알림 설정을 찾을 수 없습니다.',
          error: 'Not Found',
        });
      }
      throw error;
    }
  }

  @Patch('toggle-all')
  @ApiOperation({
    summary: '모든 알림 설정 활성화/비활성화',
    description: '사용자의 모든 알림 설정을 한 번에 켜거나 끕니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모든 알림 설정의 활성화 상태가 성공적으로 변경되었습니다.',
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다.' })
  async toggleAllAlerts(
    @RequestUser() user: User,
    @Body() toggleAllAlertsDto: ToggleAllAlertsDto,
  ): Promise<ResponseDto> {
    await this.alertsService.toggleAll(user.id, toggleAllAlertsDto.active);
    return new ResponseDto({
      success: true,
      message: '모든 알림 설정 상태가 변경되었습니다.',
    });
  }
}
