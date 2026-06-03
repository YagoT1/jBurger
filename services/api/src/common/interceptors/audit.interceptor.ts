import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
@Injectable()
export class AuditInterceptor implements NestInterceptor { intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> { return next.handle(); } }
