import type { AuthorizationContext } from '@jburger/authorization';
export interface RequestContext { requestId: string; tenantId?: string | undefined; branchId?: string | undefined; auth?: AuthorizationContext & { sessionId?: string | undefined }; }
export interface SecuredRequest { headers: Record<string, string | string[] | undefined>; params: Record<string, string | undefined>; body?: unknown; context?: RequestContext; }
