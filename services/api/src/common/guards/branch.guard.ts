import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { SecuredRequest } from '../../security/security.types.js';
@Injectable()
export class BranchGuard implements CanActivate { canActivate(context: ExecutionContext): boolean { const request = context.switchToHttp().getRequest<SecuredRequest>(); if (request.context?.branchId && request.context.auth?.branchId && request.context.branchId !== request.context.auth.branchId) throw new ForbiddenException('Cross-branch access denied.'); return true; } }
