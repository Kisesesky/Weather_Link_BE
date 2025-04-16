import { IsInt, Min } from 'class-validator';

export class PaginationDto {
  @IsInt()
  @Min(0)
  skip: number = 0;

  @IsInt()
  @Min(1)
  take: number = 10;
}
