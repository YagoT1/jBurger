import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@jburger/domain-auth';
import type { AuthenticatedPrincipal } from '@jburger/domain-auth';
import type { SecuredRequest } from '../../security/security.types.js';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SecuredRequest>();

    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required.');
    }

    let principal: AuthenticatedPrincipal;
    try {
      principal = await this.authService.validateAccessToken(
        header.slice('Bearer '.length),
        request.context?.tenantId,
        request.context?.branchId,
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    request.context = request.context ?? { requestId: crypto.randomUUID() };
    request.context.auth = {
      isAuthenticated: true,
      actorId: principal.id,
      ...(principal.tenantId ? { tenantId: principal.tenantId } : {}),
      ...(principal.branchId ? { branchId: principal.branchId } : {}),
      roleKeys: principal.roleKeys,
      permissions: principal.permissions,
    };

    return true;
  }
}
