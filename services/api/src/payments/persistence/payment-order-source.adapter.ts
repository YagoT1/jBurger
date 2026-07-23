import type { PaymentOrderSource } from '@jburger/domain-payments';
import type { Pedido } from '@jburger/domain-types';
import type { OrderRepository } from '@jburger/domain-orders';

/**
 * Implementa el puerto de solo lectura de pagos sobre el repositorio de pedidos existente.
 * Evita duplicar acceso a datos y mantiene a `domain-payments` sin dependencia de `domain-orders`.
 */
export class PaymentOrderSourceAdapter implements PaymentOrderSource {
  constructor(private readonly orders: OrderRepository) {}

  findById(tenantId: string, orderId: string): Promise<Pedido | undefined> {
    return this.orders.findById(tenantId, orderId);
  }
}
