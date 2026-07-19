import type { EventEnvelope, EventPublisher } from '@jburger/domain-events';
const SENSITIVE_KEYS = new Set(['password', 'accessToken', 'refreshToken', 'token', 'secret']);
const sanitize = (payload: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      SENSITIVE_KEYS.has(key) ? '[redacted]' : value,
    ]),
  );
export class LoggingEventPublisher implements EventPublisher {
  async publish<TPayload extends Record<string, unknown>>(
    event: EventEnvelope<TPayload>,
  ): Promise<void> {
    console.log(
      JSON.stringify({
        type: 'domain_event',
        eventName: event.metadata.eventName,
        category: event.metadata.category,
        tenantId: event.metadata.tenantId,
        actorId: event.metadata.actorId,
        occurredAt: event.metadata.occurredAt,
        payload: sanitize(event.payload),
      }),
    );
  }
}
