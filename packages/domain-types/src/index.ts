import type { Address, AuditMetadata, Coordinates, Money } from '@jburger/shared-kernel';
export type EntityId = string;
export interface Producto {
  id: EntityId;
  tenantId: EntityId;
  categoriaId: EntityId;
  nombre: string;
  descripcion?: string;
  precio: Money;
  imagenUrl?: string;
  activo: boolean;
  audit: AuditMetadata;
}
export interface DisponibilidadProducto {
  tenantId: EntityId;
  branchId: EntityId;
  productId: EntityId;
  disponible: boolean;
  precioOverride?: Money;
  updatedAt: string;
}
export interface MenuProducto {
  id: EntityId;
  nombre: string;
  descripcion?: string;
  precio: Money;
  imagenUrl?: string;
}
export interface MenuCategoria {
  id: EntityId;
  nombre: string;
  orden: number;
  productos: MenuProducto[];
}
export interface Menu {
  tenantId: EntityId;
  branchId: EntityId;
  categorias: MenuCategoria[];
  generatedAt: string;
}
export type CartStatus = 'active' | 'converted' | 'expired' | 'abandoned';
export type FulfillmentType = 'pickup' | 'delivery';
export interface CartItem {
  id: EntityId;
  productId: EntityId;
  quantity: number;
  notas?: string;
}
export interface Cart {
  id: EntityId;
  tenantId: EntityId;
  branchId?: EntityId;
  customerId: EntityId;
  version: number;
  status: CartStatus;
  fulfillmentType?: FulfillmentType;
  items: CartItem[];
  expiresAt?: string;
  lastPricedAt?: string;
  audit: AuditMetadata;
}
export type CartItemValidationState = 'ok' | 'unavailable' | 'removed';
export interface PricedCartItem {
  productId: EntityId;
  quantity: number;
  state: CartItemValidationState;
  nombre?: string;
  notas?: string;
  precioUnitario?: Money;
  subtotal?: Money;
}
export interface PricedCart {
  cartId: EntityId;
  tenantId: EntityId;
  branchId?: EntityId;
  version: number;
  items: PricedCartItem[];
  total: Money;
  generatedAt: string;
}
export interface Categoria {
  id: EntityId;
  tenantId: EntityId;
  nombre: string;
  orden: number;
  activa: boolean;
  audit: AuditMetadata;
}
export interface Pedido {
  id: EntityId;
  tenantId: EntityId;
  sucursalId: EntityId;
  clienteId?: EntityId;
  estado: 'borrador' | 'confirmado' | 'preparacion' | 'entregado' | 'cancelado';
  total: Money;
  audit: AuditMetadata;
}
export interface Sucursal {
  id: EntityId;
  tenantId: EntityId;
  nombre: string;
  direccion: Address;
  coordenadas?: Coordinates;
  activa: boolean;
  audit: AuditMetadata;
}
export interface Cliente {
  id: EntityId;
  tenantId: EntityId;
  nombre: string;
  email?: string;
  telefono?: string;
  audit: AuditMetadata;
}
export interface Usuario {
  id: EntityId;
  tenantId: EntityId;
  email: string;
  nombre: string;
  activo: boolean;
  roleIds: EntityId[];
  audit: AuditMetadata;
}
export interface Rol {
  id: EntityId;
  tenantId: EntityId;
  nombre: string;
  descripcion?: string;
  permissionIds: EntityId[];
  audit: AuditMetadata;
}
export interface Permiso {
  id: EntityId;
  clave: string;
  recurso: string;
  accion: string;
  descripcion?: string;
}
export interface AuditEvent {
  id: EntityId;
  tenantId: EntityId;
  actorId?: EntityId;
  action: string;
  resource: string;
  resourceId?: EntityId;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}
export interface Notification {
  id: EntityId;
  tenantId: EntityId;
  recipientId?: EntityId;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
}
