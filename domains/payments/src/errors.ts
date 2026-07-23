export type PaymentErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'ORDER_NOT_PAYABLE'
  | 'PAYMENT_NOT_FOUND'
  | 'PAYMENT_ALREADY_APPROVED'
  | 'PAYMENT_CONFLICT'
  | 'WEBHOOK_INVALID'
  | 'PROVIDER_UNAVAILABLE';

/** Error tipado del dominio de pagos. La API lo traduce a códigos HTTP sin acoplar el dominio a HTTP. */
export class PaymentDomainError extends Error {
  constructor(
    readonly code: PaymentErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'PaymentDomainError';
  }
}
