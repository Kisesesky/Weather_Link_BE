import { Injectable } from '@nestjs/common';
import { map, Subject } from 'rxjs';
import { AlertLog } from '../entities/alert-log.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';

@Injectable()
export class AlertLogService {
  constructor(
    @InjectRepository(AlertLog)
    private alertLogRepository: Repository<AlertLog>,
  ) {}

  private readonly userStreams = new Map<string, Subject<any>>();

  // 로그 저장
  async createLog(
    userId: string,
    alertSettingId: string,
    actualValue: number,
    unit: string,
    message: string,
    type: string,
  ) {
    const log = this.alertLogRepository.create({
      user: { id: userId },
      alertSetting: { id: alertSettingId },
      actualValue,
      unit,
      message,
      type,
    });
    await this.alertLogRepository.save(log);
  }

  // 로그 조회 (ID 기준)
  async getLogs(userId: string) {
    return await this.alertLogRepository.find({
      where: { user: { id: userId } },
      relations: ['alertSetting'],
    });
  }

  // 유저별 스트림 가져오기 (없으면 생성)
  getUserStream(userId: string): Subject<any> {
    if (!this.userStreams.has(userId)) {
      this.userStreams.set(userId, new Subject<any>());
    }
    return this.userStreams.get(userId)!;
  }

  // 알림 발송 (날씨 조건 충족 시 사용)
  sendAlertToUser(
    userId: string,
    alertData: { message: string; type: string },
  ) {
    const stream = this.userStreams.get(userId);
    if (stream) {
      stream.next(alertData);
    }
    console.log(`${userId}에게 알림: [${alertData.type}] ${alertData.message}`);
  }

  // SSE 구독 핸들러
  setupSseConnection(userId: string, res: Response) {
    const stream = this.getUserStream(userId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const subscription = stream
      .pipe(map((data) => `data: ${JSON.stringify(data)}\n\n`))
      .subscribe((message) => {
        if (!res.writableEnded) {
          res.write(message);
        }
      });

    // 연결 끊기 감지
    res.on('close', () => {
      console.log(`SSE 연결 종료: ${userId}`);
      subscription.unsubscribe();
      this.userStreams.delete(userId);
      res.end();
    });
  }
}
