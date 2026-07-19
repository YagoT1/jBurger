import type { Categoria, DisponibilidadProducto, Producto } from '@jburger/domain-types';
// Estándar de identificadores: RFC 4122, formato v4 (ver ADR-022). Alineados con supabase/seeds.
export const DEMO_TENANT_ID = 'a0000000-0000-4000-8000-000000000001';
export const DEMO_BRANCH_ID = 'b0000000-0000-4000-8000-000000000001';
export class InMemoryCatalogStore {
  readonly categories: Categoria[] = [];
  readonly products: Producto[] = [];
  readonly availability: DisponibilidadProducto[] = [];
}
export const seedDemoCatalog = (store: InMemoryCatalogStore): void => {
  const now = new Date().toISOString();
  const audit = { createdAt: now };
  const categorias: Categoria[] = [
    {
      id: 'c0000000-0000-4000-8000-000000000001',
      tenantId: DEMO_TENANT_ID,
      nombre: 'Clásicas',
      orden: 1,
      activa: true,
      audit,
    },
    {
      id: 'c0000000-0000-4000-8000-000000000002',
      tenantId: DEMO_TENANT_ID,
      nombre: 'Especiales',
      orden: 2,
      activa: true,
      audit,
    },
    {
      id: 'c0000000-0000-4000-8000-000000000003',
      tenantId: DEMO_TENANT_ID,
      nombre: 'Acompañamientos',
      orden: 3,
      activa: true,
      audit,
    },
    {
      id: 'c0000000-0000-4000-8000-000000000004',
      tenantId: DEMO_TENANT_ID,
      nombre: 'Bebidas',
      orden: 4,
      activa: true,
      audit,
    },
  ];
  const productos: Producto[] = [
    {
      id: 'd0000000-0000-4000-8000-000000000001',
      tenantId: DEMO_TENANT_ID,
      categoriaId: categorias[0]!.id,
      nombre: 'J Simple',
      descripcion: 'Medallón de carne, cheddar, lechuga y tomate.',
      precio: { amount: 7500, currency: 'ARS' },
      activo: true,
      audit,
    },
    {
      id: 'd0000000-0000-4000-8000-000000000002',
      tenantId: DEMO_TENANT_ID,
      categoriaId: categorias[0]!.id,
      nombre: 'J Doble',
      descripcion: 'Doble medallón, doble cheddar y salsa de la casa.',
      precio: { amount: 9200, currency: 'ARS' },
      activo: true,
      audit,
    },
    {
      id: 'd0000000-0000-4000-8000-000000000003',
      tenantId: DEMO_TENANT_ID,
      categoriaId: categorias[1]!.id,
      nombre: 'J Bacon',
      descripcion: 'Doble medallón, bacon crocante y cebolla caramelizada.',
      precio: { amount: 10500, currency: 'ARS' },
      activo: true,
      audit,
    },
    {
      id: 'd0000000-0000-4000-8000-000000000004',
      tenantId: DEMO_TENANT_ID,
      categoriaId: categorias[2]!.id,
      nombre: 'Papas J',
      descripcion: 'Papas rústicas con cheddar y verdeo.',
      precio: { amount: 4800, currency: 'ARS' },
      activo: true,
      audit,
    },
    {
      id: 'd0000000-0000-4000-8000-000000000005',
      tenantId: DEMO_TENANT_ID,
      categoriaId: categorias[3]!.id,
      nombre: 'Gaseosa 500ml',
      precio: { amount: 2500, currency: 'ARS' },
      activo: true,
      audit,
    },
  ];
  store.categories.push(...categorias);
  store.products.push(...productos);
  store.availability.push({
    tenantId: DEMO_TENANT_ID,
    branchId: DEMO_BRANCH_ID,
    productId: productos[4]!.id,
    disponible: true,
    precioOverride: { amount: 2200, currency: 'ARS' },
    updatedAt: now,
  });
};
