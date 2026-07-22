import type { EstadoPedido } from '@jburger/domain-types';

/** Máquina de estados del pedido. Fuente única de las transiciones válidas. */
export const ORDER_TRANSITIONS: Record<EstadoPedido, readonly EstadoPedido[]> = {
  borrador: ['confirmado', 'cancelado'],
  confirmado: ['preparacion', 'cancelado'],
  preparacion: ['entregado'],
  entregado: [],
  cancelado: [],
};

export const canTransition = (from: EstadoPedido, to: EstadoPedido): boolean =>
  ORDER_TRANSITIONS[from].includes(to);

/** Estados desde los que el cliente puede cancelar su propio pedido. */
export const CUSTOMER_CANCELLABLE: readonly EstadoPedido[] = ['borrador', 'confirmado'];
