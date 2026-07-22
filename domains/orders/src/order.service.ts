import { createEventMetadata, type AuditAction, type EventPublisher } from '@jburger/domain-events';
import type { EstadoPedido, Pedido } from '@jburger/domain-types';
import type { CancelOrderCommand, OrderRepository, TransitionOrderCommand } from './contracts.js';
import { OrderDomainError } from './errors.js';
import { canTransition, CUSTOMER_CANCELLABLE } from './order-transitions.js';

const EVENT_BY_ESTADO: Partial<Record<EstadoPedido, AuditAction>> = {
  confirmado: 'ORDER_CONFIRMED',
  cancelado: 'ORDER_CANCELLED',
};

export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly events: EventPublisher,
  ) {}

  findById(tenantId: string, orderId: string): Promise<Pedido | undefined> {
    return this.repository.findById(tenantId, orderId);
  }
  listByCustomer(tenantId: string, customerId: string): Promise<Pedido[]> {
    return this.repository.listByCustomer(tenantId, customerId);
  }
  listByBranch(tenantId: string, branchId: string, estado?: EstadoPedido): Promise<Pedido[]> {
    return this.repository.listByBranch(tenantId, branchId, estado);
  }

  async transition(command: TransitionOrderCommand): Promise<Pedido> {
    const order = await this.requireOrder(command.tenantId, command.orderId);
    if (!canTransition(order.estado, command.to)) {
      throw new OrderDomainError(
        'INVALID_TRANSITION',
        `Cannot move order from ${order.estado} to ${command.to}.`,
      );
    }
    return this.applyTransition(order.estado, command.to, command);
  }

  async cancel(command: CancelOrderCommand): Promise<Pedido> {
    const order = await this.requireOrder(command.tenantId, command.orderId);
    if (!canTransition(order.estado, 'cancelado')) {
      throw new OrderDomainError(
        'INVALID_TRANSITION',
        `Cannot cancel an order in state ${order.estado}.`,
      );
    }
    return this.applyTransition(order.estado, 'cancelado', command);
  }

  /** Cancelación iniciada por el cliente: solo desde estados permitidos. */
  assertCustomerCanCancel(estado: EstadoPedido): void {
    if (!CUSTOMER_CANCELLABLE.includes(estado)) {
      throw new OrderDomainError(
        'INVALID_TRANSITION',
        `Customer cannot cancel an order in state ${estado}.`,
      );
    }
  }

  private async applyTransition(
    from: EstadoPedido,
    to: EstadoPedido,
    command: { tenantId: string; orderId: string; actorId: string; reason?: string },
  ): Promise<Pedido> {
    const updated = await this.repository.transition(
      command.tenantId,
      command.orderId,
      from,
      to,
      command.actorId,
      command.reason,
    );
    if (!updated) {
      throw new OrderDomainError(
        'TRANSITION_CONFLICT',
        'Order state changed concurrently. Reload and retry.',
      );
    }
    const action = EVENT_BY_ESTADO[to] ?? 'ORDER_STATUS_CHANGED';
    await this.events.publish({
      metadata: createEventMetadata({
        eventName: action,
        category: 'audit',
        schemaVersion: 1,
        tenantId: command.tenantId,
        actorId: command.actorId,
      }),
      action,
      resource: 'order',
      resourceId: command.orderId,
      payload: { from, to, ...(command.reason !== undefined ? { reason: command.reason } : {}) },
    });
    return updated;
  }

  private async requireOrder(tenantId: string, orderId: string): Promise<Pedido> {
    const order = await this.repository.findById(tenantId, orderId);
    if (!order) {
      throw new OrderDomainError('ORDER_NOT_FOUND', 'Order not found.');
    }
    return order;
  }
}
