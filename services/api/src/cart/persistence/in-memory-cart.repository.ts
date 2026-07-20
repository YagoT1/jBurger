import type { CartMutation, CartRepository } from '@jburger/domain-cart';
import type { Cart } from '@jburger/domain-types';

/** Persistencia de carrito para desarrollo local sin Supabase. Replica la semántica CAS del repositorio real. */
export class InMemoryCartRepository implements CartRepository {
  private readonly carts: Cart[] = [];

  async findActiveByCustomer(tenantId: string, customerId: string): Promise<Cart | undefined> {
    return this.carts.find(
      (cart) =>
        cart.tenantId === tenantId && cart.customerId === customerId && cart.status === 'active',
    );
  }

  async createActive(
    tenantId: string,
    customerId: string,
    branchId: string | undefined,
  ): Promise<Cart> {
    const cart: Cart = {
      id: crypto.randomUUID(),
      tenantId,
      customerId,
      ...(branchId !== undefined ? { branchId } : {}),
      version: 1,
      status: 'active',
      items: [],
      audit: { createdAt: new Date().toISOString() },
    };
    this.carts.push(cart);
    return cart;
  }

  async applyMutation(
    tenantId: string,
    cartId: string,
    expectedVersion: number,
    mutation: CartMutation,
  ): Promise<Cart | undefined> {
    const index = this.carts.findIndex((cart) => cart.tenantId === tenantId && cart.id === cartId);
    const existing = this.carts[index];
    if (!existing || existing.status !== 'active' || existing.version !== expectedVersion) {
      return undefined;
    }
    const updated: Cart = {
      ...existing,
      ...(mutation.branchId !== undefined ? { branchId: mutation.branchId } : {}),
      ...(mutation.fulfillmentType !== undefined
        ? { fulfillmentType: mutation.fulfillmentType }
        : {}),
      items: mutation.items,
      version: existing.version + 1,
      audit: { ...existing.audit, updatedAt: new Date().toISOString() },
    };
    this.carts[index] = updated;
    return updated;
  }
}
