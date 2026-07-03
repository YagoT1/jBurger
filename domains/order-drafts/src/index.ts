import type { AuditMetadata, Money } from '@jburger/shared-kernel';
import {
  createEventMetadata,
  type AuditEvent,
  type DomainEvent,
  type EventPublisher,
} from '@jburger/domain-events';
export type EntityId = string;
export type DraftStatus = 'active' | 'frozen' | 'invalidated' | 'expired';
export type DraftEventName =
  | 'ORDER_DRAFT_CREATED'
  | 'ORDER_DRAFT_RECALCULATED'
  | 'ORDER_DRAFT_INVALIDATED';
export interface DraftContext {
  tenantId: EntityId;
  branchId: EntityId;
  actorId?: EntityId;
  customerId?: EntityId;
  reason?: string;
}
export interface OrderDraftItem {
  id: EntityId;
  cartItemId: EntityId;
  productId: EntityId;
  nameSnapshot: string;
  quantity: number;
  unitPrice: Money;
  modifiersSnapshot: Record<string, unknown>[];
  lineTotal: Money;
}
export interface OrderDraftTotals {
  subtotal: Money;
  taxes: Money;
  discounts: Money;
  deliveryFee: Money;
  total: Money;
}
export interface OrderDraftValidation {
  valid: boolean;
  errors: string[];
  validatedAt: string;
}
export interface OrderDraft {
  id: EntityId;
  tenantId: EntityId;
  branchId: EntityId;
  cartId: EntityId;
  customerId?: EntityId;
  status: DraftStatus;
  items: OrderDraftItem[];
  totals: OrderDraftTotals;
  validation: OrderDraftValidation;
  pricingContextId?: EntityId;
  snapshotFrozenAt?: string;
  expiresAt: string;
  audit: AuditMetadata;
}
export class OrderDraftService {
  private drafts = new Map<EntityId, OrderDraft>();
  constructor(private readonly events?: EventPublisher) {}
  list(tenantId: EntityId) {
    return [...this.drafts.values()].filter((draft) => draft.tenantId === tenantId);
  }
  get(id: EntityId, tenantId: EntityId) {
    const draft = this.drafts.get(id);
    return draft?.tenantId === tenantId ? draft : undefined;
  }
  async createDraft(
    input: Omit<OrderDraft, 'id' | 'status' | 'validation' | 'audit' | 'expiresAt'>,
    context: DraftContext,
  ) {
    const draft: OrderDraft = {
      ...input,
      id: crypto.randomUUID(),
      tenantId: context.tenantId,
      branchId: context.branchId,
      status: 'active',
      validation: this.validateItems(input.items),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      audit: {
        createdAt: new Date().toISOString(),
        ...(context.actorId ? { createdBy: context.actorId } : {}),
      },
    };
    this.ensureValid(draft);
    this.drafts.set(draft.id, draft);
    await this.publish('ORDER_DRAFT_CREATED', draft.id, undefined, draft, context);
    return draft;
  }
  async recalculate(id: EntityId, totals: OrderDraftTotals, context: DraftContext) {
    const previous = this.require(id, context.tenantId);
    const current = {
      ...previous,
      totals,
      validation: this.validateItems(previous.items),
      audit: this.touch(previous.audit, context.actorId),
    };
    this.drafts.set(id, current);
    await this.publish('ORDER_DRAFT_RECALCULATED', id, previous, current, context);
    return current;
  }
  validate(id: EntityId, context: DraftContext) {
    const draft = this.require(id, context.tenantId);
    return draft.validation;
  }
  async freezeSnapshot(id: EntityId, context: DraftContext) {
    const previous = this.require(id, context.tenantId);
    this.ensureValid(previous);
    const current = {
      ...previous,
      status: 'frozen' as const,
      snapshotFrozenAt: new Date().toISOString(),
      audit: this.touch(previous.audit, context.actorId),
    };
    this.drafts.set(id, current);
    return current;
  }
  async reservePricingContext(id: EntityId, pricingContextId: EntityId, context: DraftContext) {
    const previous = this.require(id, context.tenantId);
    const current = {
      ...previous,
      pricingContextId,
      audit: this.touch(previous.audit, context.actorId),
    };
    this.drafts.set(id, current);
    return current;
  }
  async invalidateDraft(id: EntityId, context: DraftContext) {
    const previous = this.require(id, context.tenantId);
    const current = {
      ...previous,
      status: 'invalidated' as const,
      validation: {
        valid: false,
        errors: [context.reason ?? 'INVALIDATED'],
        validatedAt: new Date().toISOString(),
      },
      audit: this.touch(previous.audit, context.actorId),
    };
    this.drafts.set(id, current);
    await this.publish('ORDER_DRAFT_INVALIDATED', id, previous, current, context);
    return current;
  }
  private validateItems(items: OrderDraftItem[]): OrderDraftValidation {
    const errors =
      items.length === 0
        ? ['CART_EMPTY']
        : items.flatMap((item) => (item.quantity < 1 ? ['INVALID_QUANTITY'] : []));
    return { valid: errors.length === 0, errors, validatedAt: new Date().toISOString() };
  }
  private ensureValid(draft: OrderDraft) {
    if (!draft.validation.valid) throw new Error('ORDER_DRAFT_INVALID');
  }
  private require(id: EntityId, tenantId: EntityId) {
    const draft = this.get(id, tenantId);
    if (!draft) throw new Error('ORDER_DRAFT_NOT_FOUND');
    return draft;
  }
  private touch(audit: AuditMetadata, actorId?: string): AuditMetadata {
    return {
      ...audit,
      updatedAt: new Date().toISOString(),
      ...(actorId ? { updatedBy: actorId } : {}),
    };
  }
  private async publish(
    eventName: DraftEventName,
    draftId: EntityId,
    previousState: unknown,
    currentState: unknown,
    context: DraftContext,
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
        draftId,
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
      resource: 'order_draft',
      resourceId: draftId,
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
