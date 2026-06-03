type RequestLike = { headers: Record<string, string | string[] | undefined> };
type ResponseLike = unknown;
type NextFunctionLike = () => void;
export function securityContextMiddleware(req: RequestLike, _res: ResponseLike, next: NextFunctionLike): void { req.headers['x-request-id'] = req.headers['x-request-id'] ?? crypto.randomUUID(); next(); }
