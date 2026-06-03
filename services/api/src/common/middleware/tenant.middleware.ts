import type { NextFunction, Request, Response } from 'express';

export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const tenantHeader = req.headers['x-tenant-id'];
  req.context = req.context ?? { requestId: crypto.randomUUID() };
  req.context.tenantId = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader;
  next();
}
