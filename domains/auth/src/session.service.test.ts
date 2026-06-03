import { InMemoryEventPublisher } from '@jburger/domain-events';
import { describe, expect, it } from 'vitest';
import { SessionService } from './session.service.js';
import type { AuthSession, SessionRepository } from './contracts.js';
const active: AuthSession = { id: 'session_1', userId: 'user_1', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() };
const repository: SessionRepository = { async create(session) { return { ...session, id: 'session_1', createdAt: new Date().toISOString() }; }, async findById() { return active; }, async listByUser() { return [active]; }, async revoke() {} };
describe('SessionService', () => { it('validates active sessions', async () => { await expect(new SessionService(repository, new InMemoryEventPublisher()).validate('session_1')).resolves.toEqual(active); }); });
