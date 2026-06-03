import type { NextFunction, Request, Response } from 'express';

export function branchMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const branchHeader = req.headers['x-branch-id'];
  req.context = req.context ?? { requestId: crypto.randomUUID() };
  req.context.branchId = Array.isArray(branchHeader) ? branchHeader[0] : branchHeader;
  next();
}
