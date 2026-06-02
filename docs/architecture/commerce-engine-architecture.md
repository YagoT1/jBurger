# J Burguer — Hardened Commerce Engine Architecture

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Historical English business terms in this document are deprecated in favor of the canonical Spanish glossary.

## 0. Commerce Engine Scope

This document defines the production-grade commerce engine architecture for J Burguer. It hardens cart, checkout, pricing, promotions, loyalty redemption, branch fulfillment, delivery pricing, payment orchestration, realtime synchronization, operational capacity, fraud controls, observability, and QA for a food-commerce operating system.

The commerce engine is not a generic ecommerce cart. It is a realtime restaurant commerce core where every customer-facing action must be reconciled with branch availability, kitchen capacity, delivery coverage, payment status, promotion eligibility, and financial auditability.

The commerce engine must survive:

- Multi-tab mobile ordering.
- Guest and authenticated cart migration.
- Stale menu and stale pricing.
- Branch closure mid-checkout.
- Promo expiration and budget exhaustion.
- Loyalty balance races.
- Payment provider delays.
- Duplicate checkout submissions.
- Kitchen capacity overload.
- Realtime disconnects and reconnect storms.
- Campaign spikes and branch-specific rush periods.

---

## 1. Commerce Architecture Philosophy

### 1.1 Commerce Objective

The commerce engine must maximize completed profitable orders while protecting financial correctness and restaurant operations. Conversion and correctness are not opposing goals: the system must make ordering fast while every final price, discount, delivery fee, tax, reward, and payment transition remains server-authoritative and auditable.

### 1.2 Principles

1. **Server-authoritative commerce**: prices, totals, discounts, delivery fees, taxes, loyalty balances, payment state, and availability are computed server-side.
2. **Mobile speed with safe checkpoints**: UI can be optimistic for browsing/cart interactions, but checkout finalization requires canonical server validation.
3. **Branch-aware by default**: menu, pricing overrides, delivery zones, operating hours, kitchen capacity, and fulfillment options are branch-scoped.
4. **Financial determinism**: identical cart inputs and pricing context produce identical totals.
5. **Operational truth**: the checkout path must respect branch hours, item availability, inventory, capacity, prep windows, and delivery constraints.
6. **Idempotent workflows**: retries must not duplicate orders, charges, rewards, notifications, or kitchen tickets.
7. **Event-driven side effects**: notifications, analytics, loyalty awards, and kitchen/delivery dispatch are triggered from durable events.
8. **Graceful degradation**: payment, realtime, analytics, and notification delays should not corrupt financial or operational state.
9. **Promotion safety**: discounts must be deterministic, budget-aware, fraud-aware, and reversible when required.
10. **Audit everything financial**: finalized orders, payment events, loyalty ledger entries, refunds, discounts, and manual adjustments are traceable.

---

## 2. Commerce Domain Boundaries

### 2.1 Domain Modules

| Domain | Responsibility | Canonical Data |
| --- | --- | --- |
| Menu | Products, modifiers, combos, category metadata | Menu tables and branch availability |
| Cart | Draft customer intent before payment | Cart and cart item records or signed guest state |
| Pricing | Deterministic calculation of line totals, discounts, taxes, fees | Pricing snapshots and price rules |
| Promotions | Coupons, automatic discounts, campaign budgets | Promotion rules and redemption ledgers |
| Loyalty | Points, reward reservations, redemption ledger | Loyalty accounts and append-only transactions |
| Checkout | Validates cart, fulfillment, customer, address, payment intent | Checkout session and order draft/final records |
| Orders | Finalized commercial commitments and operational workflow | Orders, order items, status events |
| Payments | Payment attempts, provider orchestration, reconciliation | Payments and provider event records |
| Delivery | Delivery coverage, fees, tasks, ETA, dispatch | Delivery zones, tasks, status events |
| Operations | Branch hours, capacity, kitchen readiness | Branch and kitchen operational state |
| Fraud | Risk assessment and abuse control | Risk events, decisions, review holds |

### 2.2 Boundary Rules

- Cart stores customer intent, not final financial truth.
- Checkout converts validated intent into immutable order snapshots.
- Pricing owns monetary calculation and must be deterministic.
- Promotions provide discount candidates; pricing applies them according to stacking and priority rules.
- Loyalty redemption creates reservations before payment and final ledger entries after payment outcome.
- Payments do not decide order contents; they settle the finalized order amount.
- Kitchen receives orders only after commerce and payment conditions are satisfied.

---

## 3. Cart Architecture

### 3.1 Cart Responsibilities

The cart captures mutable pre-checkout intent:

- Fulfillment preference.
- Branch context.
- Product selections.
- Variants.
- Modifier selections.
- Combo configuration.
- Quantity.
- Item notes.
- Promo code candidates.
- Loyalty reward candidates.
- Address preview context.

### 3.2 Cart Non-Responsibilities

The cart must not be the source of truth for:

- Final prices.
- Final discounts.
- Final delivery fees.
- Final taxes.
- Payment approval.
- Kitchen acceptance.
- Loyalty balance.
- Inventory reservation unless explicitly modeled as a reservation.

### 3.3 Cart Data Model Concepts

- `cart_id`.
- `cart_version` for optimistic concurrency.
- `cart_owner_type`: guest session or customer.
- `organization_id`.
- `branch_id` nullable until selected.
- `fulfillment_type`.
- `cart_items`.
- `cart_adjustments_preview`.
- `validation_state`.
- `expires_at`.
- `last_priced_at`.

---

## 4. Persistent Cart Strategy

### 4.1 Persistence Goals

Persistent carts reduce checkout friction and recover revenue without allowing stale commercial data to become final truth.

### 4.2 Persistence Rules

- Store authenticated carts server-side in Supabase.
- Store guest carts in local client state plus optional server-side guest cart record when checkout begins or recovery consent exists.
- Persist item configuration and branch context, but revalidate before checkout.
- Use `cart_version` to avoid lost updates across tabs/devices.
- Expire stale carts based on menu, pricing, and operational constraints.

### 4.3 Persistence Boundaries

Persistent cart data is customer intent. Every persisted cart must be rehydrated with current menu, branch, promo, loyalty, inventory, and operations state before payment.

---

## 5. Guest Cart Strategy

### 5.1 Guest Cart Goals

Guest carts must maximize conversion by allowing browsing, customization, and checkout start without account creation.

### 5.2 Guest Cart Rules

- Guest cart can exist before authentication.
- Guest cart uses secure anonymous session identifier.
- Guest cart cannot access customer loyalty until identity is verified.
- Guest cart can apply public promo candidates, but redemption is finalized server-side.
- Guest checkout requires minimum contact details before payment.
- Guest order tracking uses scoped, unguessable tracking token.

### 5.3 Guest Recovery

Guest abandoned cart recovery requires explicit contact capture and consent. Without consent, guest carts may be locally recoverable only on the same device.

---

## 6. Customer Cart Strategy

### 6.1 Customer Cart Goals

Authenticated carts enable saved addresses, reorder, loyalty, cross-device continuation, personalization, and lifecycle recovery.

### 6.2 Customer Cart Rules

- One active cart per organization/customer/fulfillment context by default, unless multi-cart is intentionally supported.
- Saved addresses can provide delivery fee previews.
- Loyalty balances and reward eligibility are fetched server-side.
- Customer cart recovery can trigger lifecycle notifications only with consent.
- Customer cart mutations must be scoped by customer ownership and organization.

### 6.3 Customer Cart Privacy

Cart contents are customer data. Staff/admin users should not inspect customer carts except through explicit support tooling with purpose-bound access.

---

## 7. Cross-Device Cart Synchronization

### 7.1 Synchronization Model

Authenticated carts synchronize through canonical server cart state. Clients subscribe to safe cart projections or poll after mutations.

### 7.2 Conflict Handling

- Each mutation includes expected `cart_version`.
- Server rejects stale mutations or returns merge requirements.
- Last-write-wins is acceptable for simple quantity changes only when no financial commitments exist.
- Modifier changes require explicit item-level update to prevent accidental overwrites.

### 7.3 Multi-Tab Behavior

- Same-device tabs coordinate through local broadcast plus server version checks.
- Checkout lock prevents two tabs from initiating payment for the same cart simultaneously.
- If a cart becomes an order, all tabs must transition to order status or stale cart state.

---

## 8. Cart Merge Rules

### 8.1 Merge Triggers

Cart merge occurs when:

- Guest logs in.
- Customer opens cart on new device.
- Reorder items are added to existing cart.
- Saved cart recovery happens after active cart already exists.

### 8.2 Merge Strategy

- Preserve authenticated cart as primary when it contains recent intent.
- Add guest items as separate configured line items unless exact normalized configuration matches.
- Revalidate branch compatibility before merging.
- If fulfillment types conflict, ask user to choose.
- If branches conflict, ask user to select branch and revalidate availability.
- Do not auto-merge loyalty reservations or promo redemptions.

### 8.3 Merge Audit

Merge events should record source cart, target cart, actor, merge decisions, and items affected for support and debugging.

---

## 9. Cart Recovery Strategy

### 9.1 Recovery Types

- Same-device local recovery.
- Authenticated server-side recovery.
- Marketing recovery via WhatsApp/email with consent.
- Checkout failure recovery after payment interruption.

### 9.2 Recovery Rules

Recovered carts are always marked `requires_validation`. UI must communicate changed prices, unavailable items, expired promos, or changed delivery fee before checkout resumes.

### 9.3 Recovery Messaging

Recovery messaging should deep-link to cart with secure token or authenticated route. Tokens must be scoped, short-lived, and should not expose cart contents in URLs.

---

## 10. Cart Expiration Rules

### 10.1 Expiration Drivers

Carts expire or require revalidation when:

- Branch closes.
- Menu version changes.
- Product or modifier availability changes.
- Promo expires.
- Loyalty reward reservation expires.
- Delivery zone changes.
- Cart remains inactive beyond configured threshold.
- Checkout session expires.

### 10.2 Expiration Policy

- Browsing cart can persist longer than checkout session.
- Checkout validation snapshot should have a short TTL.
- Payment preference should expire according to provider and internal policy.
- Reward reservations should expire quickly if payment is not completed.

### 10.3 Customer Experience

Expiration should be handled with clear recovery options: remove unavailable items, replace modifiers, select another branch, switch to pickup, or retry validation.

---

## 11. Realtime Cart Synchronization

### 11.1 Realtime Use Cases

Realtime cart synchronization supports:

- Cross-device authenticated cart updates.
- Multi-tab cart version updates.
- Branch availability warnings.
- Promo budget/expiration invalidation.
- Inventory or menu changes affecting cart.

### 11.2 Realtime Rules

- Realtime cart events are hints; canonical cart fetch resolves truth.
- Clients track `cart_version` and `last_validated_at`.
- If a realtime event indicates invalidation, client prompts revalidation.
- If realtime disconnects, cart remains editable but checkout requires fresh validation.

### 11.3 Sensitive Data

Cart realtime projections must not expose full PII, payment data, or staff-only notes.

---

## 12. Cart Validation Strategy

### 12.1 Validation Layers

Cart validation checks:

1. Tenant and branch scope.
2. Product existence.
3. Product status and branch availability.
4. Variant validity.
5. Modifier group requirements.
6. Modifier availability.
7. Combo configuration completeness.
8. Quantity limits.
9. Inventory or stock signals.
10. Pricing version.
11. Promotion eligibility.
12. Loyalty reward eligibility.
13. Fulfillment availability.
14. Delivery zone/fee preview.
15. Operational capacity.

### 12.2 Validation Outcomes

- `valid`.
- `valid_with_warnings`.
- `requires_customer_action`.
- `branch_unavailable`.
- `pricing_changed`.
- `promo_invalid`.
- `loyalty_invalid`.
- `cannot_checkout`.

### 12.3 Validation Snapshot

Checkout uses a validation snapshot containing canonical items, prices, discounts, fees, taxes, branch, fulfillment, and expiry timestamp.

---

## 13. Menu Availability Validation

### 13.1 Menu Availability Inputs

- Product active status.
- Category active status.
- Branch availability override.
- Time/day availability.
- Fulfillment channel availability.
- Modifier availability.
- Inventory status.
- Campaign-limited menu drops.

### 13.2 Validation Rules

- Items must be available for selected branch and fulfillment type.
- Required modifiers must have valid choices.
- Removed modifiers must not violate required group constraints.
- Unavailable modifiers should produce replacement prompts.
- Menu data displayed to users may be cached, but checkout validation must use current server state.

---

## 14. Branch-Aware Availability

### 14.1 Branch Context

Every commerce validation must resolve a branch before final checkout. Branch context determines:

- Available menu.
- Branch pricing overrides.
- Delivery zones.
- Prep time.
- Channel status.
- Capacity.
- Tax/fee rules.
- Payment configuration metadata.

### 14.2 Branch Switching

If a user switches branches:

- Cart must be revalidated.
- Unavailable items are marked.
- Branch-specific prices are recalculated.
- Delivery fee and ETA are recalculated.
- Promo and reward eligibility is recalculated.

---

## 15. Inventory-Aware Cart Rules

### 15.1 Inventory Modes

The platform can support multiple inventory maturity levels:

- Manual item availability toggles.
- Ingredient-level stock signals.
- Quantity-limited products.
- Future POS/inventory integration.

### 15.2 Inventory Rules

- Inventory signals are advisory during browsing.
- Checkout validation must confirm availability.
- If hard inventory reservation is enabled, reservation must be time-limited and idempotent.
- Reservations are released on payment failure, checkout expiration, or cancellation.
- Kitchen unavailable events can invalidate active carts.

### 15.3 Stockout UX

Stockouts should offer substitution, branch switch, pickup/delivery switch, or cart removal without restarting checkout.

---

## 16. Modifier & Customization Architecture

### 16.1 Modifier Model

Modifier groups define:

- Required vs optional.
- Minimum selections.
- Maximum selections.
- Free quantity limits.
- Per-choice price deltas.
- Branch availability.
- Fulfillment restrictions.
- Ingredient/inventory mapping.

### 16.2 Customization Rules

- Server validates all modifier constraints.
- UI prevents invalid selections but is not trusted.
- Modifier price deltas are snapshotted into order items.
- Item notes are stored separately from structured modifiers.
- Allergen-sensitive modifier removals must be communicated clearly but not treated as medical guarantees without policy.

### 16.3 Modifier Versioning

Cart items reference modifier IDs and menu version. Checkout stores immutable display names, selections, and price deltas to protect historical order accuracy.

---

## 17. Combo System Architecture

### 17.1 Combo Types

- Fixed combo: predefined burger, side, drink.
- Configurable combo: customer chooses from allowed groups.
- Upgrade combo: base item upgraded with side/drink.
- Campaign combo: time-limited promotional bundle.
- Family/group bundle.

### 17.2 Combo Validation

Combo validation checks:

- Required component groups.
- Allowed product choices.
- Branch availability for all components.
- Modifier compatibility.
- Pricing model.
- Promo conflict rules.
- Inventory for components.

### 17.3 Combo Pricing

Combo pricing may use:

- Fixed bundle price.
- Component sum minus bundle discount.
- Upgrade delta.
- Campaign-specific discount.

Final combo discount must be explicit in pricing breakdown and order snapshot.

---

## 18. Dynamic Pricing Architecture

### 18.1 Pricing Inputs

Pricing may consider:

- Organization menu price.
- Branch override.
- Fulfillment type.
- Variant deltas.
- Modifier deltas.
- Combo rules.
- Time-based campaign.
- Delivery fee rules.
- Tax rules.
- Promotions.
- Loyalty redemption.

### 18.2 Pricing Determinism

Pricing engine must accept a defined pricing context and produce deterministic output. Every calculation should be reproducible from order snapshot and applied rule versions.

### 18.3 Pricing Versioning

Price rules and menu versions must be versioned. Orders store applied rule identifiers, rule versions, and monetary breakdowns.

---

## 19. Delivery Fee Calculation Strategy

### 19.1 Delivery Fee Inputs

- Branch.
- Customer address coordinates or validated zone.
- Distance.
- Delivery zone.
- Order subtotal.
- Fulfillment time.
- Peak-hour surcharge if enabled.
- Promotion or free-delivery eligibility.
- Delivery capacity constraints.

### 19.2 Fee Models

- Flat branch fee.
- Zone-based fee.
- Distance-tier fee.
- Free delivery threshold.
- Campaign-subsidized delivery.
- Peak-hour surcharge.

### 19.3 Delivery Fee Integrity

Delivery fee is previewed in cart but finalized at checkout validation. If address or branch changes, delivery fee must be recalculated.

---

## 20. Geographic Delivery Logic

### 20.1 Geographic Inputs

- Customer address.
- Geocoded coordinates.
- Branch coordinates.
- Delivery polygon/zone.
- Distance calculation.
- Driver/service availability.

### 20.2 Delivery Coverage Rules

- Address must resolve to a valid service zone.
- If multiple branches can serve address, branch selection uses availability, ETA, capacity, and business rules.
- If no branch can deliver, offer pickup or notify unavailable.
- Delivery notes do not override service zone constraints.

### 20.3 Geocoding Reliability

Geocoding uncertainty should trigger customer confirmation or manual address refinement before payment.

---

## 21. Branch Fulfillment Selection

### 21.1 Selection Inputs

- Address or pickup preference.
- Branch hours.
- Branch menu availability.
- Delivery zone.
- Current capacity.
- Prep time.
- Delivery ETA.
- Campaign/branch eligibility.

### 21.2 Selection Strategy

- For delivery, recommend the best eligible branch using ETA and capacity.
- For pickup, allow user branch selection with clear distance/status.
- If selected branch becomes unavailable, prompt branch switch and revalidation.
- Branch selection must be locked before checkout payment initiation.

---

## 22. Pickup vs Delivery Architecture

### 22.1 Fulfillment Differences

| Capability | Pickup | Delivery |
| --- | --- | --- |
| Address required | No | Yes |
| Delivery fee | No | Yes |
| Branch selection | User-driven | Zone/ETA-driven |
| ETA | Ready time | Ready time + dispatch duration |
| Completion | Customer pickup | Delivery confirmation |
| Capacity constraints | Kitchen/pickup capacity | Kitchen + delivery capacity |

### 22.2 Switching Fulfillment

Switching fulfillment invalidates:

- Delivery fee.
- ETA.
- Branch eligibility.
- Promo eligibility where scoped.
- Minimum order thresholds.
- Scheduled time slots.

---

## 23. Checkout Architecture

### 23.1 Checkout Responsibilities

Checkout converts a validated cart into an order/payment flow. It coordinates:

- Customer identity/contact.
- Fulfillment type.
- Branch.
- Address.
- Cart validation.
- Pricing finalization.
- Promo and loyalty reservation.
- Operational capacity validation.
- Order creation.
- Payment preference creation.
- Payment status recovery.

### 23.2 Checkout Session

Checkout session stores:

- Session ID.
- Cart ID and cart version.
- Branch and fulfillment.
- Customer or guest identity.
- Validation snapshot ID.
- Pricing snapshot ID.
- Reservation IDs.
- Payment attempt state.
- Expiration timestamp.

---

## 24. Checkout State Machine

### 24.1 States

- `draft`.
- `validating_cart`.
- `requires_customer_action`.
- `ready_for_payment`.
- `payment_initiating`.
- `payment_pending`.
- `payment_approved`.
- `payment_failed`.
- `expired`.
- `converted_to_order`.
- `cancelled`.

### 24.2 State Rules

- `ready_for_payment` requires valid pricing, fulfillment, branch, and reservations.
- `payment_initiating` must be idempotent.
- `payment_approved` comes only from validated provider/internal payment state.
- Expired sessions cannot initiate payment without revalidation.
- Failed payments can retry only through safe payment attempt coordination.

---

## 25. Checkout Validation Pipeline

### 25.1 Pipeline Steps

1. Authenticate or validate guest session.
2. Lock or version-check cart.
3. Resolve branch and fulfillment.
4. Validate menu and modifiers.
5. Validate inventory and operational availability.
6. Validate delivery address/zone or pickup branch.
7. Calculate pricing.
8. Apply promotions.
9. Reserve loyalty rewards if selected.
10. Validate capacity/time slot.
11. Produce immutable validation and pricing snapshot.
12. Mark checkout ready for payment.

### 25.2 Failure Handling

Failures return actionable customer states: replace item, remove item, select branch, change address, pick another time, remove promo, release reward, or retry later.

---

## 26. Address Validation Strategy

### 26.1 Address Requirements

Delivery checkout requires:

- Street/address line.
- City/region where applicable.
- Coordinates or validated zone.
- Customer phone.
- Delivery instructions optional.

### 26.2 Validation Rules

- Normalize and geocode address.
- Confirm ambiguous addresses.
- Validate against delivery zones.
- Store address snapshot on order.
- Saved addresses require customer ownership.
- Address changes invalidate delivery fee and branch selection.

---

## 27. Delivery Zone Validation

### 27.1 Zone Types

- Radius-based zone.
- Polygon-based zone.
- Postal/area-based zone.
- Manual allow/deny zones.

### 27.2 Validation Rules

- Zone evaluation is server-side.
- Branch-specific zones override organization defaults.
- Delivery zone must be valid for scheduled time.
- Temporary weather/traffic/channel pauses can disable zone.
- Delivery zone changes trigger active checkout revalidation.

---

## 28. Operational Capacity Validation

### 28.1 Capacity Inputs

- Active order queue.
- Kitchen capacity multiplier.
- Branch channel status.
- Staff availability.
- Scheduled orders.
- Delivery capacity.
- Peak-hour policies.

### 28.2 Capacity Rules

- Checkout blocks or delays when branch capacity is exceeded.
- UI should offer scheduled time or pickup alternatives when possible.
- Capacity validation is repeated immediately before payment initiation.
- Capacity reservations may be time-limited for scheduled orders or high-load periods.

---

## 29. Kitchen Capacity Validation

### 29.1 Kitchen Signals

- Orders accepted but not completed.
- Prep station load.
- Product complexity weighting.
- Branch capacity multiplier.
- Staff override.
- Item-specific bottlenecks.

### 29.2 Kitchen Protection

- High-complexity carts can have longer ETA.
- Branch can pause delivery while keeping pickup open or vice versa.
- Kitchen overload triggers checkout throttling before operational collapse.
- Staff override requires audit.

---

## 30. Order Scheduling Architecture

### 30.1 Scheduling Use Cases

- Schedule pickup for later.
- Schedule delivery for later.
- Capacity smoothing during peak times.
- Campaign preorders.
- Future catering/group orders.

### 30.2 Scheduling Inputs

- Branch hours.
- Lead time.
- Prep time.
- Delivery duration.
- Kitchen capacity by slot.
- Delivery capacity by slot.
- Menu availability by time.
- Promo eligibility window.

---

## 31. Future Order Scheduling

### 31.1 Future Order Rules

- Future orders must validate menu availability for scheduled time.
- Payment timing policy must be explicit: pay now vs pay near fulfillment.
- Branch closure/holiday changes require customer notification and recovery flow.
- Promo eligibility uses configured rule: order time, fulfillment time, or payment time.

### 31.2 Future Order Revalidation

Future orders should revalidate before dispatch to kitchen. If invalid, customer/support recovery process begins before prep time.

---

## 32. Time Slot Reservation Logic

### 32.1 Slot Model

Slots represent branch capacity windows with:

- Start/end time.
- Fulfillment type.
- Capacity units.
- Reserved units.
- Confirmed units.
- Expiration rules.

### 32.2 Reservation Rules

- Slot reservation is idempotent.
- Reservation expires if payment/session expires.
- Payment approval converts reservation to confirmed capacity.
- Cancellation releases future slot capacity.
- Slot overbooking requires privileged override and audit.

---

## 33. Order Lifecycle Commerce Rules

### 33.1 Commerce Lifecycle

1. Cart validated.
2. Checkout session ready.
3. Order created with immutable snapshot.
4. Payment attempt initiated.
5. Payment approved.
6. Loyalty redemption finalized if applicable.
7. Kitchen dispatch eligibility confirmed.
8. Branch accepts order.
9. Order fulfilled.
10. Loyalty earning processed.

### 33.2 Lifecycle Invariants

- Order item snapshots never change after payment initiation except through explicit correction/refund flows.
- Kitchen dispatch requires payment approval or approved non-card payment policy.
- Refunds and cancellations produce compensating financial and loyalty events.

---

## 34. Financial State Machine

### 34.1 Financial States

- `unpriced`.
- `priced_preview`.
- `price_locked`.
- `payment_pending`.
- `paid`.
- `payment_failed`.
- `partially_refunded`.
- `refunded`.
- `chargeback_opened`.
- `financial_review`.

### 34.2 Financial Rules

- `price_locked` snapshot has TTL.
- `paid` requires validated provider/internal payment event.
- Refund states are derived from payment/refund events.
- Financial review blocks automatic fulfillment if anomaly is detected before kitchen dispatch.

---

## 35. Pricing Integrity Rules

### 35.1 Integrity Requirements

- Use server-side pricing only.
- Use integer minor units for money.
- Store currency on every monetary record.
- Store line-level breakdowns.
- Store discount allocation.
- Store tax and fee breakdowns.
- Store applied rule IDs and versions.

### 35.2 Anti-Tampering

The server ignores client-provided prices, totals, discount amounts, delivery fees, taxes, loyalty balances, and payment status. Client values are treated as display hints only.

---

## 36. Tax Calculation Strategy

### 36.1 Tax Inputs

- Branch jurisdiction.
- Fulfillment type.
- Product tax category.
- Delivery fee taxability.
- Discount treatment.
- Legal configuration.

### 36.2 Tax Rules

- Tax calculation is server-side.
- Tax rates and rules are versioned.
- Orders snapshot tax basis and tax amount.
- Manual tax overrides require privileged approval.
- Tax changes invalidate checkout pricing snapshots.

---

## 37. Currency & Money Precision Rules

### 37.1 Money Representation

- Store monetary values in integer minor units.
- Store currency code with every amount.
- Avoid floating point for calculations.
- Round only at defined boundaries.
- Keep line-level and order-level rounding auditable.

### 37.2 Currency Rules

- One order uses one currency.
- Branch/payment configuration determines supported currency.
- Mercado Pago amount must match internal locked total.
- Currency mismatch is a payment anomaly.

---

## 38. Discount Engine Architecture

### 38.1 Discount Responsibilities

The discount engine evaluates possible adjustments from promotions, coupons, loyalty rewards, bundles, delivery offers, and automatic campaigns.

### 38.2 Discount Output

Discount output includes:

- Discount ID.
- Source type.
- Eligibility result.
- Amount.
- Allocation by line/fee.
- Rule version.
- Stacking group.
- Budget impact.
- Rejection reason if ineligible.

### 38.3 Deterministic Application

Discount application order must be deterministic and documented. Discounts must never produce negative line totals or negative order totals.

---

## 39. Promotion Engine Architecture

### 39.1 Promotion Types

- Percentage discount.
- Fixed amount discount.
- Free item.
- Combo promotion.
- Free delivery.
- First-order promotion.
- Referral promotion.
- Branch-specific campaign.
- Time-window promotion.
- Minimum spend promotion.

### 39.2 Promotion Controls

Promotions define:

- Organization/branch scope.
- Customer eligibility.
- Fulfillment eligibility.
- Product/category eligibility.
- Time window.
- Usage limits.
- Budget caps.
- Stacking group.
- Priority.
- Fraud/risk exclusions.

### 39.3 Promotion State

Promotion eligibility is checked during cart preview and finalized during checkout validation. Redemptions are recorded transactionally with order/payment outcome policy.

---

## 40. Coupon System Architecture

### 40.1 Coupon Types

- Public coupon.
- Single-use coupon.
- Customer-specific coupon.
- Referral coupon.
- Recovery coupon.
- Branch-local coupon.
- Staff-issued recovery coupon.

### 40.2 Coupon Validation

Coupon validation checks:

- Code existence.
- Status.
- Time window.
- Branch/organization scope.
- Customer eligibility.
- Redemption limits.
- Minimum spend.
- Product eligibility.
- Stacking conflicts.
- Fraud risk.
- Budget availability.

### 40.3 Coupon Safety

Coupon validation is rate-limited. Invalid coupon responses should not expose detailed brute-force signals.

---

## 41. Loyalty Redemption Architecture

### 41.1 Redemption Flow

1. Customer selects reward.
2. Loyalty service validates customer identity and balance.
3. Reward eligibility is evaluated against cart and branch.
4. Reward reservation is created with expiration.
5. Checkout pricing applies reward reservation.
6. Payment approval finalizes redemption.
7. Payment failure or session expiration releases reservation.

### 41.2 Redemption Rules

- Guest users cannot redeem loyalty until authenticated.
- Redemption uses append-only ledger transactions.
- Reward reservation prevents double-spend.
- Refunds trigger reversal according to policy.

---

## 42. Reward Reservation Logic

### 42.1 Reservation Requirements

Reward reservations include:

- Loyalty account ID.
- Reward ID.
- Cart/checkout/order reference.
- Reserved amount or points.
- Expiration.
- Status.
- Idempotency key.

### 42.2 Reservation States

- `reserved`.
- `redeemed`.
- `released`.
- `expired`.
- `reversed`.

### 42.3 Race Prevention

Reservations must be created in a transaction that checks available balance and existing active reservations.

---

## 43. Loyalty Ledger Consistency

### 43.1 Ledger Rules

- Loyalty ledger is append-only.
- Balance changes are transactionally consistent with ledger entry creation.
- Each earning/redemption/reversal has unique idempotency key.
- Refunds create compensating entries, not destructive edits.
- Reconciliation compares derived balance to stored balance.

### 43.2 Earning Rules

Points are awarded after order completion or configured settlement period. Cancelled/refunded orders do not earn points unless policy explicitly allows partial earning.

---

## 44. Upsell & Cross-Sell Strategy

### 44.1 Upsell Moments

- Product detail: combo upgrade.
- Modifier selection: premium add-ons.
- Cart: missing side/drink/dessert.
- Checkout: final low-friction add-ons.
- Post-order: reorder and loyalty reward prompts.

### 44.2 Upsell Guardrails

- Do not delay checkout with intrusive upsells.
- Respect availability and branch context.
- Do not recommend unavailable items.
- Keep mobile CTA hierarchy clear.
- Track conversion and AOV impact.

---

## 45. Recommendation Engine Inputs

### 45.1 Inputs

- Current cart contents.
- Branch popularity.
- Time of day.
- Fulfillment type.
- Customer history.
- Product margin/category.
- Inventory availability.
- Campaign priority.
- Weather/event context in future.

### 45.2 Guardrails

Recommendations are non-authoritative suggestions. Pricing, availability, and eligibility are still validated by core commerce services.

---

## 46. Reorder Architecture

### 46.1 Reorder Flow

- Customer selects previous order.
- System maps historical item snapshots to current menu IDs.
- Current branch availability is validated.
- Price and modifier changes are surfaced.
- Unavailable items require substitution/removal.
- Reorder creates a new cart, not a duplicate order.

### 46.2 Reorder Safety

Historical prices, discounts, and availability are never reused as current truth. Reorder is a convenience input to current cart validation.

---

## 47. Abandoned Cart Recovery

### 47.1 Recovery Eligibility

Recovery requires:

- Recoverable cart state.
- Customer contact or authenticated customer.
- Marketing consent where required.
- No completed order from same cart.
- Valid recovery window.

### 47.2 Recovery Strategy

- Send reminder based on appetite timing and branch hours.
- Avoid sending recovery offers when branch is closed unless scheduled ordering is available.
- Revalidate cart on return.
- Apply recovery coupon only through promotion engine.

---

## 48. Checkout Retry Safety

### 48.1 Retry-Safe Operations

Retry-safe checkout requires idempotency for:

- Checkout session creation.
- Cart validation snapshot.
- Loyalty reservation.
- Order creation.
- Payment preference creation.
- Payment status polling.

### 48.2 Retry UX

If retry finds an existing in-progress checkout/order, return the current canonical state rather than creating a duplicate.

---

## 49. Duplicate Order Prevention

### 49.1 Duplicate Risks

- Double tap on payment button.
- Multi-tab checkout.
- Browser refresh.
- Provider redirect retry.
- Network timeout after order creation.
- Customer resubmits cart after payment pending.

### 49.2 Prevention Controls

- Checkout lock per cart/version.
- Idempotency key for order creation.
- One active payment attempt group per order.
- UI disables repeated submit but server enforces safety.
- Duplicate detection by customer/session/cart fingerprint within time window.

---

## 50. Payment Retry Coordination

### 50.1 Payment Attempts

Each order can have multiple payment attempts only under controlled rules. Payment attempts track provider preference, status, amount, currency, and attempt number.

### 50.2 Retry Rules

- Retry is allowed after terminal failure or safe expiration.
- Retry is blocked while previous attempt is ambiguous.
- Retry uses same locked order amount unless checkout/order has expired and requires revalidation.
- Multiple approved attempts produce anomaly and require reconciliation.

---

## 51. Mercado Pago Checkout Orchestration

### 51.1 Orchestration Flow

1. Checkout validates cart and locks price.
2. Order is created with immutable snapshot or payment-pending order record.
3. Payment attempt is created server-side.
4. Mercado Pago preference is created with internal references.
5. Customer is redirected or presented approved Mercado Pago flow.
6. Webhook/provider status validates payment.
7. Internal payment state updates order.
8. Kitchen dispatch begins when eligible.

### 51.2 Provider Metadata

Provider metadata should include internal order/payment attempt identifiers where supported. The system must not trust metadata without provider validation.

---

## 52. Payment Failure Recovery

### 52.1 Failure Types

- Customer cancellation.
- Payment rejected.
- Provider timeout.
- Webhook delayed.
- Redirect lost.
- Internal processing failure.

### 52.2 Recovery Rules

- Rejected payment allows retry if order/session still valid.
- Provider timeout keeps payment pending until reconciled.
- Customer cancellation releases temporary reservations if policy says so.
- Internal failure moves payment event to DLQ and alerts if critical.

---

## 53. Payment Reconciliation Rules

### 53.1 Reconciliation Inputs

- Internal payment attempts.
- Mercado Pago provider status.
- Webhook records.
- Order totals.
- Currency.
- Merchant account.
- Refund records.

### 53.2 Reconciliation Outcomes

- Internal status confirmed.
- Internal status repaired with audit event.
- Payment anomaly detected.
- Refund mismatch detected.
- Manual review required.

---

## 54. Fraud Detection Signals

### 54.1 Commerce Fraud Signals

- High checkout velocity.
- Repeated failed payments.
- Multiple accounts using same signals.
- Coupon brute-force attempts.
- Loyalty redemption velocity.
- Suspicious address reuse.
- Refund abuse patterns.
- Duplicate approved attempts.
- Branch/order anomaly patterns.

### 54.2 Fraud Decisions

Fraud service can allow, challenge, suppress promo, require verification, hold order, or block. Financially approved but high-risk orders may require review before kitchen dispatch depending on policy.

---

## 55. Checkout Abuse Prevention

### 55.1 Controls

- Rate limit checkout creation.
- Cap payment attempts.
- Require verified contact above risk thresholds.
- Detect duplicate order fingerprints.
- Suppress coupons for risky sessions.
- Block abusive address probing.
- Protect branch capacity from fake order floods.

### 55.2 Operational Protection

High-risk unpaid orders must not enter kitchen queue. Paid but risky orders follow financial review policy.

---

## 56. Coupon Abuse Prevention

### 56.1 Controls

- Coupon validation throttles.
- Code guess resistance.
- Redemption caps.
- Customer/device/IP risk checks where legally appropriate.
- Budget caps.
- Branch/time/product scoping.
- Redemption ledger uniqueness.

### 56.2 Conflict Handling

When coupons conflict, deterministic priority and stacking rules choose the allowed set. UI explains only customer-relevant conflict reasons.

---

## 57. Loyalty Abuse Prevention

### 57.1 Controls

- Reservation-based redemption.
- Idempotent ledger entries.
- Refund reversal.
- Velocity monitoring.
- Anti-self-referral controls.
- Manual adjustment audit.
- Reward budget controls.

### 57.2 Race Conditions

Concurrent redemptions must serialize on loyalty account or reservation record to prevent double-spend.

---

## 58. Operational Fallback Modes

### 58.1 Fallback Modes

- Realtime degraded: polling mode.
- Delivery unavailable: pickup only.
- Branch overloaded: scheduled ordering or temporary pause.
- Payment provider uncertain: payment pending and reconciliation.
- Notification degraded: retry/fallback channel.
- Analytics degraded: commerce continues.

### 58.2 Customer Messaging

Fallback states must be honest and actionable, not silent failures.

---

## 59. Offline & Reconnect Handling

### 59.1 Customer Reconnect

On reconnect:

1. Refresh session.
2. Fetch canonical cart/checkout/order state.
3. Compare local cart version.
4. Detect invalidation or order conversion.
5. Revalidate before checkout.
6. Resume realtime or fallback polling.

### 59.2 Staff Reconnect Impact

Staff reconnection may change branch availability or order status. Customer checkout must revalidate operational state after staff-side changes.

---

## 60. Realtime Order Synchronization

### 60.1 Customer Order Tracking

- Initial canonical fetch.
- Order-specific subscription.
- Event sequence tracking.
- Gap detection and timeline refetch.
- Fallback polling.
- Payment pending reconciliation display.

### 60.2 Commerce State Updates

Customer-facing order state should reflect commercial milestones: payment pending, paid, accepted, preparing, ready, out for delivery, completed, cancelled, refunded.

---

## 61. Kitchen Commerce Synchronization

### 61.1 Kitchen Dispatch Rules

Kitchen receives orders only when commerce rules allow dispatch:

- Payment approved or permitted payment policy.
- Order snapshot complete.
- Branch matches order.
- Fraud hold absent or cleared.
- Capacity accepted or queued.

### 61.2 Kitchen Feedback

Kitchen events can affect commerce:

- Item unavailable leads to cancellation/substitution workflow.
- Delay updates customer ETA.
- Branch pause blocks new checkout.
- Capacity updates alter future validation.

---

## 62. Delivery Workflow Synchronization

### 62.1 Delivery Sync Rules

Delivery workflow receives:

- Order ID.
- Branch.
- Address snapshot.
- Customer contact needed for delivery.
- ETA/prep status.
- Delivery fee and payment state.

### 62.2 Delivery Updates

Delivery status updates customer tracking and operational dashboards. Delivery failure creates support/branch escalation and does not automatically complete order.

---

## 63. Notification Trigger Architecture

### 63.1 Trigger Sources

Notifications are triggered by durable domain events:

- Checkout abandoned.
- Payment approved/failed/pending.
- Order accepted.
- Prep started.
- Ready for pickup.
- Out for delivery.
- Delivery delayed.
- Order completed.
- Reward earned/redeemed.

### 63.2 Notification Rules

- Transactional notifications are separated from marketing.
- Duplicate suppression uses notification intent keys.
- Consent is required for marketing recovery.
- Provider failures do not block order lifecycle.

---

## 64. Customer Communication Flows

### 64.1 Communication Principles

- Be transparent about payment and order status.
- Communicate changed prices/availability before payment.
- Provide actionable recovery steps.
- Avoid over-notifying.
- Prefer WhatsApp/email according to customer consent and transactional policy.

### 64.2 Critical Messages

- Payment pending.
- Payment failed with retry path.
- Order accepted.
- Delay or substitution needed.
- Ready/out-for-delivery.
- Refund/cancellation confirmation.

---

## 65. Event-Driven Commerce Flows

### 65.1 Core Events

- `cart.validated`.
- `checkout.started`.
- `checkout.ready_for_payment`.
- `order.created`.
- `payment.preference_created`.
- `payment.approved`.
- `order.payment_approved`.
- `kitchen.order_enqueued`.
- `loyalty.reward_redeemed`.
- `notification.requested`.

### 65.2 Event Rules

Commerce events are persisted before side effects. Consumers are idempotent and use aggregate sequence for ordering where required.

---

## 66. Queue-Based Commerce Workflows

### 66.1 Queue Responsibilities

Queues process:

- Payment reconciliation.
- Notification fan-out.
- Loyalty finalization.
- Analytics ingestion.
- Abandoned cart recovery.
- Future order revalidation.
- Delivery dispatch.
- Fraud review workflows.

### 66.2 Queue Priority

Payment and order lifecycle queues have highest priority. Marketing and analytics queues must never block checkout, payment, or kitchen dispatch.

---

## 67. Saga/Orchestration Strategy

### 67.1 Checkout Saga

Checkout saga coordinates:

1. Validate cart.
2. Reserve reward if applicable.
3. Reserve time/capacity if applicable.
4. Create order snapshot.
5. Create payment attempt.
6. Await payment confirmation.
7. Finalize reward redemption.
8. Dispatch to kitchen.
9. Trigger notifications/analytics.

### 67.2 Saga Rules

- Each step is idempotent.
- Durable state is recorded after each step.
- External calls are retried safely.
- Compensations exist for reservations and failed payments.
- Saga state is observable.

---

## 68. Compensation Flow Strategy

### 68.1 Compensation Actions

- Release loyalty reservation.
- Release time slot/capacity reservation.
- Cancel payment-pending order.
- Void or refund payment where required.
- Remove kitchen queue item if not accepted.
- Send cancellation/recovery notification.
- Reverse loyalty earning after refund.

### 68.2 Compensation Rules

Compensations are events, not silent deletes. They must be idempotent and auditable.

---

## 69. Idempotency Strategy

### 69.1 Idempotency Keys

| Operation | Key |
| --- | --- |
| Cart mutation | `cart_id + cart_version + mutation_id` |
| Checkout session | `cart_id + cart_version + customer/session` |
| Order creation | `checkout_session_id + pricing_snapshot_id` |
| Payment preference | `order_id + payment_attempt_number` |
| Reward reservation | `loyalty_account_id + reward_id + checkout_session_id` |
| Coupon redemption | `promotion_id + order_id + customer/session` |
| Notification | `order_id + event_type + template + channel` |

### 69.2 Idempotency Rules

Duplicate operations return existing canonical result or pending state. Conflicting duplicate payloads are rejected and audited.

---

## 70. Financial Auditability

### 70.1 Audit Records

Financial audit must capture:

- Order snapshot.
- Pricing breakdown.
- Discount allocation.
- Tax/fee calculation.
- Loyalty redemption/earning ledger.
- Payment attempts.
- Provider events.
- Refunds.
- Manual adjustments.

### 70.2 Audit Invariants

Financial records are append-only or corrected through compensating events. Reconciliation repairs require reason, actor/system, before/after state, and correlation ID.

---

## 71. Commerce Observability

### 71.1 Traces

Trace:

- Add-to-cart to validation.
- Checkout start to payment preference.
- Payment webhook to order paid.
- Order paid to kitchen dispatch.
- Order completion to loyalty earning.

### 71.2 Logs and Metrics

Use correlation IDs across cart, checkout, order, payment, loyalty, notification, kitchen, and delivery. Log validation failures with safe, non-PII context.

---

## 72. Commerce Metrics & KPIs

### 72.1 Business Metrics

- Add-to-cart rate.
- Checkout start rate.
- Checkout completion rate.
- Payment approval rate.
- Average order value.
- Promo attach rate.
- Loyalty redemption rate.
- Reorder rate.
- Delivery vs pickup mix.

### 72.2 Operational Metrics

- Cart validation latency.
- Checkout latency.
- Payment pending duration.
- Queue depth.
- Branch capacity utilization.
- Kitchen dispatch latency.
- Delivery ETA accuracy.
- Stale cart recovery rate.

---

## 73. Conversion Funnel Instrumentation

### 73.1 Funnel Events

- `menu_viewed`.
- `product_viewed`.
- `modifier_completed`.
- `add_to_cart`.
- `cart_viewed`.
- `checkout_started`.
- `address_validated`.
- `promo_applied`.
- `payment_started`.
- `payment_approved`.
- `order_completed`.

### 73.2 Instrumentation Rules

Critical funnel events should be server-side where possible. Client analytics can enrich but not replace server truth.

---

## 74. Load Handling Strategy

### 74.1 Load Risks

- Viral menu traffic.
- Campaign coupon spikes.
- Simultaneous checkouts.
- Payment webhook bursts.
- Realtime reconnect storms.
- Branch overload.

### 74.2 Load Controls

- Cache menu reads.
- Rate limit promo validation and checkout creation.
- Prioritize payment/order queues.
- Use branch-level backpressure.
- Degrade analytics and marketing first.
- Use fallback polling carefully during realtime incidents.

---

## 75. Peak Hour Protection

### 75.1 Peak Controls

- Dynamic ETA increases.
- Branch channel pause.
- Scheduled slot encouragement.
- Delivery throttling.
- Promo suspension or budget cap.
- Kitchen complexity weighting.
- Staff override with audit.

### 75.2 Customer UX

Peak protection should offer alternatives: later slot, pickup, different branch, or notification when available.

---

## 76. Multi-Branch Commerce Isolation

### 76.1 Isolation Rules

- Cart and checkout are scoped to selected organization and branch context.
- Branch pricing and availability cannot leak across branches.
- Staff can view/act only within assigned branches.
- Branch overload affects only that branch unless organization-level policy applies.
- Branch analytics aggregate asynchronously.

### 76.2 Cross-Branch Cart Handling

When branch changes, cart must revalidate all items, modifiers, promos, rewards, fees, taxes, and time slots.

---

## 77. Multi-Brand Future Compatibility

### 77.1 Future Model

The commerce engine should support future brands under an organization or franchise by adding brand scope to:

- Menus.
- Promotions.
- Loyalty programs.
- Branches.
- Media.
- Customer segments.
- Analytics.

### 77.2 Compatibility Rules

Do not hard-code brand assumptions into pricing, promos, loyalty, or branch logic. Use organization/brand/branch identifiers in rule contexts.

---

## 78. QA & Testing Strategy

### 78.1 Test Categories

- Pricing determinism tests.
- Cart validation tests.
- Modifier constraint tests.
- Combo pricing tests.
- Promo stacking tests.
- Loyalty reservation race tests.
- Checkout idempotency tests.
- Payment retry tests.
- Branch availability tests.
- Delivery zone tests.
- Realtime reconnect tests.
- Multi-tab concurrency tests.

### 78.2 Critical Test Cases

- Duplicate checkout submit creates one order.
- Duplicate payment webhook creates one payment effect.
- Promo expires between cart and checkout.
- Branch closes during checkout.
- Reward redemption races across two devices.
- Delivery address changes after fee preview.
- Item becomes unavailable after cart recovery.
- Payment approved after delayed webhook.

---

## 79. Edge Case Strategy

### 79.1 Edge Cases

- Cart contains only unavailable items.
- Required modifier removed from menu.
- Branch switched after promo application.
- Customer changes address after payment pending.
- Payment approved but checkout page closed.
- Order paid but kitchen paused.
- Loyalty reservation expires while payment pending.
- Coupon budget exhausted during checkout.
- Realtime disconnect during order tracking.

### 79.2 Edge Case Principles

- Preserve customer intent where safe.
- Never preserve invalid financial assumptions.
- Offer clear recovery actions.
- Prefer pending/review state over unsafe fulfillment.
- Record events for support and reconciliation.

---

## 80. Production Hardening Checklist

### 80.1 Cart and Checkout

- [ ] Cart versioning implemented.
- [ ] Guest/auth cart merge rules implemented.
- [ ] Checkout session TTL enforced.
- [ ] Checkout validation snapshot created server-side.
- [ ] Duplicate checkout prevention tested.
- [ ] Multi-tab checkout tested.

### 80.2 Pricing and Promotions

- [ ] Server-side pricing engine implemented.
- [ ] Money uses integer minor units.
- [ ] Pricing snapshots are immutable.
- [ ] Promotion stacking rules implemented.
- [ ] Coupon abuse limits configured.
- [ ] Discount allocation is auditable.

### 80.3 Loyalty

- [ ] Reward reservation implemented.
- [ ] Loyalty ledger append-only.
- [ ] Redemption race tests passing.
- [ ] Refund reversal rules implemented.
- [ ] Loyalty reconciliation job defined.

### 80.4 Delivery and Operations

- [ ] Branch delivery zones validated server-side.
- [ ] Delivery fee recalculates on address/branch change.
- [ ] Kitchen capacity validation implemented.
- [ ] Branch pause/throttle controls implemented.
- [ ] Scheduled order slot reservation rules defined.

### 80.5 Payments

- [ ] Mercado Pago preference creation idempotent.
- [ ] Payment retry rules implemented.
- [ ] Duplicate approved attempt anomaly handling implemented.
- [ ] Payment reconciliation job implemented.
- [ ] Order dispatch waits for validated payment policy.

### 80.6 Realtime and Reliability

- [ ] Cart/order realtime projections are scoped.
- [ ] Reconnect canonical refetch implemented.
- [ ] Fallback polling implemented.
- [ ] Queue priorities protect payment/order lifecycle.
- [ ] Compensation flows are idempotent and auditable.

### 80.7 Observability and QA

- [ ] Checkout correlation IDs propagate across services.
- [ ] Commerce funnel instrumentation implemented.
- [ ] Payment latency and pending dashboards configured.
- [ ] Branch capacity dashboards configured.
- [ ] Pricing determinism test suite passing.
- [ ] Peak-load scenarios tested.

This checklist is a launch gate. Production should be blocked if server-side pricing, checkout idempotency, payment reconciliation, loyalty reservation, branch-aware validation, or kitchen capacity protection is incomplete.
