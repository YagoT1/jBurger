import { describe, expect, it } from 'vitest';
import { MenuService } from '@jburger/domain-products';
import {
  InMemoryMenuSource,
  InMemoryProductRepository,
} from './persistence/in-memory-catalog.repositories.js';
import {
  DEMO_BRANCH_ID,
  DEMO_TENANT_ID,
  InMemoryCatalogStore,
  seedDemoCatalog,
} from './persistence/in-memory-catalog.store.js';
describe('Catalog wiring', () => {
  it('serves the demo menu with branch price overrides applied', async () => {
    const store = new InMemoryCatalogStore();
    seedDemoCatalog(store);
    const menu = await new MenuService(new InMemoryMenuSource(store)).getMenu({
      tenantId: DEMO_TENANT_ID,
      branchId: DEMO_BRANCH_ID,
    });
    expect(menu.categorias.map((categoria) => categoria.nombre)).toEqual([
      'Clásicas',
      'Especiales',
      'Acompañamientos',
      'Bebidas',
    ]);
    const gaseosa = menu.categorias
      .at(-1)
      ?.productos.find((producto) => producto.nombre === 'Gaseosa 500ml');
    expect(gaseosa?.precio).toEqual({ amount: 2200, currency: 'ARS' });
  });
  it('rejects duplicated product names per tenant', async () => {
    const store = new InMemoryCatalogStore();
    seedDemoCatalog(store);
    const repository = new InMemoryProductRepository(store);
    await expect(
      repository.create({
        tenantId: DEMO_TENANT_ID,
        categoriaId: store.categories[0]!.id,
        nombre: 'J Simple',
        precio: { amount: 1000, currency: 'ARS' },
        actorId: 'actor_1',
      }),
    ).rejects.toThrow('Product name already exists.');
  });
});
