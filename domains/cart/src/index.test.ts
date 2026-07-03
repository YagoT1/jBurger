import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import { CartService } from './index.js';
describe('CartService', () => {
  it('creates cart and mutates items with events', async () => {
    const events = new InMemoryEventPublisher();
    const service = new CartService(undefined, events);
    const context = { tenantId: 'tenant', branchId: 'branch', actorId: 'actor' };
    const cart = await service.createCart(
      { ownerType: 'guest', anonymousSessionId: 'guest' },
      context,
    );
    const withItem = await service.addItem(
      cart.id,
      { productId: 'product', quantity: 2, modifiers: [] },
      context,
    );
    await service.updateQuantity(cart.id, withItem.items[0]!.id, 3, context);
    expect((await service.summary(cart.id, 'tenant')).itemCount).toBe(3);
    expect(events.events.map((event) => event.metadata.eventName)).toContain('CART_CREATED');
    expect(events.events.map((event) => event.metadata.eventName)).toContain('ITEM_UPDATED');
  });
});
