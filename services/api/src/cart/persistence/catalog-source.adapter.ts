import type { CartCatalogSource } from '@jburger/domain-cart';
import type { DisponibilidadProducto, Producto } from '@jburger/domain-types';
import type { CatalogPersistence } from '../../catalog/catalog.module.js';

/**
 * Adaptador del puerto CartCatalogSource sobre la persistencia del catálogo existente.
 * Reutiliza la selección Supabase/in-memory del CatalogModule sin duplicar acceso a datos.
 */
export class CatalogSourceAdapter implements CartCatalogSource {
  constructor(private readonly persistence: CatalogPersistence) {}

  async findActiveProduct(tenantId: string, productId: string): Promise<Producto | undefined> {
    const producto = await this.persistence.products.findById(tenantId, productId);
    return producto?.activo ? producto : undefined;
  }

  async findAvailability(
    tenantId: string,
    branchId: string,
    productId: string,
  ): Promise<DisponibilidadProducto | undefined> {
    const availability = await this.persistence.availability.listByBranch(tenantId, branchId);
    return availability.find((item) => item.productId === productId);
  }
}
