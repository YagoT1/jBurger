import { createEventMetadata, type EventPublisher } from '@jburger/domain-events';
import type { AuthRepository, AuthenticatedPrincipal, AuthTokens, LoginCommand, SupabaseAuthGateway } from './contracts.js';
import { SessionService } from './session.service.js';
export class AuthService {
  constructor(private readonly gateway: SupabaseAuthGateway, private readonly authRepository: AuthRepository, private readonly sessions: SessionService, private readonly events: EventPublisher) {}
  async login(command: LoginCommand): Promise<{ principal: AuthenticatedPrincipal; tokens: AuthTokens; sessionId: string }> {
    try {
      const auth = await this.gateway.signInWithPassword(command);
      const principal = await this.authRepository.resolvePrincipal(auth.userId, command.tenantId, command.branchId);
      if (!principal) throw new Error('Authenticated user is not assigned to this tenant or branch.');
      const session = await this.sessions.create({ userId: auth.userId, tenantId: command.tenantId, branchId: command.branchId, expiresAt: auth.tokens.expiresAt, ipAddress: command.ipAddress, userAgent: command.userAgent });
      await this.events.publish({ metadata: createEventMetadata({ eventName: 'LOGIN_SUCCESS', category: 'audit', schemaVersion: 1, tenantId: command.tenantId, branchId: command.branchId, actorId: auth.userId }), action: 'LOGIN_SUCCESS', resource: 'session', resourceId: session.id, payload: { email: auth.email } });
      return { principal, tokens: auth.tokens, sessionId: session.id };
    } catch (error) {
      await this.events.publish({ metadata: createEventMetadata({ eventName: 'LOGIN_FAILED', category: 'audit', schemaVersion: 1, tenantId: command.tenantId, branchId: command.branchId }), action: 'LOGIN_FAILED', resource: 'session', payload: { email: command.email, reason: error instanceof Error ? error.message : 'unknown' } });
      throw error;
    }
  }
  async validateAccessToken(accessToken: string, tenantId?: string, branchId?: string): Promise<AuthenticatedPrincipal> { const token = await this.gateway.validateAccessToken(accessToken); const principal = await this.authRepository.resolvePrincipal(token.userId, tenantId, branchId); if (!principal) throw new Error('Principal could not be resolved.'); return principal; }
  refresh(refreshToken: string): Promise<AuthTokens> { return this.gateway.refreshSession(refreshToken); }
  guest(tenantId?: string, branchId?: string): AuthenticatedPrincipal { return this.authRepository.resolveGuest(tenantId, branchId); }
}
