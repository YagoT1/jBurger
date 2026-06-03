import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { SecuredRequest } from '../../security/security.types.js';
@Injectable()
export class TenantGuard implements CanActivate { canActivate(context: ExecutionContext): boolean { const request = context.switchToHttp().getRequest<SecuredRequest>(); if (request.context?.tenantId && request.context.auth?.tenantId && request.context.tenantId !== request.context.auth.tenantId) throw new ForbiddenException('Cross-tenant access denied.'); return true; } }
