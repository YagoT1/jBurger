# J Burguer — Hardened Data, Analytics, BI, Experimentation, and AI Readiness Architecture

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Historical English business terms in this document are deprecated in favor of the canonical Spanish glossary.

## 0. Data Intelligence Architecture Scope

This document defines the production data architecture, analytics ecosystem, business intelligence layer, experimentation platform, recommendation systems, forecasting capabilities, data governance, and AI readiness model for J Burguer.

The intelligence platform must convert trusted operational, commerce, customer, payment, kitchen, delivery, loyalty, notification, and infrastructure data into decisions without compromising privacy, tenant isolation, OLTP performance, or metric trust.

The platform must support realtime operational dashboards, executive reporting, branch/franchise intelligence, conversion optimization, experimentation, recommendations, forecasting, and future AI workloads.

---

## 1. Data Platform Philosophy

### 1.1 Objective

The data platform must provide trusted, governed, explainable, privacy-safe intelligence for product, commerce, operations, growth, finance, and franchise decisions.

### 1.2 Principles

1. **Trusted data over vanity metrics**: every KPI must have owner, definition, lineage, and validation.
2. **OLTP protection**: analytics workloads must not degrade checkout, payment, kitchen, or realtime operations.
3. **Event lineage by default**: important analytics facts trace back to source events and canonical records.
4. **Privacy-safe intelligence**: PII is minimized, redacted, pseudonymized, or consent-gated.
5. **Tenant-aware analytics**: organization, branch, and future franchise boundaries are preserved.
6. **Replay-safe pipelines**: analytics can be rebuilt from durable event sources without double-counting.
7. **Operational actionability**: dashboards must drive decisions, alerts, staffing, menu changes, and recovery.
8. **Experiment safety**: experiments must not compromise financial correctness, accessibility, or operational stability.
9. **AI explainability**: recommendations and forecasts must expose drivers, confidence, and guardrails.
10. **Scalable governance**: metrics, schemas, dashboards, and models evolve through controlled review.

---

## 2. Data Architecture Strategy

### 2.1 Data Layers

- Source systems: Supabase PostgreSQL, event/outbox records, payment webhooks, frontend analytics, operational events.
- Ingestion layer: server-side events, client-side events, queue consumers, batch exports.
- Staging layer: raw immutable event/data snapshots.
- Transformation layer: normalized facts and dimensions.
- Semantic layer: governed metrics and business definitions.
- Serving layer: dashboards, product analytics, experiments, recommendations, forecasts, alerts.

### 2.2 Data Architecture Rules

- Source-of-truth remains in OLTP for operational decisions.
- Analytics uses replicas, extracts, projections, or warehouse tables where possible.
- Critical financial and operational metrics derive from server-side canonical events.
- Client analytics enrich behavior but does not replace server truth.

---

## 3. OLTP vs OLAP Separation Strategy

### 3.1 Separation Objective

Analytics must not compete with customer checkout, payment processing, kitchen dashboards, or branch operations.

### 3.2 Separation Rules

- OLTP handles transactional state and current operational projections.
- OLAP handles historical analysis, cohorting, experimentation, BI, and model training.
- Heavy joins, long scans, and executive dashboards should use warehouse/projection layers.
- Realtime operational dashboards can use purpose-built branch projections with bounded queries.

### 3.3 Migration Path

Start with analytics-friendly PostgreSQL projections and exports, then move to a dedicated warehouse as event volume, franchise reporting, and experimentation complexity grow.

---

## 4. Event Analytics Architecture

### 4.1 Event Sources

- Frontend UX events.
- Server commerce events.
- Payment events.
- Order lifecycle events.
- Kitchen events.
- Delivery events.
- Loyalty events.
- Notification events.
- Support events.
- Infrastructure/realtime events.
- Experiment exposure events.

### 4.2 Event Rules

- Server-side events are preferred for critical funnels.
- Client-side events require client event IDs for deduplication.
- Every event includes environment, timestamp, source, schema version, and correlation ID where available.
- Tenant and branch context are included where applicable and allowed.

---

## 5. Event Lineage Strategy

### 5.1 Lineage Requirements

Analytics events must be traceable through:

- Event ID.
- Source system.
- Correlation ID.
- Causation ID.
- Aggregate ID.
- Schema version.
- Transformation job.
- Dashboard/metric consumer.

### 5.2 Lineage Rules

Derived metrics must link to source event families and transformation versions. Replayed events must be marked to avoid accidental duplicate counting.

---

## 6. Canonical Event Definitions

### 6.1 Canonical Events

Canonical analytics events include:

- `product.viewed`.
- `cart.item_added`.
- `checkout.started`.
- `checkout.completed`.
- `payment.approved`.
- `order.accepted`.
- `kitchen.prep_started`.
- `delivery.completed`.
- `loyalty.reward_redeemed`.
- `promotion.applied`.
- `experiment.exposed`.
- `notification.clicked`.

### 6.2 Canonical Rules

Canonical events are versioned, documented, owned, and tested. Event names cannot be repurposed with new semantics.

---

## 7. Analytics Event Taxonomy

### 7.1 Event Families

- Acquisition.
- Navigation.
- Menu discovery.
- Product engagement.
- Cart.
- Checkout.
- Payment.
- Order tracking.
- Kitchen operations.
- Delivery operations.
- Loyalty.
- Promotions.
- Notifications.
- Support.
- Realtime health.
- Experimentation.

### 7.2 Event Criticality

Financial, checkout, payment, loyalty, and operational SLA events are critical and server-derived. Browsing and UX events may be sampled where appropriate.

---

## 8. Event Naming Governance

### 8.1 Naming Format

Use:

```text
<domain>.<past_tense_action>
```

Examples:

- `checkout.started`.
- `payment.approved`.
- `kitchen.order_delayed`.
- `notification.delivered`.

### 8.2 Rules

Names are lowercase, stable, domain-owned, and fact-based. Avoid ambiguous events such as `button.clicked` without business meaning.

---

## 9. Event Schema Governance

### 9.1 Schema Requirements

Each event schema defines:

- Event name.
- Version.
- Owner.
- Required fields.
- Optional fields.
- PII classification.
- Tenant fields.
- Deduplication key.
- Retention class.

### 9.2 Evolution Rules

Backward-compatible additions are allowed. Breaking changes require new version, migration plan, and consumer compatibility review.

---

## 10. Data Contract Strategy

### 10.1 Contract Scope

Data contracts apply to source events, transformation outputs, metrics, dashboard datasets, feature store tables, and experiment exposure records.

### 10.2 Contract Rules

Contracts define ownership, freshness SLO, schema, nullability, allowed values, quality checks, consumers, and deprecation policy.

---

## 11. Event Enrichment Strategy

### 11.1 Enrichment Inputs

- Organization and branch context.
- Customer segment.
- Device class.
- Traffic source.
- Campaign.
- Fulfillment type.
- Product/category metadata.
- Experiment assignments.
- Operational capacity state.

### 11.2 Enrichment Rules

Enrichment should occur server-side or in controlled transformation jobs. PII is minimized and sensitive attributes require governance.

---

## 12. Realtime Analytics Architecture

### 12.1 Realtime Use Cases

- Live order volume.
- Branch queue health.
- Payment pending rate.
- Kitchen congestion.
- Delivery assignment lag.
- Realtime reconnect spikes.
- Campaign surge monitoring.

### 12.2 Realtime Rules

Realtime analytics uses bounded projections and aggregates. Do not stream raw high-cardinality analytics to dashboards during peak operations.

---

## 13. Operational Analytics Architecture

### 13.1 Operational Domains

- Branch health.
- Kitchen throughput.
- Delivery SLA.
- Queue saturation.
- Order delays.
- Incident state.
- Staff action latency.

### 13.2 Rules

Operational analytics must be fresh, branch-scoped, and actionable. Delayed data must show freshness indicators.

---

## 14. Product Analytics Architecture

### 14.1 Product Questions

- Which journeys convert?
- Which products drive AOV?
- Where do customers abandon?
- Which mobile interactions fail?
- Which features improve reorder?

### 14.2 Rules

Product analytics combines server truth with client behavior while avoiding PII and respecting consent.

---

## 15. Commerce Analytics Architecture

### 15.1 Metrics

- Gross sales.
- Net sales.
- AOV.
- Cart conversion.
- Checkout completion.
- Payment approval rate.
- Refund/cancellation rate.
- Promo cost.
- Margin proxy where available.

### 15.2 Rules

Financial metrics derive from orders/payments, not client events.

---

## 16. Kitchen Analytics Architecture

### 16.1 Metrics

- Acceptance time.
- Prep time.
- Station backlog.
- Complexity units/hour.
- Delay rate.
- Ready accuracy.
- Exception rate.

### 16.2 Rules

Kitchen analytics uses operational events and branch capacity context.

---

## 17. Delivery Analytics Architecture

### 17.1 Metrics

- Dispatch latency.
- Driver assignment rate.
- Pickup wait.
- Delivery duration.
- Failed delivery rate.
- Reassignment rate.
- Zone performance.

### 17.2 Rules

Delivery metrics separate kitchen delay, dispatch delay, and travel delay.

---

## 18. Loyalty Analytics Architecture

### 18.1 Metrics

- Loyalty enrollment.
- Points earned.
- Points redeemed.
- Reward breakage.
- Tier progression.
- Repeat purchase lift.
- Reward-driven AOV.

### 18.2 Rules

Loyalty metrics reconcile against append-only loyalty ledger.

---

## 19. Promotion Analytics Architecture

### 19.1 Metrics

- Promotion impressions.
- Applications.
- Redemptions.
- Incremental revenue.
- Discount cost.
- Abuse signals.
- Branch/campaign performance.

### 19.2 Rules

Promotion metrics distinguish attempted application, eligible application, and finalized redemption.

---

## 20. Customer Analytics Architecture

### 20.1 Customer Metrics

- First order date.
- Last order date.
- Order count.
- AOV.
- Favorite categories.
- Fulfillment preference.
- Loyalty status.
- Consent status.

### 20.2 Rules

Customer analytics uses pseudonymized identifiers in analytical contexts where possible.

---

## 21. Retention Analytics Architecture

### 21.1 Metrics

- Repeat purchase rate.
- Time to second order.
- Churn risk.
- Winback conversion.
- Reorder interval.
- Loyalty retention lift.

### 21.2 Rules

Retention cohorts should be segmented by acquisition source, branch, first product/category, and promotion exposure.

---

## 22. Conversion Funnel Architecture

### 22.1 Funnel Stages

1. Landing/menu view.
2. Product view.
3. Modifier completion.
4. Add to cart.
5. Cart view.
6. Checkout start.
7. Address validated.
8. Payment started.
9. Payment approved.
10. Order completed.

### 22.2 Rules

Server-confirmed stages take precedence over client-only stages.

---

## 23. Checkout Funnel Analytics

### 23.1 Checkout Metrics

- Checkout start rate.
- Address validation success.
- Promo failure rate.
- Payment initiation rate.
- Payment approval rate.
- Payment retry success.
- Checkout duration.

### 23.2 Rules

Checkout analytics must be correlated with cart validation outcomes, payment attempts, fulfillment type, and device class.

---

## 24. Drop-Off Analysis Strategy

### 24.1 Drop-Off Dimensions

- Device.
- Traffic source.
- Branch.
- Fulfillment type.
- Promo usage.
- Address validation failure.
- Payment failure.
- Page performance.

### 24.2 Rules

Drop-off analysis should identify actionable cause categories rather than only page-level abandonment.

---

## 25. Reorder Analytics

### 25.1 Metrics

- Reorder click-through.
- Reorder cart creation.
- Reorder checkout completion.
- Unavailable historical item rate.
- Reorder AOV.

### 25.2 Rules

Reorder analytics must distinguish suggested reorder from completed current-order purchase.

---

## 26. Cohort Analysis Strategy

### 26.1 Cohorts

- Acquisition month.
- First branch.
- First product/category.
- First promotion.
- Loyalty enrollment.
- Fulfillment type.

### 26.2 Rules

Cohorts must use stable definitions and exclude test/synthetic data.

---

## 27. LTV Modeling Strategy

### 27.1 Inputs

- Order frequency.
- AOV.
- Gross margin proxy.
- Discount cost.
- Refund/cancellation history.
- Loyalty engagement.
- Acquisition source.

### 27.2 Rules

LTV should be confidence-scored and not used as sole basis for sensitive customer decisions.

---

## 28. RFM Analysis Strategy

### 28.1 Dimensions

- Recency.
- Frequency.
- Monetary value.

### 28.2 Rules

RFM segments support lifecycle messaging, personalization, and BI, but must respect consent and privacy governance.

---

## 29. Segmentation Architecture

### 29.1 Segment Types

- Behavioral.
- Value-based.
- Loyalty tier.
- Branch affinity.
- Promo sensitivity.
- Fulfillment preference.
- Churn risk.

### 29.2 Rules

Segments are versioned, documented, and refreshed on defined cadence. Sensitive segments require governance.

---

## 30. Customer Profile Intelligence

### 30.1 Profile Attributes

- Preferred branch.
- Favorite products/categories.
- Typical order time.
- Fulfillment preference.
- Loyalty status.
- Promotion engagement.
- Reorder interval.

### 30.2 Rules

Customer intelligence should improve experience without exposing hidden profiling in staff/customer interfaces.

---

## 31. Behavioral Analytics

### 31.1 Behaviors

- Menu browsing depth.
- Product comparison.
- Modifier friction.
- Cart edits.
- Coupon attempts.
- Payment retry behavior.
- Tracking engagement.

### 31.2 Rules

Behavioral analytics must not include unnecessary raw PII or sensitive free-text notes.

---

## 32. Realtime Operational Dashboards

### 32.1 Dashboard Data

- Active orders.
- Queue depth.
- Payment pending rate.
- Kitchen congestion.
- Delivery capacity.
- Branch incidents.
- SLA breaches.

### 32.2 Rules

Dashboards must show freshness and distinguish realtime from delayed projections.

---

## 33. Executive Dashboard Architecture

### 33.1 Executive Metrics

- Revenue.
- Orders.
- AOV.
- Repeat rate.
- Branch performance.
- Promo cost.
- Delivery SLA.
- Customer growth.

### 33.2 Rules

Executive dashboards use governed semantic metrics and include definitions.

---

## 34. Branch Intelligence Dashboards

### 34.1 Branch Metrics

- Sales by daypart.
- Queue health.
- Prep performance.
- Delivery performance.
- Product mix.
- Staff shift performance where appropriate.
- Incident history.

### 34.2 Rules

Branch dashboards are scoped to authorized branch/organization context.

---

## 35. Franchise Intelligence Architecture

### 35.1 Franchise Needs

- Cross-branch benchmarking.
- Franchise group performance.
- Standard metric definitions.
- Aggregate dashboards.
- Operational compliance.

### 35.2 Rules

Franchise dashboards must respect tenant/organization boundaries and expose only authorized aggregation.

---

## 36. Business KPI Governance

### 36.1 KPI Requirements

Each KPI has:

- Owner.
- Definition.
- Formula.
- Source tables/events.
- Refresh cadence.
- Known caveats.
- Dashboard location.

### 36.2 Rules

Undefined metrics cannot be used in executive reporting.

---

## 37. SLA/SLO Analytics

### 37.1 SLO Metrics

- Checkout latency.
- Payment confirmation delay.
- Order tracking update delay.
- Kitchen acceptance time.
- Prep SLA.
- Delivery SLA.
- Queue lag.

### 37.2 Rules

SLO analytics use operational telemetry and incident annotations.

---

## 38. Operational Efficiency Metrics

### 38.1 Metrics

- Orders per labor hour where available.
- Capacity utilization.
- Queue dwell time.
- Branch pause duration.
- Scheduled order accuracy.
- Incident recovery time.

### 38.2 Rules

Efficiency metrics should support operational improvement, not opaque staff surveillance.

---

## 39. Kitchen Performance Metrics

### 39.1 Metrics

- Prep duration by product/category.
- Station bottlenecks.
- Delay rate.
- Complexity-adjusted throughput.
- Ready dwell time.
- Remake/substitution signals.

### 39.2 Rules

Kitchen performance should be normalized by complexity and demand periods.

---

## 40. Delivery Performance Metrics

### 40.1 Metrics

- Assignment latency.
- Dispatch delay.
- Travel duration.
- Zone SLA.
- Failure rate.
- Driver utilization.
- Reassignment frequency.

### 40.2 Rules

Delivery analytics separates branch prep delay from delivery execution delay.

---

## 41. ETA Accuracy Analytics

### 41.1 Metrics

- Predicted vs actual prep time.
- Predicted vs actual delivery time.
- ETA error by branch/hour/product mix.
- Confidence calibration.
- Customer delay notifications.

### 41.2 Rules

ETA accuracy analytics feeds model improvements and operational alerts.

---

## 42. Forecasting Architecture

### 42.1 Forecasting Layers

- Historical baseline.
- Seasonal/daypart model.
- Campaign/event adjustment.
- Realtime demand adjustment.
- Manager override layer.
- Confidence scoring.

### 42.2 Rules

Forecasts are decision-support outputs, not unquestionable commands.

---

## 43. Demand Forecasting Systems

### 43.1 Inputs

- Historical orders.
- Branch/daypart.
- Product mix.
- Campaign calendar.
- Weather/local events in future.
- Holiday/sports calendar.
- Recent traffic trend.

### 43.2 Outputs

Expected orders, complexity units, revenue range, kitchen load, delivery load, and confidence score.

---

## 44. Peak-Hour Forecasting

### 44.1 Use Cases

- Friday dinner rush.
- Football match spikes.
- Viral campaign spikes.
- Holiday demand.

### 44.2 Rules

Peak forecasts include operational recommendations: staff levels, delivery throttles, ETA buffers, and menu simplification suggestions.

---

## 45. Staffing Forecasting

### 45.1 Inputs

Demand forecast, product complexity, station load, historical throughput, branch staff capacity, and scheduled orders.

### 45.2 Outputs

Recommended staffing by role/station and risk warnings for understaffed periods.

---

## 46. Delivery Capacity Forecasting

### 46.1 Inputs

Order forecast, delivery mix, zone distribution, average route duration, driver availability, and weather/traffic signals in future.

### 46.2 Outputs

Required drivers, expected assignment delay, zone risk, and delivery throttle recommendations.

---

## 47. Inventory Forecasting

### 47.1 Inputs

Product sales history, ingredient mapping, campaign plans, scheduled orders, stockouts, and waste signals where available.

### 47.2 Outputs

Expected ingredient demand, stockout risk, reorder recommendations, and limited-item warnings.

---

## 48. Revenue Forecasting

### 48.1 Inputs

Demand, AOV, promotions, branch schedule, historical conversion, campaign plans, and payment approval rates.

### 48.2 Outputs

Revenue range, confidence, discount cost forecast, and branch contribution.

---

## 49. Recommendation System Architecture

### 49.1 Recommendation Layers

- Rule-based baseline.
- Popularity by branch/time.
- Cart-context recommendations.
- Customer-history personalization.
- Promotion-aware ranking.
- Future ML ranking.

### 49.2 Rules

Recommendations must be branch-aware, availability-aware, price-safe, and explainable enough for product/ops review.

---

## 50. Product Recommendation Strategy

### 50.1 Strategies

- Popular near branch.
- Frequently reordered.
- Similar products.
- New/limited drops.
- Margin-aware suggestions where allowed.

### 50.2 Rules

Do not recommend unavailable items or items incompatible with selected fulfillment branch.

---

## 51. Upsell Recommendation Engine

### 51.1 Upsell Contexts

- Product detail add-ons.
- Combo upgrade.
- Cart missing side/drink.
- Checkout final add-on.

### 51.2 Rules

Upsells must not slow checkout or feel manipulative. Track attach rate and abandonment impact.

---

## 52. Cross-Sell Recommendation Logic

### 52.1 Logic

Cross-sell ranks complementary items based on cart contents, branch availability, historical basket affinity, time of day, and promo eligibility.

### 52.2 Rules

Cross-sells must respect inventory, fulfillment, and dietary/allergen policy constraints.

---

## 53. Personalized Promotion Engine

### 53.1 Personalization Inputs

- Segment.
- RFM score.
- Loyalty status.
- Churn risk.
- Branch preference.
- Promo sensitivity.
- Consent state.

### 53.2 Rules

Promotion personalization must respect consent, budget caps, eligibility, and fairness/business policy.

---

## 54. Dynamic Recommendation Signals

### 54.1 Signals

- Current cart.
- Branch demand.
- Time/day.
- Weather/events in future.
- Inventory availability.
- Customer history.
- Experiment group.
- Operational capacity.

### 54.2 Rules

Operational capacity can suppress high-complexity recommendations during kitchen overload.

---

## 55. AI Readiness Architecture

### 55.1 Readiness Requirements

- Governed event data.
- Feature definitions.
- Privacy-safe identifiers.
- Training datasets.
- Model evaluation metrics.
- Feedback loops.
- Explainability metadata.

### 55.2 Rules

AI systems cannot bypass deterministic pricing, promotion eligibility, payment, or operational safety rules.

---

## 56. ML Feature Store Strategy

### 56.1 Feature Types

- Customer behavioral features.
- Product affinity features.
- Branch demand features.
- Time/day features.
- Operational capacity features.
- Promotion response features.

### 56.2 Rules

Features are versioned, documented, freshness-tracked, and privacy-classified.

---

## 57. Training Data Governance

### 57.1 Governance Rules

Training datasets require source lineage, time window, PII review, consent review where applicable, label definition, bias review, and retention policy.

### 57.2 Exclusions

Exclude synthetic/test users, staff/admin actions, fraudulent activity where inappropriate, and anomalous incident periods unless intentionally modeled.

---

## 58. Recommendation Feedback Loops

### 58.1 Feedback Events

- Recommendation shown.
- Recommendation clicked.
- Added to cart.
- Purchased.
- Removed from cart.
- Ignored.
- Caused abandonment signal.

### 58.2 Rules

Feedback loops must deduplicate events and attribute outcomes to active recommendation/experiment versions.

---

## 59. Experimentation Platform Architecture

### 59.1 Experiment Components

- Experiment registry.
- Assignment service.
- Exposure event.
- Metric definitions.
- Guardrail metrics.
- Rollout controls.
- Analysis dataset.

### 59.2 Rules

Exposure is logged once per unit/experiment/version. Assignment is stable for the experiment unit.

---

## 60. Feature Flag Analytics

### 60.1 Flag Metrics

- Exposure count.
- Error rate by flag state.
- Conversion by flag state.
- Latency by flag state.
- Operational impact by flag state.

### 60.2 Rules

Feature flags require analytics metadata when they affect customer or operational workflows.

---

## 61. A/B Testing Architecture

### 61.1 Test Units

- User.
- Session.
- Branch.
- Order.
- Organization.

### 61.2 Rules

Choose test unit to avoid contamination. Checkout experiments generally use user/session assignment; operational workflow experiments may require branch-level assignment.

---

## 62. Experiment Isolation Rules

### 62.1 Isolation Controls

- Tenant scope.
- Branch scope.
- Segment eligibility.
- Mutually exclusive experiment groups.
- Holdouts.
- Guardrail metrics.

### 62.2 Rules

Financial, pricing, and operational experiments require additional safety review.

---

## 63. Statistical Significance Governance

### 63.1 Governance

Define primary metric, guardrails, minimum sample, duration, confidence approach, and stopping rules before launch.

### 63.2 Rules

Do not stop experiments early solely because interim results look favorable.

---

## 64. Experiment Rollout Governance

### 64.1 Rollout Stages

- Internal.
- Small percentage.
- Branch/tenant canary.
- Wider rollout.
- Full rollout.

### 64.2 Rules

Rollback triggers include conversion loss, payment error spike, latency spike, accessibility regression, or operational incident increase.

---

## 65. Multi-Branch Experimentation

### 65.1 Use Cases

- Branch-specific promos.
- Kitchen workflow changes.
- Delivery ETA messaging.
- Menu ordering.
- Local campaigns.

### 65.2 Rules

Branch experiments must account for branch demand differences and avoid comparing unlike branches without adjustment.

---

## 66. Tenant-Aware Analytics Isolation

### 66.1 Isolation Requirements

Analytics data includes organization and branch scope. Dashboards, exports, experiments, and model outputs enforce tenant boundaries.

### 66.2 Rules

Cross-tenant benchmarking must be aggregated and anonymized unless platform-super-admin governance permits otherwise.

---

## 67. Data Privacy Architecture

### 67.1 Privacy Controls

- Data minimization.
- Pseudonymization.
- Consent enforcement.
- Retention limits.
- Access controls.
- Redaction in dashboards/logs.

### 67.2 Rules

Analytics must not become a backdoor to customer PII.

---

## 68. PII Analytics Governance

### 68.1 PII Classes

- Direct identifiers.
- Contact data.
- Address data.
- Payment metadata.
- Support content.
- Behavioral identifiers.

### 68.2 Rules

Only approved datasets can include PII, and access is purpose-bound and audited.

---

## 69. Analytics Consent Governance

### 69.1 Consent Types

- Necessary operational analytics.
- Product analytics.
- Marketing analytics.
- Personalization.
- Promotional messaging.

### 69.2 Rules

Consent state must be captured, versioned, and respected by downstream analytics and activation systems.

---

## 70. Data Retention Policies

### 70.1 Retention Classes

- Operational realtime data.
- Raw analytics events.
- Aggregated metrics.
- Payment/audit records.
- Experiment datasets.
- Model training datasets.

### 70.2 Rules

Retention balances legal, privacy, cost, and analytical needs.

---

## 71. Analytics Storage Strategy

### 71.1 Storage Layers

- Raw event storage.
- Staging tables.
- Fact tables.
- Dimension tables.
- Aggregate tables.
- Feature tables.
- Export datasets.

### 71.2 Rules

Storage is partitioned by date and tenant/branch dimensions where appropriate.

---

## 72. Data Warehouse Strategy

### 72.1 Warehouse Role

A warehouse becomes the primary home for historical BI, experimentation analysis, model training extracts, and heavy analytical queries.

### 72.2 Rules

Warehouse adoption should preserve metric definitions and lineage from earlier PostgreSQL projections.

---

## 73. Data Pipeline Architecture

### 73.1 Pipeline Stages

1. Ingest.
2. Validate.
3. Deduplicate.
4. Enrich.
5. Transform.
6. Aggregate.
7. Serve.
8. Monitor.

### 73.2 Rules

Pipelines are idempotent, replay-safe, versioned, and observable.

---

## 74. Batch vs Streaming Strategy

### 74.1 Streaming Use Cases

Realtime operational dashboards, alerting, queue health, payment pending monitoring, and campaign surge detection.

### 74.2 Batch Use Cases

Executive reporting, cohort analysis, LTV, training datasets, historical forecasting, and finance reconciliation.

### 74.3 Rules

Use streaming only where freshness materially changes decisions.

---

## 75. ETL/ELT Governance

### 75.1 Governance Rules

Transformations have owners, tests, versioning, lineage, documentation, and rollback/replay plan.

### 75.2 Rules

Metric transformations require review when source schemas or business definitions change.

---

## 76. Data Freshness Strategy

### 76.1 Freshness Classes

- Realtime: seconds.
- Near realtime: minutes.
- Hourly.
- Daily.
- Historical/archive.

### 76.2 Rules

Dashboards show freshness and warn when data exceeds freshness SLO.

---

## 77. Data Quality Monitoring

### 77.1 Quality Checks

- Volume anomalies.
- Null checks.
- Uniqueness checks.
- Referential integrity.
- Accepted value checks.
- Freshness checks.
- Metric drift checks.

### 77.2 Rules

Critical dashboard datasets require automated quality checks and owner alerts.

---

## 78. Data Reliability Engineering

### 78.1 Reliability Practices

- Data contracts.
- Pipeline tests.
- Backfills with validation.
- Replay safety.
- Incident tracking.
- Data SLAs.
- Owner assignment.

### 78.2 Rules

Data incidents are treated like production incidents when they affect decisions, financial reporting, or operations.

---

## 79. Analytics Observability

### 79.1 Observability Signals

- Pipeline runtime.
- Pipeline failures.
- Event lag.
- Freshness.
- Volume anomalies.
- Schema failures.
- Dashboard query latency.
- Recommendation latency.
- Forecast drift.

### 79.2 Rules

Analytics observability dashboards have owners and alert thresholds.

---

## 80. BI Governance

### 80.1 Governance Scope

BI governance covers metric definitions, dashboard ownership, access controls, certification, refresh cadence, and deprecation.

### 80.2 Rules

Certified dashboards are labeled and use semantic metrics.

---

## 81. Semantic Metrics Layer

### 81.1 Layer Role

The semantic layer defines reusable metrics such as revenue, net revenue, AOV, conversion, repeat rate, SLA compliance, delivery delay, and promotion cost.

### 81.2 Rules

Dashboards should consume semantic metrics rather than redefining formulas locally.

---

## 82. KPI Ownership Model

### 82.1 Owner Types

- Product owner.
- Operations owner.
- Finance owner.
- Growth owner.
- Data owner.
- Engineering owner.

### 82.2 Rules

Every KPI has accountable owner and review cadence.

---

## 83. Dashboard Governance

### 83.1 Dashboard Classes

- Executive certified.
- Operational realtime.
- Product analytics.
- Experiment analysis.
- Ad hoc exploration.

### 83.2 Rules

Dashboards have owner, audience, freshness, definitions, and access scope.

---

## 84. Self-Service Analytics Strategy

### 84.1 Self-Service Scope

Self-service analytics can expose governed dimensions and metrics for product, ops, growth, and finance users.

### 84.2 Rules

Self-service does not bypass tenant security or expose raw PII.

---

## 85. Operational Alert Analytics

### 85.1 Alert Inputs

- Queue saturation.
- SLA breaches.
- Payment pending spike.
- Delivery assignment lag.
- Realtime reconnect spike.
- Branch incident frequency.

### 85.2 Rules

Alerts should distinguish operational cause from data pipeline delay.

---

## 86. Fraud Analytics Signals

### 86.1 Signals

- Payment failure velocity.
- Coupon attempt velocity.
- Account/device reuse.
- Refund patterns.
- Delivery dispute frequency.
- Loyalty redemption anomalies.

### 86.2 Rules

Fraud analytics are access-controlled and not exposed in customer-facing surfaces.

---

## 87. Loyalty Abuse Analytics

### 87.1 Signals

- Rapid point earning/redeeming.
- Referral loops.
- Refund-after-reward patterns.
- Manual adjustment anomalies.
- Multi-account behavior.

### 87.2 Rules

Abuse analytics must reconcile against loyalty ledger and refunds.

---

## 88. Promotion Abuse Analytics

### 88.1 Signals

- Coupon brute force.
- High redemption concentration.
- Budget spikes.
- New-account farming.
- Branch-specific abnormal usage.

### 88.2 Rules

Promotion abuse signals feed campaign throttles and review workflows.

---

## 89. Infrastructure Cost Analytics

### 89.1 Metrics

- Cost by environment.
- Cost by feature domain.
- Observability ingestion cost.
- Storage growth.
- Queue/worker usage.
- Image/CDN usage.

### 89.2 Rules

Cost analytics informs architecture decisions and retention policies.

---

## 90. Realtime Cost Analytics

### 90.1 Metrics

- Connections by surface.
- Messages by channel type.
- Branch dashboard fan-out.
- Fallback polling activation.
- Reconnect storm cost.

### 90.2 Rules

Realtime cost analytics identifies over-broadcasting and projection opportunities.

---

## 91. Growth Intelligence Systems

### 91.1 Systems

- Acquisition attribution.
- Retention cohorts.
- Campaign ROI.
- Promo effectiveness.
- Referral performance.
- Winback performance.

### 91.2 Rules

Growth intelligence must connect marketing exposure to server-confirmed orders and margin/discount cost where possible.

---

## 92. Campaign Intelligence Architecture

### 92.1 Campaign Metrics

- Impressions.
- Clicks.
- Add-to-cart.
- Orders.
- Revenue.
- Discount cost.
- Branch operational impact.
- Retention impact.

### 92.2 Rules

Campaign dashboards include operational impact, not only sales lift.

---

## 93. Notification Effectiveness Analytics

### 93.1 Metrics

- Send rate.
- Delivery rate.
- Open/click where available.
- Recovery conversion.
- Opt-out rate.
- Provider failure rate.

### 93.2 Rules

Marketing notification analytics respects consent and channel policy.

---

## 94. SEO & Acquisition Analytics

### 94.1 Metrics

- Organic landing sessions.
- Menu page views.
- Branch page views.
- CTA conversion.
- Branded vs non-branded traffic.
- Acquisition to order conversion.

### 94.2 Rules

SEO analytics connects public page performance to downstream ordering when privacy and attribution allow.

---

## 95. Mobile UX Analytics

### 95.1 Metrics

- Mobile LCP/INP/CLS.
- Tap errors.
- Form field friction.
- Checkout step time.
- Bottom sheet abandonment.
- Reconnect frequency.

### 95.2 Rules

Mobile UX analytics informs CRO and performance work without collecting unnecessary PII.

---

## 96. Operational Replay Analytics

### 96.1 Use Cases

- Reconstruct order incident timeline.
- Rebuild branch dashboard projection.
- Analyze queue congestion event.
- Validate compensation flows.

### 96.2 Rules

Replay analytics must preserve original event sequence and mark replay context.

---

## 97. Historical Replay Strategy

### 97.1 Replay Scope

Historical replay can rebuild metrics, cohorts, feature tables, dashboards, and model datasets.

### 97.2 Rules

Replay jobs are idempotent, resource-governed, and isolated from production OLTP operations.

---

## 98. Data Scalability Roadmap

### 98.1 Roadmap

1. Governed PostgreSQL projections and event exports.
2. Dedicated warehouse for historical analytics.
3. Semantic metrics layer.
4. Experimentation platform.
5. Feature store.
6. Forecasting models.
7. Recommendation ranking services.
8. AI decision-support tooling.

---

## 99. AI/ML Future Expansion Strategy

### 99.1 Expansion Areas

- Personalized recommendations.
- Demand forecasting.
- Staffing recommendations.
- Inventory forecasting.
- Churn prediction.
- Promo targeting.
- ETA prediction.
- Anomaly detection.

### 99.2 Guardrails

AI outputs remain advisory unless deterministic safety rules approve action. Financial, payment, privacy, and operational policies remain authoritative.

---

## 100. Data Platform Production Hardening Checklist

### 100.1 Events and Contracts

- [ ] Canonical event registry defined.
- [ ] Event schemas versioned.
- [ ] Data contracts assigned owners.
- [ ] Deduplication keys implemented.
- [ ] Replay rules documented.

### 100.2 Metrics and BI

- [ ] Semantic metrics layer defined.
- [ ] Executive KPIs certified.
- [ ] Dashboard ownership documented.
- [ ] Data freshness shown on dashboards.
- [ ] KPI definitions visible to users.

### 100.3 Privacy and Governance

- [ ] PII classification completed.
- [ ] Consent enforcement implemented.
- [ ] Tenant analytics isolation tested.
- [ ] Retention policies configured.
- [ ] Analytics access controls defined.

### 100.4 Reliability

- [ ] Pipeline quality checks configured.
- [ ] Freshness alerts configured.
- [ ] Event lag monitoring configured.
- [ ] Data incident runbook defined.
- [ ] Backfill/replay validation process defined.

### 100.5 Intelligence Systems

- [ ] Experiment exposure tracking implemented.
- [ ] Guardrail metrics required for experiments.
- [ ] Recommendation feedback events defined.
- [ ] Forecast confidence scoring defined.
- [ ] AI/ML training data governance defined.

Production intelligence launch should be blocked if canonical metrics, tenant analytics isolation, event schema governance, freshness monitoring, PII controls, or replay-safe pipelines are incomplete.
