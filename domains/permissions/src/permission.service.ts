import type { EventPublisher } from '@jburger/domain-events';
import { createEventMetadata } from '@jburger/domain-events';
import type { PermissionRepository, GrantPermissionCommand, RevokePermissionCommand } from './contracts.js';
import { permissionVocabulary, permissionVocabularyVersion, type PermissionKey } from './vocabulary.js';
export class PermissionService {
  constructor(private readonly repository: PermissionRepository, private readonly events: EventPublisher) {}
  listVocabulary(): readonly PermissionKey[] { return permissionVocabulary; }
  get version(): string { return permissionVocabularyVersion; }
  async grant(command: GrantPermissionCommand): Promise<void> { await this.repository.grant(command); await this.events.publish({ metadata: createEventMetadata({ eventName: 'PERMISSION_GRANTED', category: 'audit', schemaVersion: 1, tenantId: command.tenantId, actorId: command.actorId }), action: 'PERMISSION_GRANTED', resource: 'role_permission', resourceId: command.roleId, payload: { permissionKey: command.permissionKey } }); }
  async revoke(command: RevokePermissionCommand): Promise<void> { await this.repository.revoke(command); await this.events.publish({ metadata: createEventMetadata({ eventName: 'PERMISSION_REVOKED', category: 'audit', schemaVersion: 1, tenantId: command.tenantId, actorId: command.actorId }), action: 'PERMISSION_REVOKED', resource: 'role_permission', resourceId: command.roleId, payload: { permissionKey: command.permissionKey } }); }
}
