/**
 * Estrategia única de errores del frontend (Screen Spec §3.0).
 * Toda falla — red, backend, dominio, auth — se normaliza a `AppError` en el cliente HTTP.
 * Las pantallas NUNCA interpretan respuestas crudas ni códigos HTTP.
 */
export type AppErrorKind =
  | 'network' // sin conexión / DNS / abortado
  | 'timeout'
  | 'unauthorized' // 401 → renovar sesión o ir a auth
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'business' // 4xx con código de dominio (PRICE_CHANGED, CART_INVALID_ITEMS, …)
  | 'conflict' // 409 sin código de dominio conocido
  | 'validation' // 400/422 de DTO
  | 'server'; // 5xx / respuesta malformada

/** Códigos de dominio del backend que la UI trata de forma diferenciada (contratos existentes). */
export type DomainErrorCode =
  | 'PRICE_CHANGED'
  | 'CART_CONFLICT'
  | 'CART_INVALID_ITEMS'
  | 'CART_EMPTY'
  | 'CART_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'TRANSITION_CONFLICT'
  | 'ORDER_NOT_PAYABLE'
  | 'PAYMENT_NOT_FOUND'
  | 'PAYMENT_ALREADY_APPROVED'
  | 'PAYMENT_CONFLICT'
  | 'PROVIDER_UNAVAILABLE'
  | 'VERSION_CONFLICT'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'QUANTITY_OUT_OF_RANGE'
  | 'ITEM_NOT_FOUND';

export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    message: string,
    readonly code?: DomainErrorCode | string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  /** Recuperable = la UI ofrece reintento u otro camino en el lugar (regla UX §8). */
  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }
}

interface BackendErrorBody {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  details?: unknown;
}

const kindFromStatus = (status: number, hasDomainCode: boolean): AppErrorKind => {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404 && !hasDomainCode) return 'not_found';
  if (hasDomainCode) return 'business';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  return 'server';
};

export const toAppError = (status: number, body: unknown): AppError => {
  const parsed = (body ?? {}) as BackendErrorBody;
  const message = Array.isArray(parsed.message)
    ? parsed.message.join(' ')
    : (parsed.message ?? `Request failed with status ${status}`);
  const hasDomainCode = typeof parsed.code === 'string' && parsed.code.length > 0;
  return new AppError(
    kindFromStatus(status, hasDomainCode),
    message,
    hasDomainCode ? parsed.code : undefined,
    status,
    parsed.details,
  );
};
