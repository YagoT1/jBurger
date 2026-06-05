import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyEngine } from '@jburger/authorization';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import type { SecuredRequest } from '../../security/security.types.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly engine = new PolicyEngine();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<SecuredRequest>();

    const auth = request.context?.auth;

    if (!auth) {
      throw new ForbiddenException('Authentication context is required.');
    }

    const result = this.engine.evaluate(auth, {
      allPermissions: permissions,
      ...(request.context?.tenantId ? { tenantId: request.context.tenantId } : {}),
      ...(request.context?.branchId ? { branchId: request.context.branchId } : {}),
    });

    if (!result.allowed) {
      throw new ForbiddenException(result.reason ?? 'Forbidden');
    }

    return true;
  }
}
