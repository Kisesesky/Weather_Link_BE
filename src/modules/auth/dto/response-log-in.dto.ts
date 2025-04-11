import { IsString } from 'class-validator';

export class ResponseLogInDto {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;
}
