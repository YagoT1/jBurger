import type { PaymentProviderGateway } from '@jburger/domain-payments';
import type { Pago } from '@jburger/domain-types';
import type { PaymentWebhookVerifier, ResolvedWebhook } from './payment-webhook.verifier.js';

/**
 * Proveedor de desarrollo local sin credenciales, análogo a las persistencias in-memory.
 * En producción el módulo hace fail-fast antes de instanciarlo (ver payments.module.ts).
 * No verifica firmas: rechaza toda notificación entrante para no simular un canal confiable.
 */
export class MockPaymentGateway implements PaymentProviderGateway, PaymentWebhookVerifier {
  readonly provider = 'mock' as const;

  async createCheckout(payment: Pago): Promise<{ preferenceId: string; checkoutUrl: string }> {
    return {
      preferenceId: `mock_pref_${payment.id}`,
      checkoutUrl: `http://localhost:3001/mock-checkout/${payment.id}`,
    };
  }

  async verify(): Promise<ResolvedWebhook | undefined> {
    return undefined;
  }
}
