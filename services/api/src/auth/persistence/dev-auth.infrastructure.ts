import type {
  AuthRepository,
  AuthSession,
  AuthTokens,
  AuthenticatedPrincipal,
  LoginCommand,
  SessionRepository,
  SupabaseAuthGateway,
} from '@jburger/domain-auth';
import { permissionVocabulary } from '@jburger/domain-permissions';

/**
 * Infraestructura de autenticación SOLO para desarrollo local sin Supabase configurado.
 * Se activa únicamente cuando faltan las variables SUPABASE_* y NODE_ENV !== 'production'
 * (en producción la ausencia de configuración aborta el bootstrap).
 */
export const DEV_USER_ID = '00000000-0000-0000-0000-0000000000aa';
export const DEV_ACCESS_TOKEN = 'dev-access-token';
export const DEV_REFRESH_TOKEN = 'dev-refresh-token';

const devTokens = (): AuthTokens => ({
  accessToken: DEV_ACCESS_TOKEN,
  refreshToken: DEV_REFRESH_TOKEN,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
});

export class DevAuthGateway implements SupabaseAuthGateway {
  async signInWithPassword(
    command: LoginCommand,
  ): Promise<{ userId: string; email?: string | undefined; tokens: AuthTokens }> {
    return { userId: DEV_USER_ID, email: command.email, tokens: devTokens() };
  }
  async validateAccessToken(
    accessToken: string,
  ): Promise<{ userId: string; email?: string | undefined }> {
    if (accessToken !== DEV_ACCESS_TOKEN) {
      throw new Error('Invalid access token.');
    }
    return { userId: DEV_USER_ID, email: 'dev@jburger.local' };
  }
  async refreshSession(refreshToken: string): Promise<AuthTokens> {
    if (refreshToken !== DEV_REFRESH_TOKEN) {
      throw new Error('Invalid refresh token.');
    }
    return devTokens();
  }
}

export class DevAuthRepository implements AuthRepository {
  async resolvePrincipal(
    userId: string,
    tenantId?: string,
    branchId?: string,
  ): Promise<AuthenticatedPrincipal | undefined> {
    if (userId !== DEV_USER_ID) {
      return undefined;
    }
    return {
      id: DEV_USER_ID,
      email: 'dev@jburger.local',
      tenantId,
      branchId,
      roleKeys: ['ADMIN'],
      permissions: [...permissionVocabulary],
      isGuest: false,
    };
  }
  resolveGuest(tenantId?: string, branchId?: string): AuthenticatedPrincipal {
    return {
      id: 'guest',
      tenantId,
      branchId,
      roleKeys: ['GUEST'],
      permissions: ['products.read'],
      isGuest: true,
    };
  }
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions: AuthSession[] = [];
  async create(session: Omit<AuthSession, 'id' | 'createdAt'>): Promise<AuthSession> {
    const created: AuthSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.sessions.push(created);
    return created;
  }
  async findById(id: string): Promise<AuthSession | undefined> {
    return this.sessions.find((session) => session.id === id);
  }
  async listByUser(userId: string): Promise<AuthSession[]> {
    return this.sessions.filter((session) => session.userId === userId);
  }
  async revoke(id: string, actorId: string): Promise<void> {
    void actorId; // AuthSession no modela revokedBy; el dato queda en el evento de auditoría del dominio.
    const index = this.sessions.findIndex((session) => session.id === id);
    const existing = this.sessions[index];
    if (existing && !existing.revokedAt) {
      this.sessions[index] = { ...existing, revokedAt: new Date().toISOString() };
    }
  }
}
