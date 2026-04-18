import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type CurrentUserPayload = {
  sub: string;
  email: string;
  username: string;
  displayName?: string | null;
  role?: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const req = ctx.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    return req.user as CurrentUserPayload;
  },
);
