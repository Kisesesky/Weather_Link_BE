import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({
    type: String,
    description: '위치 ID',
    example: '9bb48bb2-0d6c-43a1-b0b2-406797ca2a93',
  })
  @IsString()
  @IsUUID()
  locationId: string;
}
