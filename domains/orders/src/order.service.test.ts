import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import type { EstadoPedido, Pedido } from '@jburger/domain-types';
import { OrderService } from './order.service.js';
import { canTransition } from './order-transitions.js';
import type { OrderRepository } from './contracts.js';

const TENANT = 'a0000000-0000-4000-8000-000000000001';
const audit = { createdAt: new Date().toISOString() };

const order = (estado: EstadoPedido): Pedido => ({
  id: 'order_1',
  tenantId: TENANT,
  sucursalId: 'b0000000-0000-4000-8000-000000000001',
  clienteId: 'cust',
  numero: 1,
  estado,
  items: [],
  total: { amount: 15000, currency: 'ARS' },
  audit,
});

class FakeOrderRepository implements OrderRepository {
  constructor(private current: Pedido) {}
  transitions = 0;
  conflict = false;
  async placeOrder(): Promise<Pedido | undefined> {
    return undefined;
  }
  async findByIdempotencyKey(): Promise<Pedido | undefined> {
    return undefined;
  }
  async findById(): Promise<Pedido | undefined> {
    return this.current;
  }
  async listByCustomer(): Promise<Pedido[]> {
    return [this.current];
  }
  async listByBranch(): Promise<Pedido[]> {
    return [this.current];
  }
  async transition(
    _t: string,
    _o: string,
    from: EstadoPedido,
    to: EstadoPedido,
  ): Promise<Pedido | undefined> {
    if (this.conflict || this.current.estado !== from) {
      return undefined;
    }
    this.transitions += 1;
    this.current = { ...this.current, estado: to };
    return this.current;
  }
}

describe('Order transitions map', () => {
  it('OT-7/OT-8: encodes the valid state machine', () => {
    expect(canTransition('borrador', 'confirmado')).toBe(true);
    expect(canTransition('confirmado', 'preparacion')).toBe(true);
    expect(canTransition('preparacion', 'entregado')).toBe(true);
    expect(canTransition('entregado', 'preparacion')).toBe(false);
    expect(canTransition('cancelado', 'confirmado')).toBe(false);
  });
});

describe('OrderService', () => {
  it('OT-7: applies a valid transition and audits it', async () => {
    const repository = new FakeOrderRepository(order('borrador'));
    const events = new InMemoryEventPublisher();
    const updated = await new OrderService(repository, events).transition({
      tenantId: TENANT,
      orderId: 'order_1',
      to: 'confirmado',
      actorId: 'staff',
    });
    expect(updated.estado).toBe('confirmado');
    expect(events.events.some((event) => event.metadata.eventName === 'ORDER_CONFIRMED')).toBe(
      true,
    );
  });

  it('OT-8: rejects an invalid transition without touching state', async () => {
    const repository = new FakeOrderRepository(order('entregado'));
    await expect(
      new OrderService(repository, new InMemoryEventPublisher()).transition({
        tenantId: TENANT,
        orderId: 'order_1',
        to: 'preparacion',
        actorId: 'staff',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    expect(repository.transitions).toBe(0);
  });

  it('OT-9: cancels from borrador/confirmado, rejects from preparacion', async () => {
    const cancellable = new FakeOrderRepository(order('confirmado'));
    const cancelled = await new OrderService(cancellable, new InMemoryEventPublisher()).cancel({
      tenantId: TENANT,
      orderId: 'order_1',
      actorId: 'cust',
      reason: 'me arrepentí',
    });
    expect(cancelled.estado).toBe('cancelado');
    const inPrep = new FakeOrderRepository(order('preparacion'));
    await expect(
      new OrderService(inPrep, new InMemoryEventPublisher()).cancel({
        tenantId: TENANT,
        orderId: 'order_1',
        actorId: 'cust',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('surfaces TRANSITION_CONFLICT when the repository reports a concurrent change', async () => {
    const repository = new FakeOrderRepository(order('borrador'));
    repository.conflict = true;
    await expect(
      new OrderService(repository, new InMemoryEventPublisher()).transition({
        tenantId: TENANT,
        orderId: 'order_1',
        to: 'confirmado',
        actorId: 'staff',
      }),
    ).rejects.toMatchObject({ code: 'TRANSITION_CONFLICT' });
  });
});
