import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import type { Pago, Pedido } from '@jburger/domain-types';
import { PaymentService } from './payment.service.js';
import type {
  PaymentOrderSource,
  PaymentProviderGateway,
  PaymentRepository,
  TransitionOutcome,
  VerifiedProviderEvent,
} from './contracts.js';

const TENANT = 'a0000000-0000-4000-8000-000000000001';
const BRANCH = 'b0000000-0000-4000-8000-000000000001';
const CUSTOMER = 'f0000000-0000-4000-8000-000000000001';
const ORDER = '10000000-0000-4000-8000-000000000001';
const audit = { createdAt: new Date().toISOString() };

const order = (estado: Pedido['estado']): Pedido => ({
  id: ORDER,
  tenantId: TENANT,
  sucursalId: BRANCH,
  clienteId: CUSTOMER,
  estado,
  items: [],
  total: { amount: 15000, currency: 'ARS' },
  audit,
});

class FakeOrderSource implements PaymentOrderSource {
  constructor(private readonly orders: Map<string, Pedido>) {}
  async findById(_tenantId: string, orderId: string): Promise<Pedido | undefined> {
    return this.orders.get(orderId);
  }
}

class FakeGateway implements PaymentProviderGateway {
  readonly provider = 'mock' as const;
  calls = 0;
  failing = false;
  async createCheckout(payment: Pago): Promise<{ preferenceId: string; checkoutUrl: string }> {
    if (this.failing) {
      throw new Error('provider down');
    }
    this.calls += 1;
    return {
      preferenceId: `pref_${payment.id}`,
      checkoutUrl: `https://mock.checkout/${payment.id}`,
    };
  }
}

/** Replica la semántica de create_payment_intent/apply_payment_transition, incluida la confirmación atómica del pedido. */
class FakePaymentRepository implements PaymentRepository {
  readonly payments = new Map<string, Pago>();
  private readonly byKey = new Map<string, string>();
  constructor(private readonly orders: Map<string, Pedido>) {}

  async createIntent(
    tenantId: string,
    orderId: string,
    idempotencyKey: string,
    provider: Pago['provider'],
  ): Promise<Pago | undefined> {
    const byKeyId = this.byKey.get(idempotencyKey);
    if (byKeyId) {
      return this.payments.get(byKeyId);
    }
    const pending = [...this.payments.values()].find(
      (payment) => payment.orderId === orderId && payment.estado === 'pendiente',
    );
    if (pending) {
      return pending;
    }
    const target = this.orders.get(orderId);
    if (!target || target.estado !== 'borrador') {
      return undefined;
    }
    const pago: Pago = {
      id: `pay_${this.payments.size + 1}`,
      tenantId,
      orderId,
      estado: 'pendiente',
      provider,
      monto: target.total,
      audit,
    };
    this.payments.set(pago.id, pago);
    this.byKey.set(idempotencyKey, pago.id);
    return pago;
  }

  async attachCheckout(
    _tenantId: string,
    paymentId: string,
    preferenceId: string,
    checkoutUrl: string,
  ): Promise<Pago> {
    const current = this.payments.get(paymentId);
    if (!current) {
      throw new Error('attachCheckout: unknown payment');
    }
    const updated: Pago = { ...current, providerPreferenceId: preferenceId, checkoutUrl };
    this.payments.set(paymentId, updated);
    return updated;
  }

  async findById(_tenantId: string, paymentId: string): Promise<Pago | undefined> {
    return this.payments.get(paymentId);
  }

  async findByOrder(_tenantId: string, orderId: string): Promise<Pago | undefined> {
    return [...this.payments.values()].find((payment) => payment.orderId === orderId);
  }

  async applyTransition(
    _tenantId: string,
    paymentId: string,
    from: Pago['estado'],
    to: Pago['estado'],
    providerPaymentId: string,
  ): Promise<{ outcome: TransitionOutcome; payment: Pago } | undefined> {
    const current = this.payments.get(paymentId);
    if (!current || current.estado !== from) {
      if (current && current.estado === to && current.providerPaymentId === providerPaymentId) {
        return { outcome: 'duplicate', payment: current };
      }
      return undefined;
    }
    const updated: Pago = { ...current, estado: to, providerPaymentId };
    this.payments.set(paymentId, updated);
    let outcome: TransitionOutcome = 'applied';
    if (to === 'aprobado') {
      const target = this.orders.get(current.orderId);
      if (target && target.estado === 'borrador') {
        this.orders.set(target.id, { ...target, estado: 'confirmado' });
      } else {
        outcome = 'applied_order_not_confirmed';
      }
    }
    return { outcome, payment: updated };
  }
}

const setup = (estado: Pedido['estado'] = 'borrador') => {
  const orders = new Map<string, Pedido>([[ORDER, order(estado)]]);
  const repository = new FakePaymentRepository(orders);
  const gateway = new FakeGateway();
  const events = new InMemoryEventPublisher();
  const service = new PaymentService(repository, new FakeOrderSource(orders), gateway, events);
  return { orders, repository, gateway, events, service };
};

const initiateCommand = {
  tenantId: TENANT,
  orderId: ORDER,
  customerId: CUSTOMER,
  idempotencyKey: '20000000-0000-4000-8000-000000000001',
  actorId: CUSTOMER,
};

const approvedEvent = (paymentId: string): VerifiedProviderEvent => ({
  tenantId: TENANT,
  paymentId,
  providerPaymentId: 'mp_123',
  targetEstado: 'aprobado',
  eventType: 'payment.updated',
});

describe('PaymentService.initiatePayment', () => {
  it('PT-1: creates a pending intent with server-authoritative amount and a checkout url', async () => {
    const { service, events } = setup();
    const pago = await service.initiatePayment(initiateCommand);
    expect(pago.estado).toBe('pendiente');
    expect(pago.checkoutUrl).toContain('https://mock.checkout/');
    // El monto proviene del pedido, no del comando (el comando ni siquiera lo acepta).
    expect(pago.monto).toEqual({ amount: 15000, currency: 'ARS' });
    expect(
      events.events.filter((event) => event.metadata.eventName === 'PAYMENT_INITIATED'),
    ).toHaveLength(1);
  });

  it('PT-2: initiating twice reuses the intent without a second provider preference', async () => {
    const { service, gateway, events } = setup();
    const first = await service.initiatePayment(initiateCommand);
    const second = await service.initiatePayment(initiateCommand);
    expect(second.id).toBe(first.id);
    expect(gateway.calls).toBe(1);
    expect(
      events.events.filter((event) => event.metadata.eventName === 'PAYMENT_INITIATED'),
    ).toHaveLength(1);
  });

  it('PT-8: rejects orders that are not in borrador', async () => {
    for (const estado of ['confirmado', 'cancelado'] as const) {
      const { service } = setup(estado);
      await expect(service.initiatePayment(initiateCommand)).rejects.toMatchObject({
        code: 'ORDER_NOT_PAYABLE',
      });
    }
  });

  it('rejects unknown orders without leaking existence', async () => {
    const { service } = setup();
    await expect(
      service.initiatePayment({
        ...initiateCommand,
        orderId: '99999999-0000-4000-8000-000000000009',
      }),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
  });

  it('surfaces PROVIDER_UNAVAILABLE and recovers by reusing the persisted intent', async () => {
    const { service, gateway, repository } = setup();
    gateway.failing = true;
    await expect(service.initiatePayment(initiateCommand)).rejects.toMatchObject({
      code: 'PROVIDER_UNAVAILABLE',
    });
    expect(repository.payments.size).toBe(1);
    gateway.failing = false;
    const recovered = await service.initiatePayment(initiateCommand);
    expect(recovered.estado).toBe('pendiente');
    expect(recovered.checkoutUrl).toBeDefined();
    expect(repository.payments.size).toBe(1);
  });
});

describe('PaymentService.handleProviderEvent', () => {
  it('PT-3: an approved event approves the payment and confirms the order atomically', async () => {
    const { service, orders, events } = setup();
    const pago = await service.initiatePayment(initiateCommand);
    const updated = await service.handleProviderEvent(approvedEvent(pago.id));
    expect(updated.estado).toBe('aprobado');
    expect(orders.get(ORDER)?.estado).toBe('confirmado');
    const approvedAudits = events.events.filter(
      (event) => event.metadata.eventName === 'PAYMENT_APPROVED',
    );
    expect(approvedAudits).toHaveLength(1);
  });

  it('PT-4: re-ingesting the same event is an effect-free replay', async () => {
    const { service, orders, events } = setup();
    const pago = await service.initiatePayment(initiateCommand);
    await service.handleProviderEvent(approvedEvent(pago.id));
    const replay = await service.handleProviderEvent(approvedEvent(pago.id));
    expect(replay.estado).toBe('aprobado');
    expect(orders.get(ORDER)?.estado).toBe('confirmado');
    expect(
      events.events.filter((event) => event.metadata.eventName === 'PAYMENT_APPROVED'),
    ).toHaveLength(1);
  });

  it('PT-6: a rejected event rejects the payment and leaves the order in borrador', async () => {
    const { service, orders } = setup();
    const pago = await service.initiatePayment(initiateCommand);
    const updated = await service.handleProviderEvent({
      ...approvedEvent(pago.id),
      targetEstado: 'rechazado',
    });
    expect(updated.estado).toBe('rechazado');
    expect(orders.get(ORDER)?.estado).toBe('borrador');
  });

  it('PT-9: an order with an approved payment does not admit a second payment', async () => {
    const { service } = setup();
    const pago = await service.initiatePayment(initiateCommand);
    await service.handleProviderEvent(approvedEvent(pago.id));
    await expect(
      service.initiatePayment({
        ...initiateCommand,
        idempotencyKey: '30000000-0000-4000-8000-000000000003',
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_ALREADY_APPROVED' });
  });

  it('rejects events that conflict with the payment state machine', async () => {
    const { service } = setup();
    const pago = await service.initiatePayment(initiateCommand);
    await service.handleProviderEvent({ ...approvedEvent(pago.id), targetEstado: 'rechazado' });
    await expect(service.handleProviderEvent(approvedEvent(pago.id))).rejects.toMatchObject({
      code: 'PAYMENT_CONFLICT',
    });
  });

  it('rejects events for unknown payments', async () => {
    const { service } = setup();
    await expect(service.handleProviderEvent(approvedEvent('pay_ghost'))).rejects.toMatchObject({
      code: 'PAYMENT_NOT_FOUND',
    });
  });
});
