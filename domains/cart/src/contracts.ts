import type {
  Cart,
  CartItem,
  DisponibilidadProducto,
  FulfillmentType,
  Producto,
} from '@jburger/domain-types';

/** Configuración operativa del carrito. Inyectada desde el entorno; el dominio no fija valores. */
export interface CartConfig {
  maxItemQuantity: number;
}
export const defaultCartConfig: CartConfig = { maxItemQuantity: 20 };

export interface AddItemCommand {
  tenantId: string;
  customerId: string;
  branchId?: string;
  productId: string;
  quantity: number;
  notas?: string;
  expectedVersion?: number;
  actorId: string;
}
export interface UpdateItemQuantityCommand {
  tenantId: string;
  customerId: string;
  productId: string;
  quantity: number;
  expectedVersion: number;
  actorId: string;
}
export interface RemoveItemCommand {
  tenantId: string;
  customerId: string;
  productId: string;
  expectedVersion: number;
  actorId: string;
}
export interface ClearCartCommand {
  tenantId: string;
  customerId: string;
  expectedVersion: number;
  actorId: string;
}
export interface GuestCartItem {
  productId: string;
  quantity: number;
  notas?: string;
}
export interface MergeGuestCartCommand {
  tenantId: string;
  customerId: string;
  branchId?: string;
  items: GuestCartItem[];
  actorId: string;
}
export type MergeDiscardReason = 'removed' | 'invalid_quantity';
export interface MergeReportEntry {
  productId: string;
  reason: MergeDiscardReason | 'capped';
}
export interface MergeResult {
  cart: Cart;
  report: MergeReportEntry[];
}

/** Mutación atómica del carrito: el repositorio aplica compare-and-set sobre `version`. */
export interface CartMutation {
  branchId?: string;
  fulfillmentType?: FulfillmentType;
  items: CartItem[];
}

export interface CartRepository {
  findActiveByCustomer(tenantId: string, customerId: string): Promise<Cart | undefined>;
  createActive(tenantId: string, customerId: string, branchId: string | undefined): Promise<Cart>;
  /** Aplica la mutación solo si `expectedVersion` coincide; devuelve el carrito con versión incrementada o `undefined` en conflicto. */
  applyMutation(
    tenantId: string,
    cartId: string,
    expectedVersion: number,
    mutation: CartMutation,
  ): Promise<Cart | undefined>;
}

/** Puerto hacia el catálogo (DIP: el dominio de carrito no conoce al dominio de productos). */
export interface CartCatalogSource {
  findActiveProduct(tenantId: string, productId: string): Promise<Producto | undefined>;
  findAvailability(
    tenantId: string,
    branchId: string,
    productId: string,
  ): Promise<DisponibilidadProducto | undefined>;
}
