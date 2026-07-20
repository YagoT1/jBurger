import { describe, expect, it } from 'vitest';
import { CartPricingService, CartService } from '@jburger/domain-cart';
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
import { CatalogSourceAdapter } from './persistence/catalog-source.adapter.js';
import { InMemoryCartRepository } from './persistence/in-memory-cart.repository.js';

const CUSTOMER = 'f0000000-0000-4000-8000-000000000001';
const GASEOSA = 'd0000000-0000-4000-8000-000000000005';
const SIMPLE = 'd0000000-0000-4000-8000-000000000001';

const setup = () => {
  const store = new InMemoryCatalogStore();
  seedDemoCatalog(store);
  const adapter = new CatalogSourceAdapter({
    categories: new InMemoryCategoryRepository(store),
    products: new InMemoryProductRepository(store),
    availability: new InMemoryAvailabilityRepository(store),
    menu: new InMemoryMenuSource(store),
  });
  const repository = new InMemoryCartRepository();
  const events = new InMemoryEventPublisher();
  return {
    events,
    service: new CartService(repository, adapter, { maxItemQuantity: 20 }, events),
    pricing: new CartPricingService(adapter),
  };
};

describe('Cart wiring (adaptador de catálogo + persistencia in-memory)', () => {
  it('AT-1: agrega ítems reales del catálogo y el pricing aplica el override de sucursal', async () => {
    const { service, pricing } = setup();
    await service.addItem({
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      branchId: DEMO_BRANCH_ID,
      productId: SIMPLE,
      quantity: 2,
      actorId: CUSTOMER,
    });
    const cart = await service.addItem({
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      productId: GASEOSA,
      quantity: 1,
      expectedVersion: 2,
      actorId: CUSTOMER,
    });
    const priced = await pricing.price(cart);
    const gaseosa = priced.items.find((item) => item.productId === GASEOSA);
    expect(gaseosa?.precioUnitario).toEqual({ amount: 2200, currency: 'ARS' });
    expect(priced.total).toEqual({ amount: 7500 * 2 + 2200, currency: 'ARS' });
    expect(priced.version).toBe(cart.version);
  });

  it('AT-2/AT-9: rechaza productos inexistentes y fusiona cantidades sin duplicar', async () => {
    const { service } = setup();
    await expect(
      service.addItem({
        tenantId: DEMO_TENANT_ID,
        customerId: CUSTOMER,
        productId: 'c0000000-0000-4000-8000-0000000000ff',
        quantity: 1,
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    await service.addItem({
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      productId: SIMPLE,
      quantity: 1,
      actorId: CUSTOMER,
    });
    const cart = await service.addItem({
      tenantId: DEMO_TENANT_ID,
      customerId: CUSTOMER,
      productId: SIMPLE,
      quantity: 2,
      expectedVersion: 2,
      actorId: CUSTOMER,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(3);
  });
});
