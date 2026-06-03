import type { NextFunction, Request, Response } from 'express';
export function securityContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const tenantHeader = req.headers['x-tenant-id'];
  const branchHeader = req.headers['x-branch-id'];
  req.context = {
    requestId: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : crypto.randomUUID(),
    tenantId: Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader,
    branchId: Array.isArray(branchHeader) ? branchHeader[0] : branchHeader
  };
  next();
}
