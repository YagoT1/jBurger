import type { PaymentRepository, TransitionOutcome } from '@jburger/domain-payments';
import type { EstadoPago, Pago, PaymentProvider, Pedido } from '@jburger/domain-types';
import type { OrderRepository } from '@jburger/domain-orders';

/**
 * Persistencia de pagos para desarrollo local sin Supabase.
 * Replica la semántica de `create_payment_intent` y `apply_payment_transition`, incluida la
 * confirmación del pedido dentro de la misma operación (aquí vía el repositorio de pedidos).
 */
export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly payments = new Map<string, Pago>();
  private readonly byKey = new Map<string, string>();

  constructor(private readonly orders: OrderRepository) {}

  async createIntent(
    tenantId: string,
    orderId: string,
    idempotencyKey: string,
    provider: PaymentProvider,
  ): Promise<Pago | undefined> {
    const existingId = this.byKey.get(`${tenantId}:${idempotencyKey}`);
    if (existingId) {
      return this.payments.get(existingId);
    }
    const pending = this.list(tenantId).find(
      (payment) => payment.orderId === orderId && payment.estado === 'pendiente',
    );
    if (pending) {
      return pending;
    }
    const order = await this.orders.findById(tenantId, orderId);
    if (!order || order.estado !== 'borrador') {
      return undefined;
    }
    const payment: Pago = {
      id: crypto.randomUUID(),
      tenantId,
      orderId,
      estado: 'pendiente',
      provider,
      monto: order.total,
      audit: { createdAt: new Date().toISOString() },
    };
    this.payments.set(payment.id, payment);
    this.byKey.set(`${tenantId}:${idempotencyKey}`, payment.id);
    return payment;
  }

  async attachCheckout(
    tenantId: string,
    paymentId: string,
    preferenceId: string,
    checkoutUrl: string,
  ): Promise<Pago> {
    const current = this.require(tenantId, paymentId);
    const updated: Pago = {
      ...current,
      providerPreferenceId: preferenceId,
      checkoutUrl,
      audit: { ...current.audit, updatedAt: new Date().toISOString() },
    };
    this.payments.set(paymentId, updated);
    return updated;
  }

  async findById(tenantId: string, paymentId: string): Promise<Pago | undefined> {
    const payment = this.payments.get(paymentId);
    return payment?.tenantId === tenantId ? payment : undefined;
  }

  async findByOrder(tenantId: string, orderId: string): Promise<Pago | undefined> {
    const forOrder = this.list(tenantId).filter((payment) => payment.orderId === orderId);
    return forOrder.find((payment) => payment.estado === 'aprobado') ?? forOrder.at(-1);
  }

  async applyTransition(
    tenantId: string,
    paymentId: string,
    from: EstadoPago,
    to: EstadoPago,
    providerPaymentId: string,
  ): Promise<{ outcome: TransitionOutcome; payment: Pago } | undefined> {
    const current = await this.findById(tenantId, paymentId);
    if (!current || current.estado !== from) {
      if (current?.estado === to && current.providerPaymentId === providerPaymentId) {
        return { outcome: 'duplicate', payment: current };
      }
      return undefined;
    }
    const updated: Pago = {
      ...current,
      estado: to,
      providerPaymentId,
      audit: { ...current.audit, updatedAt: new Date().toISOString() },
    };
    this.payments.set(paymentId, updated);

    let outcome: TransitionOutcome = 'applied';
    if (to === 'aprobado') {
      const confirmed = await this.confirmOrder(tenantId, current.orderId);
      if (!confirmed) {
        outcome = 'applied_order_not_confirmed';
      }
    }
    return { outcome, payment: updated };
  }

  private async confirmOrder(tenantId: string, orderId: string): Promise<Pedido | undefined> {
    return this.orders.transition(
      tenantId,
      orderId,
      'borrador',
      'confirmado',
      'system',
      'pago aprobado',
    );
  }

  private list(tenantId: string): Pago[] {
    return [...this.payments.values()].filter((payment) => payment.tenantId === tenantId);
  }

  private require(tenantId: string, paymentId: string): Pago {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.tenantId !== tenantId) {
      throw new Error('Payment not found in in-memory storage.');
    }
    return payment;
  }
}
