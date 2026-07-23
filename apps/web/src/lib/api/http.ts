import { env } from '../../env.js';
import { AppError, toAppError } from './errors.js';

/**
 * Cliente HTTP único del frontend (Frontend API Matrix, Screen Spec §7).
 * - Componentes y hooks NUNCA llaman a fetch: solo los módulos api.ts de cada feature usan esto.
 * - Inyecta headers de contexto (tenant/branch/auth) desde un provider, no desde las pantallas.
 * - Normaliza toda falla a AppError; timeout explícito; reintento SOLO en GET idempotentes.
 */
export interface ApiContext {
  tenantId: string;
  branchId?: string;
  accessToken?: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  /** Reintentos automáticos solo para lecturas idempotentes (default: 1 retry en GET). */
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 8000;

async function attempt<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    throw new AppError(
      aborted ? 'timeout' : 'network',
      aborted ? 'La consulta tardó demasiado.' : 'No pudimos conectar. Revisá tu conexión.',
    );
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw toAppError(response.status, body);
  }
  return body as T;
}

export async function apiRequest<T>(
  path: string,
  context: ApiContext,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const retries = options.retries ?? (method === 'GET' ? 1 : 0);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-tenant-id': context.tenantId,
    ...(context.branchId ? { 'x-branch-id': context.branchId } : {}),
    ...(context.accessToken ? { authorization: `Bearer ${context.accessToken}` } : {}),
  };
  const init: RequestInit = {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  };
  const url = `${env.NEXT_PUBLIC_API_URL}${path}`;

  let lastError: AppError | undefined;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await attempt<T>(url, init, timeoutMs);
    } catch (error) {
      lastError = error instanceof AppError ? error : new AppError('server', String(error));
      if (!lastError.isRetryable || i === retries) {
        throw lastError;
      }
    }
  }
  // Inalcanzable: el loop siempre retorna o lanza. Existe para satisfacer el control de flujo.
  throw lastError ?? new AppError('server', 'Unknown request failure.');
}

/** Envoltura estándar de respuesta del backend (`{ data: … }`). */
export interface DataEnvelope<T> {
  data: T;
}
