import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';

export async function paginate(
  entity: any,
  paginationDto: PaginationDto,
  queryBuilder?: any,
) {
  const { skip, take } = paginationDto;

  // QueryBuilder가 전달되면 해당 쿼리로 처리하고, 없으면 repo에서 기본 쿼리 실행
  const [data, total] = queryBuilder
    ? await queryBuilder.skip(skip).take(take).getManyAndCount()
    : await entity.findAndCount({
        skip,
        take,
      });

  const lastPage = Math.ceil(total / take);

  return { data, total, lastPage };
}
