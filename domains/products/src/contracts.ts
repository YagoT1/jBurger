import type { Money } from '@jburger/shared-kernel';
import type { Categoria, DisponibilidadProducto, Producto } from '@jburger/domain-types';
export interface CreateProductCommand {
  tenantId: string;
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  precio: Money;
  imagenUrl?: string;
  actorId: string;
}
export interface UpdateProductCommand {
  id: string;
  tenantId: string;
  categoriaId?: string;
  nombre?: string;
  descripcion?: string;
  precio?: Money;
  imagenUrl?: string;
  actorId: string;
}
export interface DisableProductCommand {
  id: string;
  tenantId: string;
  actorId: string;
}
export interface SetAvailabilityCommand {
  tenantId: string;
  branchId: string;
  productId: string;
  disponible: boolean;
  precioOverride?: Money;
  actorId: string;
}
export interface ProductQueries {
  list(tenantId: string): Promise<Producto[]>;
  findById(tenantId: string, id: string): Promise<Producto | undefined>;
}
export interface ProductCommands {
  create(command: CreateProductCommand): Promise<Producto>;
  update(command: UpdateProductCommand): Promise<Producto>;
  disable(command: DisableProductCommand): Promise<void>;
}
export interface ProductRepository extends ProductQueries, ProductCommands {}
export interface AvailabilityRepository {
  listByBranch(tenantId: string, branchId: string): Promise<DisponibilidadProducto[]>;
  set(command: SetAvailabilityCommand): Promise<DisponibilidadProducto>;
}
export interface MenuSource {
  listActiveCategories(tenantId: string): Promise<Categoria[]>;
  listActiveProducts(tenantId: string): Promise<Producto[]>;
  listAvailability(tenantId: string, branchId: string): Promise<DisponibilidadProducto[]>;
}
