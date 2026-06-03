export interface AuthorizationContext {
  actorId?: string;
  tenantId?: string;
  branchId?: string;
  roleKeys: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isServiceAccount?: boolean;
}

export interface AuthorizationRequest {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  tenantId?: string;
  branchId?: string;
  allowServiceAccount?: boolean;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: 'UNAUTHENTICATED' | 'TENANT_MISMATCH' | 'BRANCH_MISMATCH' | 'MISSING_PERMISSION';
  missingPermissions?: string[];
}

export interface PermissionEvaluator {
  hasPermission(context: AuthorizationContext, permission: string): boolean;
  hasAnyPermission(context: AuthorizationContext, permissions: string[]): boolean;
  hasAllPermissions(context: AuthorizationContext, permissions: string[]): boolean;
}

export interface RoleEvaluator {
  hasRole(context: AuthorizationContext, roleKey: string): boolean;
}

export class DefaultPermissionEvaluator implements PermissionEvaluator {
  hasPermission(context: AuthorizationContext, permission: string): boolean {
    return context.permissions.includes(permission);
  }
  hasAnyPermission(context: AuthorizationContext, permissions: string[]): boolean {
    return permissions.length === 0 || permissions.some((permission) => this.hasPermission(context, permission));
  }
  hasAllPermissions(context: AuthorizationContext, permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(context, permission));
  }
}

export class DefaultRoleEvaluator implements RoleEvaluator {
  hasRole(context: AuthorizationContext, roleKey: string): boolean {
    return context.roleKeys.includes(roleKey);
  }
}

export class PolicyEngine {
  constructor(private readonly permissionEvaluator: PermissionEvaluator = new DefaultPermissionEvaluator()) {}

  evaluate(context: AuthorizationContext, request: AuthorizationRequest): AuthorizationResult {
    if (request.allowServiceAccount && context.isServiceAccount) return { allowed: true };
    if (!context.isAuthenticated) return { allowed: false, reason: 'UNAUTHENTICATED' };
    if (request.tenantId && context.tenantId !== request.tenantId) return { allowed: false, reason: 'TENANT_MISMATCH' };
    if (request.branchId && context.branchId !== request.branchId) return { allowed: false, reason: 'BRANCH_MISMATCH' };

    const required = [
      ...(request.permission ? [request.permission] : []),
      ...(request.allPermissions ?? [])
    ];
    const missing = required.filter((permission) => !this.permissionEvaluator.hasPermission(context, permission));
    if (missing.length > 0) return { allowed: false, reason: 'MISSING_PERMISSION', missingPermissions: missing };
    if (request.anyPermissions && !this.permissionEvaluator.hasAnyPermission(context, request.anyPermissions)) {
      return { allowed: false, reason: 'MISSING_PERMISSION', missingPermissions: request.anyPermissions };
    }
    return { allowed: true };
  }
}

export interface AuthorizationMiddlewareInput {
  context: AuthorizationContext;
  request: AuthorizationRequest;
}

export const createAuthorizationMiddleware = (engine = new PolicyEngine()) => (input: AuthorizationMiddlewareInput): AuthorizationResult => engine.evaluate(input.context, input.request);
