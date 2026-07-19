import type { Money } from '@jburger/shared-kernel';
import type { Cart, CartItem, PricedCart, PricedCartItem } from '@jburger/domain-types';
import type { CartCatalogSource } from './contracts.js';

/**
 * Read-model determinista del carrito: compone intención + catálogo + disponibilidad vigentes.
 * No persiste nada. Los ítems `unavailable` y `removed` se reportan y se excluyen del total.
 * La detección de `price_changed` pertenece al checkout (revalidación canónica).
 */
export class CartPricingService {
  constructor(private readonly catalog: CartCatalogSource) {}

  async price(cart: Cart): Promise<PricedCart> {
    const items: PricedCartItem[] = [];
    for (const item of cart.items) {
      items.push(await this.priceItem(cart, item));
    }
    const okItems = items.filter((item) => item.state === 'ok');
    const currency = okItems[0]?.precioUnitario?.currency ?? 'ARS';
    const total: Money = {
      amount: okItems.reduce((sum, item) => sum + (item.subtotal?.amount ?? 0), 0),
      currency,
    };
    return {
      cartId: cart.id,
      tenantId: cart.tenantId,
      ...(cart.branchId !== undefined ? { branchId: cart.branchId } : {}),
      version: cart.version,
      items,
      total,
      generatedAt: new Date().toISOString(),
    };
  }

  private async priceItem(cart: Cart, item: CartItem): Promise<PricedCartItem> {
    const notas = item.notas !== undefined ? { notas: item.notas } : {};
    const producto = await this.catalog.findActiveProduct(cart.tenantId, item.productId);
    if (!producto) {
      return { productId: item.productId, quantity: item.quantity, ...notas, state: 'removed' };
    }
    let precioUnitario: Money = producto.precio;
    if (cart.branchId) {
      const disponibilidad = await this.catalog.findAvailability(
        cart.tenantId,
        cart.branchId,
        item.productId,
      );
      if (disponibilidad && !disponibilidad.disponible) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          ...notas,
          state: 'unavailable',
          nombre: producto.nombre,
        };
      }
      if (disponibilidad?.precioOverride) {
        precioUnitario = disponibilidad.precioOverride;
      }
    }
    return {
      productId: item.productId,
      quantity: item.quantity,
      ...notas,
      state: 'ok',
      nombre: producto.nombre,
      precioUnitario,
      subtotal: {
        amount: precioUnitario.amount * item.quantity,
        currency: precioUnitario.currency,
      },
    };
  }
}
