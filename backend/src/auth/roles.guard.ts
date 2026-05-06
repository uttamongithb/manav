import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('Authentication is required');
    }

    const userRole = user.role?.toLowerCase();
    
    const hasRole = requiredRoles.some((role) => role.toLowerCase() === userRole);

    if (!hasRole) {
      throw new ForbiddenException(`Access denied: required role is one of [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}
