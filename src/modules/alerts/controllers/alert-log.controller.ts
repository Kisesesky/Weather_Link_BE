import {
  Controller,
  Sse,
  UseGuards,
  Get,
  Param,
  Logger,
  Query,
} from '@nestjs/common';
import { map } from 'rxjs';
import { AlertLogService } from '../services/alert-log.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('알림 로그')
@ApiBearerAuth()
@Controller('alerts')
export class AlertLogController {
  private readonly logger = new Logger(AlertLogController.name);

  constructor(private readonly alertsService: AlertLogService) {}

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getLogs(@RequestUser() user: User) {
    this.logger.log(
      `[AlertLogController] 알람 로그 조회 요청 받음. 사용자 ID: ${user.id}`,
    );
    return await this.alertsService.getLogs(user.id);
  }

  @Sse('subscribe/:userId')
  subscribe(@Param('userId') userId: string) {
    return this.alertsService.getUserStream(userId).pipe(
      map((alert) => ({
        type: 'weather-alert',
        data: alert,
      })),
    );
  }

  @Get('send-test-alert/:userId')
  sendTestAlert(
    @Param('userId') userId: string,
    @Query('message') message: string = '테스트 알림입니다!',
    @Query('type') type: string = 'test',
  ) {
    this.alertsService.sendAlertToUser(userId, { message, type });
    return { success: true, message: `[${userId}] 테스트 알림 전송` };
  }
}
