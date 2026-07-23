import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { PaymentProviderGateway } from '@jburger/domain-payments';
import type { Pago } from '@jburger/domain-types';
import {
  decodeExternalReference,
  encodeExternalReference,
  mapMercadoPagoStatus,
  verifyMercadoPagoSignature,
  type PaymentWebhookVerifier,
  type ResolvedWebhook,
  type WebhookHeaders,
} from './payment-webhook.verifier.js';

export interface MercadoPagoOptions {
  accessToken: string;
  webhookSecret: string;
  /** URL pública base de la API: destino de la notificación (`notification_url`). */
  publicApiUrl: string;
  /** URL pública del frontend: destino del redirect posterior al pago (`back_urls`). */
  publicAppUrl: string;
  apiBaseUrl?: string;
}

interface PreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}
interface MercadoPagoPayment {
  id?: number | string;
  status?: string;
  external_reference?: string;
}

const DEFAULT_API = 'https://api.mercadopago.com';

/**
 * Adaptador Checkout Pro. El dominio no lo conoce: implementa el puerto `PaymentProviderGateway`
 * y, para la API, el verificador de webhooks. Cambiar de proveedor = nuevo adaptador.
 */
export class MercadoPagoGateway implements PaymentProviderGateway, PaymentWebhookVerifier {
  readonly provider = 'mercadopago' as const;
  private readonly logger = new Logger(MercadoPagoGateway.name);
  private readonly api: string;

  constructor(private readonly options: MercadoPagoOptions) {
    this.api = options.apiBaseUrl ?? DEFAULT_API;
  }

  async createCheckout(payment: Pago): Promise<{ preferenceId: string; checkoutUrl: string }> {
    const response = await fetch(`${this.api}/checkout/preferences`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.options.accessToken}`,
        'content-type': 'application/json',
        // Idempotencia del lado del proveedor: reintentos no crean una segunda preferencia.
        'x-idempotency-key': payment.id,
      },
      body: JSON.stringify({
        // external_reference es la única forma de resolver nuestro pago desde el webhook.
        external_reference: encodeExternalReference(payment.tenantId, payment.id),
        notification_url: `${this.options.publicApiUrl}/webhooks/mercadopago`,
        back_urls: {
          success: `${this.options.publicAppUrl}/pedidos/${payment.orderId}`,
          pending: `${this.options.publicAppUrl}/pedidos/${payment.orderId}`,
          failure: `${this.options.publicAppUrl}/pedidos/${payment.orderId}`,
        },
        items: [
          {
            id: payment.orderId,
            title: `Pedido ${payment.orderId}`,
            quantity: 1,
            unit_price: payment.monto.amount,
            currency_id: payment.monto.currency,
          },
        ],
      }),
    });
    if (!response.ok) {
      // El detalle del proveedor solo va al log; el cliente recibe PROVIDER_UNAVAILABLE.
      this.logger.error(`Mercado Pago preference failed with status ${response.status}.`);
      throw new ServiceUnavailableException('Payment provider rejected the checkout creation.');
    }
    const preference = (await response.json()) as PreferenceResponse;
    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;
    if (!preference.id || !checkoutUrl) {
      throw new ServiceUnavailableException('Payment provider returned an incomplete preference.');
    }
    return { preferenceId: preference.id, checkoutUrl };
  }

  /**
   * Verifica la firma y resuelve la notificación consultando el pago en el proveedor.
   * El estado NUNCA se toma del payload entrante: se lee de la API de Mercado Pago, que es la
   * fuente de verdad (un payload puede ser reenviado o manipulado aunque la firma valide el id).
   */
  async verify(
    headers: WebhookHeaders,
    dataId: string | undefined,
  ): Promise<ResolvedWebhook | undefined> {
    if (!headers.signature || !headers.requestId || !dataId) {
      return undefined;
    }
    if (
      !verifyMercadoPagoSignature(
        headers.signature,
        headers.requestId,
        dataId,
        this.options.webhookSecret,
      )
    ) {
      return undefined;
    }

    const response = await fetch(`${this.api}/v1/payments/${encodeURIComponent(dataId)}`, {
      headers: { authorization: `Bearer ${this.options.accessToken}` },
    });
    if (!response.ok) {
      this.logger.error(`Mercado Pago payment lookup failed with status ${response.status}.`);
      throw new ServiceUnavailableException('Payment provider is unavailable.');
    }
    const payment = (await response.json()) as MercadoPagoPayment;
    const targetEstado = mapMercadoPagoStatus(payment.status ?? '');
    const reference = payment.external_reference
      ? decodeExternalReference(payment.external_reference)
      : undefined;
    if (!targetEstado || !reference) {
      // Estado no terminal (pending/in_process) o pago ajeno a esta integración: nada que aplicar.
      return undefined;
    }
    return {
      providerPaymentId: String(payment.id ?? dataId),
      tenantId: reference.tenantId,
      paymentId: reference.paymentId,
      targetEstado,
      eventType: `payment.${payment.status}`,
    };
  }
}
