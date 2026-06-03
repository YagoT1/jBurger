import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';
import type { SecuredRequest } from '../../security/security.types.js';
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<SecuredRequest>();
    return next.handle().pipe(tap(() => { if (request.context?.auth) console.log(JSON.stringify({ type: 'audit_hook', actorId: request.context.auth.actorId, tenantId: request.context.tenantId, branchId: request.context.branchId, requestId: request.context.requestId })); }));
  }
}
