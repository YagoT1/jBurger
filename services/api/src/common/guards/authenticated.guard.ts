import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { SecuredRequest } from '../../security/security.types.js';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SecuredRequest>();

    const authorization = request.headers.authorization;
    const token = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!token?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required.');
    }

    request.context = request.context ?? {
      requestId: crypto.randomUUID(),
    };

    request.context.auth = {
      isAuthenticated: true,
      actorId: 'current-user',
      ...(request.context.tenantId ? { tenantId: request.context.tenantId } : {}),
      ...(request.context.branchId ? { branchId: request.context.branchId } : {}),
      roleKeys: ['ADMIN'],
      permissions: [
        'users.read',
        'users.write',
        'roles.read',
        'roles.write',
        'permissions.read',
        'sessions.read',
        'sessions.revoke',
        'audit.read',
      ],
    };

    return true;
  }
}
