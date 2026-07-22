export type OrderErrorCode =
  | 'CART_NOT_FOUND'
  | 'CART_EMPTY'
  | 'CART_INVALID_ITEMS'
  | 'CART_CONFLICT'
  | 'PRICE_CHANGED'
  | 'ORDER_NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'TRANSITION_CONFLICT';

/** Error tipado del dominio de pedidos. La API lo traduce a códigos HTTP sin acoplar el dominio a HTTP. */
export class OrderDomainError extends Error {
  constructor(
    readonly code: OrderErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'OrderDomainError';
  }
}
