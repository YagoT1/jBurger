import { describe, expect, it } from 'vitest';
import { PolicyEngine } from './index.js';
describe('PolicyEngine', () => { it('denies missing permissions', () => { const result = new PolicyEngine().evaluate({ isAuthenticated: true, roleKeys: [], permissions: [] }, { permission: 'users.read' }); expect(result.allowed).toBe(false); }); });
