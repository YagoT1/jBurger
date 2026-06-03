import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { SecuredRequest } from '../../security/security.types.js';
export const Branch = createParamDecorator((_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<SecuredRequest>().context?.branchId);
