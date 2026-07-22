import { createEventMetadata, type EventPublisher } from '@jburger/domain-events';
import type { Pedido, PricedCart } from '@jburger/domain-types';
import type {
  CheckoutCartSource,
  OrderRepository,
  OrderSnapshotItem,
  PlaceOrderCommand,
} from './contracts.js';
import { OrderDomainError } from './errors.js';

/**
 * Convierte un carrito validado en un pedido inmutable.
 * Revalidación canónica de precios (el `price_changed` diferido del carrito vive aquí):
 * el total del cliente debe coincidir con el total recalculado contra catálogo/disponibilidad vigentes.
 */
export class CheckoutService {
  constructor(
    private readonly cartSource: CheckoutCartSource,
    private readonly repository: OrderRepository,
    private readonly events: EventPublisher,
  ) {}

  async placeOrder(command: PlaceOrderCommand): Promise<Pedido> {
    // Idempotencia (ADR-024 §1, OT-2): un reintento con la misma clave devuelve el pedido existente,
    // incluso cuando el carrito ya fue consumido por el checkout original. Se resuelve ANTES de exigir
    // un carrito activo; no re-emite ORDER_PLACED porque el pedido ya fue registrado y auditado.
    const alreadyPlaced = await this.repository.findByIdempotencyKey(
      command.tenantId,
      command.idempotencyKey,
    );
    if (alreadyPlaced) {
      return alreadyPlaced;
    }

    const priced = await this.cartSource.findActivePricedCart(command.tenantId, command.customerId);
    if (!priced) {
      throw new OrderDomainError('CART_NOT_FOUND', 'No active cart to checkout.');
    }
    if (priced.items.length === 0) {
      throw new OrderDomainError('CART_EMPTY', 'Cart has no items.');
    }
    const invalid = priced.items.filter((item) => item.state !== 'ok');
    if (invalid.length > 0) {
      throw new OrderDomainError('CART_INVALID_ITEMS', 'Cart has unavailable or removed items.', {
        items: invalid.map((item) => ({ productId: item.productId, state: item.state })),
      });
    }
    if (
      priced.total.amount !== command.expectedTotal.amount ||
      priced.total.currency !== command.expectedTotal.currency
    ) {
      throw new OrderDomainError('PRICE_CHANGED', 'Cart total changed since it was shown.', {
        expected: command.expectedTotal,
        current: priced.total,
      });
    }

    const items = this.toSnapshot(priced);
    const order = await this.repository.placeOrder({
      tenantId: command.tenantId,
      customerId: command.customerId,
      branchId: command.branchId,
      cartId: priced.cartId,
      expectedCartVersion: priced.version,
      idempotencyKey: command.idempotencyKey,
      fulfillmentType: command.fulfillmentType,
      ...(command.direccionEntrega !== undefined
        ? { direccionEntrega: command.direccionEntrega }
        : {}),
      ...(command.notas !== undefined ? { notas: command.notas } : {}),
      total: priced.total,
      items,
    });
    if (!order) {
      throw new OrderDomainError(
        'CART_CONFLICT',
        'Cart changed during checkout. Reload and retry.',
      );
    }

    await this.events.publish({
      metadata: createEventMetadata({
        eventName: 'ORDER_PLACED',
        category: 'audit',
        schemaVersion: 1,
        tenantId: command.tenantId,
        branchId: command.branchId,
        actorId: command.actorId,
      }),
      action: 'ORDER_PLACED',
      resource: 'order',
      resourceId: order.id,
      payload: {
        total: order.total,
        itemCount: items.length,
        idempotencyKey: command.idempotencyKey,
      },
    });
    return order;
  }

  private toSnapshot(priced: PricedCart): OrderSnapshotItem[] {
    return priced.items.map((item): OrderSnapshotItem => {
      if (!item.precioUnitario || !item.subtotal || !item.nombre) {
        throw new OrderDomainError('CART_INVALID_ITEMS', 'Priced item is missing snapshot data.');
      }
      return {
        productId: item.productId,
        nombre: item.nombre,
        quantity: item.quantity,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        ...(item.notas !== undefined ? { notas: item.notas } : {}),
      };
    });
  }
}
