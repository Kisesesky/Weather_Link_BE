import { IsString, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class SearchUsersQueryDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
