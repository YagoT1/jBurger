import type { NextFunction, Request, Response } from 'express';
import type { SecuredRequest } from '../../security/security.types.js';

export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const securedRequest = req as Request & SecuredRequest;
  const tenantHeader = req.headers['x-tenant-id'];
  securedRequest.context = securedRequest.context ?? { requestId: crypto.randomUUID() };
  const tenantId = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader;
  if (tenantId !== undefined) {
    securedRequest.context.tenantId = tenantId;
  }
  next();
}
