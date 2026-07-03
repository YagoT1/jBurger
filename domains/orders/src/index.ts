import type { Address, AuditMetadata, Money } from '@jburger/shared-kernel';
import {
  createEventMetadata,
  type AuditEvent,
  type DomainEvent,
  type EventPublisher,
} from '@jburger/domain-events';
export type EntityId = string;
export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';
export type OrderEventName =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_REJECTED'
  | 'ORDER_EXPIRED';
export interface OrderContext {
  tenantId: EntityId;
  branchId: EntityId;
  actorId?: EntityId;
  customerId?: EntityId;
  reason?: string;
}
export interface OrderCustomer {
  id?: EntityId;
  name: string;
  email?: string;
  phone?: string;
}
export interface OrderDelivery {
  mode: 'pickup' | 'local_delivery';
  address?: Address;
  estimatedDeliveryAt?: string;
  deliveryFee: Money;
}
export interface OrderTotals {
  subtotal: Money;
  taxes: Money;
  discounts: Money;
  deliveryFee: Money;
  total: Money;
}
export interface OrderItemSnapshot {
  productName: string;
  description?: string;
  price: Money;
  modifierSelection: Record<string, unknown>[];
  comboConfiguration?: Record<string, unknown>;
  appliedTaxes: Money[];
  appliedDiscounts: Money[];
  images: string[];
  menuName?: string;
  branchName: string;
}
export interface OrderItem {
  id: EntityId;
  productId: EntityId;
  quantity: number;
  snapshot: OrderItemSnapshot;
  lineTotal: Money;
}
export interface OrderTimelineEntry {
  id: EntityId;
  status: OrderStatus;
  actorId?: EntityId;
  reason?: string;
  occurredAt: string;
}
export interface Order {
  id: EntityId;
  tenantId: EntityId;
  branchId: EntityId;
  draftId?: EntityId;
  status: OrderStatus;
  customer: OrderCustomer;
  delivery: OrderDelivery;
  items: readonly OrderItem[];
  totals: OrderTotals;
  timeline: OrderTimelineEntry[];
  immutableSnapshot: Readonly<Record<string, unknown>>;
  audit: AuditMetadata;
}
export interface OrderRepository {
  save(order: Order): Promise<Order>;
  get(id: EntityId, tenantId: EntityId): Promise<Order | undefined>;
  list(tenantId: EntityId): Promise<Order[]>;
}
export interface OrderQueries {
  getOrder(id: EntityId, tenantId: EntityId): Promise<Order | undefined>;
  listOrders(tenantId: EntityId): Promise<Order[]>;
  timeline(id: EntityId, tenantId: EntityId): Promise<OrderTimelineEntry[]>;
}
export interface OrderCommands {
  createOrder(
    input: Omit<Order, 'id' | 'status' | 'timeline' | 'immutableSnapshot' | 'audit'>,
    context: OrderContext,
  ): Promise<Order>;
  confirmOrder(id: EntityId, context: OrderContext): Promise<Order>;
  cancelOrder(id: EntityId, context: OrderContext): Promise<Order>;
  rejectOrder(id: EntityId, context: OrderContext): Promise<Order>;
  expireOrder(id: EntityId, context: OrderContext): Promise<Order>;
}
export class InMemoryOrderRepository implements OrderRepository {
  private orders = new Map<EntityId, Order>();
  async save(order: Order) {
    this.orders.set(order.id, order);
    return order;
  }
  async get(id: EntityId, tenantId: EntityId) {
    const order = this.orders.get(id);
    return order?.tenantId === tenantId ? order : undefined;
  }
  async list(tenantId: EntityId) {
    return [...this.orders.values()].filter((order) => order.tenantId === tenantId);
  }
}
export class OrderValidationEngine {
  validate(input: {
    items: readonly OrderItem[];
    customer: OrderCustomer;
    branchActive?: boolean;
    menuActive?: boolean;
    deliveryAllowed?: boolean;
    draftExpired?: boolean;
  }) {
    const errors: string[] = [];
    if (input.items.length === 0) errors.push('CART_EMPTY');
    if (!input.customer.name) errors.push('CUSTOMER_INVALID');
    if (input.branchActive === false) errors.push('BRANCH_INACTIVE');
    if (input.menuActive === false) errors.push('MENU_INACTIVE');
    if (input.deliveryAllowed === false) errors.push('DELIVERY_NOT_ALLOWED');
    if (input.draftExpired === true) errors.push('DRAFT_EXPIRED');
    for (const item of input.items) {
      if (!item.productId) errors.push('PRODUCT_NOT_FOUND');
      if (item.quantity < 1) errors.push('INVALID_QUANTITY');
      if (!item.snapshot.productName) errors.push('PRODUCT_SNAPSHOT_MISSING');
    }
    return { valid: errors.length === 0, errors, validatedAt: new Date().toISOString() };
  }
}
export class OrderService implements OrderCommands, OrderQueries {
  constructor(
    private readonly repository: OrderRepository = new InMemoryOrderRepository(),
    private readonly events?: EventPublisher,
    private readonly validator = new OrderValidationEngine(),
  ) {}
  getOrder(id: EntityId, tenantId: EntityId) {
    return this.repository.get(id, tenantId);
  }
  listOrders(tenantId: EntityId) {
    return this.repository.list(tenantId);
  }
  async timeline(id: EntityId, tenantId: EntityId) {
    return (await this.requireOrder(id, tenantId)).timeline;
  }
  async createOrder(
    input: Omit<Order, 'id' | 'status' | 'timeline' | 'immutableSnapshot' | 'audit'>,
    context: OrderContext,
  ) {
    const validation = this.validator.validate({ items: input.items, customer: input.customer });
    if (!validation.valid) throw new Error(`ORDER_INVALID:${validation.errors.join(',')}`);
    const orderId = crypto.randomUUID();
    const firstTimeline = timelineEntry('pending', context);
    const snapshot = Object.freeze(
      JSON.parse(
        JSON.stringify({
          items: input.items,
          totals: input.totals,
          customer: input.customer,
          delivery: input.delivery,
          branchId: context.branchId,
        }),
      ),
    ) as Readonly<Record<string, unknown>>;
    const order: Order = {
      ...input,
      id: orderId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      status: 'pending',
      timeline: [firstTimeline],
      immutableSnapshot: snapshot,
      audit: audit(context.actorId),
    };
    await this.repository.save(order);
    await this.publish('ORDER_CREATED', orderId, undefined, order, context);
    return order;
  }
  confirmOrder(id: EntityId, context: OrderContext) {
    return this.transition(id, 'confirmed', 'ORDER_CONFIRMED', context);
  }
  cancelOrder(id: EntityId, context: OrderContext) {
    return this.transition(id, 'cancelled', 'ORDER_CANCELLED', context);
  }
  rejectOrder(id: EntityId, context: OrderContext) {
    return this.transition(id, 'rejected', 'ORDER_REJECTED', context);
  }
  expireOrder(id: EntityId, context: OrderContext) {
    return this.transition(id, 'cancelled', 'ORDER_EXPIRED', context);
  }
  private async transition(
    id: EntityId,
    status: OrderStatus,
    eventName: OrderEventName,
    context: OrderContext,
  ) {
    const previous = await this.requireOrder(id, context.tenantId);
    const current = {
      ...previous,
      status,
      timeline: [...previous.timeline, timelineEntry(status, context)],
      audit: touch(previous.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish(eventName, id, previous, current, context);
    return current;
  }
  private async requireOrder(id: EntityId, tenantId: EntityId) {
    const order = await this.repository.get(id, tenantId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    return order;
  }
  private async publish(
    eventName: OrderEventName,
    orderId: EntityId,
    previousState: unknown,
    currentState: unknown,
    context: OrderContext,
  ) {
    if (!this.events) return;
    const metadata = createEventMetadata({
      eventName,
      category: 'domain',
      tenantId: context.tenantId,
      branchId: context.branchId,
      actorId: context.actorId,
      schemaVersion: 1,
    });
    await this.events.publish({
      metadata,
      payload: {
        orderId,
        customerId: context.customerId,
        previousState,
        currentState,
        reason: context.reason,
      },
    } satisfies DomainEvent);
    await this.events.publish({
      metadata: {
        ...metadata,
        eventId: crypto.randomUUID(),
        category: 'audit',
        eventName: `${eventName}_AUDIT`,
      },
      action: eventName as never,
      resource: 'order',
      resourceId: orderId,
      payload: {
        actorId: context.actorId,
        customerId: context.customerId,
        tenantId: context.tenantId,
        branchId: context.branchId,
        previousState,
        currentState,
        reason: context.reason,
      },
    } satisfies AuditEvent);
  }
}
const audit = (actorId?: string): AuditMetadata => ({
  createdAt: new Date().toISOString(),
  ...(actorId ? { createdBy: actorId } : {}),
});
const touch = (metadata: AuditMetadata, actorId?: string): AuditMetadata => ({
  ...metadata,
  updatedAt: new Date().toISOString(),
  ...(actorId ? { updatedBy: actorId } : {}),
});
const timelineEntry = (status: OrderStatus, context: OrderContext): OrderTimelineEntry => ({
  id: crypto.randomUUID(),
  status,
  ...(context.actorId ? { actorId: context.actorId } : {}),
  ...(context.reason ? { reason: context.reason } : {}),
  occurredAt: new Date().toISOString(),
});
