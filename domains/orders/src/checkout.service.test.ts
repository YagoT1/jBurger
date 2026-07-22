import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import type { Pedido, PricedCart } from '@jburger/domain-types';
import { CheckoutService } from './checkout.service.js';
import type { CheckoutCartSource, OrderRepository, PlaceOrderData } from './contracts.js';

const TENANT = 'a0000000-0000-4000-8000-000000000001';
const BRANCH = 'b0000000-0000-4000-8000-000000000001';
const CUSTOMER = 'f0000000-0000-4000-8000-000000000001';
const audit = { createdAt: new Date().toISOString() };

const pricedCart = (overrides: Partial<PricedCart> = {}): PricedCart => ({
  cartId: 'cart_1',
  tenantId: TENANT,
  branchId: BRANCH,
  version: 3,
  items: [
    {
      productId: 'p1',
      quantity: 2,
      state: 'ok',
      nombre: 'J Simple',
      precioUnitario: { amount: 7500, currency: 'ARS' },
      subtotal: { amount: 15000, currency: 'ARS' },
    },
  ],
  total: { amount: 15000, currency: 'ARS' },
  generatedAt: new Date().toISOString(),
  ...overrides,
});

class FakeCartSource implements CheckoutCartSource {
  constructor(private readonly cart: PricedCart | undefined) {}
  async findActivePricedCart(): Promise<PricedCart | undefined> {
    return this.cart;
  }
}

/** Modela la conversión del carrito: lo entrega una sola vez; en el reintento ya no hay carrito activo. */
class ConsumableCartSource implements CheckoutCartSource {
  constructor(private cart: PricedCart | undefined) {}
  async findActivePricedCart(): Promise<PricedCart | undefined> {
    const current = this.cart;
    this.cart = undefined;
    return current;
  }
}

class FakeOrderRepository implements OrderRepository {
  readonly placed: PlaceOrderData[] = [];
  private readonly byKey = new Map<string, Pedido>();
  cartConvertible = true;
  async placeOrder(data: PlaceOrderData): Promise<Pedido | undefined> {
    const existing = this.byKey.get(data.idempotencyKey);
    if (existing) {
      return existing;
    }
    if (!this.cartConvertible) {
      return undefined;
    }
    this.placed.push(data);
    const order: Pedido = {
      id: `order_${this.byKey.size + 1}`,
      tenantId: data.tenantId,
      sucursalId: data.branchId,
      clienteId: data.customerId,
      numero: this.byKey.size + 1,
      estado: 'borrador',
      fulfillmentType: data.fulfillmentType,
      cartId: data.cartId,
      items: data.items.map((item, index) => ({
        id: `item_${index}`,
        productId: item.productId,
        nombre: item.nombre,
        quantity: item.quantity,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
      })),
      total: data.total,
      audit,
    };
    this.byKey.set(data.idempotencyKey, order);
    return order;
  }
  async findByIdempotencyKey(
    _tenantId: string,
    idempotencyKey: string,
  ): Promise<Pedido | undefined> {
    return this.byKey.get(idempotencyKey);
  }
  async findById(): Promise<Pedido | undefined> {
    return undefined;
  }
  async listByCustomer(): Promise<Pedido[]> {
    return [];
  }
  async listByBranch(): Promise<Pedido[]> {
    return [];
  }
  async transition(): Promise<Pedido | undefined> {
    return undefined;
  }
}

describe('CheckoutService', () => {
  it('OT-1: places an order with immutable snapshot from a valid priced cart', async () => {
    const repository = new FakeOrderRepository();
    const events = new InMemoryEventPublisher();
    const service = new CheckoutService(new FakeCartSource(pricedCart()), repository, events);
    const order = await service.placeOrder({
      tenantId: TENANT,
      customerId: CUSTOMER,
      branchId: BRANCH,
      idempotencyKey: 'key-1',
      fulfillmentType: 'pickup',
      expectedTotal: { amount: 15000, currency: 'ARS' },
      actorId: CUSTOMER,
    });
    expect(order.estado).toBe('borrador');
    expect(order.items).toHaveLength(1);
    expect(order.total).toEqual({ amount: 15000, currency: 'ARS' });
    expect(events.events.some((event) => event.metadata.eventName === 'ORDER_PLACED')).toBe(true);
  });

  it('OT-3: rejects checkout when the expected total is stale (PRICE_CHANGED)', async () => {
    const service = new CheckoutService(
      new FakeCartSource(pricedCart()),
      new FakeOrderRepository(),
      new InMemoryEventPublisher(),
    );
    await expect(
      service.placeOrder({
        tenantId: TENANT,
        customerId: CUSTOMER,
        branchId: BRANCH,
        idempotencyKey: 'key-2',
        fulfillmentType: 'pickup',
        expectedTotal: { amount: 14000, currency: 'ARS' },
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'PRICE_CHANGED' });
  });

  it('OT-4: rejects checkout when the cart has invalid items (CART_INVALID_ITEMS)', async () => {
    const cart = pricedCart({
      items: [{ productId: 'p1', quantity: 1, state: 'unavailable', nombre: 'J Simple' }],
      total: { amount: 0, currency: 'ARS' },
    });
    const service = new CheckoutService(
      new FakeCartSource(cart),
      new FakeOrderRepository(),
      new InMemoryEventPublisher(),
    );
    await expect(
      service.placeOrder({
        tenantId: TENANT,
        customerId: CUSTOMER,
        branchId: BRANCH,
        idempotencyKey: 'key-3',
        fulfillmentType: 'pickup',
        expectedTotal: { amount: 0, currency: 'ARS' },
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'CART_INVALID_ITEMS' });
  });

  it('OT-5: rejects checkout of an empty or missing cart', async () => {
    const empty = new CheckoutService(
      new FakeCartSource(pricedCart({ items: [], total: { amount: 0, currency: 'ARS' } })),
      new FakeOrderRepository(),
      new InMemoryEventPublisher(),
    );
    await expect(
      empty.placeOrder({
        tenantId: TENANT,
        customerId: CUSTOMER,
        branchId: BRANCH,
        idempotencyKey: 'k',
        fulfillmentType: 'pickup',
        expectedTotal: { amount: 0, currency: 'ARS' },
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'CART_EMPTY' });
    const missing = new CheckoutService(
      new FakeCartSource(undefined),
      new FakeOrderRepository(),
      new InMemoryEventPublisher(),
    );
    await expect(
      missing.placeOrder({
        tenantId: TENANT,
        customerId: CUSTOMER,
        branchId: BRANCH,
        idempotencyKey: 'k',
        fulfillmentType: 'pickup',
        expectedTotal: { amount: 0, currency: 'ARS' },
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'CART_NOT_FOUND' });
  });

  it('OT-2: retry with the same key returns the existing order even after the cart was consumed', async () => {
    const repository = new FakeOrderRepository();
    const events = new InMemoryEventPublisher();
    // ConsumableCartSource entrega el carrito solo en el primer checkout: el reintento NO tiene carrito activo,
    // reproduciendo el estado real (el checkout original convirtió el carrito). Sin la idempotencia previa a
    // exigir carrito, el reintento lanzaría CART_NOT_FOUND.
    const service = new CheckoutService(new ConsumableCartSource(pricedCart()), repository, events);
    const command = {
      tenantId: TENANT,
      customerId: CUSTOMER,
      branchId: BRANCH,
      idempotencyKey: 'key-same',
      fulfillmentType: 'pickup' as const,
      expectedTotal: { amount: 15000, currency: 'ARS' as const },
      actorId: CUSTOMER,
    };
    const first = await service.placeOrder(command);
    const second = await service.placeOrder(command);
    expect(second.id).toBe(first.id);
    expect(repository.placed).toHaveLength(1);
    // El reintento es un replay: no re-emite ORDER_PLACED (un solo evento en total).
    expect(
      events.events.filter((event) => event.metadata.eventName === 'ORDER_PLACED'),
    ).toHaveLength(1);
  });

  it('OT-6: cart conflict during checkout surfaces CART_CONFLICT', async () => {
    const repository = new FakeOrderRepository();
    repository.cartConvertible = false;
    const service = new CheckoutService(
      new FakeCartSource(pricedCart()),
      repository,
      new InMemoryEventPublisher(),
    );
    await expect(
      service.placeOrder({
        tenantId: TENANT,
        customerId: CUSTOMER,
        branchId: BRANCH,
        idempotencyKey: 'key-x',
        fulfillmentType: 'pickup',
        expectedTotal: { amount: 15000, currency: 'ARS' },
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'CART_CONFLICT' });
  });
});
