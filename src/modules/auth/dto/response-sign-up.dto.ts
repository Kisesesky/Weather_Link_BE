import { IsDate, IsString, IsEnum } from 'class-validator';
import { RegisterType } from 'src/modules/users/entities/user.entity';
import { LocationsEntity } from 'src/modules/locations/entities/location.entity';

export class ResponseSignUpDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  theme: string;

  @IsEnum(RegisterType)
  registerType: RegisterType;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  location: LocationsEntity;
}
