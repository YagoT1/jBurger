import type { NextFunction, Request, Response } from 'express';
import type { SecuredRequest } from '../../security/security.types.js';

const firstHeaderValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export function securityContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const securedRequest = req as Request & SecuredRequest;
  const tenantId = firstHeaderValue(req.headers['x-tenant-id']);
  const branchId = firstHeaderValue(req.headers['x-branch-id']);
  securedRequest.context = {
    requestId:
      typeof req.headers['x-request-id'] === 'string'
        ? req.headers['x-request-id']
        : crypto.randomUUID(),
    ...(tenantId === undefined ? {} : { tenantId }),
    ...(branchId === undefined ? {} : { branchId }),
  };
  next();
}
