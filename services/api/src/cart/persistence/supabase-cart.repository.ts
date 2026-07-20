import { ServiceUnavailableException } from '@nestjs/common';
import type { CartMutation, CartRepository } from '@jburger/domain-cart';
import type { Cart, CartItem, CartStatus, FulfillmentType } from '@jburger/domain-types';
import { eq, SupabaseRestClient } from '../../common/persistence/supabase-rest.client.js';

interface CartRow {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  customer_id: string;
  cart_version: number;
  status: CartStatus;
  fulfillment_type: FulfillmentType | null;
  expires_at: string | null;
  last_priced_at: string | null;
  created_at: string;
  updated_at: string;
}
interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  item_notes: string | null;
  created_at: string;
}

const toCart = (row: CartRow, itemRows: CartItemRow[]): Cart => ({
  id: row.id,
  tenantId: row.tenant_id,
  ...(row.branch_id !== null ? { branchId: row.branch_id } : {}),
  customerId: row.customer_id,
  version: row.cart_version,
  status: row.status,
  ...(row.fulfillment_type !== null ? { fulfillmentType: row.fulfillment_type } : {}),
  items: itemRows.map(
    (item): CartItem => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      ...(item.item_notes !== null ? { notas: item.item_notes } : {}),
    }),
  ),
  ...(row.expires_at !== null ? { expiresAt: row.expires_at } : {}),
  ...(row.last_priced_at !== null ? { lastPricedAt: row.last_priced_at } : {}),
  audit: { createdAt: row.created_at, updatedAt: row.updated_at },
});

export class SupabaseCartRepository implements CartRepository {
  constructor(private readonly client: SupabaseRestClient) {}

  async findActiveByCustomer(tenantId: string, customerId: string): Promise<Cart | undefined> {
    const rows = await this.client.select<CartRow>(
      `carts?tenant_id=${eq(tenantId)}&customer_id=${eq(customerId)}&status=eq.active&limit=1`,
    );
    const row = rows[0];
    if (!row) {
      return undefined;
    }
    return toCart(row, await this.loadItems(tenantId, row.id));
  }

  async createActive(
    tenantId: string,
    customerId: string,
    branchId: string | undefined,
  ): Promise<Cart> {
    const rows = await this.client.insert<CartRow>('carts', {
      tenant_id: tenantId,
      customer_id: customerId,
      branch_id: branchId ?? null,
    });
    const row = rows[0];
    if (!row) {
      throw new ServiceUnavailableException('Cart storage is unavailable.');
    }
    return toCart(row, []);
  }

  /**
   * Compare-and-set atómico: delega en la función Postgres `apply_cart_mutation`
   * (una única transacción para versión + reconciliación de ítems).
   * Devuelve `undefined` en conflicto de concurrencia.
   */
  async applyMutation(
    tenantId: string,
    cartId: string,
    expectedVersion: number,
    mutation: CartMutation,
  ): Promise<Cart | undefined> {
    const newVersion = await this.client.rpc<number | null>('apply_cart_mutation', {
      p_tenant_id: tenantId,
      p_cart_id: cartId,
      p_expected_version: expectedVersion,
      p_branch_id: mutation.branchId ?? null,
      p_fulfillment_type: mutation.fulfillmentType ?? null,
      p_items: mutation.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        notas: item.notas ?? '',
      })),
    });
    if (newVersion === null) {
      return undefined;
    }
    const rows = await this.client.select<CartRow>(
      `carts?tenant_id=${eq(tenantId)}&id=${eq(cartId)}&limit=1`,
    );
    const row = rows[0];
    if (!row) {
      throw new ServiceUnavailableException('Cart storage is unavailable.');
    }
    return toCart(row, await this.loadItems(tenantId, cartId));
  }

  private loadItems(tenantId: string, cartId: string): Promise<CartItemRow[]> {
    return this.client.select<CartItemRow>(
      `cart_items?tenant_id=${eq(tenantId)}&cart_id=${eq(cartId)}&order=created_at.asc`,
    );
  }
}
