import { Controller, HttpCode, Inject, Logger, Post, Query, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentService } from '@jburger/domain-payments';
import type { PaymentWebhookVerifier } from './providers/payment-webhook.verifier.js';
import { PAYMENT_WEBHOOK_VERIFIER } from './payments.tokens.js';

const header = (req: Request, name: string): string | undefined => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Ingesta de notificaciones del proveedor. Endpoint público: sin guards de autenticación ni de
 * tenant (el proveedor no envía sesión). La confianza proviene EXCLUSIVAMENTE de la verificación
 * de firma del adaptador; el tenant se resuelve desde la referencia externa del pago.
 *
 * Responde 200 en todos los casos salvo error de infraestructura: el proveedor reintenta ante
 * cualquier no-2xx, y una notificación inválida o irrelevante no debe generar reintentos infinitos.
 * Las notificaciones rechazadas quedan registradas en el log y, cuando resuelven un pago, en
 * `payment_events`.
 */
@ApiExcludeController()
@Controller('webhooks')
export class PaymentWebhooksController {
  private readonly logger = new Logger(PaymentWebhooksController.name);

  constructor(
    private readonly payments: PaymentService,
    @Inject(PAYMENT_WEBHOOK_VERIFIER) private readonly verifier: PaymentWebhookVerifier,
  ) {}

  @Post('mercadopago')
  @HttpCode(200)
  async ingest(@Req() req: Request, @Query('data.id') dataId?: string) {
    const resolved = await this.verifier.verify(
      { signature: header(req, 'x-signature'), requestId: header(req, 'x-request-id') },
      dataId,
    );
    if (!resolved) {
      // Firma inválida, ausente, o evento sin efecto (estado no terminal). Sin mutación de estado.
      this.logger.warn('Discarded an unverified or irrelevant payment notification.');
      return { received: true, applied: false };
    }

    await this.payments.handleProviderEvent({
      tenantId: resolved.tenantId,
      paymentId: resolved.paymentId,
      providerPaymentId: resolved.providerPaymentId,
      targetEstado: resolved.targetEstado,
      eventType: resolved.eventType,
    });
    return { received: true, applied: true };
  }
}
