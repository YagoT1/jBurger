import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '@jburger/domain-payments';
import type {
  PaymentOrderSource,
  PaymentProviderGateway,
  PaymentRepository,
} from '@jburger/domain-payments';
import type { OrderRepository } from '@jburger/domain-orders';
import type { EventPublisher } from '@jburger/domain-events';
import { LoggingEventPublisher } from '../common/events/logging-event.publisher.js';
import { EVENT_PUBLISHER } from '../common/events/tokens.js';
import { SupabaseRestClient } from '../common/persistence/supabase-rest.client.js';
import { ORDER_REPOSITORY, OrdersModule } from '../orders/orders.module.js';
import { PaymentsController } from './payments.controller.js';
import {
  PAYMENT_ORDER_SOURCE,
  PAYMENT_PROVIDER_GATEWAY,
  PAYMENT_REPOSITORY,
  PAYMENT_WEBHOOK_VERIFIER,
} from './payments.tokens.js';
import { InMemoryPaymentRepository } from './persistence/in-memory-payment.repository.js';
import { PaymentOrderSourceAdapter } from './persistence/payment-order-source.adapter.js';
import { SupabasePaymentRepository } from './persistence/supabase-payment.repository.js';
import { MercadoPagoGateway } from './providers/mercadopago.gateway.js';
import { MockPaymentGateway } from './providers/mock-payment.gateway.js';
import type { PaymentWebhookVerifier } from './providers/payment-webhook.verifier.js';
import { PaymentWebhooksController } from './webhooks.controller.js';

const createPaymentRepository = (
  config: ConfigService,
  orders: OrderRepository,
): PaymentRepository => {
  const url = config.get<string>('SUPABASE_URL');
  const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  if (url && serviceRoleKey) {
    return new SupabasePaymentRepository(new SupabaseRestClient({ url, serviceRoleKey }));
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.');
  }
  return new InMemoryPaymentRepository(orders);
};

/**
 * Con credenciales configuradas se usa Mercado Pago; sin ellas, el proveedor mock para desarrollo.
 * En producción sin credenciales: fail-fast (mismo criterio que la persistencia).
 * El gateway y el verificador de webhooks son la misma instancia: un proveedor es una sola pieza.
 */
/** Un proveedor es una sola pieza: crea checkouts y verifica sus propias notificaciones. */
type PaymentProvider = PaymentProviderGateway & PaymentWebhookVerifier;

const createPaymentGateway = (config: ConfigService): PaymentProvider => {
  const accessToken = config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
  const webhookSecret = config.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
  if (accessToken && webhookSecret) {
    return new MercadoPagoGateway({
      accessToken,
      webhookSecret,
      publicApiUrl: config.get<string>('PUBLIC_API_URL') ?? 'http://localhost:3001',
      publicAppUrl: config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:3000',
    });
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error(
      'MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET are required in production.',
    );
  }
  return new MockPaymentGateway();
};

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, PaymentWebhooksController],
  providers: [
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
    {
      provide: PAYMENT_REPOSITORY,
      useFactory: createPaymentRepository,
      inject: [ConfigService, ORDER_REPOSITORY],
    },
    {
      provide: PAYMENT_ORDER_SOURCE,
      useFactory: (orders: OrderRepository): PaymentOrderSource =>
        new PaymentOrderSourceAdapter(orders),
      inject: [ORDER_REPOSITORY],
    },
    {
      provide: PAYMENT_PROVIDER_GATEWAY,
      useFactory: createPaymentGateway,
      inject: [ConfigService],
    },
    {
      provide: PAYMENT_WEBHOOK_VERIFIER,
      useFactory: (gateway: PaymentProvider): PaymentWebhookVerifier => gateway,
      inject: [PAYMENT_PROVIDER_GATEWAY],
    },
    {
      provide: PaymentService,
      useFactory: (
        repository: PaymentRepository,
        orderSource: PaymentOrderSource,
        gateway: PaymentProviderGateway,
        events: EventPublisher,
      ): PaymentService => new PaymentService(repository, orderSource, gateway, events),
      inject: [PAYMENT_REPOSITORY, PAYMENT_ORDER_SOURCE, PAYMENT_PROVIDER_GATEWAY, EVENT_PUBLISHER],
    },
  ],
})
export class PaymentsModule {}
