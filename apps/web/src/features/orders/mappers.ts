import type { Money } from '../../entities/money.js';
import type { Order, OrderItem, OrderStatus, FulfillmentType } from '../../entities/order.js';

/** DTO de red del pedido (contrato existente de OrdersModule). Solo este archivo lo conoce. */
export interface OrderItemDto {
  id: string;
  productId: string;
  nombre: string;
  quantity: number;
  precioUnitario: Money;
  subtotal: Money;
  notas?: string;
}
export interface OrderDto {
  id: string;
  numero?: number;
  estado: OrderStatus;
  fulfillmentType?: FulfillmentType;
  direccionEntrega?: { street?: string; city?: string } | string;
  items: OrderItemDto[];
  total: Money;
  audit: { createdAt: string };
}

const toItem = (dto: OrderItemDto): OrderItem => ({
  id: dto.id,
  productId: dto.productId,
  name: dto.nombre,
  quantity: dto.quantity,
  unitPrice: dto.precioUnitario,
  subtotal: dto.subtotal,
  ...(dto.notas !== undefined ? { notes: dto.notas } : {}),
});

const toAddress = (address: OrderDto['direccionEntrega']): string | undefined => {
  if (address === undefined) return undefined;
  if (typeof address === 'string') return address;
  return [address.street, address.city].filter(Boolean).join(', ') || undefined;
};

export const toOrder = (dto: OrderDto): Order => {
  const deliveryAddress = toAddress(dto.direccionEntrega);
  return {
    id: dto.id,
    ...(dto.numero !== undefined ? { number: dto.numero } : {}),
    status: dto.estado,
    ...(dto.fulfillmentType !== undefined ? { fulfillmentType: dto.fulfillmentType } : {}),
    ...(deliveryAddress !== undefined ? { deliveryAddress } : {}),
    items: dto.items.map(toItem),
    total: dto.total,
    createdAt: dto.audit.createdAt,
  };
};
