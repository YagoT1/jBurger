import type { NextFunction, Request, Response } from 'express';
import type { SecuredRequest } from '../../security/security.types.js';

export function branchMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const securedRequest = req as Request & SecuredRequest;
  const branchHeader = req.headers['x-branch-id'];
  securedRequest.context = securedRequest.context ?? { requestId: crypto.randomUUID() };
  const branchId = Array.isArray(branchHeader) ? branchHeader[0] : branchHeader;
  if (branchId !== undefined) {
    securedRequest.context.branchId = branchId;
  }
  next();
}
