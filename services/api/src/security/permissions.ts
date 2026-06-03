export const permissionVocabulary = {
  users: ['users:read', 'users:create', 'users:update', 'users:disable'],
  roles: ['roles:read', 'roles:create', 'roles:update', 'roles:assign'],
  permissions: ['permissions:read'],
  audit: ['audit:read'],
  branches: ['branches:read', 'branches:create', 'branches:update']
} as const;
export type PermissionKey = (typeof permissionVocabulary)[keyof typeof permissionVocabulary][number];
