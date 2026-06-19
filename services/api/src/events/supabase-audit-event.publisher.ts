import type { EventEnvelope, EventPublisher } from '@jburger/domain-events';

interface SupabaseErrorResponse {
  message?: string;
  error?: string;
  details?: string;
  hint?: string;
}

export interface SupabaseAuditEventPublisherOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  fetchImpl?: typeof fetch;
}

const normalizeSupabaseUrl = (url: string): string => url.replace(/\/+$/, '');

const extractResourceId = (event: EventEnvelope): string | undefined => {
  if ('resourceId' in event && event.resourceId !== undefined) {
    return event.resourceId;
  }

  return undefined;
};

const extractResource = (event: EventEnvelope): string => {
  if ('resource' in event) {
    return event.resource;
  }

  return event.metadata.eventName;
};

const extractAction = (event: EventEnvelope): string => {
  if ('action' in event) {
    return event.action;
  }

  return event.metadata.eventName;
};

export class SupabaseAuditEventPublisher implements EventPublisher {
  private readonly endpoint: string;
  private readonly supabaseAnonKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SupabaseAuditEventPublisherOptions) {
    this.endpoint = `${normalizeSupabaseUrl(options.supabaseUrl)}/rest/v1/audit_events`;
    this.supabaseAnonKey = options.supabaseAnonKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async publish<TPayload extends Record<string, unknown>>(
    event: EventEnvelope<TPayload>,
  ): Promise<void> {
    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        apikey: this.supabaseAnonKey,
        authorization: `Bearer ${this.supabaseAnonKey}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        tenant_id: event.metadata.tenantId ?? null,
        actor_id: event.metadata.actorId ?? null,
        action: extractAction(event),
        resource: extractResource(event),
        resource_id: extractResourceId(event) ?? null,
        metadata: {
          eventMetadata: event.metadata,
          payload: event.payload,
          category: event.metadata.category,
          branchId: event.metadata.branchId ?? null,
        },
        occurred_at: event.metadata.occurredAt,
      }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => undefined)) as
        | SupabaseErrorResponse
        | undefined;
      const message = error?.message ?? error?.error ?? response.statusText;
      throw new Error(`Failed to persist audit event: ${message}`);
    }
  }
}
