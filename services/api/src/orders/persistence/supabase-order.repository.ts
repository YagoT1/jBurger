import { ServiceUnavailableException } from '@nestjs/common';
import type { OrderRepository, PlaceOrderData } from '@jburger/domain-orders';
import type { Address } from '@jburger/shared-kernel';
import type { EstadoPedido, FulfillmentType, Pedido, PedidoItem } from '@jburger/domain-types';
import { eq, SupabaseRestClient } from '../../common/persistence/supabase-rest.client.js';

interface OrderRow {
  id: string;
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  numero: number;
  estado: EstadoPedido;
  fulfillment_type: FulfillmentType;
  delivery_address: Address | null;
  notas: string | null;
  cart_id: string | null;
  total_amount: number | string;
  total_currency: PedidoItem['precioUnitario']['currency'];
  created_at: string;
  updated_at: string;
}
interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  nombre: string;
  quantity: number;
  unit_price_amount: number | string;
  unit_price_currency: PedidoItem['precioUnitario']['currency'];
  subtotal_amount: number | string;
  item_notes: string | null;
}

const toPedido = (row: OrderRow, itemRows: OrderItemRow[]): Pedido => ({
  id: row.id,
  tenantId: row.tenant_id,
  sucursalId: row.branch_id,
  clienteId: row.customer_id,
  numero: row.numero,
  estado: row.estado,
  fulfillmentType: row.fulfillment_type,
  ...(row.delivery_address !== null ? { direccionEntrega: row.delivery_address } : {}),
  ...(row.notas !== null ? { notas: row.notas } : {}),
  ...(row.cart_id !== null ? { cartId: row.cart_id } : {}),
  items: itemRows.map(
    (item): PedidoItem => ({
      id: item.id,
      productId: item.product_id,
      nombre: item.nombre,
      quantity: item.quantity,
      precioUnitario: {
        amount: Number(item.unit_price_amount),
        currency: item.unit_price_currency,
      },
      subtotal: { amount: Number(item.subtotal_amount), currency: item.unit_price_currency },
      ...(item.item_notes !== null ? { notas: item.item_notes } : {}),
    }),
  ),
  total: { amount: Number(row.total_amount), currency: row.total_currency },
  audit: { createdAt: row.created_at, updatedAt: row.updated_at },
});

export class SupabaseOrderRepository implements OrderRepository {
  constructor(private readonly client: SupabaseRestClient) {}

  async placeOrder(data: PlaceOrderData): Promise<Pedido | undefined> {
    const orderId = await this.client.rpc<string | null>('place_order', {
      p_tenant_id: data.tenantId,
      p_customer_id: data.customerId,
      p_branch_id: data.branchId,
      p_cart_id: data.cartId,
      p_expected_cart_version: data.expectedCartVersion,
      p_idempotency_key: data.idempotencyKey,
      p_fulfillment_type: data.fulfillmentType,
      p_delivery_address: data.direccionEntrega ?? null,
      p_notas: data.notas ?? '',
      p_total_amount: data.total.amount,
      p_total_currency: data.total.currency,
      p_items: data.items.map((item) => ({
        productId: item.productId,
        nombre: item.nombre,
        quantity: item.quantity,
        unitPriceAmount: item.precioUnitario.amount,
        currency: item.precioUnitario.currency,
        subtotalAmount: item.subtotal.amount,
        notas: item.notas ?? '',
      })),
    });
    if (orderId === null) {
      return undefined;
    }
    // La RPC confirmó la creación (o la idempotencia): el pedido existe con certeza.
    // Si la relectura falla, es una inconsistencia de infraestructura, no un conflicto de dominio.
    return this.requirePersisted(data.tenantId, orderId);
  }

  async findByIdempotencyKey(
    tenantId: string,
    idempotencyKey: string,
  ): Promise<Pedido | undefined> {
    const rows = await this.client.select<OrderRow>(
      `orders?tenant_id=${eq(tenantId)}&idempotency_key=${eq(idempotencyKey)}&limit=1`,
    );
    const row = rows[0];
    if (!row) {
      return undefined;
    }
    return toPedido(row, await this.loadItems(tenantId, row.id));
  }

  async findById(tenantId: string, orderId: string): Promise<Pedido | undefined> {
    const rows = await this.client.select<OrderRow>(
      `orders?tenant_id=${eq(tenantId)}&id=${eq(orderId)}&limit=1`,
    );
    const row = rows[0];
    if (!row) {
      return undefined;
    }
    return toPedido(row, await this.loadItems(tenantId, orderId));
  }

  async listByCustomer(tenantId: string, customerId: string): Promise<Pedido[]> {
    return this.hydrate(
      tenantId,
      await this.client.select<OrderRow>(
        `orders?tenant_id=${eq(tenantId)}&customer_id=${eq(customerId)}&order=created_at.desc`,
      ),
    );
  }

  async listByBranch(tenantId: string, branchId: string, estado?: EstadoPedido): Promise<Pedido[]> {
    const estadoFilter = estado ? `&estado=eq.${estado}` : '';
    return this.hydrate(
      tenantId,
      await this.client.select<OrderRow>(
        `orders?tenant_id=${eq(tenantId)}&branch_id=${eq(branchId)}${estadoFilter}&order=created_at.desc`,
      ),
    );
  }

  async transition(
    tenantId: string,
    orderId: string,
    from: EstadoPedido,
    to: EstadoPedido,
    actorId: string,
    reason?: string,
  ): Promise<Pedido | undefined> {
    const applied = await this.client.rpc<boolean>('transition_order', {
      p_tenant_id: tenantId,
      p_order_id: orderId,
      p_from: from,
      p_to: to,
      p_actor_id: actorId,
      p_reason: reason ?? '',
    });
    if (!applied) {
      return undefined;
    }
    // La transición se aplicó: el pedido existe con certeza (relectura obligatoria).
    return this.requirePersisted(tenantId, orderId);
  }

  /** Relectura tras una escritura confirmada. La fila debe existir; su ausencia es un fallo de infraestructura. */
  private async requirePersisted(tenantId: string, orderId: string): Promise<Pedido> {
    const order = await this.findById(tenantId, orderId);
    if (!order) {
      throw new ServiceUnavailableException(
        'Order storage is inconsistent after a confirmed write.',
      );
    }
    return order;
  }

  private async hydrate(tenantId: string, rows: OrderRow[]): Promise<Pedido[]> {
    return Promise.all(
      rows.map(async (row) => toPedido(row, await this.loadItems(tenantId, row.id))),
    );
  }

  private loadItems(tenantId: string, orderId: string): Promise<OrderItemRow[]> {
    return this.client.select<OrderItemRow>(
      `order_items?tenant_id=${eq(tenantId)}&order_id=${eq(orderId)}&order=created_at.asc`,
    );
  }
}
