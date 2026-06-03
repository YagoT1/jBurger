import { describe, expect, it } from 'vitest';
import { PolicyEngine } from '@jburger/authorization';
describe('API authorization policy', () => { it('allows exact permissions', () => { const result = new PolicyEngine().evaluate({ isAuthenticated: true, roleKeys: ['ADMIN'], permissions: ['users.read'] }, { permission: 'users.read' }); expect(result.allowed).toBe(true); }); });
