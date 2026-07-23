import type { EstadoPago } from '@jburger/domain-types';

/**
 * Fuente única de la máquina de estados del pago (mismo criterio que order-transitions).
 * La DB aplica el CAS sobre el estado origen; la validez semántica de la transición vive aquí.
 */
export const PAYMENT_TRANSITIONS: Record<EstadoPago, readonly EstadoPago[]> = {
  pendiente: ['aprobado', 'rechazado', 'expirado'],
  aprobado: ['reembolsado'],
  rechazado: [],
  reembolsado: [],
  expirado: [],
};

export const canTransitionPayment = (from: EstadoPago, to: EstadoPago): boolean =>
  PAYMENT_TRANSITIONS[from].includes(to);
