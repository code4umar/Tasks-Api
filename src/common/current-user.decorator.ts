import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../entities/User';

// Pulls the authenticated user off the request — populated by JwtStrategy's
// validate() method after JwtAuthGuard confirms the token. Usage:
//   create(@CurrentUser() user: User, @Body() dto: CreateTaskDto)
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
