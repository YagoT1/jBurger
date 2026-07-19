import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import type { Cart, DisponibilidadProducto, Producto } from '@jburger/domain-types';
import { CartService } from './cart.service.js';
import { CartPricingService } from './cart-pricing.service.js';
import { CartDomainError } from './errors.js';
import type { CartCatalogSource, CartConfig, CartMutation, CartRepository } from './contracts.js';

const audit = { createdAt: new Date().toISOString() };
const TENANT = 'a0000000-0000-4000-8000-000000000001';
const BRANCH = 'b0000000-0000-4000-8000-000000000001';
const CUSTOMER = 'f0000000-0000-4000-8000-000000000001';

const producto = (id: string, nombre: string, amount: number): Producto => ({
  id,
  tenantId: TENANT,
  categoriaId: 'c0000000-0000-4000-8000-000000000001',
  nombre,
  precio: { amount, currency: 'ARS' },
  activo: true,
  audit,
});

class FakeCartRepository implements CartRepository {
  cart: Cart | undefined;
  async findActiveByCustomer(tenantId: string, customerId: string): Promise<Cart | undefined> {
    return this.cart &&
      this.cart.tenantId === tenantId &&
      this.cart.customerId === customerId &&
      this.cart.status === 'active'
      ? this.cart
      : undefined;
  }
  async createActive(
    tenantId: string,
    customerId: string,
    branchId: string | undefined,
  ): Promise<Cart> {
    this.cart = {
      id: 'cart_1',
      tenantId,
      customerId,
      ...(branchId !== undefined ? { branchId } : {}),
      version: 1,
      status: 'active',
      items: [],
      audit,
    };
    return this.cart;
  }
  async applyMutation(
    _tenantId: string,
    cartId: string,
    expectedVersion: number,
    mutation: CartMutation,
  ): Promise<Cart | undefined> {
    if (!this.cart || this.cart.id !== cartId || this.cart.version !== expectedVersion) {
      return undefined;
    }
    this.cart = {
      ...this.cart,
      ...(mutation.branchId !== undefined ? { branchId: mutation.branchId } : {}),
      items: mutation.items,
      version: this.cart.version + 1,
    };
    return this.cart;
  }
}

class FakeCatalogSource implements CartCatalogSource {
  constructor(
    readonly products: Map<string, Producto>,
    readonly availability: Map<string, DisponibilidadProducto> = new Map(),
  ) {}
  async findActiveProduct(_tenantId: string, productId: string): Promise<Producto | undefined> {
    const found = this.products.get(productId);
    return found?.activo ? found : undefined;
  }
  async findAvailability(
    _tenantId: string,
    branchId: string,
    productId: string,
  ): Promise<DisponibilidadProducto | undefined> {
    return this.availability.get(`${branchId}:${productId}`);
  }
}

const setup = (config: CartConfig = { maxItemQuantity: 20 }) => {
  const repository = new FakeCartRepository();
  const products = new Map<string, Producto>([
    ['p1', producto('p1', 'J Simple', 7500)],
    ['p2', producto('p2', 'Gaseosa 500ml', 2500)],
  ]);
  const catalog = new FakeCatalogSource(products);
  const events = new InMemoryEventPublisher();
  return {
    repository,
    products,
    catalog,
    events,
    service: new CartService(repository, catalog, config, events),
  };
};

describe('CartService', () => {
  it('AT-9: adding the same product twice updates quantity without duplicating items', async () => {
    const { service, repository } = setup();
    await service.addItem({
      tenantId: TENANT,
      customerId: CUSTOMER,
      branchId: BRANCH,
      productId: 'p1',
      quantity: 2,
      actorId: CUSTOMER,
    });
    const cart = await service.addItem({
      tenantId: TENANT,
      customerId: CUSTOMER,
      productId: 'p1',
      quantity: 3,
      expectedVersion: repository.cart!.version,
      actorId: CUSTOMER,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(5);
  });

  it('AT-2: rejects unknown products and out-of-range quantities using the injected config', async () => {
    const { service } = setup({ maxItemQuantity: 5 });
    await expect(
      service.addItem({
        tenantId: TENANT,
        customerId: CUSTOMER,
        productId: 'ghost',
        quantity: 1,
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    await expect(
      service.addItem({
        tenantId: TENANT,
        customerId: CUSTOMER,
        productId: 'p1',
        quantity: 0,
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'QUANTITY_OUT_OF_RANGE' });
    await expect(
      service.addItem({
        tenantId: TENANT,
        customerId: CUSTOMER,
        productId: 'p1',
        quantity: 6,
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'QUANTITY_OUT_OF_RANGE' });
  });

  it('AT-3: concurrent mutation with stale version fails with VERSION_CONFLICT and preserves state', async () => {
    const { service, repository } = setup();
    await service.addItem({
      tenantId: TENANT,
      customerId: CUSTOMER,
      productId: 'p1',
      quantity: 1,
      actorId: CUSTOMER,
    });
    const staleVersion = repository.cart!.version;
    await service.updateItemQuantity({
      tenantId: TENANT,
      customerId: CUSTOMER,
      productId: 'p1',
      quantity: 2,
      expectedVersion: staleVersion,
      actorId: CUSTOMER,
    });
    await expect(
      service.updateItemQuantity({
        tenantId: TENANT,
        customerId: CUSTOMER,
        productId: 'p1',
        quantity: 9,
        expectedVersion: staleVersion,
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(repository.cart!.items[0]?.quantity).toBe(2);
  });

  it('AT-4: guest merge sums quantities with cap, discards invalid items and never duplicates', async () => {
    const { service, repository } = setup({ maxItemQuantity: 10 });
    await service.addItem({
      tenantId: TENANT,
      customerId: CUSTOMER,
      productId: 'p1',
      quantity: 8,
      notas: 'sin cebolla',
      actorId: CUSTOMER,
    });
    const result = await service.mergeGuestCart({
      tenantId: TENANT,
      customerId: CUSTOMER,
      items: [
        { productId: 'p1', quantity: 5, notas: 'con cebolla' },
        { productId: 'p2', quantity: 1 },
        { productId: 'ghost', quantity: 2 },
        { productId: 'p2', quantity: 0 },
      ],
      actorId: CUSTOMER,
    });
    expect(result.cart.items).toHaveLength(2);
    const p1 = result.cart.items.find((item) => item.productId === 'p1');
    expect(p1?.quantity).toBe(10);
    expect(p1?.notas).toBe('sin cebolla');
    expect(result.report).toEqual(
      expect.arrayContaining([
        { productId: 'p1', reason: 'capped' },
        { productId: 'ghost', reason: 'removed' },
        { productId: 'p2', reason: 'invalid_quantity' },
      ]),
    );
    expect(repository.cart!.items).toHaveLength(2);
  });

  it('rejects adding a product marked unavailable at the cart branch', async () => {
    const { repository, products, events } = setup();
    const catalog = new FakeCatalogSource(
      products,
      new Map([
        [
          `${BRANCH}:p1`,
          {
            tenantId: TENANT,
            branchId: BRANCH,
            productId: 'p1',
            disponible: false,
            updatedAt: new Date().toISOString(),
          },
        ],
      ]),
    );
    const service = new CartService(repository, catalog, { maxItemQuantity: 20 }, events);
    await expect(
      service.addItem({
        tenantId: TENANT,
        customerId: CUSTOMER,
        branchId: BRANCH,
        productId: 'p1',
        quantity: 1,
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_UNAVAILABLE' });
  });
});

describe('CartPricingService', () => {
  it('AT-6/AT-10: prices with branch override, excludes unavailable and marks removed items keeping the rest intact', async () => {
    const products = new Map<string, Producto>([
      ['p1', producto('p1', 'J Simple', 7500)],
      ['p2', producto('p2', 'Gaseosa 500ml', 2500)],
      ['p3', producto('p3', 'Papas J', 4800)],
    ]);
    const availability = new Map<string, DisponibilidadProducto>([
      [
        `${BRANCH}:p2`,
        {
          tenantId: TENANT,
          branchId: BRANCH,
          productId: 'p2',
          disponible: true,
          precioOverride: { amount: 2200, currency: 'ARS' },
          updatedAt: new Date().toISOString(),
        },
      ],
      [
        `${BRANCH}:p3`,
        {
          tenantId: TENANT,
          branchId: BRANCH,
          productId: 'p3',
          disponible: false,
          updatedAt: new Date().toISOString(),
        },
      ],
    ]);
    const catalog = new FakeCatalogSource(products, availability);
    const cart: Cart = {
      id: 'cart_1',
      tenantId: TENANT,
      branchId: BRANCH,
      customerId: CUSTOMER,
      version: 4,
      status: 'active',
      audit,
      items: [
        { id: 'i1', productId: 'p1', quantity: 2 },
        { id: 'i2', productId: 'p2', quantity: 1 },
        { id: 'i3', productId: 'p3', quantity: 1 },
        { id: 'i4', productId: 'deleted', quantity: 3 },
      ],
    };
    const priced = await new CartPricingService(catalog).price(cart);
    expect(priced.items).toHaveLength(4);
    expect(priced.items.find((item) => item.productId === 'p2')?.subtotal).toEqual({
      amount: 2200,
      currency: 'ARS',
    });
    expect(priced.items.find((item) => item.productId === 'p3')?.state).toBe('unavailable');
    expect(priced.items.find((item) => item.productId === 'deleted')?.state).toBe('removed');
    expect(priced.total).toEqual({ amount: 7500 * 2 + 2200, currency: 'ARS' });
    expect(priced.version).toBe(4);
  });
});

describe('CartDomainError', () => {
  it('exposes stable machine-readable codes', () => {
    const error = new CartDomainError('VERSION_CONFLICT', 'conflict');
    expect(error.code).toBe('VERSION_CONFLICT');
    expect(error.name).toBe('CartDomainError');
  });
});
