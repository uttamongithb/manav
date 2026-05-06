import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

type RequestWithUser = {
  user?: {
    sub: string;
    role?: string;
  };
};

@Injectable()
export class PoetRoleGuard implements CanActivate {
  private readonly allowedRoles = new Set(['poet', 'admin', 'superadmin']);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const role = req.user?.role?.toLowerCase?.();

    if (!req.user) {
      throw new UnauthorizedException('Authentication is required');
    }

    if (!role || !this.allowedRoles.has(role)) {
      throw new ForbiddenException('Poet access required to upload content');
    }

    return true;
  }
}
