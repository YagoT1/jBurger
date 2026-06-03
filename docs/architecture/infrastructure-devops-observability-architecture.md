# J Burguer — Hardened Infrastructure, DevOps, Observability, and SRE Architecture

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Historical English business terms in this document are deprecated in favor of the canonical Spanish glossary.

## 0. Infrastructure Architecture Scope

This document defines the production infrastructure, DevOps, observability, deployment, reliability, scalability, disaster recovery, cost governance, and SRE operating model for J Burguer.

The platform infrastructure must support realtime food commerce, payment reliability, multi-branch restaurant operations, operational dashboards, queue systems, Supabase/PostgreSQL persistence, Supabase Realtime, Vercel deployment, Mercado Pago integrations, and future franchise/multi-brand expansion.

The infrastructure must survive high-traffic spikes, queue saturation, delayed webhooks, reconnect storms, branch outages, deployment failures, worker crashes, provider degradation, database recovery scenarios, and operational incidents without cascading failure.

---

## 1. Infrastructure Architecture Philosophy

### 1.1 Objective

Infrastructure exists to keep commerce and operations reliable, observable, recoverable, secure, and cost-aware while enabling rapid product iteration.

### 1.2 Principles

1. **Reliability first**: checkout, payment, order, kitchen, and delivery flows have priority over analytics and marketing workloads.
2. **Failure isolation**: branch, tenant, queue, provider, and deployment failures must be contained.
3. **Observable by default**: every critical flow emits traces, metrics, logs, events, and actionable alerts.
4. **Safe deployments**: production changes require validation, progressive release, rollback, and migration coordination.
5. **Replay-safe recovery**: event/outbox/replay systems must repair missed side effects without duplicates.
6. **Cost-aware scaling**: realtime, storage, logging, images, workers, and queues need budgets and retention controls.
7. **Secure operations**: secrets, production access, artifacts, and observability data are protected.
8. **Automation over heroics**: runbooks, kill switches, health checks, and recovery procedures are operational products.

---

## 2. Platform Topology

### 2.1 Core Runtime Topology

- Next.js 15 application on Vercel.
- Supabase PostgreSQL as system of record.
- Supabase Auth for identity.
- Supabase Realtime for scoped realtime projections.
- Supabase Storage for media and controlled private files.
- Queue/worker layer for outbox processing, payment reconciliation, notifications, loyalty, analytics, and maintenance.
- Mercado Pago provider integration via server-only route handlers and workers.
- Observability stack for logs, traces, metrics, alerts, and dashboards.

### 2.2 Topology Rules

- Vercel request handlers should persist durable state quickly and delegate slow work to workers.
- Supabase database remains canonical state.
- Realtime is not durable storage.
- Workers consume durable queues/outbox records.
- Operational dashboards read scoped projections, not unbounded raw streams.

---

## 3. Environment Architecture

### 3.1 Environment Types

- Local development.
- Preview deployments.
- Staging.
- Production.
- Optional disaster recovery/readiness environment.

### 3.2 Environment Rules

Each environment has isolated secrets, Supabase project/database, storage buckets, Mercado Pago credentials, notification credentials, observability labels, and deployment permissions.

---

## 4. Multi-Environment Strategy

### 4.1 Strategy

Environments progress from local to preview to staging to production. Production data and secrets never flow backward without anonymization and explicit approval.

### 4.2 Promotion Rules

- Preview validates feature branches.
- Staging validates production-like integrations.
- Production deploys require green checks and authorization.
- Migrations are tested in staging before production.

---

## 5. Development Environment Strategy

### 5.1 Local Development

Local development should support mocked or sandboxed providers, seeded Supabase data, deterministic test fixtures, and safe local environment variables.

### 5.2 Rules

- No production credentials locally.
- Synthetic data by default.
- Provider webhooks tested through sandbox tunnels or fixture replay.
- Local queues can use simplified workers but must preserve idempotency semantics.

---

## 6. Staging Environment Strategy

### 6.1 Staging Purpose

Staging validates production-like flows before launch: checkout, payment sandbox, realtime, queues, RLS, migrations, dashboards, and incident runbooks.

### 6.2 Staging Requirements

- Separate Supabase project.
- Mercado Pago sandbox credentials.
- Representative branch/menu/order data.
- Load and chaos tests where safe.
- Observability mirroring production dashboards.

---

## 7. Production Environment Strategy

### 7.1 Production Requirements

Production requires strict access control, branch protection, deployment approval, incident monitoring, backups, audit logging, secret management, and recovery procedures.

### 7.2 Production Rules

- No direct manual mutations except audited break-glass or approved repair workflows.
- Production feature flags default safe.
- Production database migrations require rollback/repair plan.
- Critical alerts page on-call.

---

## 8. Tenant Isolation Infrastructure

### 8.1 Isolation Controls

Tenant isolation is enforced through RLS, tenant-aware queues, tenant-aware logs, scoped realtime channels, scoped storage paths, and tenant-aware dashboards.

### 8.2 Infrastructure Rules

- Observability queries must respect customer/tenant privacy.
- Queue partitions include organization/branch where applicable.
- Realtime channels avoid cross-tenant fan-out.
- Support access is audited and scoped.

---

## 9. Branch Isolation Infrastructure

### 9.1 Branch Partitioning

Branch-scoped workloads include kitchen queues, delivery queues, capacity projections, realtime channels, incident state, and operational dashboard projections.

### 9.2 Failure Rules

A branch queue stall, realtime storm, or incident must trigger branch-local throttling before platform-level degradation.

---

## 10. Regional Scalability Strategy

### 10.1 Initial Strategy

Start with one primary production region aligned with Supabase and main customer geography to minimize database latency and operational complexity.

### 10.2 Future Strategy

Future regional expansion requires data residency review, region-aware Supabase projects or replicas, edge caching, provider region availability, and tenant/branch placement strategy.

---

## 11. Edge Infrastructure Strategy

### 11.1 Edge Use Cases

- Static asset delivery.
- Public menu cache.
- Lightweight redirects.
- Security headers.
- Geo hints where safe.

### 11.2 Edge Limits

Do not execute payment finalization, service-role operations, or complex transactional logic exclusively at the edge.

---

## 12. Vercel Deployment Architecture

### 12.1 Vercel Role

Vercel hosts the Next.js application, route handlers, server actions, edge/static delivery, and preview deployments.

### 12.2 Vercel Rules

- Environment variables scoped by environment.
- Production deployment permissions restricted.
- Preview deployments protected where needed.
- Runtime secrets never exposed as public variables.
- Webhook handlers are idempotent and fast.

---

## 13. Supabase Infrastructure Strategy

### 13.1 Supabase Role

Supabase provides PostgreSQL, Auth, Realtime, Storage, RLS, and operational APIs.

### 13.2 Supabase Rules

- RLS enabled on tenant/customer tables.
- Realtime enabled only on safe tables or projections.
- Storage buckets private by default.
- Backups and PITR strategy reviewed for production plan.
- Database health monitored continuously.

---

## 14. PostgreSQL Scalability Strategy

### 14.1 Scaling Controls

- Correct indexes for branch/status/customer/date filters.
- Projection tables for dashboards.
- Append-only event tables with retention/archive strategy.
- Connection pooling where applicable.
- Query budgets for high-traffic endpoints.

### 14.2 Database Rules

Critical OLTP queries must remain predictable. Analytics workloads should not compete with checkout/order operations.

---

## 15. Realtime Infrastructure Scaling

### 15.1 Scaling Strategy

Realtime subscriptions are scoped by order, branch, or role. High-cardinality operational data uses projections and rate-limited updates.

### 15.2 Rules

- Avoid broad organization-wide raw subscriptions.
- Track connection count and message volume.
- Fall back to polling when realtime is degraded.
- Resync canonical state after reconnect.

---

## 16. Queue Infrastructure Strategy

### 16.1 Queue Classes

- Payment/order critical queues.
- Kitchen/delivery operational queues.
- Notification transactional queues.
- Loyalty queues.
- Analytics queues.
- Maintenance queues.

### 16.2 Queue Rules

Critical queues are isolated from analytics/marketing. Queue records carry tenant, branch, aggregate, idempotency, priority, and retry metadata.

---

## 17. Worker Scaling Strategy

### 17.1 Scaling Inputs

- Queue depth.
- Queue age.
- Processing latency.
- Error rate.
- Branch peak hours.
- Provider rate limits.

### 17.2 Worker Rules

Scale workers by queue class and branch/tenant partitions. Payment workers respect provider limits; analytics workers batch aggressively.

---

## 18. Event Throughput Strategy

### 18.1 Throughput Controls

- Transactional outbox.
- Batch processing for non-critical events.
- Backpressure on analytics and marketing.
- Branch partitions for operational events.
- Replay tooling for missed projections.

### 18.2 Rules

Payment/order events receive priority over dashboard, analytics, recommendation, and marketing events.

---

## 19. Distributed Systems Boundaries

### 19.1 Boundaries

- Commerce/order/payment.
- Kitchen/delivery operations.
- Notifications.
- Loyalty.
- Analytics.
- Admin/support.

### 19.2 Rules

Boundaries communicate through durable events, commands, and scoped APIs. External providers are treated as unreliable.

---

## 20. Service Isolation Strategy

### 20.1 Isolation Levels

- Route handler isolation.
- Worker isolation by queue class.
- Database policy isolation.
- Realtime channel isolation.
- Storage bucket/path isolation.

### 20.2 Rules

One service or queue class degradation must not consume all platform capacity.

---

## 21. Infrastructure Security Boundaries

### 21.1 Boundaries

- Public browser.
- Vercel server runtime.
- Supabase anon/authenticated roles.
- Supabase service role.
- Worker runtime.
- Provider integrations.
- Observability systems.

### 21.2 Rules

Service-role and provider secrets are server-only. Observability access is role-scoped and redacted.

---

## 22. Secret Management Architecture

### 22.1 Secret Controls

- Environment-scoped secrets.
- Least-privilege provider credentials.
- Rotation procedures.
- No secrets in client bundles.
- No secrets in logs.
- Break-glass rotation runbook.

### 22.2 Secret Classes

Supabase service role, database credentials, Mercado Pago keys, webhook secrets, WhatsApp/email credentials, internal signing keys, and observability tokens.

---

## 23. CI/CD Architecture

### 23.1 Pipeline Stages

1. Install dependencies.
2. Lint/typecheck.
3. Unit/component tests.
4. Security/dependency scanning.
5. Build.
6. Migration validation.
7. Preview deployment.
8. E2E/smoke tests.
9. Approval for production.
10. Production deployment.
11. Post-deploy monitoring.

### 23.2 Branch Strategy

Feature branches create previews. Main branch is protected. Production deploys require passing checks and approval.

---

## 24. Deployment Pipeline Strategy

### 24.1 Gates

- TypeScript check.
- Lint.
- Test suite.
- Build.
- Migration dry-run.
- Secret scan.
- Dependency scan.
- Smoke tests.

### 24.2 Rules

Failed checks block deployment. Critical migrations require explicit release notes and rollback plan.

---

## 25. Progressive Deployment Strategy

### 25.1 Strategy

Use feature flags, staged exposure, and scoped branch/tenant rollout for risky changes.

### 25.2 Rules

New checkout, payment, kitchen, and realtime changes should release behind flags where possible.

---

## 26. Canary Release Strategy

### 26.1 Canary Scope

Canaries may target internal users, one branch, one organization, low-traffic windows, or limited percentage traffic.

### 26.2 Canary Metrics

Monitor errors, latency, checkout conversion, payment pending rate, queue lag, realtime reconnects, and support contacts.

---

## 27. Blue/Green Deployment Strategy

### 27.1 Use Cases

Use blue/green concepts for major infrastructure or database-adjacent changes where rollback speed is critical.

### 27.2 Constraints

Database migrations must be backward compatible across blue/green runtime versions.

---

## 28. Rollback Strategy

### 28.1 Rollback Triggers

- Error rate spike.
- Checkout failure spike.
- Payment anomaly.
- Realtime outage caused by release.
- Queue processing stall.
- Severe performance regression.

### 28.2 Rollback Rules

Rollback application code quickly; repair data through forward-only migrations or audited repair jobs when schema/data changed.

---

## 29. Infrastructure as Code Philosophy

### 29.1 Philosophy

Infrastructure configuration should be declarative, reviewed, versioned, and reproducible where provider capabilities allow.

### 29.2 Scope

Vercel settings, environment templates, Supabase migrations/policies, storage bucket policies, monitoring dashboards, alerts, and runbook references should be managed as code or documented configuration.

---

## 30. Build Pipeline Architecture

### 30.1 Build Rules

- Deterministic dependency installation.
- Locked dependency versions.
- Build-time environment validation.
- Public/private env separation checks.
- Bundle budget checks for frontend.

### 30.2 Build Artifacts

Build artifacts must not contain secrets, test data with PII, or source maps exposed in unsafe contexts.

---

## 31. Artifact Management Strategy

### 31.1 Artifact Types

- Application build output.
- Database migration files.
- Test reports.
- Security scan reports.
- Release notes.
- Observability dashboard definitions.

### 31.2 Rules

Artifacts are traceable to commit SHA, environment, release, and deployment actor.

---

## 32. Dependency Governance

### 32.1 Controls

- Lockfiles committed.
- Dependency review.
- Vulnerability scanning.
- License review where needed.
- Upgrade cadence.
- Deprecated package tracking.

### 32.2 Rules

High-risk dependencies used in auth, payments, file handling, or build pipeline require additional scrutiny.

---

## 33. Supply Chain Security

### 33.1 Controls

- Secret scanning.
- Dependency scanning.
- Protected branches.
- Required reviews.
- Build provenance where feasible.
- Minimal CI permissions.

### 33.2 Rules

Production deployment credentials are not available to untrusted PRs or forks.

---

## 34. Runtime Isolation Strategy

### 34.1 Runtime Rules

- Separate server-only code from client code.
- Workers use least-privilege credentials.
- Provider integrations run in controlled server contexts.
- Long-running tasks are queued, not request-bound.

### 34.2 Failure Isolation

Worker failures do not crash customer browsing. Analytics failures do not block checkout.

---

## 35. Distributed Tracing Architecture

### 35.1 Trace Coverage

Trace checkout, payment preference creation, Mercado Pago webhook processing, order paid transition, kitchen dispatch, notification dispatch, loyalty processing, and delivery completion.

### 35.2 Trace Rules

Every trace carries correlation ID, environment, organization/branch where safe, order/payment IDs where safe, and service boundary spans.

---

## 36. Correlation ID Propagation

### 36.1 Propagation Path

Browser request → Vercel route/server action → Supabase transaction/outbox → worker → provider call → webhook/reconciliation → notification/analytics.

### 36.2 Rules

Correlation IDs are generated if missing and persisted on orders, payments, events, queue jobs, logs, and notifications.

---

## 37. Structured Logging Strategy

### 37.1 Log Fields

Timestamp, level, environment, service, route/job, correlation ID, organization, branch, aggregate ID, actor type, latency, retry count, and redacted error details.

### 37.2 Rules

No secrets, raw card data, OTPs, full tokens, or unnecessary PII in logs.

---

## 38. Centralized Logging Architecture

### 38.1 Architecture

Application, worker, database, provider integration, and frontend error logs flow to centralized storage with retention and access controls.

### 38.2 Rules

Logs are searchable by correlation ID, order ID, branch, release version, and incident ID.

---

## 39. Metrics Collection Strategy

### 39.1 Metric Types

- Business metrics.
- Operational metrics.
- Infrastructure metrics.
- Realtime metrics.
- Queue metrics.
- Payment metrics.
- Frontend web vitals.

### 39.2 Rules

Metrics are tagged by environment, release, organization/branch where safe, route/job, and provider.

---

## 40. Realtime Metrics Infrastructure

### 40.1 Metrics

- Active connections.
- Subscriptions by channel class.
- Message volume.
- Reconnect rate.
- Authorization failures.
- Fallback polling activation.
- Stale dashboard duration.

### 40.2 Rules

Realtime metrics drive scaling decisions, incident detection, and cost controls.

---

## 41. Queue Monitoring Architecture

### 41.1 Metrics

Queue depth, oldest age, processing latency, retry rate, DLQ count, worker concurrency, branch partition lag, and provider throttling.

### 41.2 Alerts

Payment/order queue lag pages immediately. Analytics queue lag warns but should not page unless business reporting is critically impacted.

---

## 42. Dashboard Observability Strategy

### 42.1 Dashboards

- Executive uptime/SLO dashboard.
- Checkout/payment reliability dashboard.
- Realtime health dashboard.
- Queue/worker dashboard.
- Branch operations dashboard.
- Kitchen/delivery SLA dashboard.
- Security events dashboard.
- Cost dashboard.

### 42.2 Rules

Dashboards include freshness, environment, release, incident annotations, and clear owner.

---

## 43. Error Tracking Strategy

### 43.1 Error Capture

Capture frontend exceptions, server route errors, worker failures, provider integration failures, database errors, and realtime subscription errors.

### 43.2 Rules

Errors include release version and correlation ID. PII is redacted.

---

## 44. Frontend Observability

### 44.1 Signals

Web vitals, route latency, hydration errors, checkout abandonment, JS exceptions, realtime reconnects, dashboard stale state, and failed user actions.

### 44.2 Rules

Frontend telemetry is sampled and privacy-safe, with higher fidelity for checkout and operational dashboards.

---

## 45. Backend Observability

### 45.1 Signals

API latency, route errors, database query latency, webhook processing time, payment status lag, outbox lag, worker failures, and auth errors.

### 45.2 Rules

Backend telemetry distinguishes customer, staff, admin, webhook, and worker workloads.

---

## 46. Operational Telemetry

### 46.1 Signals

Order acceptance time, kitchen queue age, prep duration, delivery assignment latency, branch pause duration, incident count, ETA accuracy, and staff action latency.

### 46.2 Rules

Operational telemetry feeds branch dashboards and SLOs.

---

## 47. Infrastructure Health Monitoring

### 47.1 Health Checks

- Vercel app health.
- Supabase database health.
- Supabase Realtime health.
- Queue worker health.
- Provider integration health.
- Storage access health.
- Observability ingestion health.

### 47.2 Rules

Health checks differentiate degraded and down states and include customer/branch impact.

---

## 48. SLA/SLO Strategy

### 48.1 SLO Domains

- Customer browsing.
- Cart/checkout.
- Payment confirmation.
- Order tracking realtime.
- Kitchen dashboard updates.
- Queue processing.
- Delivery tracking.

### 48.2 Rules

SLOs are measurable, owned, reviewed, and tied to error budgets.

---

## 49. Error Budget Strategy

### 49.1 Error Budget Use

Error budgets guide release velocity. Repeated SLO breaches reduce risky deployments and prioritize reliability work.

### 49.2 Rules

Checkout, payment, and kitchen operations have stricter budgets than analytics or marketing.

---

## 50. Incident Management Architecture

### 50.1 Incident Components

- Severity levels.
- Incident commander.
- Communications lead.
- Technical leads.
- Runbooks.
- Timeline.
- Postmortem.

### 50.2 Incident Rules

Incidents are tracked with start/end time, impact, mitigation, root cause, follow-ups, and customer/branch communication where needed.

---

## 51. Incident Escalation Flows

### 51.1 Severity Levels

- SEV1: checkout/payment/production outage or data exposure.
- SEV2: major branch operations or realtime degradation.
- SEV3: partial feature degradation.
- SEV4: minor issue or planned follow-up.

### 51.2 Escalation Rules

Payment anomalies, cross-tenant leaks, production outages, and branch-wide fulfillment failures page immediately.

---

## 52. On-Call Strategy

### 52.1 On-Call Roles

- Primary engineer.
- Secondary engineer.
- Product/operations contact.
- Security contact for security incidents.

### 52.2 Rules

On-call rotations require runbooks, dashboard access, escalation contacts, and post-incident review expectations.

---

## 53. Alert Fatigue Prevention

### 53.1 Controls

- Alert on symptoms, not every cause.
- Use severity routing.
- Deduplicate related alerts.
- Include runbook links.
- Tune thresholds after incidents.
- Route non-urgent items to tickets.

### 53.2 Rules

Every paging alert must be actionable.

---

## 54. Operational Runbook Strategy

### 54.1 Required Runbooks

- Checkout outage.
- Payment webhook failure.
- Payment reconciliation anomaly.
- Realtime outage.
- Queue saturation.
- Branch incident.
- Deployment rollback.
- Database restore.
- Secret rotation.

### 54.2 Runbook Format

Symptoms, impact, dashboards, immediate actions, rollback/recovery, escalation, verification, and post-incident tasks.

---

## 55. Disaster Recovery Architecture

### 55.1 DR Goals

Protect order/payment data, restore branch operations, preserve audit trails, recover queue processing, and communicate customer impact.

### 55.2 DR Rules

DR processes must preserve RLS, secrets separation, audit logs, and payment integrity.

---

## 56. Backup Strategy

### 56.1 Backup Scope

PostgreSQL, storage metadata, critical files, configuration, migration history, observability dashboards, and runbooks.

### 56.2 Rules

Backups are encrypted, access-controlled, tested, and aligned with RPO/RTO targets.

---

## 57. Database Recovery Procedures

### 57.1 Recovery Types

- Point-in-time recovery.
- Restore to staging for validation.
- Logical repair.
- Replay event projections.
- Manual audited repair.

### 57.2 Rules

Production restores require incident command approval and validation of RLS, indexes, policies, and data integrity.

---

## 58. Catastrophic Failure Recovery

### 58.1 Scenarios

- Database corruption.
- Provider regional outage.
- Severe deployment failure.
- Secret compromise.
- Data isolation bug.

### 58.2 Actions

Contain, freeze risky operations, preserve evidence, restore from backup or rollback, reconcile payments/orders, replay events, and communicate impact.

---

## 59. Realtime Recovery Strategy

### 59.1 Recovery Rules

- Switch UI to polling fallback.
- Preserve command APIs where safe.
- Display stale state warnings.
- Resubscribe and refetch canonical state after recovery.
- Monitor reconnect storm impact.

---

## 60. Queue Recovery Strategy

### 60.1 Recovery Rules

- Pause poison partitions.
- Preserve unprocessed jobs.
- Scale workers if safe.
- Move exhausted jobs to DLQ.
- Replay idempotently after fix.
- Prioritize payment/order queues.

---

## 61. Replay Recovery Systems

### 61.1 Replay Use Cases

- Rebuild dashboards.
- Repair notifications.
- Reprocess loyalty events.
- Recover missed kitchen/delivery projections.
- Fix analytics lag.

### 61.2 Replay Rules

Replay disables unsafe external side effects unless explicitly approved.

---

## 62. Failover Strategy

### 62.1 Failover Scope

Initial failover focuses on application rollback, provider fallback where possible, polling fallback, queue worker recovery, and database restore readiness.

### 62.2 Future Scope

Regional failover requires data replication, DNS/edge strategy, provider parity, and operational runbooks.

---

## 63. Branch Failure Isolation

### 63.1 Controls

- Branch channel pause.
- Branch queue partitioning.
- Branch-specific degraded mode.
- Branch-scoped dashboards and alerts.
- Branch incident records.

### 63.2 Rules

A failed branch should not degrade checkout, kitchen dashboards, or delivery operations for healthy branches.

---

## 64. Regional Failure Isolation

### 64.1 Initial Reality

With a primary-region database, regional failure may impact platform availability. Mitigation relies on provider SLAs, backups, runbooks, and degraded communication.

### 64.2 Future Controls

Read replicas, multi-region edge cache, region-aware tenants, and standby restore environments.

---

## 65. Degraded Mode Infrastructure

### 65.1 Degraded Modes

- Realtime degraded to polling.
- Delivery paused but pickup active.
- Checkout throttled.
- Analytics delayed.
- Notifications queued.
- Payment pending reconciliation mode.

### 65.2 Rules

Degraded modes are feature-flagged or operationally controllable and visible to staff/customers where relevant.

---

## 66. Offline Operational Resilience

### 66.1 Resilience Rules

Staff dashboards refetch canonical state after reconnect. Offline staff actions are resubmitted as commands and may be rejected if state changed.

### 66.2 Branch Fallback

Branches need manual fallback procedures for active orders during internet/dashboard outages.

---

## 67. Infrastructure Cost Governance

### 67.1 Cost Domains

- Vercel usage.
- Supabase database/realtime/storage.
- Observability ingestion/retention.
- Queue/worker compute.
- Notifications.
- CDN/image optimization.

### 67.2 Rules

Cost dashboards, budgets, alerts, and per-feature cost reviews are required.

---

## 68. Realtime Cost Management

### 68.1 Controls

- Scope channels tightly.
- Use projections.
- Rate-limit high-frequency updates.
- Fall back to polling carefully.
- Monitor connection/message volume.

### 68.2 Rules

Do not stream raw high-cardinality analytics to browsers.

---

## 69. Storage Cost Strategy

### 69.1 Controls

- Image optimization.
- Retention policies.
- Export expiration.
- Archive old event payloads.
- Delete temporary files.

### 69.2 Rules

Payment/audit data retention follows legal/business rules; ephemeral files expire aggressively.

---

## 70. CDN & Caching Strategy

### 70.1 Cache Targets

- Static assets.
- Product images.
- Public menu pages.
- Marketing pages.
- Non-sensitive branch metadata.

### 70.2 Rules

Checkout, cart, payment, account, and staff dashboards require fresh or scoped server-authoritative data.

---

## 71. Asset Optimization Strategy

### 71.1 Asset Controls

- Compressed images.
- Responsive image sizes.
- Font subsetting.
- Script budgets.
- Lazy-loaded non-critical media.

### 71.2 Rules

Premium visuals must not degrade mobile ordering performance.

---

## 72. Image Pipeline Strategy

### 72.1 Pipeline

Upload → validate → optimize → store → serve responsive variants → monitor size/performance.

### 72.2 Rules

Menu media should have approved aspect ratios, alt text guidance, and fallback imagery.

---

## 73. API Rate Protection Infrastructure

### 73.1 Protected Surfaces

Auth, checkout, promo validation, payment preference creation, payment polling, guest tracking, support/admin actions, and webhooks.

### 73.2 Rules

Rate limits include IP/session/user/order/branch dimensions and preserve provider webhook safety through quarantine rather than blind dropping.

---

## 74. DDoS Mitigation Strategy

### 74.1 Controls

- Provider-level DDoS protection.
- CDN/edge caching for public pages.
- Rate limiting.
- Bot challenge for suspicious traffic.
- Traffic shedding for non-critical endpoints.

### 74.2 Rules

Protect checkout/order/payment APIs before analytics and marketing endpoints.

---

## 75. Capacity Planning Strategy

### 75.1 Inputs

Traffic forecasts, branch count, order volume, realtime connections, queue throughput, event volume, image/storage growth, and campaign calendar.

### 75.2 Reviews

Capacity plans are reviewed before major campaigns, new branch launches, and franchise onboarding.

---

## 76. High-Traffic Event Strategy

### 76.1 Preparation

Pre-warm caches, review branch capacity, validate queue workers, verify payment/provider health, enable dashboards, and staff on-call.

### 76.2 During Event

Monitor checkout latency, payment pending rate, queue lag, realtime reconnects, branch saturation, and error budgets.

---

## 77. Peak-Hour Scaling Strategy

### 77.1 Controls

- Worker autoscaling.
- Branch backpressure.
- ETA degradation.
- Delivery throttling.
- Queue priority changes.
- Feature flags for non-critical features.

### 77.2 Rules

Scale infrastructure and reduce demand before operational collapse.

---

## 78. Football Match Surge Strategy

### 78.1 Surge Preparation

Use historical match-day traffic, branch staffing, menu simplification, delivery capacity planning, and campaign throttles.

### 78.2 Surge Rules

Activate rush dashboards, stricter ETA buffers, delivery throttles, and operational on-call coverage.

---

## 79. Viral Campaign Handling

### 79.1 Risks

Traffic spikes, coupon abuse, branch overload, payment retries, notification bursts, and social-driven checkout waves.

### 79.2 Controls

Budget caps, promo rate limits, landing page caching, branch throttles, queue prioritization, and live campaign dashboard.

---

## 80. Load Testing Infrastructure

### 80.1 Load Tests

- Menu browsing.
- Cart mutations.
- Checkout creation.
- Payment webhook bursts.
- Queue throughput.
- Realtime subscriptions.
- Kitchen dashboard concurrency.
- Delivery dashboard concurrency.

### 80.2 Rules

Load tests run against staging/safe environments and use synthetic data.

---

## 81. Chaos Engineering Strategy

### 81.1 Experiments

- Realtime disconnect storm.
- Worker crash.
- Queue overload.
- Delayed Mercado Pago webhook.
- Notification provider outage.
- Database latency spike.
- Branch partition outage.
- Deployment rollback drill.

### 81.2 Rules

Chaos tests are controlled, documented, reversible, and initially non-production.

---

## 82. Reliability Testing Strategy

### 82.1 Reliability Tests

- Idempotent retries.
- DLQ replay.
- Payment reconciliation.
- Realtime fallback.
- Branch isolation.
- Backup restore.
- Migration rollback.

### 82.2 Rules

Reliability tests become release gates for critical subsystems.

---

## 83. Production QA Infrastructure

### 83.1 QA Environments

- Preview for feature QA.
- Staging for integration QA.
- Synthetic production checks for smoke monitoring.

### 83.2 Rules

Synthetic production checks do not create real charges or operational noise.

---

## 84. Infrastructure Auditability

### 84.1 Audit Events

Deployments, environment variable changes, secret rotations, production access, migration runs, manual repairs, backup restores, and incident actions.

### 84.2 Rules

Audit logs are immutable where possible and reviewed after incidents.

---

## 85. Compliance Infrastructure

### 85.1 Controls

Access control, audit logs, retention policies, secure backups, PII redaction, consent data, and data export/deletion workflows.

### 85.2 Rules

Compliance controls are part of infrastructure operations, not only application features.

---

## 86. Data Retention Infrastructure

### 86.1 Retention Domains

Logs, traces, metrics, events, webhooks, exports, storage files, backups, audit records, and analytics raw data.

### 86.2 Rules

Retention is configured per data class with legal/business rationale and cost impact.

---

## 87. Infrastructure Observability UX

### 87.1 UX Requirements

Dashboards must show impact, scope, severity, freshness, owner, runbook link, and recent deployments/incidents.

### 87.2 Rules

On-call should identify customer/branch impact within minutes.

---

## 88. Platform Analytics Infrastructure

### 88.1 Analytics Pipeline

Server events, client events, operational events, payment events, and notification events feed analytics projections and BI dashboards.

### 88.2 Rules

Analytics ingestion is isolated from critical commerce operations and can lag without breaking checkout.

---

## 89. Multi-Branch Scaling Strategy

### 89.1 Scaling Controls

Branch partitions, branch-scoped realtime, branch dashboard projections, branch queue workers, branch health metrics, and branch-level throttles.

### 89.2 Rules

New branch onboarding includes capacity review, configuration validation, operational dashboard setup, and alert routing.

---

## 90. Franchise Scaling Readiness

### 90.1 Readiness Requirements

Tenant isolation, organization-level dashboards, branch templates, role templates, cost attribution, support boundaries, and data governance.

### 90.2 Rules

Franchise expansion should not require copying infrastructure manually.

---

## 91. Multi-Brand Infrastructure Compatibility

### 91.1 Compatibility Controls

Brand-scoped media, theme tokens, menu data, analytics dimensions, notification templates, and operational templates.

### 91.2 Rules

Infrastructure uses organization/brand/branch identifiers rather than hard-coded single-brand assumptions.

---

## 92. Infrastructure Governance Model

### 92.1 Ownership

Every infrastructure component has owner, runbook, dashboard, SLO where relevant, cost center, and escalation path.

### 92.2 Review Cadence

Monthly reliability/cost reviews and pre-launch operational readiness reviews for major releases.

---

## 93. Technical Debt Governance

### 93.1 Debt Classes

Reliability debt, security debt, observability debt, performance debt, cost debt, and documentation debt.

### 93.2 Rules

Critical reliability/security debt blocks launches; lower-severity debt is tracked with owner and due date.

---

## 94. Platform Lifecycle Management

### 94.1 Lifecycle Areas

Runtime versions, dependencies, Supabase migrations, observability dashboards, runbooks, CI images, provider integrations, and feature flags.

### 94.2 Rules

Lifecycle upgrades are planned, tested, and reversible where possible.

---

## 95. Upgrade & Migration Strategy

### 95.1 Migration Rules

- Backward-compatible schema changes first.
- Deploy code supporting old and new states.
- Backfill safely.
- Switch reads/writes.
- Remove old fields later.

### 95.2 Risk Controls

Large migrations use batching, progress tracking, rollback/repair plans, and staging validation.

---

## 96. Operational Documentation Standards

### 96.1 Required Docs

Architecture docs, runbooks, deployment guides, incident postmortems, onboarding guides, SLO definitions, dashboard catalog, and recovery procedures.

### 96.2 Rules

Docs have owners and review dates.

---

## 97. SRE Operational Checklists

### 97.1 Daily/Shift Checks

- Critical dashboards healthy.
- Payment queue normal.
- Realtime health normal.
- Branch incidents reviewed.
- DLQ clean or triaged.

### 97.2 Weekly Checks

- Error budget review.
- Cost review.
- Backup status.
- Alert tuning.
- Runbook gaps.

---

## 98. Launch Readiness Checklist

### 98.1 Launch Gates

- Production secrets configured.
- CI/CD green.
- Migrations tested.
- Monitoring dashboards live.
- On-call schedule active.
- Payment/webhook tests passed.
- Realtime fallback tested.
- Queue/DLQ tested.
- Backup restore tested.
- Rollback drill completed.

---

## 99. Long-Term Scalability Roadmap

### 99.1 Roadmap

1. Postgres-backed outbox and worker foundation.
2. Dedicated queue/broker when outbox lag or retry volume requires it.
3. Data warehouse/BI separation.
4. Advanced realtime projections.
5. Region-aware expansion.
6. Franchise self-service operations.
7. Multi-brand infrastructure templates.

---

## 100. Production Hardening Checklist

### 100.1 Reliability

- [ ] SLOs defined and monitored.
- [ ] Error budgets defined.
- [ ] Critical queues monitored.
- [ ] Realtime fallback implemented.
- [ ] Branch failure isolation tested.

### 100.2 Deployment

- [ ] Protected production deployments enabled.
- [ ] Rollback procedure tested.
- [ ] Migration strategy documented.
- [ ] Feature flags available for risky changes.
- [ ] Post-deploy monitoring checklist active.

### 100.3 Observability

- [ ] Distributed tracing implemented.
- [ ] Correlation IDs propagated.
- [ ] Structured logs centralized.
- [ ] Payment/order dashboards live.
- [ ] Queue/realtime dashboards live.

### 100.4 Disaster Recovery

- [ ] Backups configured and tested.
- [ ] Database recovery procedure documented.
- [ ] Replay recovery procedure documented.
- [ ] Queue recovery procedure documented.
- [ ] Incident command process defined.

### 100.5 Security and Cost

- [ ] Secret rotation procedure tested.
- [ ] Dependency/security scanning enabled.
- [ ] Observability access controlled.
- [ ] Cost budgets and alerts configured.
- [ ] Retention policies configured.

Production release should be blocked if checkout/payment observability, rollback, queue recovery, realtime fallback, backups, secret management, or incident escalation is incomplete.
