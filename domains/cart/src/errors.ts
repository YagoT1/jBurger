export type CartErrorCode =
  | 'CART_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'QUANTITY_OUT_OF_RANGE'
  | 'VERSION_CONFLICT'
  | 'ITEM_NOT_FOUND';

/** Error tipado del dominio de carrito. La API lo traduce a códigos HTTP sin acoplar el dominio a HTTP. */
export class CartDomainError extends Error {
  constructor(
    readonly code: CartErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CartDomainError';
  }
}
