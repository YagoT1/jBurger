import { apiRequest, type ApiContext } from '../../lib/api/http.js';
import type { Principal } from '../../lib/authz.js';

export interface Session {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  principal: Principal;
}

interface LoginResponseDto {
  data: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    principal: {
      actorId: string;
      permissions: string[];
      roleKeys: string[];
      branchId?: string;
    };
  };
}

const toSession = (dto: LoginResponseDto): Session => ({
  accessToken: dto.data.accessToken,
  refreshToken: dto.data.refreshToken,
  sessionId: dto.data.sessionId,
  principal: {
    actorId: dto.data.principal.actorId,
    permissions: dto.data.principal.permissions,
    roleKeys: dto.data.principal.roleKeys,
    ...(dto.data.principal.branchId !== undefined ? { branchId: dto.data.principal.branchId } : {}),
  },
});

export const login = async (
  context: ApiContext,
  email: string,
  password: string,
): Promise<Session> => {
  const response = await apiRequest<LoginResponseDto>('/auth/login', context, {
    method: 'POST',
    body: { email, password, tenantId: context.tenantId },
    timeoutMs: 10000,
    retries: 0,
  });
  return toSession(response);
};

export const refreshSession = async (
  context: ApiContext,
  refreshToken: string,
): Promise<Session> => {
  const response = await apiRequest<LoginResponseDto>('/auth/refresh', context, {
    method: 'POST',
    body: { refreshToken },
    retries: 0,
  });
  return toSession(response);
};

export const logout = async (context: ApiContext): Promise<void> => {
  await apiRequest('/auth/logout', context, { method: 'POST', retries: 0 });
};

// `register` y `resetPassword` se agregan cuando exista el backend NUEVO (PRD §17 RF-031).
// Deliberadamente NO se stubbean: un stub que finge éxito es el defecto B1 que acabamos de retirar.
