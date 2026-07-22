export type EventId = string;
export type EventName = string;
export type EventCategory = 'domain' | 'audit' | 'security' | 'integration';

export interface EventMetadata {
  eventId: EventId;
  eventName: EventName;
  category: EventCategory;
  occurredAt: string;
  tenantId?: string | undefined;
  branchId?: string | undefined;
  actorId?: string | undefined;
  correlationId?: string | undefined;
  causationId?: string | undefined;
  schemaVersion: number;
}

export interface DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  metadata: EventMetadata & { category: 'domain' };
  payload: TPayload;
}

export interface AuditEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  metadata: EventMetadata & { category: 'audit' };
  action: AuditAction;
  resource: string;
  resourceId?: string;
  payload: TPayload;
}

export interface SecurityEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  metadata: EventMetadata & { category: 'security' };
  severity: 'info' | 'warning' | 'critical';
  payload: TPayload;
}

export interface IntegrationEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  metadata: EventMetadata & { category: 'integration' };
  destination?: string;
  payload: TPayload;
}

export type EventEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> =
  | DomainEvent<TPayload>
  | AuditEvent<TPayload>
  | SecurityEvent<TPayload>
  | IntegrationEvent<TPayload>;

export interface EventPublisher {
  publish<TPayload extends Record<string, unknown>>(event: EventEnvelope<TPayload>): Promise<void>;
}

export interface EventHandler<TEvent extends EventEnvelope = EventEnvelope> {
  eventName: string;
  handle(event: TEvent): Promise<void>;
}

export const auditActions = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DISABLED',
  'ROLE_ASSIGNED',
  'ROLE_REMOVED',
  'PERMISSION_GRANTED',
  'PERMISSION_REVOKED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'SESSION_REVOKED',
  'TENANT_ASSIGNED',
  'BRANCH_ASSIGNED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DISABLED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_DISABLED',
  'AVAILABILITY_UPDATED',
  'CART_CREATED',
  'CART_ITEM_ADDED',
  'CART_ITEM_UPDATED',
  'CART_ITEM_REMOVED',
  'CART_CLEARED',
  'CART_MERGED',
  'ORDER_PLACED',
  'ORDER_CONFIRMED',
  'ORDER_STATUS_CHANGED',
  'ORDER_CANCELLED',
] as const;

export type AuditAction = (typeof auditActions)[number];

export const createEventMetadata = <TCategory extends EventCategory>(
  input: Omit<EventMetadata, 'eventId' | 'occurredAt' | 'category'> & {
    category: TCategory;
    eventId?: string | undefined;
    occurredAt?: string | undefined;
  },
): EventMetadata & { category: TCategory } => ({
  ...input,
  eventId: input.eventId ?? crypto.randomUUID(),
  occurredAt: input.occurredAt ?? new Date().toISOString(),
});

export class InMemoryEventPublisher implements EventPublisher {
  readonly events: EventEnvelope[] = [];
  async publish<TPayload extends Record<string, unknown>>(
    event: EventEnvelope<TPayload>,
  ): Promise<void> {
    this.events.push(event);
  }
}
