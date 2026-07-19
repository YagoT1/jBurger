import { describe, expect, it } from 'vitest';
import type { Categoria, Producto } from '@jburger/domain-types';
import { MenuService } from './menu.service.js';
import type { MenuSource } from './contracts.js';
const audit = { createdAt: new Date().toISOString() };
const categorias: Categoria[] = [
  { id: 'cat_bebidas', tenantId: 'tenant_1', nombre: 'Bebidas', orden: 2, activa: true, audit },
  { id: 'cat_clasicas', tenantId: 'tenant_1', nombre: 'Clásicas', orden: 1, activa: true, audit },
  { id: 'cat_vacia', tenantId: 'tenant_1', nombre: 'Sin productos', orden: 3, activa: true, audit },
];
const productos: Producto[] = [
  {
    id: 'prod_simple',
    tenantId: 'tenant_1',
    categoriaId: 'cat_clasicas',
    nombre: 'Simple',
    precio: { amount: 7000, currency: 'ARS' },
    activo: true,
    audit,
  },
  {
    id: 'prod_doble',
    tenantId: 'tenant_1',
    categoriaId: 'cat_clasicas',
    nombre: 'Doble',
    precio: { amount: 8500, currency: 'ARS' },
    activo: true,
    audit,
  },
  {
    id: 'prod_gaseosa',
    tenantId: 'tenant_1',
    categoriaId: 'cat_bebidas',
    nombre: 'Gaseosa',
    precio: { amount: 2500, currency: 'ARS' },
    activo: true,
    audit,
  },
];
const source: MenuSource = {
  async listActiveCategories() {
    return categorias;
  },
  async listActiveProducts() {
    return productos;
  },
  async listAvailability() {
    return [
      {
        tenantId: 'tenant_1',
        branchId: 'branch_1',
        productId: 'prod_doble',
        disponible: false,
        updatedAt: new Date().toISOString(),
      },
      {
        tenantId: 'tenant_1',
        branchId: 'branch_1',
        productId: 'prod_gaseosa',
        disponible: true,
        precioOverride: { amount: 2000, currency: 'ARS' },
        updatedAt: new Date().toISOString(),
      },
    ];
  },
};
describe('MenuService', () => {
  it('builds a branch menu applying availability, overrides, ordering and empty-category pruning', async () => {
    const menu = await new MenuService(source).getMenu({
      tenantId: 'tenant_1',
      branchId: 'branch_1',
    });
    expect(menu.categorias.map((categoria) => categoria.nombre)).toEqual(['Clásicas', 'Bebidas']);
    expect(menu.categorias[0]?.productos.map((producto) => producto.id)).toEqual(['prod_simple']);
    expect(menu.categorias[1]?.productos[0]?.precio.amount).toBe(2000);
  });
});
