export type CurrencyCode = 'ARS' | 'USD' | 'MXN' | 'EUR';
export interface Money {
  amount: number;
  currency: CurrencyCode;
}
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
export type Email = string & { readonly brand: 'Email' };
export type Phone = string & { readonly brand: 'Phone' };
export interface Coordinates {
  latitude: number;
  longitude: number;
}
export interface AuditMetadata {
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
}
export interface TenantContext {
  tenantId: string;
  tenantSlug?: string;
}
export interface BranchContext extends TenantContext {
  branchId: string;
}
export interface DomainError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
export type Result<T, E extends DomainError = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
export interface Pagination {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages?: number;
}
export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}
export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = <E extends DomainError>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
