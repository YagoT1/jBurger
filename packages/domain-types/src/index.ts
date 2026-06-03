import type { Address, AuditMetadata, Coordinates, Money } from '@jburger/shared-kernel';
export type EntityId = string;
export interface Producto { id: EntityId; tenantId: EntityId; categoriaId: EntityId; nombre: string; descripcion?: string; precio: Money; activo: boolean; audit: AuditMetadata; }
export interface Categoria { id: EntityId; tenantId: EntityId; nombre: string; orden: number; activa: boolean; audit: AuditMetadata; }
export interface Pedido { id: EntityId; tenantId: EntityId; sucursalId: EntityId; clienteId?: EntityId; estado: 'borrador' | 'confirmado' | 'preparacion' | 'entregado' | 'cancelado'; total: Money; audit: AuditMetadata; }
export interface Sucursal { id: EntityId; tenantId: EntityId; nombre: string; direccion: Address; coordenadas?: Coordinates; activa: boolean; audit: AuditMetadata; }
export interface Cliente { id: EntityId; tenantId: EntityId; nombre: string; email?: string; telefono?: string; audit: AuditMetadata; }
export interface Usuario { id: EntityId; tenantId: EntityId; email: string; nombre: string; activo: boolean; roleIds: EntityId[]; audit: AuditMetadata; }
export interface Rol { id: EntityId; tenantId: EntityId; nombre: string; descripcion?: string; permissionIds: EntityId[]; audit: AuditMetadata; }
export interface Permiso { id: EntityId; clave: string; recurso: string; accion: string; descripcion?: string; }
export interface AuditEvent { id: EntityId; tenantId: EntityId; actorId?: EntityId; action: string; resource: string; resourceId?: EntityId; metadata?: Record<string, unknown>; occurredAt: string; }
export interface Notification { id: EntityId; tenantId: EntityId; recipientId?: EntityId; channel: 'email' | 'sms' | 'push' | 'in_app'; title: string; body: string; readAt?: string; createdAt: string; }
