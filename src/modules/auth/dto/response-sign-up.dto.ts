import { IsDate, IsString } from 'class-validator';

export class ResponseSignUpDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  theme: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
