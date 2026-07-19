import { InMemoryEventPublisher } from '@jburger/domain-events';
import { describe, expect, it } from 'vitest';
import { ProductService } from './product.service.js';
import type { ProductRepository } from './contracts.js';
const repository: ProductRepository = {
  async list() {
    return [];
  },
  async findById() {
    return undefined;
  },
  async create(command) {
    return {
      id: 'product_1',
      tenantId: command.tenantId,
      categoriaId: command.categoriaId,
      nombre: command.nombre,
      precio: command.precio,
      activo: true,
      audit: { createdAt: new Date().toISOString(), createdBy: command.actorId },
    };
  },
  async update(command) {
    return {
      id: command.id,
      tenantId: command.tenantId,
      categoriaId: command.categoriaId ?? 'category_1',
      nombre: command.nombre ?? 'Doble Clásica',
      precio: command.precio ?? { amount: 8500, currency: 'ARS' },
      activo: true,
      audit: { createdAt: new Date().toISOString(), updatedBy: command.actorId },
    };
  },
  async disable() {},
};
describe('ProductService', () => {
  it('audits product creation', async () => {
    const events = new InMemoryEventPublisher();
    await new ProductService(repository, events).create({
      tenantId: 'tenant_1',
      categoriaId: 'category_1',
      nombre: 'Doble Clásica',
      precio: { amount: 8500, currency: 'ARS' },
      actorId: 'actor_1',
    });
    expect(events.events[0]?.metadata.eventName).toBe('PRODUCT_CREATED');
  });
  it('rejects non-positive prices', async () => {
    const events = new InMemoryEventPublisher();
    await expect(
      new ProductService(repository, events).create({
        tenantId: 'tenant_1',
        categoriaId: 'category_1',
        nombre: 'Doble Clásica',
        precio: { amount: 0, currency: 'ARS' },
        actorId: 'actor_1',
      }),
    ).rejects.toThrow('Product price must be greater than zero.');
    expect(events.events).toHaveLength(0);
  });
});
