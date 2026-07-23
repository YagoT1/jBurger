import { apiRequest, type ApiContext } from '../../lib/api/http.js';
import type { Order, FulfillmentType } from '../../entities/order.js';
import type { Money } from '../../entities/money.js';
import { toOrder, type OrderDto } from './mappers.js';

export interface PlaceOrderInput {
  idempotencyKey: string;
  fulfillmentType: FulfillmentType;
  expectedTotal: Money;
  direccionEntrega?: unknown;
  notas?: string;
}

/** Checkout idempotente (SC-06). PRICE_CHANGED y CART_INVALID_ITEMS llegan como AppError kind 'business'. */
export const placeOrder = async (context: ApiContext, input: PlaceOrderInput): Promise<Order> => {
  const response = await apiRequest<{ data: OrderDto }>('/orders', context, {
    method: 'POST',
    body: input,
    timeoutMs: 10000,
  });
  return toOrder(response.data);
};

export const fetchOrder = async (context: ApiContext, orderId: string): Promise<Order> => {
  const response = await apiRequest<{ data: OrderDto }>(`/orders/${orderId}`, context);
  return toOrder(response.data);
};

export const listMyOrders = async (context: ApiContext): Promise<Order[]> => {
  const response = await apiRequest<{ data: OrderDto[] }>('/orders', context);
  return response.data.map(toOrder);
};

export const cancelOrder = async (
  context: ApiContext,
  orderId: string,
  reason?: string,
): Promise<Order> => {
  const response = await apiRequest<{ data: OrderDto }>(`/orders/${orderId}/cancel`, context, {
    method: 'POST',
    body: reason !== undefined ? { reason } : {},
  });
  return toOrder(response.data);
};
