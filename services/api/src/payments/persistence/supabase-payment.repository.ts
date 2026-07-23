import { ServiceUnavailableException } from '@nestjs/common';
import type { PaymentRepository, TransitionOutcome } from '@jburger/domain-payments';
import type { EstadoPago, Pago, PaymentProvider } from '@jburger/domain-types';
import { eq, SupabaseRestClient } from '../../common/persistence/supabase-rest.client.js';

interface PaymentRow {
  id: string;
  tenant_id: string;
  order_id: string;
  estado: EstadoPago;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  provider_preference_id: string | null;
  checkout_url: string | null;
  amount: number | string;
  currency: Pago['monto']['currency'];
  created_at: string;
  updated_at: string;
}

const toPago = (row: PaymentRow): Pago => ({
  id: row.id,
  tenantId: row.tenant_id,
  orderId: row.order_id,
  estado: row.estado,
  provider: row.provider,
  ...(row.provider_payment_id !== null ? { providerPaymentId: row.provider_payment_id } : {}),
  ...(row.provider_preference_id !== null
    ? { providerPreferenceId: row.provider_preference_id }
    : {}),
  ...(row.checkout_url !== null ? { checkoutUrl: row.checkout_url } : {}),
  monto: { amount: Number(row.amount), currency: row.currency },
  audit: { createdAt: row.created_at, updatedAt: row.updated_at },
});

/** Los estados de retorno de `apply_payment_transition` (ver migración 202607220010). */
const OUTCOMES = new Set<string>(['applied', 'applied_order_not_confirmed', 'duplicate']);

export class SupabasePaymentRepository implements PaymentRepository {
  constructor(private readonly client: SupabaseRestClient) {}

  async createIntent(
    tenantId: string,
    orderId: string,
    idempotencyKey: string,
    provider: PaymentProvider,
  ): Promise<Pago | undefined> {
    const paymentId = await this.client.rpc<string | null>('create_payment_intent', {
      p_tenant_id: tenantId,
      p_order_id: orderId,
      p_idempotency_key: idempotencyKey,
      p_provider: provider,
    });
    if (paymentId === null) {
      return undefined;
    }
    return this.requirePersisted(tenantId, paymentId);
  }

  async attachCheckout(
    tenantId: string,
    paymentId: string,
    preferenceId: string,
    checkoutUrl: string,
  ): Promise<Pago> {
    const rows = await this.client.patch<PaymentRow>(
      `payments?tenant_id=${eq(tenantId)}&id=${eq(paymentId)}`,
      {
        provider_preference_id: preferenceId,
        checkout_url: checkoutUrl,
        updated_at: new Date().toISOString(),
      },
    );
    const row = rows[0];
    if (!row) {
      throw new ServiceUnavailableException('Payment storage is inconsistent after a write.');
    }
    return toPago(row);
  }

  async findById(tenantId: string, paymentId: string): Promise<Pago | undefined> {
    const rows = await this.client.select<PaymentRow>(
      `payments?tenant_id=${eq(tenantId)}&id=${eq(paymentId)}&limit=1`,
    );
    const row = rows[0];
    return row ? toPago(row) : undefined;
  }

  /** Intento vigente del pedido: el aprobado manda; si no, el más reciente (pendiente/rechazado). */
  async findByOrder(tenantId: string, orderId: string): Promise<Pago | undefined> {
    const rows = await this.client.select<PaymentRow>(
      `payments?tenant_id=${eq(tenantId)}&order_id=${eq(orderId)}&order=created_at.desc`,
    );
    const approved = rows.find((row) => row.estado === 'aprobado');
    const row = approved ?? rows[0];
    return row ? toPago(row) : undefined;
  }

  async applyTransition(
    tenantId: string,
    paymentId: string,
    from: EstadoPago,
    to: EstadoPago,
    providerPaymentId: string,
    eventType: string,
  ): Promise<{ outcome: TransitionOutcome; payment: Pago } | undefined> {
    const outcome = await this.client.rpc<string>('apply_payment_transition', {
      p_tenant_id: tenantId,
      p_payment_id: paymentId,
      p_from: from,
      p_to: to,
      p_provider_payment_id: providerPaymentId,
      p_event_type: eventType,
      p_payload: {},
      p_actor_id: null,
    });
    if (!OUTCOMES.has(outcome)) {
      // 'conflict' o cualquier retorno inesperado: el dominio lo traduce a PAYMENT_CONFLICT.
      return undefined;
    }
    return {
      outcome: outcome as TransitionOutcome,
      payment: await this.requirePersisted(tenantId, paymentId),
    };
  }

  /** Relectura tras una escritura confirmada. La fila debe existir; su ausencia es un fallo de infraestructura. */
  private async requirePersisted(tenantId: string, paymentId: string): Promise<Pago> {
    const payment = await this.findById(tenantId, paymentId);
    if (!payment) {
      throw new ServiceUnavailableException(
        'Payment storage is inconsistent after a confirmed write.',
      );
    }
    return payment;
  }
}
