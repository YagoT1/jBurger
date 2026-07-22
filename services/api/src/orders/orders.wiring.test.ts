import { describe, expect, it } from 'vitest';
import { CartPricingService, CartService } from '@jburger/domain-cart';
import { CheckoutService, OrderService } from '@jburger/domain-orders';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import {
  InMemoryAvailabilityRepository,
  InMemoryCategoryRepository,
  InMemoryMenuSource,
  InMemoryProductRepository,
} from '../catalog/persistence/in-memory-catalog.repositories.js';
import {
  DEMO_BRANCH_ID,
  DEMO_TENANT_ID,
  InMemoryCatalogStore,
  seedDemoCatalog,
} from '../catalog/persistence/in-memory-catalog.store.js';
import { CatalogSourceAdapter } from '../cart/persistence/catalog-source.adapter.js';
import { InMemoryCartRepository } from '../cart/persistence/in-memory-cart.repository.js';
import { CheckoutCartSourceAdapter } from './persistence/checkout-cart-source.adapter.js';
import { InMemoryOrderRepository } from './persistence/in-memory-order.repository.js';

const CUSTOMER = 'f0000000-0000-4000-8000-000000000001';
const SIMPLE = 'd0000000-0000-4000-8000-000000000001';

const setup = () => {
  const store = new InMemoryCatalogStore();
  seedDemoCatalog(store);
  const catalogAdapter = new CatalogSourceAdapter({
    categories: new InMemoryCategoryRepository(store),
    products: new InMemoryProductRepository(store),
    availability: new InMemoryAvailabilityRepository(store),
    menu: new InMemoryMenuSource(store),
  });
  const events = new InMemoryEventPublisher();
  const cartService = new CartService(
    new InMemoryCartRepository(),
    catalogAdapter,
    { maxItemQuantity: 20 },
    events,
  );
  const pricingService = new CartPricingService(catalogAdapter);
  const orderRepository = new InMemoryOrderRepository();
  const checkout = new CheckoutService(
    new CheckoutCartSourceAdapter(cartService, pricingService),
    orderRepository,
    events,
  );
  const orders = new OrderService(orderRepository, events);
  return { cartService, checkout, orders, events };
};

describe('Orders wiring (checkout desde carrito real)', () => {
  it('OT-1/OT-2: checkout produce el pedido con snapshot financiero y es idempotente', async () => {
    const { cartService, checkout, orders } = setup();
    await cartService.addItem({
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      branchId: DEMO_BRANCH_ID,
      productId: SIMPLE,
      quantity: 2,
      actorId: CUSTOMER,
    });

    const command = {
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      branchId: DEMO_BRANCH_ID,
      idempotencyKey: '00000000-0000-4000-8000-0000000000cc',
      fulfillmentType: 'pickup' as const,
      expectedTotal: { amount: 15000, currency: 'ARS' as const },
      actorId: CUSTOMER,
    };
    const order = await checkout.placeOrder(command);
    expect(order.estado).toBe('borrador');
    expect(order.total).toEqual({ amount: 15000, currency: 'ARS' });
    expect(order.items[0]).toMatchObject({ nombre: 'J Simple', quantity: 2 });

    const retry = await checkout.placeOrder(command);
    expect(retry.id).toBe(order.id);

    // Idempotencia: el reintento no crea un segundo pedido.
    // (La conversión del carrito es una garantía transaccional del RPC `place_order`; se valida a nivel Supabase/Acceptance.)
    const mine = await orders.listByCustomer(DEMO_TENANT_ID, CUSTOMER);
    expect(mine).toHaveLength(1);
  });

  it('OT-7: transición válida borrador → confirmado', async () => {
    const { cartService, checkout, orders } = setup();
    await cartService.addItem({
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      branchId: DEMO_BRANCH_ID,
      productId: SIMPLE,
      quantity: 1,
      actorId: CUSTOMER,
    });
    const order = await checkout.placeOrder({
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      branchId: DEMO_BRANCH_ID,
      idempotencyKey: '00000000-0000-4000-8000-0000000000ce',
      fulfillmentType: 'pickup',
      expectedTotal: { amount: 7500, currency: 'ARS' },
      actorId: CUSTOMER,
    });
    const confirmed = await orders.transition({
      tenantId: DEMO_TENANT_ID,
      orderId: order.id,
      to: 'confirmado',
      actorId: CUSTOMER,
    });
    expect(confirmed.estado).toBe('confirmado');
  });
});
