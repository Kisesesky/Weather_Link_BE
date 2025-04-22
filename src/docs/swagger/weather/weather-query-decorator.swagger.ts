import { ApiQuery } from '@nestjs/swagger';

export const ApiSidoQuery = () =>
  ApiQuery({
    name: 'sido',
    description: '시도 이름 (예: 서울특별시)',
    required: true,
    example: '서울특별시',
    type: String,
  });

export const ApiGugunQuery = () =>
  ApiQuery({
    name: 'gugun',
    description: '구군 이름 (예: 강남구)',
    required: true,
    example: '강남구',
    type: String,
  });
