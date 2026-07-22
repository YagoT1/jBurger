import type { OrderRepository, PlaceOrderData } from '@jburger/domain-orders';
import type { EstadoPedido, Pedido, PedidoItem } from '@jburger/domain-types';

/** Persistencia de pedidos para desarrollo local sin Supabase. Replica idempotencia y CAS de estado. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders: Pedido[] = [];
  private readonly byKey = new Map<string, string>();
  private sequence = 0;

  async placeOrder(data: PlaceOrderData): Promise<Pedido | undefined> {
    const existingId = this.byKey.get(`${data.tenantId}:${data.idempotencyKey}`);
    if (existingId) {
      return this.orders.find((order) => order.id === existingId);
    }
    this.sequence += 1;
    const order: Pedido = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      sucursalId: data.branchId,
      clienteId: data.customerId,
      numero: this.sequence,
      estado: 'borrador',
      fulfillmentType: data.fulfillmentType,
      ...(data.direccionEntrega !== undefined ? { direccionEntrega: data.direccionEntrega } : {}),
      ...(data.notas !== undefined ? { notas: data.notas } : {}),
      cartId: data.cartId,
      items: data.items.map(
        (item): PedidoItem => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          nombre: item.nombre,
          quantity: item.quantity,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
          ...(item.notas !== undefined ? { notas: item.notas } : {}),
        }),
      ),
      total: data.total,
      audit: { createdAt: new Date().toISOString() },
    };
    this.orders.push(order);
    this.byKey.set(`${data.tenantId}:${data.idempotencyKey}`, order.id);
    return order;
  }

  async findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<Pedido | undefined> {
    const orderId = this.byKey.get(`${tenantId}:${idempotencyKey}`);
    return orderId ? this.orders.find((order) => order.id === orderId) : undefined;
  }

  async findById(tenantId: string, orderId: string): Promise<Pedido | undefined> {
    return this.orders.find((order) => order.tenantId === tenantId && order.id === orderId);
  }
  async listByCustomer(tenantId: string, customerId: string): Promise<Pedido[]> {
    return this.orders.filter(
      (order) => order.tenantId === tenantId && order.clienteId === customerId,
    );
  }
  async listByBranch(tenantId: string, branchId: string, estado?: EstadoPedido): Promise<Pedido[]> {
    return this.orders.filter(
      (order) =>
        order.tenantId === tenantId &&
        order.sucursalId === branchId &&
        (estado === undefined || order.estado === estado),
    );
  }
  async transition(
    tenantId: string,
    orderId: string,
    from: EstadoPedido,
    to: EstadoPedido,
  ): Promise<Pedido | undefined> {
    const index = this.orders.findIndex(
      (order) => order.tenantId === tenantId && order.id === orderId,
    );
    const existing = this.orders[index];
    if (!existing || existing.estado !== from) {
      return undefined;
    }
    const updated: Pedido = {
      ...existing,
      estado: to,
      audit: { ...existing.audit, updatedAt: new Date().toISOString() },
    };
    this.orders[index] = updated;
    return updated;
  }
}
