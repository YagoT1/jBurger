import { createEventMetadata, type AuditAction, type EventPublisher } from '@jburger/domain-events';
import type { Categoria } from '@jburger/domain-types';
import type {
  CategoryRepository,
  CreateCategoryCommand,
  DisableCategoryCommand,
  UpdateCategoryCommand,
} from './contracts.js';
export class CategoryService {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly events: EventPublisher,
  ) {}
  list(tenantId: string): Promise<Categoria[]> {
    return this.repository.list(tenantId);
  }
  findById(tenantId: string, id: string): Promise<Categoria | undefined> {
    return this.repository.findById(tenantId, id);
  }
  async create(command: CreateCategoryCommand): Promise<Categoria> {
    if (!command.nombre.trim()) {
      throw new Error('Category name must not be empty.');
    }
    const categoria = await this.repository.create(command);
    await this.audit('CATEGORY_CREATED', command.tenantId, command.actorId, categoria.id, {
      nombre: categoria.nombre,
    });
    return categoria;
  }
  async update(command: UpdateCategoryCommand): Promise<Categoria> {
    const categoria = await this.repository.update(command);
    await this.audit('CATEGORY_UPDATED', command.tenantId, command.actorId, categoria.id, {
      fields: Object.keys(command).filter((key) => !['id', 'tenantId', 'actorId'].includes(key)),
    });
    return categoria;
  }
  async disable(command: DisableCategoryCommand): Promise<void> {
    await this.repository.disable(command);
    await this.audit('CATEGORY_DISABLED', command.tenantId, command.actorId, command.id, {});
  }
  private async audit(
    action: AuditAction,
    tenantId: string,
    actorId: string,
    resourceId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.events.publish({
      metadata: createEventMetadata({
        eventName: action,
        category: 'audit',
        schemaVersion: 1,
        tenantId,
        actorId,
      }),
      action,
      resource: 'category',
      resourceId,
      payload,
    });
  }
}
