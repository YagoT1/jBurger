import { InMemoryEventPublisher } from '@jburger/domain-events';
import { describe, expect, it } from 'vitest';
import { CategoryService } from './category.service.js';
import type { CategoryRepository } from './contracts.js';
const repository: CategoryRepository = {
  async list() {
    return [];
  },
  async findById() {
    return undefined;
  },
  async create(command) {
    return {
      id: 'category_1',
      tenantId: command.tenantId,
      nombre: command.nombre,
      orden: command.orden ?? 0,
      activa: true,
      audit: { createdAt: new Date().toISOString(), createdBy: command.actorId },
    };
  },
  async update(command) {
    return {
      id: command.id,
      tenantId: command.tenantId,
      nombre: command.nombre ?? 'Clásicas',
      orden: command.orden ?? 0,
      activa: true,
      audit: { createdAt: new Date().toISOString(), updatedBy: command.actorId },
    };
  },
  async disable() {},
};
describe('CategoryService', () => {
  it('audits category creation', async () => {
    const events = new InMemoryEventPublisher();
    await new CategoryService(repository, events).create({
      tenantId: 'tenant_1',
      nombre: 'Clásicas',
      actorId: 'actor_1',
    });
    expect(events.events[0]?.metadata.eventName).toBe('CATEGORY_CREATED');
  });
  it('rejects empty category names', async () => {
    const events = new InMemoryEventPublisher();
    await expect(
      new CategoryService(repository, events).create({
        tenantId: 'tenant_1',
        nombre: '   ',
        actorId: 'actor_1',
      }),
    ).rejects.toThrow('Category name must not be empty.');
    expect(events.events).toHaveLength(0);
  });
});
