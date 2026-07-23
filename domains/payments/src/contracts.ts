import type { EstadoPago, Pago, PaymentProvider, Pedido } from '@jburger/domain-types';

export interface InitiatePaymentCommand {
  tenantId: string;
  orderId: string;
  customerId: string;
  idempotencyKey: string;
  actorId: string;
}

/**
 * Notificación del proveedor YA verificada (firma/origen validados por el adaptador, PT-5).
 * El dominio nunca procesa payloads sin verificar.
 */
export interface VerifiedProviderEvent {
  tenantId: string;
  paymentId: string;
  providerPaymentId: string;
  targetEstado: Exclude<EstadoPago, 'pendiente'>;
  eventType: string;
}

/** Puerto de solo lectura hacia pedidos (DIP: pagos no depende de domain-orders). */
export interface PaymentOrderSource {
  findById(tenantId: string, orderId: string): Promise<Pedido | undefined>;
}

/**
 * Puerto del proveedor de pagos. Cambiar de proveedor = nuevo adaptador, cero cambios de dominio.
 * El monto proviene del intento persistido (server-authoritative), nunca del cliente.
 */
export interface PaymentProviderGateway {
  readonly provider: PaymentProvider;
  createCheckout(payment: Pago): Promise<{ preferenceId: string; checkoutUrl: string }>;
}

export type TransitionOutcome = 'applied' | 'applied_order_not_confirmed' | 'duplicate';

export interface PaymentRepository {
  /**
   * Intento idempotente (create_payment_intent): misma clave o pendiente existente → mismo intento;
   * pedido inexistente o no pagable → undefined (última barrera; el dominio valida antes).
   */
  createIntent(
    tenantId: string,
    orderId: string,
    idempotencyKey: string,
    provider: PaymentProvider,
  ): Promise<Pago | undefined>;
  attachCheckout(
    tenantId: string,
    paymentId: string,
    preferenceId: string,
    checkoutUrl: string,
  ): Promise<Pago>;
  findById(tenantId: string, paymentId: string): Promise<Pago | undefined>;
  findByOrder(tenantId: string, orderId: string): Promise<Pago | undefined>;
  /**
   * CAS + bitácora + (si aprobado) confirmación del pedido, atómico (apply_payment_transition).
   * La confirmación viaja DENTRO de la transacción del repositorio y no como paso separado del
   * dominio: correctitud > pureza del puerto (no puede existir pago aprobado sin intento de
   * confirmación registrado). undefined = conflicto CAS (PAYMENT_CONFLICT).
   */
  applyTransition(
    tenantId: string,
    paymentId: string,
    from: EstadoPago,
    to: EstadoPago,
    providerPaymentId: string,
    eventType: string,
  ): Promise<{ outcome: TransitionOutcome; payment: Pago } | undefined>;
}

export type { EstadoPago, Pago, PaymentProvider };
