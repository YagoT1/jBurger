import type { RequestContext } from '../security/security.types.js';
declare module 'express-serve-static-core' { interface Request { context?: RequestContext; } }
