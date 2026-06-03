import type { AuditMetadata } from '@jburger/shared-kernel';
export interface RoleRecord { id: string; tenantId: string; key: string; nombre: string; descripcion?: string; permissionKeys: string[]; audit: AuditMetadata; }
export interface CreateRoleCommand { tenantId: string; key: string; nombre: string; descripcion?: string; actorId: string; }
export interface AssignRoleCommand { tenantId: string; userId: string; roleId: string; actorId: string; }
export interface RemoveRoleCommand extends AssignRoleCommand {}
export interface RoleQueries { listByTenant(tenantId: string): Promise<RoleRecord[]>; findById(id: string): Promise<RoleRecord | undefined>; }
export interface RoleCommands { create(command: CreateRoleCommand): Promise<RoleRecord>; assign(command: AssignRoleCommand): Promise<void>; remove(command: RemoveRoleCommand): Promise<void>; }
export interface RoleRepository extends RoleQueries, RoleCommands {}
