import { describe, expect, it } from 'vitest';
import { AuthService, SessionService } from '@jburger/domain-auth';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import {
  DEV_ACCESS_TOKEN,
  DevAuthGateway,
  DevAuthRepository,
  InMemorySessionRepository,
} from './persistence/dev-auth.infrastructure.js';

const createService = () => {
  const events = new InMemoryEventPublisher();
  const sessions = new SessionService(new InMemorySessionRepository(), events);
  return {
    events,
    sessions,
    service: new AuthService(new DevAuthGateway(), new DevAuthRepository(), sessions, events),
  };
};

describe('Auth flow (dev infrastructure)', () => {
  it('logs in, creates a session and audits LOGIN_SUCCESS', async () => {
    const { events, service } = createService();
    const result = await service.login({
      email: 'dev@jburger.local',
      password: 'dev-password-1',
      tenantId: 'tenant_1',
    });
    expect(result.tokens.accessToken).toBe(DEV_ACCESS_TOKEN);
    expect(result.principal.permissions).toContain('products.write');
    expect(result.sessionId).toBeTruthy();
    expect(events.events.some((event) => event.metadata.eventName === 'LOGIN_SUCCESS')).toBe(true);
  });

  it('validates access tokens and rejects invalid ones', async () => {
    const { service } = createService();
    const principal = await service.validateAccessToken(DEV_ACCESS_TOKEN, 'tenant_1');
    expect(principal.roleKeys).toContain('ADMIN');
    await expect(service.validateAccessToken('forged-token')).rejects.toThrow();
  });

  it('revokes sessions and audits SESSION_REVOKED', async () => {
    const { events, sessions, service } = createService();
    const result = await service.login({ email: 'dev@jburger.local', password: 'dev-password-1' });
    await sessions.revoke(result.sessionId, result.principal.id);
    await expect(sessions.validate(result.sessionId)).rejects.toThrow('Session has been revoked.');
    expect(events.events.some((event) => event.metadata.eventName === 'SESSION_REVOKED')).toBe(
      true,
    );
  });
});
