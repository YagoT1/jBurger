import { createEventMetadata, type EventPublisher } from '@jburger/domain-events';
import type { AssignRoleCommand, CreateRoleCommand, RemoveRoleCommand, RoleRepository, RoleRecord } from './contracts.js';
import { defaultRoleKeys } from './default-roles.js';
export class RoleService {
  constructor(private readonly repository: RoleRepository, private readonly events: EventPublisher) {}
  getDefaultRoles() { return defaultRoleKeys; }
  async create(command: CreateRoleCommand): Promise<RoleRecord> { return this.repository.create(command); }
  async assign(command: AssignRoleCommand): Promise<void> { await this.repository.assign(command); await this.events.publish({ metadata: createEventMetadata({ eventName: 'ROLE_ASSIGNED', category: 'audit', schemaVersion: 1, tenantId: command.tenantId, actorId: command.actorId }), action: 'ROLE_ASSIGNED', resource: 'user_role', resourceId: command.userId, payload: { roleId: command.roleId } }); }
  async remove(command: RemoveRoleCommand): Promise<void> { await this.repository.remove(command); await this.events.publish({ metadata: createEventMetadata({ eventName: 'ROLE_REMOVED', category: 'audit', schemaVersion: 1, tenantId: command.tenantId, actorId: command.actorId }), action: 'ROLE_REMOVED', resource: 'user_role', resourceId: command.userId, payload: { roleId: command.roleId } }); }
}
