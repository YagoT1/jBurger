import { Injectable } from '@nestjs/common';
import type { AuthorizationContext } from '@jburger/authorization';
import type { SecuredRequest } from './security.types.js';
export interface TenantScope { tenantId: string; }
export interface BranchScope extends TenantScope { branchId: string; }
@Injectable()
export class TenantContextResolver { resolve(request: SecuredRequest): string | undefined { const value = request.headers['x-tenant-id']; return Array.isArray(value) ? value[0] : value; } validate(context: AuthorizationContext, tenantId?: string): boolean { return !tenantId || context.tenantId === tenantId; } }
@Injectable()
export class BranchContextResolver { resolve(request: SecuredRequest): string | undefined { const value = request.headers['x-branch-id']; return Array.isArray(value) ? value[0] : value; } validate(context: AuthorizationContext, branchId?: string): boolean { return !branchId || context.branchId === branchId; } }
