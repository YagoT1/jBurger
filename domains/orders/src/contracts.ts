import type { Address, Money } from '@jburger/shared-kernel';
import type {
  EstadoPedido,
  FulfillmentType,
  Pedido,
  PedidoItem,
  PricedCart,
} from '@jburger/domain-types';

export interface PlaceOrderCommand {
  tenantId: string;
  customerId: string;
  branchId: string;
  idempotencyKey: string;
  fulfillmentType: FulfillmentType;
  expectedTotal: Money;
  direccionEntrega?: Address;
  notas?: string;
  actorId: string;
}

export interface TransitionOrderCommand {
  tenantId: string;
  orderId: string;
  to: EstadoPedido;
  actorId: string;
  reason?: string;
}

export interface CancelOrderCommand {
  tenantId: string;
  orderId: string;
  actorId: string;
  reason?: string;
}

/** Snapshot financiero inmutable que persiste el pedido (a diferencia del carrito). */
export interface OrderSnapshotItem {
  productId: string;
  nombre: string;
  quantity: number;
  precioUnitario: Money;
  subtotal: Money;
  notas?: string;
}

export interface PlaceOrderData {
  tenantId: string;
  customerId: string;
  branchId: string;
  cartId: string;
  expectedCartVersion: number;
  idempotencyKey: string;
  fulfillmentType: FulfillmentType;
  direccionEntrega?: Address;
  notas?: string;
  total: Money;
  items: OrderSnapshotItem[];
}

/** Puerto hacia el carrito (DIP: pedidos no depende de domain-cart). */
export interface CheckoutCartSource {
  findActivePricedCart(tenantId: string, customerId: string): Promise<PricedCart | undefined>;
}

export interface OrderRepository {
  /** Checkout transaccional e idempotente. Devuelve el pedido creado, el existente (misma clave), o undefined si el carrito no pudo convertirse. */
  placeOrder(data: PlaceOrderData): Promise<Pedido | undefined>;
  /** Pedido asociado a una idempotency_key ya usada. Habilita el reintento idempotente aun con el carrito ya consumido (ADR-024 §1). */
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<Pedido | undefined>;
  findById(tenantId: string, orderId: string): Promise<Pedido | undefined>;
  listByCustomer(tenantId: string, customerId: string): Promise<Pedido[]>;
  listByBranch(tenantId: string, branchId: string, estado?: EstadoPedido): Promise<Pedido[]>;
  /** Transición de estado con CAS sobre el estado origen. Devuelve el pedido actualizado o undefined en conflicto. */
  transition(
    tenantId: string,
    orderId: string,
    from: EstadoPedido,
    to: EstadoPedido,
    actorId: string,
    reason?: string,
  ): Promise<Pedido | undefined>;
}

export type { EstadoPedido, Pedido, PedidoItem };
