import { ServiceUnavailableException } from '@nestjs/common';
import type {
  AuthRepository,
  AuthSession,
  AuthenticatedPrincipal,
  SessionRepository,
} from '@jburger/domain-auth';
import { eq, SupabaseRestClient } from '../../common/persistence/supabase-rest.client.js';

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  nombre: string;
  active: boolean;
}
interface UserRoleRow {
  role_id: string;
  roles: { nombre: string } | null;
}
interface RolePermissionRow {
  permissions: { key: string } | null;
}
interface UserBranchRow {
  branch_id: string;
}
interface SessionRow {
  id: string;
  user_id: string;
  tenant_id: string | null;
  branch_id: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

const toSession = (row: SessionRow): AuthSession => ({
  id: row.id,
  userId: row.user_id,
  tenantId: row.tenant_id ?? undefined,
  branchId: row.branch_id ?? undefined,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at ?? undefined,
  createdAt: row.created_at,
  ipAddress: row.ip_address ?? undefined,
  userAgent: row.user_agent ?? undefined,
});

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseRestClient) {}
  async resolvePrincipal(
    userId: string,
    tenantId?: string,
    branchId?: string,
  ): Promise<AuthenticatedPrincipal | undefined> {
    const tenantFilter = tenantId ? `&tenant_id=${eq(tenantId)}` : '';
    const users = await this.client.select<UserRow>(
      `users?id=${eq(userId)}&active=eq.true${tenantFilter}&limit=1`,
    );
    const user = users[0];
    if (!user) {
      return undefined;
    }
    if (branchId) {
      const branches = await this.client.select<UserBranchRow>(
        `user_branches?user_id=${eq(userId)}&select=branch_id`,
      );
      if (branches.length > 0 && !branches.some((row) => row.branch_id === branchId)) {
        return undefined;
      }
    }
    const roleRows = await this.client.select<UserRoleRow>(
      `user_roles?user_id=${eq(userId)}&tenant_id=${eq(user.tenant_id)}&select=role_id,roles(nombre)`,
    );
    const roleIds = roleRows.map((row) => row.role_id);
    const roleKeys = roleRows
      .map((row) => row.roles?.nombre)
      .filter((nombre): nombre is string => typeof nombre === 'string');
    let permissions: string[] = [];
    if (roleIds.length > 0) {
      const permissionRows = await this.client.select<RolePermissionRow>(
        `role_permissions?role_id=in.(${roleIds.map((id) => encodeURIComponent(id)).join(',')})&select=permissions(key)`,
      );
      permissions = [
        ...new Set(
          permissionRows
            .map((row) => row.permissions?.key)
            .filter((key): key is string => typeof key === 'string'),
        ),
      ];
    }
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      branchId,
      roleKeys,
      permissions,
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

export class SupabaseSessionRepository implements SessionRepository {
  constructor(private readonly client: SupabaseRestClient) {}
  async create(session: Omit<AuthSession, 'id' | 'createdAt'>): Promise<AuthSession> {
    const rows = await this.client.insert<SessionRow>('session_tracking', {
      user_id: session.userId,
      tenant_id: session.tenantId ?? null,
      branch_id: session.branchId ?? null,
      expires_at: session.expiresAt,
      ip_address: session.ipAddress ?? null,
      user_agent: session.userAgent ?? null,
    });
    const row = rows[0];
    if (!row) {
      throw new ServiceUnavailableException('Session storage is unavailable.');
    }
    return toSession(row);
  }
  async findById(id: string): Promise<AuthSession | undefined> {
    const rows = await this.client.select<SessionRow>(`session_tracking?id=${eq(id)}&limit=1`);
    const row = rows[0];
    return row ? toSession(row) : undefined;
  }
  async listByUser(userId: string): Promise<AuthSession[]> {
    const rows = await this.client.select<SessionRow>(
      `session_tracking?user_id=${eq(userId)}&order=created_at.desc`,
    );
    return rows.map(toSession);
  }
  async revoke(id: string, actorId: string): Promise<void> {
    await this.client.patch<SessionRow>(`session_tracking?id=${eq(id)}&revoked_at=is.null`, {
      revoked_at: new Date().toISOString(),
      revoked_by: actorId,
    });
  }
}
