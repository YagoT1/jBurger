import type { Menu, Product } from '../../entities/product.js';
import type { Money } from '../../entities/money.js';

/** DTOs de red (espejo del contrato `GET /menu` del backend). Solo este archivo los conoce. */
export interface MenuProductDto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: Money;
  imagenUrl?: string;
}
export interface MenuCategoryDto {
  id: string;
  nombre: string;
  orden: number;
  productos: MenuProductDto[];
}
export interface MenuDto {
  tenantId: string;
  branchId: string;
  categorias: MenuCategoryDto[];
  generatedAt: string;
}

/**
 * ÚNICO lugar del frontend que deriva las reglas por categoría (RN-010/RN-011/RF-060)
 * hasta que el backend exponga flags de modificadores/alcohol (PRD §17, backend NUEVO).
 * Cuando eso ocurra, se elimina esta derivación sin tocar la UI.
 */
const HAMBURGUESAS = 'hamburguesas';
const ALCOHOL = 'bebidas con alcohol';
const CAJITA = 'cajita feliz';

const toProduct = (dto: MenuProductDto, categoryId: string, categoryName: string): Product => {
  const category = categoryName.trim().toLowerCase();
  return {
    id: dto.id,
    categoryId,
    name: dto.nombre,
    ...(dto.descripcion !== undefined ? { description: dto.descripcion } : {}),
    price: dto.precio,
    ...(dto.imagenUrl !== undefined ? { imageUrl: dto.imagenUrl } : {}),
    available: true, // el menú del backend ya excluye lo no disponible
    allowsExtraPatty: category === HAMBURGUESAS,
    containsAlcohol: category === ALCOHOL,
    requiresVariantChoice: dto.nombre.trim().toLowerCase() === CAJITA,
  };
};

export const toMenu = (dto: MenuDto): Menu => ({
  categories: dto.categorias.map((category) => ({
    id: category.id,
    name: category.nombre,
    order: category.orden,
    products: category.productos.map((product) => toProduct(product, category.id, category.nombre)),
  })),
  generatedAt: dto.generatedAt,
});
