import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartPricingService, CartService, defaultCartConfig } from '@jburger/domain-cart';
import type { CartCatalogSource, CartRepository } from '@jburger/domain-cart';
import type { EventPublisher } from '@jburger/domain-events';
import { CatalogModule, CATALOG_PERSISTENCE } from '../catalog/catalog.module.js';
import type { CatalogPersistence } from '../catalog/catalog.module.js';
import { LoggingEventPublisher } from '../common/events/logging-event.publisher.js';
import { EVENT_PUBLISHER } from '../common/events/tokens.js';
import { SupabaseRestClient } from '../common/persistence/supabase-rest.client.js';
import { CartController } from './cart.controller.js';
import { CatalogSourceAdapter } from './persistence/catalog-source.adapter.js';
import { InMemoryCartRepository } from './persistence/in-memory-cart.repository.js';
import { SupabaseCartRepository } from './persistence/supabase-cart.repository.js';

export const CART_REPOSITORY = 'CART_REPOSITORY';
export const CART_CATALOG_SOURCE = 'CART_CATALOG_SOURCE';

const createCartRepository = (config: ConfigService): CartRepository => {
  const url = config.get<string>('SUPABASE_URL');
  const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  if (url && serviceRoleKey) {
    return new SupabaseCartRepository(new SupabaseRestClient({ url, serviceRoleKey }));
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.');
  }
  return new InMemoryCartRepository();
};

@Module({
  imports: [CatalogModule],
  controllers: [CartController],
  providers: [
    { provide: CART_REPOSITORY, useFactory: createCartRepository, inject: [ConfigService] },
    {
      provide: CART_CATALOG_SOURCE,
      useFactory: (persistence: CatalogPersistence): CartCatalogSource =>
        new CatalogSourceAdapter(persistence),
      inject: [CATALOG_PERSISTENCE],
    },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
    {
      provide: CartService,
      useFactory: (
        repository: CartRepository,
        catalog: CartCatalogSource,
        config: ConfigService,
        events: EventPublisher,
      ): CartService =>
        new CartService(
          repository,
          catalog,
          {
            maxItemQuantity:
              config.get<number>('MAX_CART_ITEM_QUANTITY') ?? defaultCartConfig.maxItemQuantity,
          },
          events,
        ),
      inject: [CART_REPOSITORY, CART_CATALOG_SOURCE, ConfigService, EVENT_PUBLISHER],
    },
    {
      provide: CartPricingService,
      useFactory: (catalog: CartCatalogSource): CartPricingService =>
        new CartPricingService(catalog),
      inject: [CART_CATALOG_SOURCE],
    },
  ],
})
export class CartModule {}
