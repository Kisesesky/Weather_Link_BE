import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestOrigin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['origin']
      ? request.headers['origin']
      : request.hostname;
  },
);
