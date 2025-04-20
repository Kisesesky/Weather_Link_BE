import { IsString, IsEnum, IsOptional } from 'class-validator';
import { RegisterType } from 'src/modules/users/entities/user.entity';

export class ResponseSignUpDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsEnum(RegisterType)
  registerType: RegisterType;
}
