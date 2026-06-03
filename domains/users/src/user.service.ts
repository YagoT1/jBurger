import { createEventMetadata, type AuditAction, type EventPublisher } from '@jburger/domain-events';
import type { Usuario } from '@jburger/domain-types';
import type { AssignBranchCommand, AssignTenantCommand, AssignUserRoleCommand, CreateUserCommand, DisableUserCommand, UpdateUserCommand, UserRepository } from './contracts.js';
export class UserService {
  constructor(private readonly repository: UserRepository, private readonly events: EventPublisher) {}
  list(tenantId: string): Promise<Usuario[]> { return this.repository.list(tenantId); }
  findById(tenantId: string, id: string): Promise<Usuario | undefined> { return this.repository.findById(tenantId, id); }
  async create(command: CreateUserCommand): Promise<Usuario> { const user = await this.repository.create(command); await this.audit('USER_CREATED', command.tenantId, command.actorId, user.id, { email: user.email }); return user; }
  async update(command: UpdateUserCommand): Promise<Usuario> { const user = await this.repository.update(command); await this.audit('USER_UPDATED', command.tenantId, command.actorId, user.id, { fields: Object.keys(command).filter((key) => !['id','tenantId','actorId'].includes(key)) }); return user; }
  async disable(command: DisableUserCommand): Promise<void> { await this.repository.disable(command); await this.audit('USER_DISABLED', command.tenantId, command.actorId, command.id, {}); }
  async assignTenant(command: AssignTenantCommand): Promise<void> { await this.repository.assignTenant(command); await this.audit('TENANT_ASSIGNED', command.tenantId, command.actorId, command.userId, {}); }
  async assignBranch(command: AssignBranchCommand): Promise<void> { await this.repository.assignBranch(command); await this.audit('BRANCH_ASSIGNED', command.tenantId, command.actorId, command.userId, { branchId: command.branchId }); }
  async assignRole(command: AssignUserRoleCommand): Promise<void> { await this.repository.assignRole(command); await this.audit('ROLE_ASSIGNED', command.tenantId, command.actorId, command.userId, { roleId: command.roleId }); }
  private async audit(action: AuditAction, tenantId: string, actorId: string, resourceId: string, payload: Record<string, unknown>): Promise<void> { await this.events.publish({ metadata: createEventMetadata({ eventName: action, category: 'audit', schemaVersion: 1, tenantId, actorId }), action, resource: 'user', resourceId, payload }); }
}
