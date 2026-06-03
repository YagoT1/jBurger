import { createEventMetadata, type EventPublisher } from '@jburger/domain-events';
import type { AuthSession, SessionRepository } from './contracts.js';
export class SessionService {
  constructor(private readonly repository: SessionRepository, private readonly events: EventPublisher) {}
  create(session: Omit<AuthSession, 'id' | 'createdAt'>): Promise<AuthSession> { return this.repository.create(session); }
  async validate(sessionId: string): Promise<AuthSession> { const session = await this.repository.findById(sessionId); if (!session) throw new Error('Session not found.'); if (session.revokedAt) throw new Error('Session has been revoked.'); if (new Date(session.expiresAt).getTime() <= Date.now()) throw new Error('Session has expired.'); return session; }
  listByUser(userId: string): Promise<AuthSession[]> { return this.repository.listByUser(userId); }
  async revoke(sessionId: string, actorId: string): Promise<void> { const session = await this.repository.findById(sessionId); await this.repository.revoke(sessionId, actorId); await this.events.publish({ metadata: createEventMetadata({ eventName: 'SESSION_REVOKED', category: 'audit', schemaVersion: 1, tenantId: session?.tenantId, branchId: session?.branchId, actorId }), action: 'SESSION_REVOKED', resource: 'session', resourceId: sessionId, payload: {} }); }
}
