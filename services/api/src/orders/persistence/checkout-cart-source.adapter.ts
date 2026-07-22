import type { CheckoutCartSource } from '@jburger/domain-orders';
import { CartPricingService, CartService } from '@jburger/domain-cart';
import type { PricedCart } from '@jburger/domain-types';

/**
 * Adaptador del puerto CheckoutCartSource sobre los servicios de carrito ya cableados.
 * Pedidos no depende de domain-cart: recibe los servicios por inyección desde la API.
 */
export class CheckoutCartSourceAdapter implements CheckoutCartSource {
  constructor(
    private readonly cartService: CartService,
    private readonly pricingService: CartPricingService,
  ) {}

  async findActivePricedCart(
    tenantId: string,
    customerId: string,
  ): Promise<PricedCart | undefined> {
    const cart = await this.cartService.getActiveCart(tenantId, customerId);
    if (!cart) {
      return undefined;
    }
    return this.pricingService.price(cart);
  }
}
