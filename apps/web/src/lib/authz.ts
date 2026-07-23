/**
 * Autorización centralizada del frontend (Screen Spec §8; regla 14 de arquitectura).
 * Prohibido `if (role === 'admin')` en componentes: siempre `can(principal, permission)`.
 * El vocabulario de permisos es el canónico del backend (formato punto).
 */
export type Permission =
  | 'catalog.read'
  | 'catalog.write'
  | 'orders.read'
  | 'orders.write'
  | 'payments.read'
  | 'payments.refund'
  | 'users.read'
  | 'users.write'
  | 'roles.read'
  | 'roles.write'
  | 'permissions.read';

export interface Principal {
  actorId: string;
  permissions: readonly string[];
  roleKeys: readonly string[];
  branchId?: string;
}

export const can = (principal: Principal | undefined, permission: Permission): boolean =>
  principal !== undefined && principal.permissions.includes(permission);

export const isStaff = (principal: Principal | undefined): boolean => can(principal, 'orders.read');
