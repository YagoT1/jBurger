import type { Usuario } from '@jburger/domain-types';
export interface CreateUserCommand { tenantId: string; email: string; nombre: string; actorId: string; roleIds?: string[]; branchIds?: string[]; }
export interface UpdateUserCommand { id: string; tenantId: string; nombre?: string; email?: string; actorId: string; }
export interface DisableUserCommand { id: string; tenantId: string; actorId: string; }
export interface AssignTenantCommand { userId: string; tenantId: string; actorId: string; }
export interface AssignBranchCommand { userId: string; tenantId: string; branchId: string; actorId: string; }
export interface AssignUserRoleCommand { userId: string; tenantId: string; roleId: string; actorId: string; }
export interface UserQueries { list(tenantId: string): Promise<Usuario[]>; findById(tenantId: string, id: string): Promise<Usuario | undefined>; }
export interface UserCommands { create(command: CreateUserCommand): Promise<Usuario>; update(command: UpdateUserCommand): Promise<Usuario>; disable(command: DisableUserCommand): Promise<void>; assignTenant(command: AssignTenantCommand): Promise<void>; assignBranch(command: AssignBranchCommand): Promise<void>; assignRole(command: AssignUserRoleCommand): Promise<void>; }
export interface UserRepository extends UserQueries, UserCommands {}
