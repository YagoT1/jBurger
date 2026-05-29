# J Burguer — Hardened Restaurant Operations Architecture

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Historical English business terms in this document are deprecated in favor of the canonical Spanish glossary.

## 0. Operations Architecture Scope

This document defines the production restaurant operating system architecture for J Burguer. It hardens branch operations, kitchen workflows, fulfillment queues, staff coordination, delivery dispatch, pickup execution, ETA management, operational alerts, degraded modes, observability, and QA for high-volume food operations.

The operational system is not a simple order status tracker. It is the realtime execution layer that converts paid commerce intent into prepared food, customer pickup, or delivery completion while protecting kitchen throughput, branch autonomy, delivery capacity, and customer trust.

The operating system must survive:

- Paid order bursts from campaigns or sports events.
- Kitchen station overload.
- Branch-specific staff shortages.
- Delivery driver scarcity.
- Delayed payment/provider events.
- Realtime reconnect storms.
- Scheduled order surges.
- Item stockouts after payment.
- Partial branch outages.
- Human mistakes under peak-hour stress.

---

## 1. Restaurant Operations Philosophy

### 1.1 Operating Objective

The restaurant operations layer must maintain clear, safe, realtime operational control from order payment approval through kitchen preparation, pickup handoff, delivery dispatch, completion, delay handling, and recovery. The system must optimize throughput without hiding operational risk or overloading staff.

### 1.2 Principles

1. **Operational truth over optimistic UI**: staff dashboards reflect canonical branch state, not unconfirmed client assumptions.
2. **Branch autonomy with platform governance**: branches can pause, throttle, and recover independently while organization admins retain oversight.
3. **Human-first workflows**: high-stress kitchen and dispatch tasks must be touch-friendly, fast, obvious, and resilient to mistakes.
4. **Realtime is a projection**: staff dashboards use realtime updates, but canonical state is always reloadable and replay-safe.
5. **Bounded queues**: branch, kitchen, delivery, and station queues must have capacity thresholds and backpressure controls.
6. **ETA honesty**: ETAs must degrade visibly when operational conditions degrade.
7. **Failure isolation**: one branch outage, delivery shortage, or kitchen overload must not cascade across the platform.
8. **Manual intervention is first-class**: managers need audited controls for pause, throttle, reassignment, cancellation, substitution, and delay handling.
9. **Every operational transition is auditable**: staff actions, system escalations, overrides, and corrections must be traceable.
10. **Peak-hour survivability**: the system must protect staff and customers during overload before operational collapse occurs.

---

## 2. Operational Domain Boundaries

### 2.1 Domain Modules

| Domain | Responsibility | Canonical Data |
| --- | --- | --- |
| Branch Operations | Hours, channels, capacity, staffing state | Branch settings, operational state snapshots |
| Kitchen | Queue, preparation, station progress | Kitchen tickets, station tasks, status events |
| Fulfillment | Order acceptance, readiness, handoff | Orders, fulfillment events |
| Delivery | Dispatch, assignment, route status | Delivery tasks, driver assignments |
| Pickup | Ready queue, customer handoff | Pickup queue and completion events |
| Scheduling | Future orders, slots, capacity reservations | Scheduled order and slot records |
| Staff | Roles, shifts, active sessions, workload | Staff memberships, shifts, activity events |
| Incident Management | Operational incidents and recovery | Incident records, audit events |
| ETA Engine | Prep and delivery estimates | ETA snapshots, model inputs, accuracy metrics |
| Observability | Metrics, alerts, traces, dashboards | Operational event streams and projections |

### 2.2 Boundary Rules

- Commerce finalizes order/payment eligibility; operations executes fulfillment.
- Kitchen does not mutate financial totals.
- Delivery does not alter kitchen preparation state except through handoff events.
- Staff commands create validated operational events.
- Operational projections are branch-scoped.
- Support tools can assist recovery but must not bypass branch/financial controls.

---

## 3. Branch Operational Model

### 3.1 Branch State

Each branch maintains operational state for:

- Open/closed status.
- Pickup channel status.
- Delivery channel status.
- Kitchen capacity multiplier.
- Active queue depth.
- Estimated prep baseline.
- Station availability.
- Staff on shift.
- Delivery capacity.
- Incident/degraded status.

### 3.2 Branch Modes

- `closed`.
- `opening_precheck`.
- `open_normal`.
- `open_peak`.
- `delivery_paused`.
- `pickup_paused`.
- `throttled`.
- `incident_mode`.
- `closing_grace_period`.

### 3.3 Branch Control Rules

- Branch managers can pause channels within assigned branch scope.
- Organization admins can apply organization-level policies but branch state remains isolated.
- Operational overrides require reason and audit.
- Customer checkout reads branch state before payment and before kitchen dispatch.

---

## 4. Multi-Branch Operational Isolation

### 4.1 Isolation Requirements

Every operational record must carry `organization_id` and `branch_id` where branch-scoped. Staff queues, realtime channels, delivery tasks, incidents, capacity snapshots, and kitchen tickets are isolated by branch.

### 4.2 Failure Isolation

- Branch overload triggers branch-local throttling.
- Branch incident mode affects only that branch unless organization policy escalates.
- Delivery shortage in one branch does not pause other branches.
- Realtime queue storms are partitioned by branch.
- Branch-specific workers prevent head-of-line blocking across branches.

### 4.3 Cross-Branch Oversight

Organization dashboards aggregate branch projections asynchronously. Admins should not depend on live raw queue fan-out from every branch during peak traffic.

---

## 5. Kitchen Workflow Architecture

### 5.1 Kitchen Workflow Objective

Kitchen workflow transforms paid, eligible orders into prepared food through clear stages, station tasks, queue priority, and readiness handoff.

### 5.2 Workflow Stages

1. Order eligible for kitchen.
2. Branch acceptance.
3. Kitchen ticket creation.
4. Station task generation.
5. Preparation started.
6. Station completion.
7. Assembly/quality check.
8. Ready for pickup or delivery handoff.
9. Completion or exception flow.

### 5.3 Kitchen Ticket Rules

- One order can create one kitchen ticket with multiple station tasks.
- Tickets are branch-scoped.
- Tickets inherit immutable order item snapshots.
- Staff actions transition ticket state through validated commands.
- Ticket corrections create operational events, not silent edits.

---

## 6. Kitchen Queue Architecture

### 6.1 Queue Types

- Incoming paid orders pending acceptance.
- Active kitchen tickets.
- Station-specific work queues.
- Ready-for-handoff queue.
- Exception queue.
- Scheduled order pre-release queue.

### 6.2 Queue Record Fields

Queue records should include:

- Order ID.
- Kitchen ticket ID.
- Branch ID.
- Fulfillment type.
- Priority score.
- Promised time.
- Estimated prep time.
- Complexity score.
- Current station state.
- Delay risk.
- Assignment state.

### 6.3 Queue Constraints

- Queues are bounded by capacity thresholds.
- Queue ordering is deterministic and auditable.
- Staff can manually reprioritize only with permission and reason.
- Exception queue must be visually distinct from normal flow.

---

## 7. Kitchen Prioritization Strategy

### 7.1 Priority Inputs

- Payment approval time.
- Fulfillment type.
- Promised pickup/delivery time.
- Scheduled order slot.
- Delivery driver availability.
- Order complexity.
- Customer delay risk.
- Branch SLA policy.
- Manual manager override.

### 7.2 Priority Rules

- Scheduled orders enter active prep at calculated release time.
- Delivery orders may be timed to driver availability to avoid cold food.
- Pickup orders prioritize promised ready time.
- Delayed orders escalate visually and operationally.
- Manual priority overrides require audit.

### 7.3 Rush Handling

During rush mode, prioritization should favor SLA risk and station balance over simple FIFO when necessary.

---

## 8. Kitchen Capacity Modeling

### 8.1 Capacity Inputs

- Staff on shift.
- Active stations.
- Average prep time by product.
- Complexity score by item/modifier.
- Current active tickets.
- Scheduled order load.
- Branch manager multiplier.
- Incident/degraded state.

### 8.2 Capacity Units

Use capacity units instead of raw order count. A large customized order consumes more capacity than a single simple burger.

### 8.3 Capacity Thresholds

- Green: normal throughput.
- Yellow: ETA degradation begins.
- Orange: throttle checkout or recommend scheduled slots.
- Red: pause affected fulfillment channel or require manager intervention.

---

## 9. Kitchen Load Balancing

### 9.1 Load Balancing Dimensions

- Station load.
- Staff assignment.
- Product complexity.
- Fulfillment timing.
- Scheduled orders.
- Delivery dispatch windows.

### 9.2 Load Balancing Actions

- Reassign station tasks.
- Delay release of scheduled orders until optimal prep window.
- Increase ETA.
- Pause delivery while keeping pickup open.
- Disable high-complexity limited items temporarily.
- Trigger manager alert.

### 9.3 Limits

Do not balance load across branches unless operationally supported by inventory, staff, fulfillment, and customer communication policies.

---

## 10. Kitchen State Machine

### 10.1 States

- `queued`.
- `accepted`.
- `prep_pending`.
- `in_preparation`.
- `station_blocked`.
- `assembly`.
- `quality_check`.
- `ready`.
- `handoff_pending`.
- `completed`.
- `cancelled`.
- `exception`.

### 10.2 Transition Rules

- `accepted` requires branch staff authorization.
- `in_preparation` requires active kitchen ticket.
- `ready` requires required station tasks completed or manager override.
- `exception` requires reason code.
- `completed` requires pickup handoff or delivery completion depending on fulfillment type.

---

## 11. Order Fulfillment State Machine

### 11.1 States

- `payment_confirmed`.
- `awaiting_branch_acceptance`.
- `accepted_by_branch`.
- `queued_for_kitchen`.
- `preparing`.
- `ready_for_pickup`.
- `ready_for_delivery_dispatch`.
- `out_for_delivery`.
- `picked_up`.
- `delivered`.
- `completed`.
- `delayed`.
- `cancelled`.
- `refund_required`.
- `operational_exception`.

### 11.2 Fulfillment Rules

- Payment-confirmed orders enter operational flow only after fraud/commerce checks pass.
- Fulfillment state is customer-visible only where appropriate.
- Operational exceptions must not silently mark orders completed.
- Cancellation after prep start may require manager approval and refund coordination.

---

## 12. Order Routing Architecture

### 12.1 Routing Inputs

- Order branch.
- Fulfillment type.
- Payment status.
- Fraud hold status.
- Scheduled time.
- Kitchen capacity.
- Delivery capacity.
- Item availability.

### 12.2 Routing Outputs

- Branch acceptance queue.
- Kitchen ticket queue.
- Scheduled release queue.
- Delivery dispatch queue.
- Pickup ready queue.
- Exception queue.

### 12.3 Routing Rules

Orders are routed by branch and fulfillment path. Rerouting to another branch after payment is exceptional and requires customer consent, financial consistency, and operational audit.

---

## 13. Station-Based Workflow Design

### 13.1 Station Types

- Grill.
- Fryer.
- Assembly.
- Drinks.
- Dessert.
- Packing.
- Quality check.

### 13.2 Station Task Rules

- Order items generate station tasks based on product configuration.
- Station tasks can run in parallel where operationally safe.
- Assembly waits for required station dependencies.
- Station blockers escalate to kitchen lead.
- Station completion updates ticket progress and ETA.

### 13.3 Batching Opportunities

Batching can group similar station tasks, such as fries or multiple burgers, but must not compromise promised times or food quality.

---

## 14. Prep Time Modeling

### 14.1 Prep Time Inputs

- Base product prep time.
- Modifier complexity.
- Combo components.
- Station load.
- Active queue depth.
- Staff count.
- Fulfillment type.
- Scheduled time.
- Historical branch performance.

### 14.2 Prep Time Output

Prep time model should output:

- Estimated prep duration.
- Confidence level.
- Delay risk.
- Station bottleneck hint.

### 14.3 Model Governance

Prep time formulas should be explainable to operations. Predictive models can improve estimates but must not hide operational reasons from staff.

---

## 15. Dynamic ETA Calculation

### 15.1 ETA Components

- Order acceptance delay.
- Queue wait.
- Prep time.
- Assembly/packing time.
- Pickup buffer or delivery dispatch wait.
- Delivery travel time.
- Current congestion multiplier.

### 15.2 ETA Rules

- ETA is recalculated on major operational events.
- Customer-facing ETA should avoid noisy second-by-second changes.
- Staff-facing ETA can show more granular risk.
- ETA must degrade honestly when capacity worsens.

---

## 16. Predictive ETA Strategy

### 16.1 Predictive Inputs

- Historical branch prep times.
- Product mix.
- Hour/day seasonality.
- Campaign status.
- Weather/local event context in future.
- Driver availability.
- Current station throughput.

### 16.2 Prediction Guardrails

- Predictions are advisory and bounded by operational policy.
- Managers can override capacity/ETA multipliers.
- Prediction drift is monitored continuously.
- Customer promises use conservative estimates under uncertainty.

---

## 17. Peak-Hour ETA Adjustments

### 17.1 Peak Detection

Peak mode is triggered by:

- Queue depth exceeding threshold.
- Station saturation.
- Payment/order burst rate.
- Delivery driver shortage.
- Scheduled order concentration.
- Manager manual activation.

### 17.2 Adjustment Rules

- Increase prep estimates by congestion multiplier.
- Increase delivery dispatch buffer.
- Suppress aggressive short ETAs.
- Encourage pickup or later slots.
- Pause delivery if driver capacity is insufficient.

---

## 18. Kitchen Congestion Detection

### 18.1 Congestion Signals

- Active ticket count.
- Oldest active ticket age.
- Station task backlog.
- Station blocked time.
- Prep SLA breach rate.
- Staff action latency.
- Ready queue dwell time.

### 18.2 Congestion Actions

- Alert kitchen lead.
- Raise ETAs.
- Throttle new orders.
- Pause channel.
- Reassign staff.
- Mark branch degraded.

---

## 19. Kitchen Failure Recovery

### 19.1 Failure Scenarios

- Dashboard disconnect.
- Printer/display failure.
- Station unavailable.
- Staff shortage.
- Item stockout.
- Branch power/network issue.
- Incorrect status transition.

### 19.2 Recovery Rules

- Staff dashboards refetch canonical active queue on reconnect.
- Manual fallback sheets may be generated for active orders if needed.
- Branch channel can be paused immediately.
- Incorrect transitions require audited correction.
- Affected customers receive delay/cancellation/substitution communication.

---

## 20. Operational Pause/Throttle Systems

### 20.1 Pause Types

- Pause delivery.
- Pause pickup.
- Pause scheduled orders.
- Pause specific menu items.
- Pause branch entirely.
- Pause high-complexity products.

### 20.2 Throttle Types

- Limit active checkout slots.
- Extend ETA windows.
- Reduce delivery zones temporarily.
- Require scheduled slots.
- Limit large orders.

### 20.3 Control Rules

Pauses and throttles require actor, reason, scope, start time, optional expiry, and audit event.

---

## 21. Staff Workflow Architecture

### 21.1 Staff Workflow Surfaces

- Kitchen queue display.
- Station task view.
- Branch manager operations console.
- Delivery dispatch board.
- Pickup handoff view.
- Incident/escalation panel.

### 21.2 Workflow Requirements

- Touch-friendly actions.
- Minimal typing.
- Large status indicators.
- Clear next action.
- Undo/correction where safe.
- Visible connection state.
- Branch scope awareness.

---

## 22. Staff Role Architecture

### 22.1 Operational Roles

- Kitchen operator.
- Station lead.
- Kitchen lead.
- Pickup staff.
- Delivery dispatcher.
- Driver/delivery operator.
- Branch manager.
- Support operator.
- Organization operations admin.

### 22.2 Role Capabilities

Roles control queue visibility, status transitions, station assignment, pause/throttle controls, incident management, refunds/corrections coordination, and operational reporting.

---

## 23. Branch Staff Permissions

### 23.1 Permission Examples

- `kitchen:read:branch`.
- `kitchen:update_status:branch`.
- `kitchen:override_ready:branch`.
- `branch:pause_channel:branch`.
- `delivery:assign_driver:branch`.
- `delivery:reassign:branch`.
- `orders:cancel_operational:branch`.
- `incidents:create:branch`.

### 23.2 Permission Rules

- Kitchen staff cannot issue refunds by default.
- Drivers cannot see full branch queue.
- Dispatchers cannot mutate payment state.
- Branch managers can override operational states with audit.
- Support operators require purpose-bound access.

---

## 24. Shift & Operational State Management

### 24.1 Shift Data

- Staff member.
- Branch.
- Role for shift.
- Start/end time.
- Active station assignment.
- Break status.
- Device/session status.

### 24.2 Shift Rules

- Active staff count influences capacity.
- Shift role can be narrower than membership role.
- Staff off shift should lose operational write access unless manager override exists.
- Shift changes create operational audit events.

---

## 25. Branch Opening/Closing Workflows

### 25.1 Opening Checklist

- Staff present.
- Menu availability confirmed.
- Stations ready.
- Delivery status confirmed.
- Realtime dashboard online.
- Payment/order pipeline healthy.

### 25.2 Closing Workflow

- Stop new orders by channel.
- Complete or resolve active orders.
- Disable scheduled release if needed.
- Reconcile exceptions.
- Record closing operational snapshot.

### 25.3 Closing Grace Period

Branch may remain operationally open for active orders while closed to new checkout.

---

## 26. Branch Operational Overrides

### 26.1 Override Types

- ETA multiplier.
- Capacity multiplier.
- Item availability.
- Channel pause.
- Station disabled.
- Manual order priority.
- Force ready/complete correction.

### 26.2 Override Governance

Overrides require permission, reason, actor, expiry where applicable, and audit. Long-lived overrides should alert managers for review.

---

## 27. Delivery Architecture

### 27.1 Delivery Responsibilities

Delivery architecture coordinates branch-ready orders, driver capacity, route assignment, delivery status, customer tracking, proof-of-delivery, and failure recovery.

### 27.2 Delivery Entities

- Delivery task.
- Driver profile.
- Driver shift.
- Assignment.
- Route/stop.
- Delivery status event.
- Proof-of-delivery record.

### 27.3 Delivery Boundaries

Delivery tasks do not decide payment. Delivery completion influences order completion only after valid handoff/delivery evidence or staff confirmation.

---

## 28. Delivery Dispatch System

### 28.1 Dispatch Inputs

- Ready or soon-ready orders.
- Driver availability.
- Delivery zone.
- Customer address.
- ETA promise.
- Order value/risk.
- Batch compatibility.

### 28.2 Dispatch Outputs

- Assigned driver.
- Dispatch time.
- Route grouping.
- Customer tracking state.
- Delay risk.

### 28.3 Dispatch Rules

- Do not dispatch before food is ready unless driver pickup timing is coordinated.
- Avoid assigning drivers to orders that are not likely ready soon.
- Dispatch decisions are auditable.

---

## 29. Delivery Queue Management

### 29.1 Delivery Queue Types

- Awaiting dispatch.
- Assigned awaiting pickup.
- Out for delivery.
- Failed delivery.
- Reassignment needed.
- Completed.

### 29.2 Queue Prioritization

Prioritize by promised time, food readiness, route efficiency, customer delay risk, driver availability, and failure escalation.

### 29.3 Queue Safety

Delivery queues must be branch-scoped and bounded. Driver shortages trigger delivery throttle or pause before dispatch collapse.

---

## 30. Delivery Capacity Modeling

### 30.1 Capacity Inputs

- Active drivers.
- Average delivery duration.
- Zone distance.
- Batch efficiency.
- Driver shift status.
- Weather/traffic in future integrations.
- Active out-for-delivery count.

### 30.2 Capacity Rules

- Delivery capacity is separate from kitchen capacity.
- Delivery overload can pause delivery while pickup remains open.
- Delivery ETA includes dispatch wait plus travel time.
- Capacity estimates are updated from actual driver completion times.

---

## 31. Delivery Zone Orchestration

### 31.1 Zone Controls

- Enable/disable zones by branch.
- Adjust fee/ETA by zone.
- Temporarily reduce coverage under driver shortage.
- Set minimum order by zone.
- Support scheduled delivery windows by zone.

### 31.2 Zone Events

Zone changes emit operational events and trigger active checkout/cart revalidation for affected customers.

---

## 32. Delivery ETA Modeling

### 32.1 ETA Components

- Kitchen remaining prep.
- Packing time.
- Driver assignment delay.
- Pickup wait.
- Travel time.
- Customer handoff buffer.

### 32.2 ETA Degradation

ETA degrades when driver capacity falls, zones are congested, kitchen readiness slips, or reassignment occurs.

---

## 33. Delivery Driver Workflow

### 33.1 Driver States

- `off_shift`.
- `available`.
- `assigned`.
- `arriving_at_branch`.
- `picked_up`.
- `out_for_delivery`.
- `delivered`.
- `failed_delivery`.
- `returning`.

### 33.2 Driver Actions

- Accept assignment.
- Confirm pickup.
- Mark customer contacted.
- Mark delivered.
- Report failure.
- Request reassignment/support.

### 33.3 Driver Data Minimization

Drivers see only data necessary to complete delivery: address, customer contact, order handoff identifier, and delivery instructions.

---

## 34. Driver Assignment Strategy

### 34.1 Assignment Modes

- Manual dispatcher assignment.
- Auto-assignment by availability/zone.
- Batch assignment.
- Future route optimization.

### 34.2 Assignment Criteria

- Driver availability.
- Current location/status.
- Zone familiarity.
- Delivery SLA risk.
- Batch compatibility.
- Order priority.

### 34.3 Assignment Safety

Assignment changes are auditable. Drivers cannot self-assign high-risk or out-of-scope tasks unless policy allows.

---

## 35. Delivery Failure Recovery

### 35.1 Failure Types

- Customer unreachable.
- Wrong address.
- Driver unavailable.
- Vehicle issue.
- Unsafe delivery condition.
- Food damaged.
- Delivery timeout.

### 35.2 Recovery Flow

1. Driver reports failure with reason.
2. Dispatcher/branch receives alert.
3. Customer contact attempt is logged.
4. Reassignment, return, remake, refund, or cancellation decision is made.
5. Order state and customer communication update.
6. Incident is audited.

---

## 36. Delivery Reassignment Logic

### 36.1 Reassignment Triggers

- Driver rejects assignment.
- Driver does not acknowledge in time.
- Driver reports issue.
- ETA breach risk.
- Batch route changed.
- Manager override.

### 36.2 Reassignment Rules

- Preserve food quality constraints.
- Update customer ETA.
- Audit previous and new assignment.
- Escalate if no driver available.
- Avoid infinite reassignment loops through retry caps.

---

## 37. Pickup Workflow Architecture

### 37.1 Pickup Flow

1. Order paid and accepted.
2. Kitchen prepares.
3. Order marked ready.
4. Customer receives ready notification.
5. Pickup staff verifies handoff identifier.
6. Order marked picked up/completed.

### 37.2 Pickup Controls

- Ready queue is branch-scoped.
- Handoff uses order number or secure pickup code.
- Long dwell time triggers staff alert.
- Wrong pickup correction requires audit.

---

## 38. Pickup Queue Management

### 38.1 Pickup Queue Fields

- Order number.
- Ready time.
- Customer name or initials.
- Fulfillment channel.
- Shelf/bin location if used.
- Dwell time.
- Handoff status.

### 38.2 Queue Rules

Pickup queue prioritizes dwell time and customer arrival. Staff should be able to quickly mark handed off with minimal taps.

---

## 39. Customer Arrival Coordination

### 39.1 Arrival Signals

- Customer opens tracking page nearby.
- Customer taps “I’m here”.
- Scheduled pickup time arrives.
- Staff manually marks customer present.

### 39.2 Coordination Rules

Arrival signals are hints, not proof of pickup. Handoff still requires staff confirmation.

---

## 40. Scheduled Order Operational Flows

### 40.1 Scheduled Order Lifecycle

- Scheduled order confirmed.
- Capacity slot reserved.
- Pre-release validation runs.
- Kitchen ticket released at prep start time.
- Customer receives reminder/ETA.
- Normal fulfillment flow begins.

### 40.2 Scheduled Order Risks

- Branch closes unexpectedly.
- Item unavailable at scheduled time.
- Slot overbooked.
- Customer changes fulfillment details.
- Payment policy mismatch.

---

## 41. Future Order Operational Coordination

### 41.1 Coordination Requirements

Future orders require pre-service visibility for managers. Branch dashboards should show upcoming scheduled volume by slot, complexity, fulfillment type, and delivery zone.

### 41.2 Revalidation

Future orders are revalidated before kitchen release. Exceptions produce substitution, delay, cancellation, or support workflows.

---

## 42. Operational Event Taxonomy

### 42.1 Branch Events

- `branch.opened`.
- `branch.closed`.
- `branch.channel_paused`.
- `branch.channel_resumed`.
- `branch.capacity_changed`.
- `branch.incident_started`.
- `branch.incident_resolved`.

### 42.2 Kitchen Events

- `kitchen.ticket_created`.
- `kitchen.order_accepted`.
- `kitchen.prep_started`.
- `kitchen.station_task_started`.
- `kitchen.station_task_completed`.
- `kitchen.order_ready`.
- `kitchen.order_delayed`.
- `kitchen.exception_reported`.

### 42.3 Delivery and Pickup Events

- `delivery.task_created`.
- `delivery.driver_assigned`.
- `delivery.picked_up_from_branch`.
- `delivery.out_for_delivery`.
- `delivery.failed`.
- `delivery.completed`.
- `pickup.order_ready`.
- `pickup.customer_arrived`.
- `pickup.handed_off`.

---

## 43. Operational Queue Systems

### 43.1 Queue Categories

- Branch acceptance queue.
- Kitchen active queue.
- Station task queues.
- Delivery dispatch queue.
- Pickup ready queue.
- Scheduled release queue.
- Exception/escalation queue.
- Operational notification queue.

### 43.2 Queue Rules

- Critical operational queues are branch-partitioned.
- Queue entries include priority, sequence, SLA deadline, and branch scope.
- Queue workers are idempotent.
- Exception queues must generate visible staff alerts.

---

## 44. Operational Saga Workflows

### 44.1 Acceptance Saga

1. Payment-approved order enters branch acceptance queue.
2. Branch staff accepts or rejects.
3. Kitchen ticket is created.
4. ETA is calculated.
5. Customer is notified.
6. Station tasks are generated.

### 44.2 Delivery Dispatch Saga

1. Kitchen marks order ready or near-ready.
2. Delivery task becomes dispatchable.
3. Driver is assigned.
4. Driver confirms pickup.
5. Customer tracking updates.
6. Completion or failure recovery occurs.

### 44.3 Exception Saga

Operational exceptions route to manager/support decision with compensating actions: remake, substitution, delay, cancellation, refund coordination, or reassignment.

---

## 45. Realtime Kitchen Synchronization

### 45.1 Sync Rules

- Kitchen dashboard performs canonical fetch on load.
- Subscribes to branch-scoped ticket and queue projections.
- Tracks event sequence.
- Refetches on reconnect or sequence gap.
- Displays stale connection state clearly.

### 45.2 Optimistic Actions

Staff actions may show pending UI state, but canonical transition must confirm before removing tasks from active view.

---

## 46. Realtime Staff Synchronization

### 46.1 Staff Sync Scope

Staff synchronization includes:

- Active shift state.
- Station assignment.
- Branch channel status.
- Queue assignments.
- Incident alerts.
- Permission/session changes.

### 46.2 Session Changes

If staff permissions or branch membership changes, active subscriptions must reauthorize and unsafe actions must be blocked.

---

## 47. Realtime Branch Dashboards

### 47.1 Dashboard Data

- Active order count.
- Queue depth.
- Oldest ticket age.
- Station congestion.
- ETA multiplier.
- Delivery capacity.
- Channel status.
- Incidents.
- SLA breaches.

### 47.2 Dashboard Rules

Dashboards use realtime projections plus periodic canonical refresh. Aggregates must show freshness and stale warnings.

---

## 48. Realtime Delivery Tracking

### 48.1 Tracking Scope

Customers see only their own delivery task projection. Staff see branch/route-scoped delivery queues. Admins see scoped aggregate delivery status.

### 48.2 Tracking Rules

- Durable status events drive tracking.
- High-frequency location, if added, is rate-limited and privacy-scoped.
- Reassignment updates customer ETA and staff dashboards.

---

## 49. Operational Notifications

### 49.1 Notification Types

- New order alert.
- Delayed order alert.
- Station blocked alert.
- Branch capacity alert.
- Driver assignment alert.
- Failed delivery alert.
- Customer ready notification.
- Manager escalation.

### 49.2 Notification Rules

- Operational alerts must avoid fatigue.
- Critical alerts persist until acknowledged.
- Customer notifications are triggered from durable order/fulfillment events.
- Internal alerts are branch-scoped.

---

## 50. Branch Incident Management

### 50.1 Incident Types

- Kitchen outage.
- Delivery outage.
- Staff shortage.
- Item stockout.
- Equipment failure.
- Payment/order pipeline issue.
- Realtime degradation.
- Weather/local disruption.

### 50.2 Incident Flow

1. Incident detected manually or automatically.
2. Branch status changes if needed.
3. Active orders are assessed.
4. Customer impact workflow starts.
5. Recovery actions are assigned.
6. Incident resolved and postmortem recorded.

---

## 51. Operational Recovery Flows

### 51.1 Recovery Principles

- Preserve canonical order state.
- Communicate customer impact quickly.
- Prefer branch-local recovery.
- Escalate financial corrections through commerce/payment flows.
- Audit all manual fixes.

### 51.2 Recovery Actions

- Pause channel.
- Increase ETA.
- Reassign staff/driver.
- Substitute item.
- Remake order.
- Cancel order.
- Trigger refund coordination.

---

## 52. Order Escalation Workflows

### 52.1 Escalation Triggers

- Acceptance timeout.
- Prep SLA breach.
- Station blocked beyond threshold.
- Delivery assignment failure.
- Customer unreachable.
- Refund/cancellation needed.
- Repeated staff action failure.

### 52.2 Escalation Levels

- Staff attention.
- Kitchen lead.
- Branch manager.
- Support operator.
- Organization operations admin.

---

## 53. Delay Handling Strategy

### 53.1 Delay Detection

Detect delays through SLA deadlines, ETA drift, station backlog, driver unavailability, and manual staff flags.

### 53.2 Delay Actions

- Recalculate ETA.
- Notify customer if threshold exceeded.
- Escalate to manager.
- Offer support contact.
- Consider compensation policy.
- Update operational metrics.

---

## 54. Substitution & Unavailable Item Flows

### 54.1 Trigger Scenarios

- Item unavailable after payment.
- Modifier unavailable.
- Ingredient shortage.
- Equipment failure affecting item.

### 54.2 Flow Options

- Customer-approved substitution.
- Staff-approved equivalent substitution under policy.
- Partial cancellation/refund.
- Full cancellation.
- Delayed fulfillment.

### 54.3 Rules

Financial impact must coordinate with commerce/payment correction flows. Substitution must be auditable and customer-visible where appropriate.

---

## 55. Refund & Operational Correction Flows

### 55.1 Correction Types

- Cancellation before prep.
- Cancellation after prep.
- Partial item refund.
- Delivery failure refund.
- Customer compensation.
- Manual status correction.

### 55.2 Rules

Operations can request refund coordination but payment domain executes financial refund according to permission and audit rules. Operational corrections never mutate payment records directly.

---

## 56. Operational Auditability

### 56.1 Audited Actions

- Order acceptance/rejection.
- Status changes.
- Station overrides.
- Channel pause/resume.
- Capacity changes.
- Driver assignment/reassignment.
- Incident actions.
- Substitution decisions.
- Cancellation/refund requests.

### 56.2 Audit Fields

- Actor.
- Role.
- Branch.
- Order/ticket/task.
- Previous state.
- New state.
- Reason.
- Timestamp.
- Correlation ID.

---

## 57. Operational Metrics & KPIs

### 57.1 Core KPIs

- Order acceptance time.
- Prep time.
- Ready dwell time.
- Delivery dispatch time.
- Delivery completion time.
- On-time rate.
- Cancellation rate.
- Delay rate.
- Branch throughput.
- Staff action latency.

### 57.2 KPI Segmentation

Segment metrics by organization, branch, fulfillment type, daypart, product category, campaign, and staff shift.

---

## 58. Kitchen Performance Metrics

### 58.1 Metrics

- Queue depth.
- Oldest ticket age.
- Prep SLA compliance.
- Station backlog.
- Station blocked time.
- Average complexity units per hour.
- Ready accuracy vs ETA.
- Manager overrides.

### 58.2 Quality Signals

- Remake count.
- Cancellation after prep start.
- Substitution frequency.
- Customer complaints linked to kitchen delay.

---

## 59. Delivery Performance Metrics

### 59.1 Metrics

- Assignment latency.
- Pickup wait time.
- Out-for-delivery duration.
- Delivery SLA compliance.
- Failed delivery rate.
- Reassignment rate.
- Driver utilization.
- Zone performance.

### 59.2 Delivery Quality Signals

- Customer unreachable rate.
- Delivery complaint rate.
- Late delivery compensation rate.
- Proof-of-delivery exception rate.

---

## 60. Branch Efficiency Metrics

### 60.1 Metrics

- Orders per labor hour where staffing data exists.
- Capacity utilization.
- Channel pause duration.
- Peak throughput.
- Scheduled order accuracy.
- Branch incident frequency.
- SLA breach by daypart.

### 60.2 Management Use

Branch managers use metrics for staffing, training, menu complexity decisions, delivery zone tuning, and campaign readiness.

---

## 61. Operational Observability

### 61.1 Tracing

Operational traces should connect:

- Payment approval to branch acceptance.
- Acceptance to kitchen ticket creation.
- Station tasks to order readiness.
- Readiness to pickup/delivery handoff.
- Delivery dispatch to completion.
- Exception to recovery action.

### 61.2 Logs

Structured logs include branch, order, ticket, staff actor, station, queue, status, latency, correlation ID, and reason code where applicable.

---

## 62. Queue Monitoring

### 62.1 Queue Metrics

- Queue depth.
- Queue age.
- Processing latency.
- SLA deadline proximity.
- Worker health.
- Retry/DLQ count.
- Branch partition lag.

### 62.2 Queue Alerts

Alert when critical branch queues stall, oldest ticket exceeds threshold, exception queue grows, scheduled release queue fails, or dispatch queue saturates.

---

## 63. Branch Health Monitoring

### 63.1 Health Inputs

- Dashboard connectivity.
- Realtime subscription health.
- Active staff count.
- Queue depth.
- Channel status.
- Payment/order pipeline health.
- Incident state.
- Delivery capacity.

### 63.2 Health States

- Healthy.
- Degraded.
- Throttled.
- Incident.
- Offline.

---

## 64. SLA/SLO Definitions

### 64.1 Operational SLOs

- Branch acceptance p95 under configured branch threshold.
- Kitchen queue update p95 under 2 seconds when realtime healthy.
- Prep ETA accuracy within configured tolerance.
- Delivery assignment p95 under branch policy.
- Customer status update p95 under 2 seconds after state change when realtime healthy.

### 64.2 Breach Handling

SLO breaches trigger dashboard warnings, alerts, manager escalation, and post-shift review depending on severity.

---

## 65. Peak-Hour Protection Systems

### 65.1 Protection Controls

- Capacity thresholds.
- Dynamic ETA buffers.
- Channel throttles.
- Scheduled slot steering.
- High-complexity item pause.
- Delivery zone reduction.
- Manager rush mode.

### 65.2 Protection Rules

Peak protection must activate before queues become unbounded. Customer checkout should receive honest availability and ETA changes.

---

## 66. High-Volume Order Handling

### 66.1 High-Volume Patterns

- Batch read models for dashboards.
- Branch-partitioned queue workers.
- Station-level task projections.
- Rate-limited realtime payloads.
- Prioritized operational events.

### 66.2 High-Volume Safeguards

- Limit dashboard payload size.
- Use incremental updates plus periodic full refresh.
- Avoid broadcasting raw order details to unnecessary subscribers.
- Keep branch queues independently scalable.

---

## 67. Operational Backpressure Strategy

### 67.1 Backpressure Inputs

- Queue depth.
- Queue age.
- Staff count.
- Station saturation.
- Driver capacity.
- Incident state.
- Realtime/dashboard health.

### 67.2 Backpressure Actions

- Increase ETA.
- Reduce checkout slots.
- Pause delivery.
- Pause pickup.
- Disable scheduling for overloaded slots.
- Trigger manager approval for large orders.

---

## 68. Queue Prioritization Rules

### 68.1 Priority Dimensions

- SLA deadline.
- Fulfillment type.
- Food quality risk.
- Driver arrival time.
- Customer wait time.
- Order complexity.
- Manual escalation.

### 68.2 Priority Safety

Priority changes must not starve lower-priority orders. Escalation rules should detect starvation and old order age.

---

## 69. Operational Degraded Modes

### 69.1 Degraded Modes

- Realtime degraded: polling and manual refresh.
- Kitchen dashboard degraded: printable active queue or simplified fallback view.
- Delivery degraded: pickup-only or manual dispatch.
- Payment uncertain: hold before kitchen dispatch.
- Branch incident: channel pause and active order recovery.

### 69.2 Degraded Mode UX

Staff interfaces must show degraded state, last sync time, safe actions, and blocked actions.

---

## 70. Offline & Reconnect Operational Flows

### 70.1 Staff Reconnect

1. Refresh auth and permissions.
2. Fetch branch operational state.
3. Fetch active queues.
4. Reconcile pending local actions.
5. Re-subscribe to branch realtime.
6. Show unresolved conflicts.

### 70.2 Offline Actions

Critical offline actions are not silently applied after reconnect. They are resubmitted as commands and validated against current state.

---

## 71. Disaster Recovery Operations

### 71.1 DR Scenarios

- Supabase realtime outage.
- Database degraded.
- Vercel/API outage.
- Branch internet outage.
- Payment provider uncertainty.
- Notification provider outage.

### 71.2 DR Principles

- Preserve financial/order truth.
- Pause unsafe new orders if operations cannot fulfill.
- Maintain active order recovery list.
- Communicate customer impact.
- Restore branch queues from canonical state.

---

## 72. Franchise Operational Scalability

### 72.1 Franchise Needs

- Organization/branch operational templates.
- Standardized incident playbooks.
- Benchmark dashboards.
- Role templates.
- Branch-level autonomy.
- Franchise-level aggregate oversight.

### 72.2 Scalability Rules

Franchise operators see scoped aggregates and authorized branch details only. Operational standards should be configurable without code changes.

---

## 73. Multi-Brand Operational Compatibility

### 73.1 Brand Context

Future multi-brand operations require brand-aware:

- Menus.
- Prep models.
- Station workflows.
- Packaging/handoff rules.
- Delivery promises.
- Operational dashboards.

### 73.2 Compatibility Rules

Do not hard-code burger-only operational assumptions into station, ETA, dispatch, or branch workflows. Product complexity and station mapping should be data-driven.

---

## 74. Staff UX Principles

### 74.1 Principles

- One-screen operational clarity.
- Large touch targets.
- Minimal text entry.
- Color plus text/icon status coding.
- Persistent branch and connection status.
- Clear next-best action.
- Fast exception reporting.
- Confirmation for destructive actions.

### 74.2 Stress Design

Under peak stress, staff UX should reduce choices, highlight exceptions, and keep normal flow simple.

---

## 75. Kitchen UX Principles

### 75.1 Kitchen Display Requirements

- High contrast.
- Large readable order cards.
- Clear timers.
- Station grouping.
- Item/modifier clarity.
- Allergy/note visibility according to policy.
- Simple status actions.
- Audible/visual alert control.

### 75.2 Kitchen UX Safety

Avoid small controls, hidden actions, ambiguous colors, or status-only iconography. Every critical action should have clear label and state feedback.

---

## 76. Mobile Staff Workflows

### 76.1 Mobile Use Cases

- Branch manager override.
- Delivery driver workflow.
- Pickup handoff.
- Incident escalation.
- On-the-floor queue monitoring.

### 76.2 Mobile Rules

- Mobile actions are branch-scoped.
- Critical actions require confirmation.
- Offline/reconnect state must be obvious.
- Driver UI minimizes distractions and PII exposure.

---

## 77. Operational Accessibility

### 77.1 Accessibility Requirements

- Keyboard-accessible admin/manager surfaces.
- Sufficient contrast for kitchen displays.
- Non-color-only status indicators.
- Large touch targets.
- Reduced motion support.
- Screen reader labels for management dashboards.

### 77.2 Operational Environment

Kitchen environments are noisy, fast, and visually demanding. Accessibility must account for distance viewing, gloves, grease, and stress.

---

## 78. Operational QA Strategy

### 78.1 Test Categories

- Kitchen queue ordering.
- Station task transitions.
- Branch pause/throttle.
- Staff permission boundaries.
- Realtime reconnect.
- Delivery assignment/reassignment.
- Scheduled order release.
- ETA recalculation.
- Incident workflows.
- Substitution/cancellation/refund coordination.

### 78.2 Critical Tests

- Paid order appears in correct branch only.
- Branch A overload does not affect Branch B.
- Staff removed from shift cannot mutate queue.
- Dashboard reconnect repairs missed events.
- Delivery reassignment updates ETA and audit.
- Item stockout after payment triggers substitution/refund flow.
- Scheduled order releases at correct prep time.

---

## 79. Operational Load Testing

### 79.1 Load Scenarios

- Football match spike.
- Viral campaign order burst.
- Scheduled orders concentrated in one slot.
- Delivery driver shortage.
- Realtime reconnect storm.
- Branch dashboard open on many devices.
- Payment approval burst feeding kitchen queue.

### 79.2 Success Criteria

- Branch queues remain bounded or throttle activates.
- Realtime degradation falls back to polling.
- Kitchen dashboard remains usable.
- Branch isolation holds under overload.
- ETA degradation is visible to customers and staff.
- Critical queues remain within operational SLOs.

---

## 80. Production Operations Checklist

### 80.1 Branch Operations

- [ ] Branch open/close workflows implemented.
- [ ] Channel pause/resume controls audited.
- [ ] Capacity thresholds configured per branch.
- [ ] Branch incident mode implemented.
- [ ] Branch isolation tested.

### 80.2 Kitchen

- [ ] Kitchen queue and station task model implemented.
- [ ] Kitchen state machine validated.
- [ ] Prep time model configured.
- [ ] Congestion alerts configured.
- [ ] Exception queue visible and actionable.

### 80.3 Delivery and Pickup

- [ ] Delivery dispatch queue implemented.
- [ ] Driver assignment/reassignment audited.
- [ ] Delivery failure recovery tested.
- [ ] Pickup ready queue implemented.
- [ ] Customer handoff verification defined.

### 80.4 Realtime and Resilience

- [ ] Branch-scoped realtime channels secured.
- [ ] Staff reconnect canonical refetch implemented.
- [ ] Fallback polling implemented.
- [ ] Dashboard stale state warnings implemented.
- [ ] Operational degraded modes documented.

### 80.5 Observability

- [ ] Branch health dashboard configured.
- [ ] Kitchen queue metrics configured.
- [ ] Delivery SLA metrics configured.
- [ ] Queue saturation alerts configured.
- [ ] ETA accuracy monitoring configured.

### 80.6 QA and Launch Gates

- [ ] Peak-hour load tests passed.
- [ ] Branch outage tests passed.
- [ ] Scheduled order surge tests passed.
- [ ] Staff permission tests passed.
- [ ] Substitution/cancellation/refund coordination tests passed.

This checklist is a launch gate. Production operations should be blocked if branch isolation, kitchen queue stability, delivery failure recovery, realtime reconnect handling, operational pause controls, or queue saturation alerts are incomplete.
