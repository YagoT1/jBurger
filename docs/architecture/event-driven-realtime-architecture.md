# J Burguer — Hardened Event-Driven and Realtime Architecture

## 0. Architecture Scope

This document hardens the J Burguer platform foundation with a production-grade event-driven, realtime, asynchronous, and synchronization architecture for commerce, kitchen operations, delivery, payments, loyalty, notifications, analytics, and multi-branch operations.

The goal is not to make WebSockets the architecture. The goal is to make durable state transitions the architecture, with realtime delivery as one projection of canonical state.

The platform must tolerate:

- Duplicate Mercado Pago webhooks.
- Webhook delays and out-of-order provider notifications.
- Mobile clients reconnecting after sleep, backgrounding, or network changes.
- Staff dashboards losing realtime connectivity during active service.
- Branch-level queue spikes.
- Notification provider failures.
- Analytics processing lag.
- Partial Supabase, Vercel, email, WhatsApp, or payment-provider degradation.
- Safe retries without duplicate charges, duplicate loyalty points, or duplicate customer notifications.

---

## 1. Event-Driven Architecture Philosophy

### 1.1 Core Philosophy

J Burguer should use an event-driven architecture where business state changes are captured as durable facts and downstream systems react asynchronously. The event system exists to protect operational continuity, not to add unnecessary complexity.

### 1.2 Principles

1. **Durable state first**: every critical business transition must be persisted before it is broadcast, queued, or processed downstream.
2. **Realtime is a projection**: Supabase Realtime is used to deliver state changes quickly, but the database remains the canonical state source.
3. **Events describe facts**: events should represent something that already happened, not a request that may or may not happen.
4. **Commands request change**: commands such as `accept_order` or `apply_promo` validate intent and then produce durable state plus events.
5. **Idempotency is mandatory**: every external callback, customer retry, staff action, queue job, and event consumer must tolerate duplicate execution.
6. **Ordering is scoped**: global ordering is not required; per-aggregate ordering is required for orders, payments, loyalty accounts, and branch queues.
7. **Eventual consistency is explicit**: non-critical projections may lag, but customer-facing payment and fulfillment states must expose safe pending states.
8. **Auditability is non-negotiable**: order, payment, staff, loyalty, and notification events must be traceable after the fact.
9. **Isolation by branch and customer**: no realtime subscription, event consumer, dashboard, or queue worker should leak cross-branch or cross-customer data.
10. **Recovery over perfection**: the system must support replay, reconciliation, fallback polling, and manual incident procedures.

### 1.3 Canonical Sources of Truth

| Domain | Canonical Source | Realtime Projection | Async Consumers |
| --- | --- | --- | --- |
| Orders | `orders`, `order_items`, `order_status_events` | Customer tracking, kitchen queue, admin dashboards | Notifications, analytics, loyalty |
| Payments | `payments`, `payment_events`, `payment_webhook_events` | Payment status UI, admin payment view | Order state sync, reconciliation, alerts |
| Kitchen | `orders`, `kitchen_events`, `branch_capacity_snapshots` | Staff order queue, branch operations dashboard | SLA metrics, customer ETA notifications |
| Delivery | `delivery_tasks`, `delivery_events` | Customer tracking, dispatch board | ETA analytics, delay notifications |
| Loyalty | `loyalty_accounts`, `loyalty_transactions` | Account rewards UI | Lifecycle campaigns, BI |
| Notifications | `notifications`, `notification_attempts` | Admin visibility | Provider dispatch, retry worker |
| Analytics | `analytics_events`, aggregate marts | Admin dashboard projections | BI exports, forecasting |

---

## 2. Domain Event Taxonomy

### 2.1 Event Families

Events are grouped by domain ownership and aggregate boundary.

#### Commerce Events

- `cart.created`
- `cart.item_added`
- `cart.item_updated`
- `cart.item_removed`
- `cart.validated`
- `checkout.started`
- `checkout.validation_failed`
- `checkout.payment_initiated`
- `checkout.abandoned`

#### Order Events

- `order.created`
- `order.priced`
- `order.payment_pending`
- `order.payment_approved`
- `order.payment_rejected`
- `order.accepted`
- `order.rejected`
- `order.preparation_started`
- `order.ready_for_pickup`
- `order.out_for_delivery`
- `order.completed`
- `order.cancelled`
- `order.refunded`
- `order.delayed`

#### Payment Events

- `payment.preference_created`
- `payment.webhook_received`
- `payment.webhook_validated`
- `payment.provider_status_fetched`
- `payment.approved`
- `payment.rejected`
- `payment.cancelled`
- `payment.refunded`
- `payment.chargeback_opened`
- `payment.reconciliation_required`
- `payment.reconciled`

#### Kitchen Events

- `kitchen.order_enqueued`
- `kitchen.order_claimed`
- `kitchen.prep_started`
- `kitchen.item_unavailable`
- `kitchen.order_ready`
- `kitchen.capacity_updated`
- `kitchen.channel_paused`
- `kitchen.channel_resumed`

#### Delivery Events

- `delivery.task_created`
- `delivery.driver_assigned`
- `delivery.pickup_confirmed`
- `delivery.out_for_delivery`
- `delivery.arrival_nearby`
- `delivery.completed`
- `delivery.failed`
- `delivery.delayed`

#### Notification Events

- `notification.requested`
- `notification.queued`
- `notification.sent`
- `notification.delivered`
- `notification.failed`
- `notification.suppressed`
- `notification.retry_scheduled`

#### Loyalty Events

- `loyalty.points_pending`
- `loyalty.points_awarded`
- `loyalty.points_reversed`
- `loyalty.reward_reserved`
- `loyalty.reward_redeemed`
- `loyalty.reward_released`
- `loyalty.tier_changed`

#### Branch Operations Events

- `branch.opened`
- `branch.closed`
- `branch.delivery_paused`
- `branch.delivery_resumed`
- `branch.pickup_paused`
- `branch.pickup_resumed`
- `branch.menu_availability_changed`
- `branch.prep_time_multiplier_changed`

#### Analytics Events

- `analytics.event_recorded`
- `analytics.batch_flushed`
- `analytics.projection_updated`
- `analytics.export_completed`

### 2.2 Event Criticality Classes

| Class | Examples | Requirements |
| --- | --- | --- |
| Critical financial | Payment approval, refund, chargeback | Durable persistence, idempotency, reconciliation, alerting |
| Critical operational | Order accepted, prep started, ready, completed | Durable persistence, realtime projection, SLA tracking |
| Customer experience | Notification sent, order delayed | Retryable, auditable, suppress duplicates |
| Growth | Loyalty awarded, campaign trigger | Idempotent, replayable, eventually consistent |
| Analytics | Funnel events, BI projections | Append-only, lossy only where explicitly acceptable |

---

## 3. Event Naming Conventions

### 3.1 Standard Format

Event names must use:

```text
<domain>.<past_tense_business_fact>
```

Examples:

- `order.created`
- `payment.approved`
- `kitchen.prep_started`
- `notification.sent`
- `loyalty.points_awarded`

### 3.2 Naming Rules

- Use lowercase snake case for multi-word facts.
- Use past tense for facts.
- Do not encode implementation details in event names.
- Do not use ambiguous names such as `order.updated` for critical workflows.
- Do not use commands as events, such as `order.accept`.
- Do not create generic catch-all event names for financial or operational transitions.

### 3.3 Versioned Event Types

The event type remains stable while payload version is tracked separately:

```text
event_type = "payment.approved"
payload_version = 1
```

Breaking payload changes increment `payload_version`; semantic event meaning changes require a new event name.

---

## 4. Event Ownership Rules

### 4.1 Domain Ownership

Each event has exactly one owning domain. Only the owner may publish the event.

| Domain | Owner | Publishes |
| --- | --- | --- |
| Checkout | Commerce service boundary | Cart and checkout events |
| Orders | Order service boundary | Order lifecycle events |
| Payments | Payment integration boundary | Payment status and reconciliation events |
| Kitchen | Branch operations boundary | Kitchen queue and capacity events |
| Delivery | Delivery orchestration boundary | Delivery task events |
| Loyalty | Loyalty boundary | Points, rewards, tiers |
| Notifications | Notification orchestration boundary | Notification lifecycle events |
| Analytics | Analytics pipeline | Analytics ingestion/projection events |

### 4.2 Publication Rules

- Consumers must not publish another domain's canonical event.
- Cross-domain side effects must be mediated through commands or event handlers with idempotent records.
- Staff UI actions produce commands; backend validation produces events.
- External webhooks produce raw provider records first, then validated domain events.
- Analytics consumers may emit analytics-specific events but must not mutate canonical order/payment state.

### 4.3 Ownership Examples

- Mercado Pago webhook handler stores `payment.webhook_received`; payment processor publishes `payment.approved`; order domain reacts by transitioning order to `paid` and publishing `order.payment_approved`.
- Staff dashboard calls an accept-order command; order domain validates branch authorization and publishes `order.accepted`; kitchen projection reacts and updates queue position.

---

## 5. Event Payload Standards

### 5.1 Required Envelope

Every persisted domain event must include an envelope with:

```text
event_id
idempotency_key
event_type
payload_version
aggregate_type
aggregate_id
organization_id
branch_id nullable where not branch-scoped
customer_id nullable where not customer-scoped
actor_type
actor_id nullable
source
correlation_id
causation_id nullable
occurred_at
recorded_at
schema_hash optional
metadata
payload
```

### 5.2 Envelope Field Rules

- `event_id`: globally unique event identifier.
- `idempotency_key`: deterministic for retryable external events and commands.
- `aggregate_type`: order, payment, branch, loyalty account, notification, delivery task.
- `aggregate_id`: the entity whose ordered stream owns this event.
- `correlation_id`: ties request, payment, order, notification, and logs together.
- `causation_id`: identifies the event or command that caused this event.
- `occurred_at`: business time from trusted source where available.
- `recorded_at`: database insertion time.
- `metadata`: operational fields such as provider, branch timezone, user agent, IP hash, retry count.

### 5.3 Payload Rules

Payloads must be:

- JSON serializable.
- Backward compatible within the same `payload_version`.
- Free of unnecessary PII.
- Redacted before analytics export.
- Snapshotted for mutable business data that must be audited, such as price and order item names.

### 5.4 Payload Examples by Category

Payment approved payload should include:

- Provider payment ID.
- Provider status and status detail.
- Amount approved.
- Currency.
- Payment method family.
- Mercado Pago merchant account reference.
- Provider event timestamp.
- Reconciliation status.

Order accepted payload should include:

- Order ID.
- Branch ID.
- Staff actor ID.
- Estimated ready time.
- Previous status.
- New status.
- Queue position if available.

Notification sent payload should include:

- Notification ID.
- Channel.
- Template key.
- Provider message ID.
- Recipient hash or internal customer reference.
- Attempt number.

---

## 6. Event Versioning Strategy

### 6.1 Compatibility Rules

Backward compatible changes:

- Adding optional fields.
- Adding nullable metadata.
- Adding enum values when consumers handle unknown values safely.

Breaking changes:

- Removing fields.
- Renaming fields.
- Changing field meaning.
- Changing numeric units.
- Making optional fields required.

### 6.2 Version Management

- Store `payload_version` on every event.
- Consumers declare supported versions.
- Producers may emit both old and new versions during migrations.
- Replayers must preserve original version and transform only in projection layers.
- Analytics pipelines should normalize versions into warehouse-friendly schemas.

### 6.3 Deprecation Process

1. Add new optional fields or new version.
2. Update consumers to support both versions.
3. Backfill projections if required.
4. Monitor consumer lag and errors.
5. Stop emitting old version only after all consumers are confirmed compatible.
6. Preserve historical events forever or until retention policy allows archival.

---

## 7. Realtime Synchronization Strategy

### 7.1 Realtime Design Principle

Realtime channels should deliver fast state awareness, not own truth. Every realtime client must load canonical state first, subscribe second, and resync after disconnect.

### 7.2 Realtime Flows

#### Customer Order Tracking

- Initial load fetches order, payment, fulfillment, and timeline state by secure order token or authenticated customer ownership.
- Client subscribes to order status and order event projections for that order only.
- On reconnect, client refetches canonical order state and compares latest known event sequence.
- If the client detects a sequence gap, it refetches the timeline.
- If realtime fails, client falls back to polling with a progressive interval.

#### Kitchen Dashboard

- Initial load fetches active branch queue ordered by operational priority.
- Staff subscribes to branch-scoped order changes and capacity changes.
- Dashboard displays realtime connection health and last-sync timestamp.
- Staff actions are submitted as commands and then confirmed by canonical state changes.
- On reconnect, the entire active queue is resynced.

#### Admin Dashboards

- Admin dashboards use realtime for live counters and alerts only.
- Financial and BI metrics are fetched from durable aggregate projections.
- High-cardinality analytics should not stream directly to browsers.

#### Delivery Updates

- Customer tracking subscribes only to the delivery task associated with the order.
- Driver or staff location updates should be rate-limited and generalized when customer precision is not required.
- Delivery status events are durable; high-frequency geolocation samples may have shorter retention.

### 7.3 Stale State Detection

Clients track:

- Last successful canonical fetch time.
- Last realtime event time.
- Last known event sequence.
- Connection state.
- Subscription authorization status.

A client state is stale when:

- No realtime heartbeat is observed inside the configured threshold.
- Event sequence gaps are detected.
- Browser or mobile app resumes from background.
- Auth token refresh occurs.
- Network type changes.

### 7.4 Fallback Polling Rules

| Surface | Normal Realtime | Fallback Polling |
| --- | --- | --- |
| Customer order tracking | Order-specific subscription | 5s for active orders, 20s after ready/completed |
| Kitchen dashboard | Branch active queue subscription | 3s during service, 10s when idle |
| Staff branch controls | Branch settings subscription | 10s |
| Admin dashboard | Projection alerts | 15s to 60s depending on metric |
| Payment pending page | Payment/order subscription | 3s initially, then exponential backoff to 30s |

### 7.5 Optimistic Update Rules

Allowed optimistic updates:

- Cart UI quantity changes before checkout.
- Product customization local state.
- Non-critical UI preferences.

Not allowed optimistic updates:

- Payment approval.
- Order accepted.
- Order preparation started.
- Loyalty points awarded.
- Refund complete.
- Delivery completed.

---

## 8. Async Processing Strategy

### 8.1 Async Boundaries

The system should process asynchronously when the operation is:

- External provider dependent.
- Retryable.
- Not required for immediate user response.
- Potentially slow.
- Useful for fan-out to multiple consumers.

### 8.2 Synchronous Commit Path

Critical request path:

1. Validate command.
2. Open database transaction.
3. Mutate canonical aggregate state.
4. Insert domain event and outbox record.
5. Commit transaction.
6. Return canonical state or pending state to caller.

### 8.3 Asynchronous Fan-Out

After commit, workers process outbox records for:

- Notifications.
- Analytics.
- Loyalty.
- Webhook reconciliation.
- Search/index projections.
- Aggregate dashboards.
- Branch SLA calculations.

### 8.4 Outbox Pattern

Use a transactional outbox table to ensure state changes and event publication are atomic. If the system updates `orders` and needs to publish `order.accepted`, both must be committed in the same transaction.

Outbox record states:

- `pending`
- `processing`
- `processed`
- `retry_scheduled`
- `dead_lettered`

---

## 9. Queue Architecture

### 9.1 Queue Categories

| Queue | Purpose | Priority |
| --- | --- | --- |
| `payments` | Process provider events, reconciliation | Critical |
| `order_lifecycle` | Order state fan-out | Critical |
| `notifications_transactional` | Customer transactional messages | High |
| `notifications_marketing` | Campaign messages | Medium |
| `loyalty` | Award/reverse points, tiers | Medium |
| `analytics_ingestion` | Funnel and operational events | Medium |
| `analytics_projection` | Aggregates and dashboards | Low/Medium |
| `delivery` | Delivery task orchestration | High |
| `maintenance` | Cleanup, stale carts, daily summaries | Low |

### 9.2 Priority Rules

- Payment and order lifecycle queues must not be blocked by analytics or marketing work.
- Transactional notifications are separate from marketing notifications.
- Branch operations events are prioritized during service hours.
- Retry storms must not starve new critical events.

### 9.3 Queue Backend Options

The architecture can start with a Supabase/Postgres-backed outbox worker model if volume is moderate, but it must preserve abstraction for future migration to a dedicated queue such as managed Redis, Cloud Tasks, or a message broker.

Selection criteria for a dedicated queue:

- Sustained outbox lag exceeds SLO.
- Notification retry volume impacts database performance.
- Analytics ingestion becomes high-cardinality.
- Multi-region or advanced worker autoscaling is required.

---

## 10. Retry Architecture

### 10.1 Retry Principles

- Retry only idempotent operations.
- Classify errors before retrying.
- Use exponential backoff with jitter.
- Cap maximum retry attempts.
- Persist retry attempts and last error.
- Separate provider outage retries from validation failures.

### 10.2 Retryable Errors

- Network timeouts.
- Provider 5xx responses.
- Temporary rate limits.
- Database serialization failures.
- Transient realtime publication failures.

### 10.3 Non-Retryable Errors

- Invalid payload schema.
- Unauthorized command.
- Invalid promotion.
- Payment rejected by provider.
- Permanent provider validation error.
- Missing required customer consent for marketing notification.

### 10.4 Retry Schedule

Recommended default schedule:

1. 30 seconds.
2. 2 minutes.
3. 10 minutes.
4. 30 minutes.
5. 2 hours.
6. 6 hours.
7. Dead letter after final failure.

Critical payment reconciliation may use a longer recovery schedule with manual alerting after the short retry window.

---

## 11. Dead Letter Queue Strategy

### 11.1 DLQ Purpose

Dead letter queues preserve failed jobs or events that cannot be processed automatically after retry exhaustion. DLQ is not a trash bin; it is an operational recovery surface.

### 11.2 DLQ Record Requirements

Each DLQ record must include:

- Original event or job ID.
- Queue name.
- Aggregate ID.
- Correlation ID.
- Payload snapshot.
- Attempt count.
- Last error code.
- Last error message redacted for PII.
- First failed time.
- Final failed time.
- Manual resolution status.
- Resolver actor ID.

### 11.3 DLQ Handling

- Payment DLQ creates immediate SRE/payment alert.
- Notification DLQ creates channel-health alert if above threshold.
- Analytics DLQ is batch-reviewed unless operational dashboards are impacted.
- Loyalty DLQ requires reconciliation before campaign exports.
- Manual replay must preserve idempotency keys.

---

## 12. Idempotency Strategy

### 12.1 Idempotency Requirements

Idempotency applies to:

- Checkout initiation.
- Payment preference creation.
- Mercado Pago webhook processing.
- Staff order actions.
- Loyalty point awards/reversals.
- Notification sending.
- Queue job processing.
- Event replay.

### 12.2 Idempotency Keys

| Operation | Key Strategy |
| --- | --- |
| Checkout order creation | `customer_or_session_id + cart_version + branch_id` |
| Payment preference creation | `order_id + payment_attempt_number` |
| Mercado Pago webhook | Provider event ID, or provider payment ID + status + timestamp fallback |
| Staff status transition | `order_id + target_status + actor_id + command_nonce` |
| Loyalty award | `order_id + loyalty_account_id + earning_rule_id` |
| Notification send | `notification_id + channel + template + recipient` |
| Analytics event | Client event ID or server event ID |

### 12.3 Idempotency Storage

Store idempotency records with:

- Key.
- Operation type.
- Request hash.
- Response snapshot where safe.
- Status.
- Created timestamp.
- Expiration timestamp.

Financial and loyalty idempotency records should have long retention; transient cart records may expire sooner.

### 12.4 Duplicate Handling Policy

Duplicate requests return the previously recorded outcome when safe. If the original operation is still processing, return a pending response with polling/retry instructions.

---

## 13. Event Ordering Guarantees

### 13.1 Ordering Scope

The system must not promise global ordering. It must promise scoped ordering for:

- One order lifecycle.
- One payment attempt.
- One loyalty account ledger.
- One branch active queue projection.
- One delivery task.

### 13.2 Sequence Numbers

Each aggregate event stream should maintain a monotonic `aggregate_sequence`.

Rules:

- Increment sequence inside the same transaction as the aggregate mutation.
- Reject invalid state transitions based on current aggregate state and sequence.
- Consumers detect gaps and trigger resync.
- Replays maintain original event ordering.

### 13.3 Out-of-Order External Events

External providers may deliver events out of order. Provider event arrival order must not directly drive business state. The payment processor must fetch canonical provider status when necessary and apply a state precedence model.

Payment state precedence example:

1. `refunded`
2. `chargeback`
3. `approved`
4. `rejected`
5. `cancelled`
6. `pending`

The actual model must align with Mercado Pago status semantics and internal refund policies.

---

## 14. Event Consistency Rules

### 14.1 Strong Consistency Required

Strong consistency is required for:

- Order creation and order item price snapshot.
- Payment record creation.
- Payment approval applied to order payment state.
- Staff status transition authorization.
- Loyalty redemption reservation before payment.
- Inventory decrement if inventory is enforced in checkout.

### 14.2 Eventual Consistency Allowed

Eventual consistency is acceptable for:

- Email or WhatsApp notification dispatch.
- Analytics dashboards.
- Loyalty point award after order completion.
- Recommendations.
- BI exports.
- Marketing segmentation.

### 14.3 User-Facing Pending States

When downstream consistency is pending, UI must show truthful states:

- `Payment pending confirmation`.
- `Order received, waiting for branch acceptance`.
- `Reward pending after order completion`.
- `Notification delivery pending` for admin views.

---

## 15. Distributed System Reliability

### 15.1 Reliability Patterns

- Transactional outbox for event publication.
- Idempotent consumers.
- Retry with backoff and jitter.
- DLQ with manual replay.
- Canonical state refetch on reconnect.
- Reconciliation jobs for external providers.
- Health checks for workers and queues.
- Circuit breakers for degraded providers.
- Graceful degradation for non-critical features.

### 15.2 Circuit Breaker Rules

Provider integrations should open circuit when:

- Error rate exceeds threshold.
- Latency exceeds threshold.
- Provider returns sustained rate limits.
- Webhook validation failures spike.

When open:

- Disable non-critical sends or switch channels where possible.
- Preserve jobs in retryable state.
- Show honest customer pending states.
- Alert operations.

### 15.3 Degraded Mode Examples

- WhatsApp outage: continue order flow, send email fallback if consent exists, retry WhatsApp later.
- Analytics lag: keep commerce available, mark dashboards as delayed.
- Realtime outage: continue orders with polling and staff manual refresh.
- Mercado Pago uncertainty: show payment pending and run reconciliation before fulfillment if approval is not confirmed.

---

## 16. Failure Recovery Strategy

### 16.1 Recovery Tiers

| Tier | Scenario | Recovery |
| --- | --- | --- |
| Client transient | Mobile disconnect | Refetch canonical state, replay missed events from sequence |
| Worker transient | Queue job timeout | Retry with backoff |
| Provider transient | WhatsApp 5xx | Retry or fallback channel |
| Provider uncertain | Payment webhook delayed | Poll/fetch provider status and reconcile |
| Data inconsistency | Payment approved but order not marked paid | Reconciliation repair with audit event |
| Operational incident | Branch queue unavailable | Pause affected channel, manual order handling, incident log |

### 16.2 Recovery Records

Recovery actions must create durable audit events such as:

- `payment.reconciled`
- `order.state_repaired`
- `notification.replayed`
- `loyalty.reconciled`
- `branch.channel_paused`

### 16.3 Manual Intervention

Admin repair tools must be role-restricted and auditable. Manual repairs require:

- Reason code.
- Actor ID.
- Before/after state.
- Correlation ID.
- Optional supporting provider reference.

---

## 17. Payment Event Integrity

### 17.1 Mercado Pago Webhook Validation

Webhook handling must:

1. Receive raw payload.
2. Store raw webhook record with request metadata.
3. Validate authenticity using Mercado Pago-supported signature or verification mechanism.
4. Reject or quarantine invalid events.
5. Use provider IDs to fetch canonical payment status when required.
6. Process status through idempotent payment state machine.
7. Emit validated internal payment events.

### 17.2 Duplicate Event Handling

Duplicate webhook events must be detected by:

- Provider event ID where available.
- Provider payment ID and status transition.
- Payload hash fallback.
- Existing payment attempt state.

Duplicates should update delivery metadata if useful, but they must not:

- Create duplicate payment records.
- Move orders backward incorrectly.
- Trigger duplicate notifications.
- Award duplicate loyalty points.

### 17.3 Delayed Webhook Recovery

If checkout redirects before webhook confirmation:

- Payment page shows pending state.
- Client polls internal payment status.
- Backend reconciliation job fetches provider status by payment/preference ID.
- Approved payment transitions order to paid even if webhook arrives later.
- Late webhook is stored and deduplicated.

### 17.4 Payment Retry Safety

Payment retry creates a new payment attempt linked to the same order only when the previous attempt is terminal or safely abandoned.

Rules:

- Never reuse an ambiguous provider payment attempt.
- Do not create a second payable order for the same cart without explicit idempotency handling.
- If two attempts report approved, flag payment anomaly and prevent double fulfillment until resolved.
- Order fulfillment begins only after exactly one valid approved payment state is applied, except explicitly configured cash or manual payment flows.

### 17.5 Order/Payment Consistency Guarantees

- `payments` records provider state.
- `orders.payment_status` is a derived operational summary updated transactionally from validated payment events.
- `order.payment_approved` is emitted only once per order payment completion.
- Refunds create both payment and order events when they affect customer/order state.

### 17.6 Reconciliation Strategy

Scheduled reconciliation should:

- Scan pending payments older than configured thresholds.
- Fetch provider status.
- Compare provider amount, currency, merchant account, and order reference.
- Repair internal status if needed.
- Alert on ambiguous, overpaid, underpaid, or duplicate-approved states.

---

## 18. Notification Orchestration

### 18.1 Notification Architecture

Notifications are generated from domain events through a notification orchestration layer. Domain services should not call WhatsApp or email providers directly.

### 18.2 Notification Lifecycle

1. Domain event occurs.
2. Notification rule evaluates eligibility.
3. Notification intent is created.
4. Consent and suppression rules are checked.
5. Channel is selected.
6. Provider send job is queued.
7. Attempt is recorded.
8. Provider response updates attempt and notification status.
9. Failures are retried or dead-lettered.

### 18.3 Duplicate Suppression

Suppress duplicates by notification intent key:

```text
order_id + event_type + channel + template_key + recipient
```

### 18.4 Channel Fallback

- Transactional messages may fall back from WhatsApp to email if customer contact and policy allow.
- Marketing messages must honor explicit consent and should not fallback to channels without consent.
- Provider-level failures should not block order fulfillment.

---

## 19. Loyalty Event Flows

### 19.1 Loyalty Award Flow

1. `order.completed` is emitted.
2. Loyalty worker checks order eligibility.
3. Worker creates `loyalty.points_pending` if settlement delay applies.
4. Worker awards points with idempotency key.
5. Ledger transaction is inserted.
6. Account balance is updated transactionally.
7. `loyalty.points_awarded` is emitted.
8. Notification rule may announce reward progress.

### 19.2 Refund and Cancellation Flow

- Refund event triggers eligibility check.
- Awarded points are reversed if policy requires.
- Reversal is ledger-based, never destructive.
- Tier recalculation is event-driven and auditable.

### 19.3 Redemption Reservation

Rewards used during checkout require reservation:

1. Customer selects reward.
2. Loyalty service validates balance and availability.
3. Reward is reserved for cart/order with expiration.
4. Payment succeeds: reward becomes redeemed.
5. Payment fails or expires: reward is released.

---

## 20. Kitchen Event Flows

### 20.1 Paid Order to Kitchen Queue

1. `payment.approved` is processed.
2. Order domain transitions to `paid`.
3. `order.payment_approved` is emitted.
4. Kitchen projection enqueues order for branch.
5. `kitchen.order_enqueued` is emitted.
6. Staff dashboard receives branch-scoped realtime update.

### 20.2 Staff Acceptance Flow

1. Staff sends accept command.
2. Backend verifies staff branch authorization.
3. Backend verifies order status and branch capacity.
4. Order transitions to `accepted`.
5. Event and status timeline record are persisted.
6. Customer and kitchen dashboards receive updates.
7. Notification orchestration sends customer confirmation.

### 20.3 Capacity Flow

- Kitchen dashboard can update capacity multiplier.
- Capacity changes emit `kitchen.capacity_updated`.
- Customer checkout ETA recalculates.
- If capacity threshold is exceeded, ordering can be paused by channel.

---

## 21. Delivery Event Flows

### 21.1 Delivery Task Creation

Delivery task is created after order acceptance for delivery orders or after preparation readiness depending on operating model.

Event flow:

1. `order.accepted`.
2. Delivery eligibility verified.
3. `delivery.task_created`.
4. Dispatch board receives task.
5. Customer tracking includes delivery state.

### 21.2 Dispatch and Completion

- Driver assignment emits `delivery.driver_assigned`.
- Pickup from branch emits `delivery.pickup_confirmed`.
- Dispatch emits `delivery.out_for_delivery`.
- Completion emits `delivery.completed` and may trigger `order.completed`.

### 21.3 Delivery Failure

Delivery failure must preserve customer support visibility:

- Emit `delivery.failed` with reason code.
- Alert branch staff.
- Create customer support task where needed.
- Do not mark order completed until resolved.

---

## 22. Analytics Event Streaming

### 22.1 Analytics Ingestion

Analytics events should be append-only and isolated from critical commerce paths.

### 22.2 Stream Categories

- Product funnel events.
- Checkout funnel events.
- Payment funnel events.
- Branch operational events.
- Kitchen SLA events.
- Delivery SLA events.
- Loyalty engagement events.
- Notification performance events.

### 22.3 Analytics Reliability

- Analytics failures must not break checkout.
- Server-side critical funnel events should be preferred over client-only events.
- Client analytics events should include client event IDs to deduplicate retries.
- Operational analytics should derive from domain events when accuracy matters.

### 22.4 Projection Lag

Dashboards must show data freshness. If projection lag exceeds threshold, display stale data warnings and alert internal teams.

---

## 23. Event Persistence Strategy

### 23.1 Event Store Tables

Recommended event persistence surfaces:

- `domain_events` for canonical cross-domain event envelope.
- `outbox_events` for pending publication/work dispatch.
- `order_status_events` for customer and operational order timelines.
- `payment_webhook_events` for raw provider event receipt.
- `payment_events` for normalized payment lifecycle.
- `notification_events` and `notification_attempts`.
- `dead_letter_events` for unrecoverable processing failures.

### 23.2 Retention

| Data | Retention |
| --- | --- |
| Payment webhook raw payloads | Long retention per legal/accounting requirements, with PII controls |
| Order status events | Long retention for customer support and audit |
| Domain events | Long retention or archival after operational window |
| Realtime ephemeral presence | Short retention |
| High-frequency location samples | Short retention unless needed for dispute resolution |
| Analytics raw events | Policy-based retention and aggregation |

### 23.3 Append-Only Rules

Financial, order status, loyalty ledger, and audit events should be append-only. Corrections are represented by compensating events, not destructive edits.

---

## 24. Realtime Authorization

### 24.1 Authorization Model

Realtime authorization must be equivalent to API authorization. A user who cannot fetch a row must not subscribe to its changes.

### 24.2 Customer Channels

Customers can subscribe to:

- Their own authenticated orders.
- Guest order tracking only through secure order token with limited scope.
- Their own loyalty account.

Customers cannot subscribe to:

- Branch queues.
- Other customer orders.
- Admin analytics.
- Staff operational channels.

### 24.3 Staff Channels

Staff can subscribe to:

- Orders for assigned branch.
- Branch availability and capacity for assigned branch.
- Delivery tasks for assigned branch.

Staff cannot subscribe to:

- Other branches unless membership permits.
- Organization-wide financial analytics unless role permits.

### 24.4 Admin Channels

Admins can subscribe according to organization and role permissions. Organization admins do not automatically get super-admin visibility.

### 24.5 Token and Session Handling

- Realtime subscriptions must be reauthorized after auth token refresh.
- Expired or revoked staff sessions must terminate operational subscriptions.
- Staff role changes should invalidate active sessions or force permission refresh.

---

## 25. Multi-Branch Event Isolation

### 25.1 Isolation Requirements

Every branch-scoped event must carry `organization_id` and `branch_id`. Every query, subscription, queue worker, and dashboard projection must filter by organization and branch where applicable.

### 25.2 Branch Queue Isolation

- Branch queue workers process only assigned branch partitions or branch-safe batches.
- One overloaded branch must not block another branch's kitchen queue.
- Branch-specific paused channels affect only that branch.

### 25.3 Organization-Level Aggregation

Organization dashboards aggregate branch projections asynchronously. Admin views should not query every live branch queue directly for high-cardinality metrics during peak traffic.

### 25.4 Franchise Readiness

Future franchise expansion requires:

- Tenant-aware event schemas.
- Organization-scoped encryption and policy boundaries where needed.
- Role templates per franchise operator.
- Branch-level operational autonomy with organization-level governance.

---

## 26. Observability & Tracing

### 26.1 Correlation IDs

Every user request, webhook, queue job, event, notification, and provider call must carry a `correlation_id`.

Correlation propagation:

- Browser checkout request creates or receives correlation ID.
- Order creation stores it.
- Payment preference uses it in metadata where possible.
- Webhook maps provider metadata back to internal correlation.
- Notification and loyalty jobs inherit causation chain.

### 26.2 Structured Logs

Logs must include:

- Timestamp.
- Service/boundary name.
- Environment.
- Correlation ID.
- Causation ID.
- Event ID.
- Aggregate ID.
- Organization ID.
- Branch ID where applicable.
- Actor ID where safe.
- Error code.
- Latency.
- Retry attempt.

PII must be redacted or tokenized.

### 26.3 Traces

Distributed traces should cover:

- Checkout to payment preference creation.
- Mercado Pago webhook to order paid transition.
- Order paid to kitchen queue update.
- Staff action to customer tracking update.
- Order completed to loyalty award and notification.

### 26.4 Metrics

Track:

- Event publication rate.
- Outbox lag.
- Queue depth by queue.
- Queue processing latency.
- DLQ counts.
- Realtime connection counts.
- Realtime reconnect rate.
- Realtime authorization failures.
- Payment webhook latency.
- Payment reconciliation repairs.
- Notification send success rate.
- Kitchen queue age.
- Branch order SLA.

---

## 27. Monitoring & Alerting

### 27.1 Critical Alerts

Immediate alerts:

- Payment webhook validation failures spike.
- Payment approved by provider but not reflected internally beyond threshold.
- Outbox lag for payment/order queues exceeds SLO.
- Kitchen dashboard realtime failure for active branch.
- Branch active order queue processing stalled.
- DLQ receives payment or order lifecycle events.
- Unauthorized realtime subscription attempts spike.

### 27.2 Warning Alerts

Warning alerts:

- Notification provider error rate elevated.
- Analytics projection lag elevated.
- Realtime reconnect rate elevated.
- Staff action latency elevated.
- Payment pending rate elevated.
- Branch capacity threshold reached.

### 27.3 Dashboards

Dashboards required:

- Payment reliability dashboard.
- Order lifecycle dashboard.
- Realtime health dashboard.
- Queue and worker dashboard.
- Branch operations SLA dashboard.
- Notification delivery dashboard.
- DLQ and replay dashboard.
- Security event dashboard.

---

## 28. Security Hardening

### 28.1 Event Authorization

Event publication must be server-side. Clients submit commands, not domain events. The backend validates actor identity, role, branch membership, and current aggregate state before publishing any event.

### 28.2 Webhook Spoofing Protection

Webhook endpoints must:

- Validate provider signature or supported verification mechanism.
- Enforce allowed methods.
- Use replay windows where provider timestamps exist.
- Verify provider payment status server-to-server for critical transitions.
- Rate limit by source and endpoint.
- Store invalid attempts for security monitoring without processing them.

### 28.3 Replay Attack Prevention

- Reject duplicate provider events by idempotency key.
- Reject stale signed requests outside allowed timestamp windows.
- Bind guest order tracking tokens to limited read scope and expiration.
- Rotate secrets periodically.

### 28.4 Queue Abuse Prevention

- Workers process only trusted persisted jobs.
- Queue enqueue operations require server authority.
- Job payloads are validated before processing.
- Poison messages are isolated to DLQ.
- Retry attempts are capped to avoid cost or provider abuse.

### 28.5 Realtime Boundary Hardening

- RLS policies must cover all realtime-enabled tables.
- Avoid broadcasting sensitive payloads when only status is needed.
- Use projection tables with minimal fields for customer-facing realtime if necessary.
- Staff and admin channels require role verification and branch/organization scoping.

---

## 29. Event Replay Strategy

### 29.1 Replay Use Cases

- Rebuild analytics projections.
- Repair missed notifications where safe.
- Recompute loyalty balances.
- Rebuild order timelines.
- Recover from worker outage.
- Migrate event payload versions.

### 29.2 Replay Rules

- Replays must be explicitly marked as replay context.
- Replays must preserve original `event_id`, `occurred_at`, and aggregate sequence.
- Side effects that contact customers or providers must be disabled unless intentionally replayed.
- Idempotent consumers must detect already-applied effects.
- Replay operations must be permissioned and audited.

### 29.3 Replay Modes

| Mode | Purpose | Side Effects |
| --- | --- | --- |
| Dry run | Validate projection result | None |
| Projection rebuild | Recompute read models | Internal only |
| Targeted replay | Repair one aggregate or branch | Controlled |
| Side-effect replay | Resend missed notification | Explicit approval required |

---

## 30. Event Auditability

### 30.1 Audit Requirements

Audit trails must answer:

- Who changed an order status?
- When did the provider approve payment?
- Which webhook caused internal state transition?
- Why was an order cancelled or refunded?
- Which notification was sent to the customer?
- Which staff member paused delivery?
- Which replay or repair changed projections?

### 30.2 Audit Data

Audit events must include:

- Actor.
- Role.
- Branch and organization.
- Before/after state for administrative repairs.
- Reason code for manual actions.
- Provider reference for payment events.
- IP hash and user agent for sensitive admin operations where policy allows.

### 30.3 Immutability

Audit-critical tables should avoid destructive updates. If correction is required, append a correcting event with reason and actor.

---

## 31. Rate Limiting Strategy

### 31.1 Rate-Limited Surfaces

- Checkout creation.
- Payment preference creation.
- Payment status polling.
- Promo validation.
- Loyalty redemption.
- Login and OTP.
- Webhook endpoints.
- Guest order tracking.
- Staff status transitions.
- Admin bulk operations.

### 31.2 Rate Limit Dimensions

- IP hash.
- User ID.
- Session ID.
- Order ID.
- Branch ID.
- Provider source.
- Endpoint.

### 31.3 Backpressure

When rate limits or capacity thresholds are reached:

- Return safe retry-after guidance.
- Do not drop critical payment webhooks solely because of generic rate limits; quarantine and process safely.
- Throttle analytics and marketing before payment/order processing.
- Allow branch-level channel pause to protect kitchen operations.

---

## 32. Queue Scaling Strategy

### 32.1 Scaling Dimensions

Scale workers by:

- Queue depth.
- Queue age.
- Processing latency.
- Branch peak hours.
- Provider rate limits.
- Error rate.

### 32.2 Partitioning

Partition critical operational processing by:

- Queue type.
- Organization.
- Branch.
- Aggregate ID for strict ordering.

### 32.3 Worker Concurrency

- Payment workers use conservative concurrency to protect provider limits and ordering.
- Notification workers can scale horizontally with provider-aware throttles.
- Analytics workers can batch aggressively.
- Branch queue projection workers should avoid cross-branch head-of-line blocking.

### 32.4 Autoscaling Trigger Examples

- Scale payment/order workers when critical queue age exceeds 30 seconds.
- Scale notification workers when transactional notification queue age exceeds 60 seconds.
- Scale analytics workers based on batch lag, not customer-facing latency.

---

## 33. Infrastructure Cost Controls

### 33.1 Cost Principles

- Preserve realtime for high-value operational surfaces.
- Batch analytics and marketing workloads.
- Avoid high-frequency customer geolocation streaming unless required.
- Store large payloads selectively.
- Archive old event data.

### 33.2 Cost Controls

- Use projection tables to reduce expensive dashboard queries.
- Limit realtime payload size and subscription fan-out.
- Apply retention policies for ephemeral events.
- Batch notification and analytics jobs.
- Use branch-level throttles during demand spikes.
- Prefer server-side aggregation for admin dashboards.

### 33.3 Cost Observability

Track cost indicators:

- Realtime connection count and message volume.
- Database write rate from events.
- Storage growth from webhook payloads.
- Notification provider spend.
- Function execution duration.
- Queue retry volume.

---

## 34. Offline Recovery Flows

### 34.1 Customer Mobile Recovery

When a customer reconnects:

1. Refresh auth/session.
2. Fetch current order state.
3. Fetch events after last known sequence.
4. Rebuild timeline.
5. Re-subscribe to realtime.
6. Resume fallback polling if subscription fails.

### 34.2 Staff Dashboard Recovery

When staff dashboard reconnects:

1. Refresh staff permissions.
2. Fetch active branch state.
3. Fetch active order queue.
4. Compare local pending actions with server state.
5. Mark unresolved actions for staff confirmation.
6. Re-subscribe to branch realtime.

### 34.3 Payment Pending Recovery

When payment status is unknown:

1. Show pending confirmation.
2. Poll internal status.
3. Trigger server reconciliation after threshold.
4. Fetch provider status server-side.
5. Resolve order state or escalate.

### 34.4 Local Action Safety

The platform should not allow offline staff actions to silently mutate critical order state after reconnect without validation. Offline actions must be resubmitted as commands and may be rejected if state changed.

---

## 35. Eventual Consistency Rules

### 35.1 Explicit Consistency Contracts

Each feature must declare consistency behavior:

| Feature | Consistency Contract |
| --- | --- |
| Payment approval | Strong internal transition after provider validation |
| Order tracking | Realtime best effort, canonical refetch on load/reconnect |
| Kitchen queue | Strong branch queue state, realtime projection for UI |
| Notifications | At-least-once processing with duplicate suppression |
| Loyalty earning | Eventually consistent after completion/refund windows |
| Analytics | Eventually consistent with freshness indicator |
| Recommendations | Eventually consistent and non-critical |

### 35.2 Customer Communication

Do not expose internal eventual consistency as confusion. Use clear statuses such as:

- `Confirming payment`.
- `Syncing latest order status`.
- `Reward will appear after your order is completed`.
- `Dashboard data delayed by X minutes`.

---

## 36. SLA/SLO Definitions

### 36.1 Customer Commerce SLOs

- Checkout order creation p95 under 1.5 seconds excluding provider redirect.
- Payment pending internal status refresh p95 under 5 seconds after webhook receipt.
- Customer order tracking update p95 under 2 seconds after internal state change when realtime is healthy.
- Cart validation p95 under 800ms.

### 36.2 Operations SLOs

- Kitchen dashboard active queue update p95 under 2 seconds.
- Staff status command p95 under 1 second.
- Branch capacity update p95 under 2 seconds.
- Critical order queue outbox lag p95 under 10 seconds.

### 36.3 Payment SLOs

- Webhook receipt persistence p99 under 500ms.
- Validated payment event processing p95 under 5 seconds.
- Pending payment reconciliation starts within 2 minutes after threshold.
- Payment anomaly alert within 1 minute of detection.

### 36.4 Notification SLOs

- Transactional notification enqueue p95 under 5 seconds after triggering event.
- Transactional provider send p95 under 60 seconds when provider is healthy.
- Marketing notifications have lower priority and separate SLOs.

---

## 37. Realtime QA Strategy

### 37.1 Test Categories

- Subscription authorization tests.
- Reconnect and resync tests.
- Event sequence gap tests.
- Multi-tab customer tracking tests.
- Staff dashboard concurrency tests.
- Branch isolation tests.
- Fallback polling tests.
- Realtime outage simulation.

### 37.2 Critical Realtime Test Scenarios

- Customer sees order transition from paid to accepted without refresh.
- Customer reconnects after missing two status events and timeline repairs correctly.
- Staff dashboard receives new paid order in correct branch only.
- Staff from Branch A cannot subscribe to Branch B queue.
- Admin dashboard shows stale data warning when projection lag exceeds threshold.
- Realtime disconnect does not prevent staff from submitting validated commands.

### 37.3 QA Acceptance Criteria

- No critical workflow relies exclusively on WebSockets.
- Every realtime surface has canonical refetch path.
- Every branch-scoped subscription is authorization tested.
- Every reconnect path detects stale state.

---

## 38. Load Testing Strategy

### 38.1 Load Test Dimensions

- Concurrent menu browsers.
- Concurrent checkout attempts.
- Payment webhook bursts.
- Staff dashboard subscriptions per branch.
- Customer order tracking subscriptions.
- Notification fan-out after order state bursts.
- Analytics event ingestion bursts.

### 38.2 Peak Service Simulation

Simulate:

- Friday dinner traffic.
- One branch overloaded while another remains normal.
- Mercado Pago webhook burst and duplicate delivery.
- WhatsApp provider degradation.
- Realtime disconnect wave.
- Worker restart during active order processing.

### 38.3 Success Criteria

- Payment/order queues remain within SLO.
- Duplicate webhooks do not create duplicate effects.
- Branch A overload does not degrade Branch B beyond defined limits.
- Staff dashboards recover after reconnect.
- Customer checkout remains available when analytics is degraded.

---

## 39. Incident Recovery Procedures

### 39.1 Payment Incident

1. Alert triggered for payment anomaly or webhook failure.
2. Freeze affected payment attempt transitions if data integrity is uncertain.
3. Run reconciliation by provider payment ID/order ID.
4. Repair internal state with audited recovery event.
5. Notify branch/customer only after state is confirmed.
6. Document incident timeline and root cause.

### 39.2 Realtime Incident

1. Detect elevated disconnects or subscription failures.
2. Enable or increase fallback polling intervals.
3. Notify staff UI that live sync is degraded.
4. Preserve order command functionality through canonical APIs.
5. Monitor queue and database load from polling.
6. Restore realtime and trigger client resync.

### 39.3 Notification Incident

1. Detect provider failure or DLQ spike.
2. Open circuit for failing provider.
3. Route transactional messages to fallback channel if allowed.
4. Queue failed messages for retry.
5. Avoid duplicate sends through notification intent keys.
6. Replay intentionally after provider recovery.

### 39.4 Branch Operations Incident

1. Pause affected branch channel if kitchen cannot receive orders.
2. Preserve customer browsing with clear unavailable state.
3. Reconcile active orders manually.
4. Resume channel only after branch dashboard is healthy.
5. Record incident and operational metrics.

---

## 40. Production Hardening Recommendations

### 40.1 Immediate Hardening Requirements

- Implement transactional outbox before integrating payment webhooks.
- Define payment state machine and idempotency keys before Mercado Pago launch.
- Create branch-scoped realtime policies before staff dashboard launch.
- Add order timeline event persistence before customer tracking launch.
- Separate transactional and marketing notification queues.
- Add DLQ and replay procedures before production traffic.

### 40.2 Pre-Launch Gates

Production launch should be blocked until:

- Duplicate Mercado Pago webhook tests pass.
- Payment pending reconciliation tests pass.
- Realtime reconnect tests pass.
- Branch isolation authorization tests pass.
- Staff dashboard fallback polling works.
- Payment and order DLQ alerting works.
- Correlation IDs are visible across checkout, payment, order, and notification logs.
- Manual recovery procedures are documented and rehearsed.

### 40.3 Future Evolution

As volume grows, evolve from Postgres-backed outbox workers to dedicated messaging infrastructure while preserving:

- Event envelope.
- Idempotency model.
- Aggregate sequence rules.
- Consumer contracts.
- Replay procedures.
- Observability standards.

The architecture should remain provider-portable: Supabase Realtime can power initial synchronization, but durable event persistence and queue abstraction ensure the platform can add dedicated brokers, mobile push, driver apps, and franchise-scale operational systems without rewriting core business workflows.
