import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class SearchFriendsDto extends PaginationDto {
  @ApiProperty({ description: '검색할 친구 닉네임', required: true })
  @IsString()
  @IsNotEmpty()
  name: string;
}
