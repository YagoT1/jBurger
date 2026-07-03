import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import { ProductService } from './index.js';
describe('ProductService', () => {
  it('creates, publishes, disables, and audits products', async () => {
    const events = new InMemoryEventPublisher();
    const service = new ProductService(undefined, events);
    const product = await service.create(
      {
        name: 'Burger',
        slug: 'burger',
        gallery: { additionalImages: [] },
        tags: [],
        visibility: 'public',
        sortOrder: 1,
      },
      { tenantId: 'tenant', actorId: 'actor' },
    );
    await service.publish(product.id, { tenantId: 'tenant' });
    await service.disable(product.id, { tenantId: 'tenant' });
    expect(await service.list({ tenantId: 'tenant' })).toHaveLength(1);
    expect(events.events.map((event) => event.metadata.eventName)).toContain('PRODUCT_CREATED');
    expect(events.events.map((event) => event.metadata.eventName)).toContain('PRODUCT_DISABLED');
  });
});
