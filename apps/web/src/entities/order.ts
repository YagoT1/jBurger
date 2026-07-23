import type { Money } from './money.js';

export type OrderStatus = 'borrador' | 'confirmado' | 'preparacion' | 'entregado' | 'cancelado';
export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
  notes?: string;
}

export interface Order {
  id: string;
  number?: number;
  status: OrderStatus;
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: string;
  items: OrderItem[];
  total: Money;
  createdAt: string;
}

/**
 * Espejo declarado de la máquina de estados del backend (ADR-024; fuente de verdad: dominio).
 * Existe SOLO para affordances de UI (mostrar/ocultar acciones); el backend siempre revalida.
 * Si ADR-024 cambia, este es el ÚNICO archivo del frontend que se actualiza.
 */
const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = ['borrador', 'confirmado'];
const TERMINAL: readonly OrderStatus[] = ['entregado', 'cancelado'];

export const OrderState = {
  canCustomerCancel: (status: OrderStatus): boolean => CUSTOMER_CANCELLABLE.includes(status),
  isTerminal: (status: OrderStatus): boolean => TERMINAL.includes(status),
  isAwaitingCashAcceptance: (order: Order, paidWithCash: boolean): boolean =>
    paidWithCash && order.status === 'borrador',
} as const;
