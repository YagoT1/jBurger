import type { AuditMetadata } from '@jburger/shared-kernel';
import type { PermissionKey } from './vocabulary.js';
export interface PermissionRecord { id: string; key: PermissionKey; resource: string; action: string; version: string; description?: string; audit: AuditMetadata; }
export interface PermissionQueries { list(): Promise<PermissionRecord[]>; findByKey(key: PermissionKey): Promise<PermissionRecord | undefined>; }
export interface GrantPermissionCommand { roleId: string; permissionKey: PermissionKey; actorId: string; tenantId: string; }
export interface RevokePermissionCommand { roleId: string; permissionKey: PermissionKey; actorId: string; tenantId: string; }
export interface PermissionCommands { grant(command: GrantPermissionCommand): Promise<void>; revoke(command: RevokePermissionCommand): Promise<void>; }
export interface PermissionRepository extends PermissionQueries, PermissionCommands {}
