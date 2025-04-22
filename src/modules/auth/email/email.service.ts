import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CACHE_MANAGER } from "@nestjs/cache-manager"
import { Cache } from "cache-manager"

type VerificationType = 'signup' | 'password';

@Injectable()
export class EmailService {
  private transporter: any;
  private readonly logger = new Logger(EmailService.name)
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  private getVerificationKey(email: string): string {
    return `verification:${email}`
  }

  
  private getVerifiedKey(email: string): string {
    return `verified:${email}`
  }

  private generateEmailTemplate(type: VerificationType, code: string): string {
    const contextMessage =
      type === 'signup'
        ? `아래의 인증번호를 회원가입 화면에 입력해주세요.`
        : `아래의 인증번호를 입력해주세요.`;

    const subjectTitle =
      type === 'signup'
        ? '[Weather_Link] 회원가입을 위한 인증번호입니다.'
        : '[Weather_Link] 비밀번호 재설정을 위한 인증번호입니다.';

    return `
      <div style="max-width: 520px; margin: 40px auto; padding: 40px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 24px;">
        <img src="https://velog.velcdn.com/images/kisesesky19/post/7f3a6754-cbdd-4139-bc62-badd3a752920/image.png" alt="Weather-Link Logo" style="height: 40px; margin-right: 12px;" />
        <h2 style="font-size: 20px; font-weight: 600; color: #222; margin: 0;">이메일 인증 안내</h2>
      </div>
      <p style="font-size: 15px; color: #555; margin-bottom: 24px;">
          ${contextMessage}<br/>
          기상정보 기반의 스마트한 라이프, <strong>Weather-Link</strong>가 함께합니다.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 12px 24px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #222; border-radius: 8px; background-color: #f2f3f5;">
            🔐 ${code}
          </div>
        </div>
        <p style="font-size: 13px; color: #999; line-height: 1.6;">
          이 메일을 <strong>중요 메일함</strong>으로 설정해주세요.<br/>
          그래야 Weather-Link로부터 발송되는 이메일이 스팸으로 처리되지 않아요.<br/>
          요청하신 일을 돕는 꼭 필요한 안내만 신속하게 전달해드릴게요.
        </p>
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
        <div style="font-size: 12px; color: #999; line-height: 1.6;">
          Weather-Link 주식회사<br/>
          서울특별시 성동구 아차산로 17길 48, 성수낙낙 2층 (엘리스랩 성수점)<br/>
          Copyright ⓒ Weather-Link. All Rights Reserved.
        </div>
        <p style="margin-top: 20px; font-size: 11px; color: #ccc;">
          ※ 본 메일은 발신 전용입니다. 회신하셔도 답변드릴 수 없습니다.
        </p>
      </div>
    `;
  }

  async sendVerificationCode(to: string, type: VerificationType = 'signup') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try{
      await this.cacheManager.set(this.getVerificationKey(to),code, 120); //2분
      const subject =
        type === 'signup'
          ? '[Weather_Link] 회원가입을 위한 인증번호입니다.'
          : '[Weather_Link] 비밀번호 재설정을 위한 인증번호입니다.';

      const html = this.generateEmailTemplate(type, code);
      const mailOptions = {
        from: process.env.MAIL_USER,
        to,
        subject,
        html,
      };
      await this.transporter.sendMail(mailOptions);

      if(process.env.NODE_ENV === 'dev') {
        this.logger.log(`인증코드: ${code}`)
      }
    } catch (error) {
      this.logger.error('Cache error:', error)
      throw new InternalServerErrorException('인증 코드 생성 중 오류가 발생하였습니다.')
    }
    
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const storedCode = await this.cacheManager.get(this.getVerificationKey(email));
    if (!storedCode || storedCode.toString().trim() !== code.trim()) {
      this.logger.warn(`이메일: ${email}, 인증 코드가 일치하지 않음 (입력 코드: ${code})`);
      return false;
    }
  

    await this.cacheManager.del(this.getVerificationKey(email));
    await this.cacheManager.set(this.getVerifiedKey(email), 'true', 24 * 60 * 60 * 1000); //24시간
    return true;
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const verified = await this.cacheManager.get(this.getVerifiedKey(email))
    return verified === 'true'
  }
}
