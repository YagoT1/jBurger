import { createEventMetadata, type AuditAction, type EventPublisher } from '@jburger/domain-events';
import type { Money } from '@jburger/shared-kernel';
import type { Producto } from '@jburger/domain-types';
import type {
  CreateProductCommand,
  DisableProductCommand,
  ProductRepository,
  UpdateProductCommand,
} from './contracts.js';
const assertValidPrice = (precio: Money): void => {
  if (!Number.isFinite(precio.amount) || precio.amount <= 0) {
    throw new Error('Product price must be greater than zero.');
  }
};
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly events: EventPublisher,
  ) {}
  list(tenantId: string): Promise<Producto[]> {
    return this.repository.list(tenantId);
  }
  findById(tenantId: string, id: string): Promise<Producto | undefined> {
    return this.repository.findById(tenantId, id);
  }
  async create(command: CreateProductCommand): Promise<Producto> {
    if (!command.nombre.trim()) {
      throw new Error('Product name must not be empty.');
    }
    assertValidPrice(command.precio);
    const producto = await this.repository.create(command);
    await this.audit('PRODUCT_CREATED', command.tenantId, command.actorId, producto.id, {
      nombre: producto.nombre,
      categoriaId: producto.categoriaId,
    });
    return producto;
  }
  async update(command: UpdateProductCommand): Promise<Producto> {
    if (command.precio) {
      assertValidPrice(command.precio);
    }
    const producto = await this.repository.update(command);
    await this.audit('PRODUCT_UPDATED', command.tenantId, command.actorId, producto.id, {
      fields: Object.keys(command).filter((key) => !['id', 'tenantId', 'actorId'].includes(key)),
    });
    return producto;
  }
  async disable(command: DisableProductCommand): Promise<void> {
    await this.repository.disable(command);
    await this.audit('PRODUCT_DISABLED', command.tenantId, command.actorId, command.id, {});
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
      resource: 'product',
      resourceId,
      payload,
    });
  }
}
