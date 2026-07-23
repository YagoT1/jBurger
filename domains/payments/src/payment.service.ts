import { createEventMetadata, type AuditAction, type EventPublisher } from '@jburger/domain-events';
import type { EstadoPago, Pago } from '@jburger/domain-types';
import type {
  InitiatePaymentCommand,
  PaymentOrderSource,
  PaymentProviderGateway,
  PaymentRepository,
  VerifiedProviderEvent,
} from './contracts.js';
import { PaymentDomainError } from './errors.js';
import { canTransitionPayment } from './payment-transitions.js';

const AUDIT_BY_ESTADO: Record<Exclude<EstadoPago, 'pendiente'>, AuditAction> = {
  aprobado: 'PAYMENT_APPROVED',
  rechazado: 'PAYMENT_REJECTED',
  reembolsado: 'PAYMENT_REFUNDED',
  expirado: 'PAYMENT_EXPIRED',
};

/**
 * Orquesta el cobro de un pedido detrás de un puerto de proveedor abstracto.
 * El monto es server-authoritative (se copia del pedido al crear el intento, nunca del cliente)
 * y la confirmación del pedido queda gateada por el pago aprobado (ADR-024, supuesto 2).
 */
export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly orderSource: PaymentOrderSource,
    private readonly gateway: PaymentProviderGateway,
    private readonly events: EventPublisher,
  ) {}

  /** Estado del pago vigente de un pedido (el aprobado manda; si no, el intento más reciente). */
  findByOrder(tenantId: string, orderId: string): Promise<Pago | undefined> {
    return this.repository.findByOrder(tenantId, orderId);
  }

  async initiatePayment(command: InitiatePaymentCommand): Promise<Pago> {
    const order = await this.orderSource.findById(command.tenantId, command.orderId);
    if (!order) {
      throw new PaymentDomainError('ORDER_NOT_FOUND', 'Order does not exist.');
    }

    const existing = await this.repository.findByOrder(command.tenantId, command.orderId);
    if (existing?.estado === 'aprobado') {
      throw new PaymentDomainError(
        'PAYMENT_ALREADY_APPROVED',
        'Order already has an approved payment.',
      );
    }
    // Reintento completo (PT-2): intento pendiente con checkout emitido → replay sin tocar al proveedor.
    if (existing?.estado === 'pendiente' && existing.checkoutUrl) {
      return existing;
    }
    if (order.estado !== 'borrador') {
      throw new PaymentDomainError('ORDER_NOT_PAYABLE', 'Only draft orders can be paid.', {
        estado: order.estado,
      });
    }

    const reused = existing?.estado === 'pendiente' ? existing : undefined;
    const intent =
      reused ??
      (await this.repository.createIntent(
        command.tenantId,
        command.orderId,
        command.idempotencyKey,
        this.gateway.provider,
      ));
    if (!intent) {
      // Última barrera de la DB (create_payment_intent): el pedido dejó de ser pagable en la carrera.
      throw new PaymentDomainError('ORDER_NOT_PAYABLE', 'Order is not payable.');
    }

    let checkout: { preferenceId: string; checkoutUrl: string };
    try {
      checkout = await this.gateway.createCheckout(intent);
    } catch (error) {
      // El intento pendiente queda persistido sin checkout: un reintento lo reusa (sin doble preferencia).
      throw new PaymentDomainError('PROVIDER_UNAVAILABLE', 'Payment provider is unavailable.', {
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    const payment = await this.repository.attachCheckout(
      command.tenantId,
      intent.id,
      checkout.preferenceId,
      checkout.checkoutUrl,
    );

    if (!reused) {
      await this.audit('PAYMENT_INITIATED', command.tenantId, command.actorId, payment.id, {
        orderId: payment.orderId,
        amount: payment.monto.amount,
        currency: payment.monto.currency,
        provider: payment.provider,
      });
    }
    return payment;
  }

  /**
   * Aplica una notificación verificada del proveedor. Idempotente: la reingesta del mismo estado
   * es un replay sin efectos (PT-4). La aprobación confirma el pedido dentro de la misma
   * transacción del repositorio (apply_payment_transition).
   */
  async handleProviderEvent(event: VerifiedProviderEvent): Promise<Pago> {
    const payment = await this.repository.findById(event.tenantId, event.paymentId);
    if (!payment) {
      throw new PaymentDomainError(
        'PAYMENT_NOT_FOUND',
        'Payment referenced by the provider event does not exist.',
      );
    }
    if (payment.estado === event.targetEstado) {
      return payment;
    }
    if (!canTransitionPayment(payment.estado, event.targetEstado)) {
      throw new PaymentDomainError(
        'PAYMENT_CONFLICT',
        'Provider event conflicts with the current payment state.',
        { from: payment.estado, to: event.targetEstado },
      );
    }

    const result = await this.repository.applyTransition(
      event.tenantId,
      payment.id,
      payment.estado,
      event.targetEstado,
      event.providerPaymentId,
      event.eventType,
    );
    if (!result) {
      throw new PaymentDomainError(
        'PAYMENT_CONFLICT',
        'Payment changed concurrently. Event not applied.',
      );
    }

    if (result.outcome !== 'duplicate') {
      await this.audit(
        AUDIT_BY_ESTADO[event.targetEstado],
        event.tenantId,
        undefined,
        result.payment.id,
        {
          orderId: result.payment.orderId,
          providerPaymentId: event.providerPaymentId,
          eventType: event.eventType,
          orderConfirmed: event.targetEstado === 'aprobado' && result.outcome === 'applied',
        },
      );
    }
    return result.payment;
  }

  private async audit(
    action: AuditAction,
    tenantId: string,
    actorId: string | undefined,
    paymentId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.events.publish({
      metadata: createEventMetadata({
        eventName: action,
        category: 'audit',
        schemaVersion: 1,
        tenantId,
        actorId,
      }),
      action,
      resource: 'payment',
      resourceId: paymentId,
      payload,
    });
  }
}
