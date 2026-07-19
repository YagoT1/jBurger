import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EventPublisher } from '@jburger/domain-events';
import { CategoryService } from '@jburger/domain-categories';
import type { CategoryRepository } from '@jburger/domain-categories';
import { AvailabilityService, MenuService, ProductService } from '@jburger/domain-products';
import type {
  AvailabilityRepository,
  MenuSource,
  ProductRepository,
} from '@jburger/domain-products';
import { LoggingEventPublisher } from '../common/events/logging-event.publisher.js';
import { EVENT_PUBLISHER } from '../common/events/tokens.js';
import { SupabaseRestClient } from '../common/persistence/supabase-rest.client.js';
import { CategoriesController } from './categories.controller.js';
import { MenuController } from './menu.controller.js';
import { ProductsController } from './products.controller.js';
import {
  InMemoryAvailabilityRepository,
  InMemoryCategoryRepository,
  InMemoryMenuSource,
  InMemoryProductRepository,
} from './persistence/in-memory-catalog.repositories.js';
import { InMemoryCatalogStore, seedDemoCatalog } from './persistence/in-memory-catalog.store.js';
import {
  SupabaseAvailabilityRepository,
  SupabaseCategoryRepository,
  SupabaseMenuSource,
  SupabaseProductRepository,
} from './persistence/supabase-catalog.repositories.js';

export const CATALOG_PERSISTENCE = 'CATALOG_PERSISTENCE';

export interface CatalogPersistence {
  categories: CategoryRepository;
  products: ProductRepository;
  availability: AvailabilityRepository;
  menu: MenuSource;
}

const createCatalogPersistence = (config: ConfigService): CatalogPersistence => {
  const url = config.get<string>('SUPABASE_URL');
  const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  if (url && serviceRoleKey) {
    const client = new SupabaseRestClient({ url, serviceRoleKey });
    return {
      categories: new SupabaseCategoryRepository(client),
      products: new SupabaseProductRepository(client),
      availability: new SupabaseAvailabilityRepository(client),
      menu: new SupabaseMenuSource(client),
    };
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.');
  }
  const store = new InMemoryCatalogStore();
  seedDemoCatalog(store);
  return {
    categories: new InMemoryCategoryRepository(store),
    products: new InMemoryProductRepository(store),
    availability: new InMemoryAvailabilityRepository(store),
    menu: new InMemoryMenuSource(store),
  };
};

@Module({
  controllers: [MenuController, CategoriesController, ProductsController],
  providers: [
    { provide: CATALOG_PERSISTENCE, useFactory: createCatalogPersistence, inject: [ConfigService] },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
    {
      provide: CategoryService,
      useFactory: (persistence: CatalogPersistence, events: EventPublisher): CategoryService =>
        new CategoryService(persistence.categories, events),
      inject: [CATALOG_PERSISTENCE, EVENT_PUBLISHER],
    },
    {
      provide: ProductService,
      useFactory: (persistence: CatalogPersistence, events: EventPublisher): ProductService =>
        new ProductService(persistence.products, events),
      inject: [CATALOG_PERSISTENCE, EVENT_PUBLISHER],
    },
    {
      provide: AvailabilityService,
      useFactory: (persistence: CatalogPersistence, events: EventPublisher): AvailabilityService =>
        new AvailabilityService(persistence.availability, events),
      inject: [CATALOG_PERSISTENCE, EVENT_PUBLISHER],
    },
    {
      provide: MenuService,
      useFactory: (persistence: CatalogPersistence): MenuService =>
        new MenuService(persistence.menu),
      inject: [CATALOG_PERSISTENCE],
    },
  ],
})
export class CatalogModule {}
