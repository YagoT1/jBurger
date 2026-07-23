import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartPricingService, CartService } from '@jburger/domain-cart';
import { CheckoutService, OrderService } from '@jburger/domain-orders';
import type { CheckoutCartSource, OrderRepository } from '@jburger/domain-orders';
import type { EventPublisher } from '@jburger/domain-events';
import { CartModule } from '../cart/cart.module.js';
import { LoggingEventPublisher } from '../common/events/logging-event.publisher.js';
import { EVENT_PUBLISHER } from '../common/events/tokens.js';
import { SupabaseRestClient } from '../common/persistence/supabase-rest.client.js';
import { OrdersController } from './orders.controller.js';
import { CheckoutCartSourceAdapter } from './persistence/checkout-cart-source.adapter.js';
import { InMemoryOrderRepository } from './persistence/in-memory-order.repository.js';
import { SupabaseOrderRepository } from './persistence/supabase-order.repository.js';

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
export const CHECKOUT_CART_SOURCE = 'CHECKOUT_CART_SOURCE';

const createOrderRepository = (config: ConfigService): OrderRepository => {
  const url = config.get<string>('SUPABASE_URL');
  const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  if (url && serviceRoleKey) {
    return new SupabaseOrderRepository(new SupabaseRestClient({ url, serviceRoleKey }));
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.');
  }
  return new InMemoryOrderRepository();
};

@Module({
  imports: [CartModule],
  controllers: [OrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useFactory: createOrderRepository, inject: [ConfigService] },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
    {
      provide: CHECKOUT_CART_SOURCE,
      useFactory: (
        cartService: CartService,
        pricingService: CartPricingService,
      ): CheckoutCartSource => new CheckoutCartSourceAdapter(cartService, pricingService),
      inject: [CartService, CartPricingService],
    },
    {
      provide: CheckoutService,
      useFactory: (
        cartSource: CheckoutCartSource,
        repository: OrderRepository,
        events: EventPublisher,
      ): CheckoutService => new CheckoutService(cartSource, repository, events),
      inject: [CHECKOUT_CART_SOURCE, ORDER_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: OrderService,
      useFactory: (repository: OrderRepository, events: EventPublisher): OrderService =>
        new OrderService(repository, events),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER],
    },
  ],
  // ORDER_REPOSITORY se exporta para que PaymentsModule reutilice la misma instancia de persistencia
  // (crítico con InMemoryOrderRepository: dos instancias no compartirían pedidos).
  exports: [ORDER_REPOSITORY, OrderService],
})
export class OrdersModule {}
