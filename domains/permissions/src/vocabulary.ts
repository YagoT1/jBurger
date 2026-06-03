export const permissionVocabularyVersion = '2026.06.wave1';
export const permissionVocabulary = [
  'users.read', 'users.write',
  'products.read', 'products.write',
  'orders.read', 'orders.write',
  'payments.read', 'payments.refund',
  'audit.read', 'audit.export',
  'support.access', 'support.break_glass',
  'roles.read', 'roles.write',
  'permissions.read', 'permissions.write',
  'sessions.read', 'sessions.revoke',
  'tenants.assign', 'branches.assign'
] as const;
export type PermissionKey = (typeof permissionVocabulary)[number];
export const isPermissionKey = (value: string): value is PermissionKey => permissionVocabulary.includes(value as PermissionKey);
