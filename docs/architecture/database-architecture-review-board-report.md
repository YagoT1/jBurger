# J Burguer — Independent Database Architecture Review Board Risk Report

## 0. Review Mandate

> **P0 hardening:** The required P0 remediation specification is `docs/architecture/database-hardening-p0-resolution-specification.md`; this report remains blocking until those controls are accepted and reflected in migration specs.

> **Language policy:** This review follows `docs/architecture/language-standard-business-spanish-technical-english.md`: business concepts use Spanish and technical concepts remain English.

This document is a hostile Architecture Review Board assessment of the PostgreSQL/Supabase database architecture, the Wave 1 migration specification, and the foundational database direction before implementation begins.

This is not an approval document. It intentionally focuses only on weaknesses, failure modes, technical debt, security exposure, scale risks, operational risks, consistency risks, compliance gaps, and production failure scenarios.

Reviewed artifacts:

- `docs/architecture/database-implementation-specification.md`
- `docs/architecture/first-migration-set-specification.md`
- `docs/architecture/language-standard-business-spanish-technical-english.md`
- `docs/architecture/implementation-blueprint.md`
- Existing architecture documents referenced by the database and migration specifications.

Severity scale:

| Severity | Meaning |
| --- | --- |
| P0 | Must fix before implementation. |
| P1 | Must fix before production. |
| P2 | Recommended improvement. |
| P3 | Future enhancement. |

Probability scale:

| Probability | Meaning |
| --- | --- |
| High | Likely without explicit mitigation. |
| Medium | Plausible during implementation or scale-up. |
| Low | Less likely but high enough to track. |

---

## 1. Executive Risk Summary

The architecture is not ready to be implemented without additional hardening decisions. The most dangerous gaps are not syntax or table naming issues; they are ambiguity and operational incompleteness in tenant hierarchy, RLS helper semantics, audit immutability enforcement, event replay safety, Supabase realtime scaling boundaries, support access controls, payment idempotency preparation, partitioning timing, storage authorization, and production observability.

The current specifications define intent but leave several critical behaviors under-specified. That creates a high risk that engineers will make inconsistent local decisions during migrations and application implementation.

### 1.1 Highest-risk areas

| Area | Risk |
| --- | --- |
| Multi-tenant hierarchy | `organizacion_padre_id` is insufficient for franquicia/franquiciado access semantics and can create either data leaks or unusable reporting. |
| RLS | Helper functions are described conceptually but not specified enough to prevent privilege escalation, stale permissions, or slow policy execution. |
| Supabase Realtime | Branch-scoped realtime is required, but publication strategy, payload minimization, fan-out limits, and fallback thresholds are incomplete. |
| Audit | Immutability is stated but enforcement path, audit write trust boundary, legal hold mechanics, and audit access logging are not implementation-complete. |
| Events | Outbox and replay exist conceptually, but ordering, locking, dedupe, poison events, schema compatibility enforcement, and replay blast-radius controls are underspecified. |
| Payments | Wave 1 does not force enough primitives for Mercado Pago idempotency, webhook dedupe, reconciliation, refund reviews, charge disputes, or payment state isolation. |
| Operations scale | Kitchen and entrega realtime workloads will stress Supabase Realtime and hot branch queries unless queue projections and rate controls are specified earlier. |
| Data governance | Deletion, anonymization, legal hold, retention classes, and analytics retention are not tied to concrete lifecycle procedures. |
| Observability | Correlation fields are mentioned, but no mandatory database-level operation log, migration telemetry, event lag metrics, RLS denial telemetry, or audit ingestion SLO exists. |

### 1.2 Architecture Review Board position

Final recommendation: **Do not start SQL migrations yet.** Resolve P0 findings and convert P1 findings into tracked implementation requirements before migration authoring begins.

---

## 2. Detailed Findings

The sections below are the detailed hostile findings by review area. Each issue includes severity, probability, impact and recommendation.

## 2. Multi-Tenant Review

### 2.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| MT-01 | `organizacion_padre_id` models hierarchy as a simple tree but does not define franquicia permissions, inherited marca/catalogo ownership, or roll-up reporting boundaries. | P0 | High | Cross-franquicia leakage or blocked legitimate franchisor reporting. | Define explicit hierarchy model: parent-child access rules, reporting-only vs operational authority, and RLS-safe hierarchy helper strategy before migration. |
| MT-02 | `marca_id` on `sucursales` assumes a primary marca; future multi-brand kitchens may need one sucursal serving multiple marcas. | P1 | Medium | Schema refactor when multiple burger brands share one kitchen or branch. | Add explicit `sucursales_marcas` join strategy or document hard constraint that one sucursal equals one marca. |
| MT-03 | Organization consistency is repeatedly stated but not formalized as required composite FK/check strategy. | P0 | High | Cross-tenant FK bugs can silently associate rows from different organizaciones. | Require composite FK patterns or trigger/check helpers for every `(organizacion_id, child_id)` relationship. |
| MT-04 | Slug uniqueness by organizacion does not address global public routing collisions for multi-brand/franchise public URLs. | P2 | Medium | Wrong sucursal/marca public route resolution. | Define public route namespace: global slug, organizacion slug + sucursal slug, or brand domain mapping. |
| MT-05 | Support access is deferred but support role exists in RBAC; this creates a dangerous interim ambiguity. | P0 | High | Developers may grant broad soporte reads to unblock operations. | Wave 1 must create support grant primitives or explicitly prevent soporte from any tenant data until a later audited migration. |
| MT-06 | No tenant lifecycle state machine exists for suspended/franquiciado/offboarded organizaciones. | P1 | Medium | Suspended tenant may still receive realtime, writes, events, notifications, or analytics. | Define organization lifecycle effects across auth, RLS, workers, events, storage, and realtime. |
| MT-07 | `super_admin` platform access is defined but not separated into break-glass vs routine platform operations. | P0 | Medium | Insider risk and unnecessary cross-tenant visibility. | Split `super_admin` into `platform_operator`, `security_admin`, and `break_glass` semantics before production. |
| MT-08 | Franchise roll-up analytics could bypass tenant RLS through analytics aggregates. | P1 | Medium | Aggregated data leakage between franquiciados. | Define aggregation access policy and minimum k-anonymity/redaction rules for franchise-level metrics. |

### 2.2 Multi-tenant risk conclusion

The current multi-tenant design is insufficiently precise for franquicias. The largest risk is not missing tables; it is unclear authority inheritance. Without strict modeling, RLS helpers will either leak data or block required franchisor operations.

---

## 3. Supabase Review

### 3.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| SB-01 | Supabase Realtime fan-out limits are not converted into hard design constraints for cocina and entregas. | P0 | High | Reconnect storms and branch dashboards failing during rush. | Define realtime publication whitelist, payload shape, rate limits, max subscribers per sucursal, and polling fallback thresholds. |
| SB-02 | Supabase Auth metadata/JWT staleness is not addressed for role changes. | P0 | High | Revoked users may retain access until token refresh. | RLS must query database membership for privileged access and deny based on `roles_usuario.estado/expira_at`; JWT claims cannot be authoritative. |
| SB-03 | Storage policies are discussed at architecture level but Wave 1 does not define storage metadata tables or access policy sequencing. | P1 | Medium | Private comprobantes_entrega or audit artifacts can be exposed through signed URL misuse. | Define storage metadata ownership, signed URL TTL rules, and audit access requirements before storage buckets are created. |
| SB-04 | Edge Function trust boundary is not formalized in migrations. | P1 | Medium | Service-role logic spreads across functions with inconsistent authorization/audit. | Define server-only RPC/Edge Function authorization contract and service-role usage registry. |
| SB-05 | RLS performance under Supabase client access is not tested by planned migration gates. | P1 | High | Slow policies cause timeouts or dashboard degradation. | Add query-plan gates for representative RLS queries on perfiles, sucursales, roles_usuario and future pedidos. |
| SB-06 | Vendor lock-in risk around Supabase Realtime and Storage policies is not captured in exit strategy. | P2 | Medium | Future scale may require custom realtime or object storage migration. | Define abstraction boundary for realtime channel naming and storage metadata independent from Supabase implementation. |
| SB-07 | Supabase managed schemas (`auth`, `storage`, `realtime`) can change behavior; dependency assumptions are not versioned. | P2 | Medium | Upgrade or tier changes break auth/storage/realtime assumptions. | Record Supabase version/tier assumptions in ADR and run upgrade compatibility checks. |

---

## 4. RLS Review

### 4.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| RLS-01 | RLS helper functions are named conceptually but not specified for volatility, security definer/invoker, search_path, or leakproof assumptions. | P0 | High | Privilege escalation or unsafe function behavior. | Specify helper function security mode, fixed `search_path`, input validation, indexing assumptions, and test matrix before SQL. |
| RLS-02 | Role hierarchy is not defined; permissions may be duplicated or interpreted inconsistently. | P1 | Medium | Over-permissive roles or broken admin workflows. | Define whether roles inherit, compose, or remain flat; enforce through seeded `permisos_rol`. |
| RLS-03 | `roles_usuario` is both authorization source and tenant membership source; if status logic is inconsistent, all isolation fails. | P0 | High | Tenant data leak or lockout. | Define canonical active membership predicate once and test every edge case: revoked, expired, future-start, deleted organizacion, suspended sucursal. |
| RLS-04 | Support access is acknowledged but not implemented in Wave 1. | P0 | High | Support engineers will demand access and teams may bypass RLS. | Create `accesos_soporte` in Wave 1 or explicitly block support data access with production runbook. |
| RLS-05 | Audit read policies depend on privileged roles but audit access logging cannot be guaranteed at database policy level. | P1 | Medium | Audit records viewed without access log. | Force audit reads through SECURITY DEFINER RPC/Edge endpoint that writes `logs_audit_acceso`; prohibit direct table grants. |
| RLS-06 | RLS policies that join `roles_usuario -> permisos_rol -> permisos` on every row can become expensive. | P1 | High | Query latency and realtime degradation. | Consider materialized permission scope table or cached active permission projection with strict invalidation. |
| RLS-07 | Super-admin bypass semantics are too broad. | P0 | Medium | Insider can access all tenant data without sufficient friction. | Require break-glass grant row with expiry, reason, approver and audit event for cross-tenant reads. |
| RLS-08 | No negative RLS test catalog is specified per table. | P1 | High | Policies regress silently. | Require table-by-table positive/negative tests: own org, other org, own sucursal, other sucursal, revoked role, expired role, anonymous. |

---

## 5. Database Review

### 5.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| DB-01 | Partitioning is deferred or conditional for high-volume event/audit tables; retrofitting partitions later is painful. | P1 | High | Migration downtime, index bloat, retention pain. | Partition `eventos_audit`, `eventos_seguridad`, `outbox_events`, and later analytics from first production migration if expected volume is high. |
| DB-02 | Composite tenant consistency is described but not required for every FK. | P0 | High | Cross-tenant relational corruption. | Mandate composite uniqueness/foreign keys including `organizacion_id` where child table stores organization. |
| DB-03 | JSONB is overused for `settings`, `payload`, `metadata`, `resumen_*` without query/index boundaries. | P1 | High | Unindexable business logic, slow admin/support queries, inconsistent schemas. | Require JSONB field registry with allowed keys, generated columns for queried fields, and schema validation at contract level. |
| DB-04 | No enum strategy is chosen: PostgreSQL enums vs text checks vs lookup tables. | P1 | High | Status drift and hard-to-change enum values. | Decide per category: text+check for early flexibility, lookup tables for governance, PostgreSQL enum only for stable technical states. |
| DB-05 | `updated_at` strategy is referenced but trigger/function behavior is not specified. | P2 | Medium | Incorrect concurrency/debug data. | Define standard updated timestamp mechanism and exceptions for append-only tables. |
| DB-06 | No concurrency strategy for role assignment uniqueness and revocation race conditions. | P1 | Medium | Duplicate active roles or stale permissions. | Add partial unique active assignment constraints and transaction patterns. |
| DB-07 | `event_catalog` in `app_internal` lacks migration-time compatibility enforcement mechanism. | P2 | Medium | Catalog can drift from actual event producers. | Add CI validation to compare event schemas and catalog rows. |
| DB-08 | Search strategy is absent for admin/support lookup. | P2 | Medium | Teams may add ad hoc unbounded ILIKE queries. | Define search projections and indexes before support/admin screens. |
| DB-09 | No explicit vacuum/autovacuum strategy for hot append/update tables. | P2 | Medium | Bloat in outbox, idempotency, sessions, realtime projections. | Define table-level maintenance thresholds for high-churn tables. |
| DB-10 | No uniqueness strategy for public identifiers beyond slugs. | P2 | Medium | Later pedido/tracking identifiers may leak sequence or collide. | Define public reference generation before pedidos migration. |

---

## 6. Audit Review

### 6.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| AU-01 | Audit immutability is policy-level, not enforced by concrete mechanism in the spec. | P0 | High | Audit tampering by privileged path. | Define DB-level immutability guard: restricted grants, triggers/rules, append-only roles, controlled retention worker only. |
| AU-02 | Audit write trust boundary is unclear: who can insert `eventos_audit` and how input is validated. | P0 | High | Fake audit events, missing audit events, or PII leaks. | Require central audit writer function/service with schema validation, redaction and correlation enforcement. |
| AU-03 | Legal hold is a boolean, but legal holds require scope, reason, owner, expiry/release and evidence. | P1 | High | Inability to prove compliance or prevent purge correctly. | Add legal hold registry before production: entity/time/category scope, release workflow, audit trail. |
| AU-04 | Audit access logging is stated but no table is specified in Wave 1 catalog. | P0 | Medium | Reviewers can read audit records without trace. | Add `accesos_audit`/`logs_acceso_audit` in Wave 1 or ban audit read APIs until present. |
| AU-05 | Retention classes are strings without policy table in Wave 1. | P1 | Medium | Inconsistent retention, accidental deletion, legal noncompliance. | Add `politicas_retencion` foundation table or require static governed enum with ADR. |
| AU-06 | `logs_audit` projection may diverge from `eventos_audit`. | P2 | Medium | Investigations see incomplete/inconsistent evidence. | Define rebuild job, consistency check and projection lag metric. |
| AU-07 | `resumen_antes`/`resumen_despues` can leak sensitive PII or payment data. | P1 | Medium | Compliance/privacy breach. | Define redaction schema and forbidden fields for audit summaries. |

---

## 7. Event Architecture Review

### 7.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| EV-01 | Outbox worker claiming strategy is not defined. | P0 | High | Duplicate publishes or stuck events under concurrency. | Specify SKIP LOCKED/advisory lock strategy, status transitions, max attempts, dead-letter behavior. |
| EV-02 | No event ordering guarantee per aggregate is defined. | P1 | High | Consumers process `pedido.cancelado` before `pedido.creado`. | Define per-aggregate ordering key and consumer behavior for out-of-order events. |
| EV-03 | Replay operations lack blast-radius controls. | P0 | Medium | Replay corrupts pagos, reembolsos, notificaciones or analytics. | Require dry-run count, approval, scope limits, idempotency proof, and per-consumer replay opt-in. |
| EV-04 | `idempotency_keys` uniqueness with nullable `organizacion_id` is risky. | P1 | Medium | Platform-scope duplicate keys if NULL uniqueness behavior is misunderstood. | Use explicit non-null scope namespace or generated organization key sentinel. |
| EV-05 | Poison event handling is unspecified. | P1 | High | Worker repeatedly fails and blocks event lane. | Add dead-letter status, quarantine table/projection, alert thresholds and replay policy. |
| EV-06 | Event schema compatibility is in docs but not enforced at DB/CI boundary. | P1 | Medium | Producers publish payloads consumers cannot parse. | Add schema hash validation and CI contract checks before deployment. |
| EV-07 | Consumer offsets per event can grow unbounded. | P2 | Medium | Storage/index growth. | Define retention/compaction for processed offsets and consumer checkpoint strategy. |
| EV-08 | No explicit exactly-once/at-least-once semantics statement per side effect. | P1 | High | Teams assume wrong delivery guarantees. | State outbox is at-least-once; every consumer must be idempotent. |

---

## 8. Payment Preparation Review

### 8.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| PAY-01 | Wave 1 does not create provider webhook dedupe primitives despite payments being a critical future integration. | P1 | High | Mercado Pago duplicate webhooks produce duplicate state transitions. | Add generic provider idempotency/dedupe foundation or require in pagos migration before any payment tests. |
| PAY-02 | No charge dispute/claim model is anticipated. | P2 | Medium | Mercado Pago disputes handled outside system or in support notes. | Add future `disputas_pago` concept to database spec before payments implementation. |
| PAY-03 | Refund approvals rely on audit but no approval workflow primitives exist in Wave 1 beyond generic audit records. | P1 | Medium | Reembolso approval inconsistent and hard to prove. | Define review-case foundation or ensure `revisiones_reembolso` in pagos migration has mandatory audit linkage. |
| PAY-04 | Money conventions exist, but no invariant ensures same `codigo_moneda` across pedido/pago/reembolso later. | P1 | Medium | Financial reconciliation errors. | Require composite financial checks in pagos migration and test fixtures. |
| PAY-05 | Payment retry semantics are not specified at foundation level. | P2 | Medium | Duplicate payment attempts or blocked checkout recovery. | Define retry/idempotency state machine before finalizacion_compra/pagos migrations. |
| PAY-06 | Provider payload redaction and retention are not fully specified. | P1 | Medium | PII/provider data retained too long or exposed to support. | Define Mercado Pago payload classification, retention and redaction policy before integration. |

---

## 9. Restaurant Operations Review

### 9.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| OPS-01 | Cocina queue projections are future work, but foundational realtime/index decisions may constrain them. | P1 | High | Hot branch queries fail during lunch/dinner peaks. | Specify queue projection table shape and branch/status/priority index requirements before pedidos/cocina migrations. |
| OPS-02 | No surge mode data model exists for sucursal overload. | P2 | Medium | Manual overrides proliferate during rush. | Add future `modo_operativo_sucursal` state machine and audit requirements. |
| OPS-03 | Delivery peaks require dispatch batching/geospatial lookup but zones are JSONB. | P2 | Medium | Slow delivery eligibility queries. | Decide PostGIS adoption before high-volume delivery. |
| OPS-04 | Realtime reconnection storm controls are not concrete. | P1 | High | Operations panels become unusable during network/provider incident. | Define client backoff, server throttling, channel partitioning and poll fallback. |
| OPS-05 | Multi-branch supervisors may need cross-branch queues; RLS and indexes focus on single branch. | P2 | Medium | Inefficient dashboards or overbroad permissions. | Define multi-sucursal operational scope and indexes. |
| OPS-06 | Operational overrides can become primary workflow if normal flows are incomplete. | P1 | Medium | Data inconsistency masked as manual corrections. | Limit override types and require linked incident/reason/approval thresholds. |

---

## 10. Security Review

### 10.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| SEC-01 | `super_admin` is too powerful and under-constrained. | P0 | Medium | Platform-wide data breach through insider or compromised account. | Break into scoped platform roles and enforce break-glass expiry/reason/approval. |
| SEC-02 | Session model stores hashes but no session revocation propagation semantics are defined. | P1 | Medium | Revoked sessions keep access through Supabase JWT. | Define forced token refresh/revocation strategy and RLS DB checks. |
| SEC-03 | No MFA/step-up requirement for high-risk permissions. | P1 | Medium | Refunds, permissions and audit exports vulnerable after account compromise. | Add step-up requirement to sensitive permission policy. |
| SEC-04 | Permission seeding is deterministic but no permission change approval gate is specified. | P1 | Medium | Dangerous permissions added casually. | Require ADR/security review for P1/P0 risk permissions. |
| SEC-05 | Support abuse is not controlled by purpose-bound grant table in Wave 1. | P0 | High | Support role becomes universal read role. | Add support grant model or deny all support tenant access until implemented. |
| SEC-06 | Storage access is not tied to RLS foundation in Wave 1. | P1 | Medium | Private artifacts leak through object path or signed URL. | Add storage metadata/policy plan before private uploads. |
| SEC-07 | No secret access audit model for service-role operations. | P2 | Medium | Hard to investigate misuse of service role. | Add operational audit around service-role endpoints and worker actions. |

---

## 11. Observability Review

### 11.1 Missing components

| ID | Gap | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| OBS-01 | No database migration telemetry standard. | P1 | Medium | Failed/slow migrations hard to diagnose. | Require migration execution logs with version, duration, actor, environment and checks. |
| OBS-02 | No RLS denial metrics. | P1 | Medium | Tenant leak attempts or broken policies are invisible. | Add app-level instrumentation for RLS denials and permission denials. |
| OBS-03 | No outbox lag SLO. | P1 | High | Events silently delayed, kitchen/delivery/notifications stale. | Define event lag metrics by event_name and consumer. |
| OBS-04 | No audit ingestion completeness metric. | P1 | Medium | Audit gaps discovered after incident. | Track audit write failures and mandatory-event coverage. |
| OBS-05 | No realtime health dashboard by sucursal. | P1 | High | Operations incident blind spots. | Track subscribers, reconnects, message rate and lag per sucursal/channel. |
| OBS-06 | No payment reconciliation lag metric defined before payments. | P2 | Medium | Delayed payment anomalies. | Add planned metric requirement to pagos implementation gate. |
| OBS-07 | No postmortem data contract for incident records. | P2 | Medium | Incidents lack required evidence. | Define required incident fields, timeline events, linked audit/event IDs. |

---

## 12. Data Governance Review

### 12.1 Findings

| ID | Issue | Severity | Probability | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| DG-01 | Retention classes exist as strings but no enforcement schedule or policy table is mandatory in Wave 1. | P1 | High | Retention policy not enforceable. | Add `politicas_retencion` or static governed retention registry before production. |
| DG-02 | Legal hold boolean is insufficient. | P1 | High | Legal hold cannot be scoped, released, or audited properly. | Add legal hold registry and release workflow. |
| DG-03 | Deletion/anonymization workflows are not tied to `auth.users`, perfiles, audit and analytics. | P1 | Medium | Privacy requests handled inconsistently. | Define privacy deletion/anonymization model before customer launch. |
| DG-04 | Analytics raw event retention is not constrained in Wave 1. | P2 | Medium | PII over-retention. | Define privacy classification and TTL before analytics ingestion. |
| DG-05 | Audit preservation conflicts with privacy deletion are not resolved. | P1 | Medium | Legal/privacy conflict during deletion request. | Define pseudonymization strategy for audit references. |
| DG-06 | Cross-franchise analytics governance is undefined. | P1 | Medium | Franquiciado sees competitor/franchisee data. | Define franchise analytics scopes and aggregation rules. |

---

## 13. Production Failure Scenarios

| # | Scenario | Root Cause | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- | --- |
| 1 | Tenant data leak between organizaciones. | Missing composite FK or faulty RLS helper. | Confidential data exposure. | Medium | Composite tenant constraints and negative RLS tests. |
| 2 | Sucursal staff sees another sucursal queue. | Branch predicate missing in realtime projection. | Operational breach. | Medium | Branch-scoped channels and RLS tests. |
| 3 | Revoked admin still accesses data. | JWT stale and RLS trusts claims. | Privilege escalation. | High | DB membership checks and short-lived privileged grants. |
| 4 | Soporte reads all clientes. | Support role seeded without purpose grant. | Insider/privacy breach. | High | Purpose-bound support grants or deny-by-default. |
| 5 | Super admin account compromise. | Broad super_admin role. | Platform-wide breach. | Medium | Break-glass role with MFA, expiry, approval. |
| 6 | Audit gap during permission change. | RBAC mutation path does not write audit. | Compliance failure. | Medium | Central permission change function and audit test. |
| 7 | Audit tampering. | Privileged role can update/delete audit rows. | Legal evidence invalid. | Low/Medium | DB-level immutability controls. |
| 8 | Audit access not logged. | Direct table grants to audit readers. | Investigation blind spot. | Medium | Read only through audited endpoint. |
| 9 | Outbox duplicate publish. | Worker claim race. | Duplicate notifications/payment side effects. | High | SKIP LOCKED claim and idempotent consumers. |
| 10 | Outbox stuck behind poison event. | No dead-letter status. | Event pipeline outage. | High | Dead-letter/quarantine and alert. |
| 11 | Replay corrupts pagos. | Replay lacks scope/idempotency checks. | Financial inconsistency. | Medium | Approved scoped replay with dry-run. |
| 12 | Event consumer parses wrong schema. | Schema hash not enforced. | Consumer crash/data loss. | Medium | Contract CI and schema hash validation. |
| 13 | Mercado Pago duplicate webhook later creates duplicate pago transition. | Provider dedupe not foundational. | Double fulfillment/refund confusion. | High | Provider dedupe and idempotency constraints. |
| 14 | Reembolso approved without required authority. | Permission model too coarse. | Financial loss. | Medium | High-risk permission + step-up + audit. |
| 15 | Payment reconciliation impossible. | Provider payload redacted incorrectly or not retained. | Financial audit failure. | Medium | Retention/redaction policy before integration. |
| 16 | Cocina dashboard outage during rush. | Realtime fan-out and hot queries. | Branch operational failure. | High | Queue projections, rate limits, fallback polling. |
| 17 | Delivery assignment stale. | Realtime reconnect storm and no canonical refetch. | Late deliveries/customer complaints. | Medium | Reconnect refetch and channel health metrics. |
| 18 | Sucursal pause not respected. | Operational status not enforced in order flow. | Orders accepted while closed. | Medium | Central availability check and audit. |
| 19 | Franchise reporting leaks branch data. | Parent hierarchy permissions too broad. | Legal/commercial breach. | Medium | Reporting-only aggregate views. |
| 20 | RLS policy causes query timeouts. | Per-row permission joins. | App outage. | High | Permission projection/cache and query plan gates. |
| 21 | JSONB settings become ungoverned business logic. | No schema for settings keys. | Maintenance debt and bugs. | High | JSONB registry and generated columns. |
| 22 | Retention purge deletes legal evidence. | Legal hold is boolean/incomplete. | Legal exposure. | Medium | Legal hold registry. |
| 23 | Privacy deletion removes needed audit references. | No pseudonymization policy. | Compliance conflict. | Medium | Pseudonymized durable entity references. |
| 24 | Storage proof leaked. | Signed URL or bucket policy too broad. | Privacy/security incident. | Medium | Private metadata-backed policies and short TTL. |
| 25 | Migration partially applies in production. | No migration telemetry/repair playbook. | Broken foundation state. | Low/Medium | Preflight, transaction boundaries, forward repair plan. |
| 26 | Base permission seed changes unexpectedly. | Non-idempotent seed migration. | Role drift across environments. | Medium | Deterministic seed with checksums. |
| 27 | Idempotency key collision/null issue. | Nullable `organizacion_id` uniqueness semantics. | Duplicate command execution. | Medium | Non-null scope namespace. |
| 28 | Analytics over-retains PII. | No retention enforcement. | Privacy violation. | Medium | TTL by classification before ingestion. |
| 29 | Incident postmortem lacks evidence. | No required observability correlation. | Repeated incidents. | Medium | Required correlation IDs and incident record contract. |
| 30 | Worker uses service role too broadly. | No service-role registry or scoped RPC. | Silent tenant bypass. | Medium | Narrow service functions and service-role audit. |

---

## 14. Gap Analysis

| Gap | Required Before Implementation | Required Before Production |
| --- | --- | --- |
| Tenant hierarchy semantics | Define franquicia/franquiciado authority model. | Test hierarchy RLS and analytics roll-ups. |
| RLS helper specification | Define exact security mode, predicates, indexes and tests. | Run negative/positive RLS suite in CI. |
| Support access model | Add support grant table or deny by policy. | Purpose-bound audited support workflows. |
| Audit immutability | Define DB enforcement. | Validate tamper-resistance and access logging. |
| Event worker semantics | Define claim/retry/dead-letter/replay strategy. | Load test outbox and consumers. |
| Supabase Realtime limits | Define publication strategy and fallback. | Branch-level realtime SLO dashboards. |
| Retention/legal hold | Define registry and policy model. | Run retention dry-run and legal hold tests. |
| Payment readiness | Define provider dedupe/reconciliation primitives. | Mercado Pago sandbox load/replay tests. |
| Observability | Define migration, RLS, outbox, audit, realtime metrics. | Alerting and runbooks. |

---

## 15. Critical Risks

Critical risks are the findings classified as P0 and P1. P0 blocks implementation; P1 blocks production. The required changes section below converts those critical risks into mandatory remediation work.

## 16. Required Changes

### 15.1 P0 — Must fix before implementation

1. Define exact RLS helper function semantics, security mode, `search_path`, volatility, and test matrix.
2. Define composite tenant consistency enforcement for all `organizacion_id` relationships.
3. Define franquicia/franquiciado authority and reporting model before hierarchy migrations.
4. Add or explicitly defer-with-deny support access grant model; do not seed broad soporte access.
5. Split or constrain `super_admin` with break-glass semantics.
6. Define DB-level audit immutability enforcement.
7. Define audit write trust boundary and redaction rules.
8. Define outbox worker claim/retry/dead-letter semantics.
9. Define replay blast-radius controls.
10. Define Supabase Realtime publication/fan-out/fallback limits for cocina and entregas.

### 15.2 P1 — Must fix before production

1. Add retention policy and legal hold registry.
2. Add audit access logging table/path.
3. Add RLS performance tests with representative data volume.
4. Define storage metadata and signed URL policy for private assets.
5. Define Mercado Pago provider dedupe and reconciliation requirements.
6. Define event schema compatibility enforcement in CI.
7. Define observability metrics for outbox lag, audit gaps, RLS denials and realtime health.
8. Define customer privacy deletion/anonymization flow.
9. Define JSONB governance and indexed field rules.
10. Define high-risk permission step-up/MFA policy.

### 15.3 P2 — Recommended improvement

1. Decide PostGIS adoption timing for zonas_entrega_sucursal.
2. Define search projections for admin/support.
3. Define vacuum/autovacuum strategy for hot tables.
4. Add public identifier generation strategy for future pedidos.
5. Add multi-sucursal supervisor scope.
6. Define analytics aggregation rules for franquicias.

### 15.4 P3 — Future enhancement

1. Custom realtime service abstraction if Supabase Realtime limits are exceeded.
2. Warehouse offload for high-volume analytics.
3. Advanced fraud scoring tables.
4. Multi-region read strategy.
5. Automated policy diff visualizer.

---

## 17. Architecture Scorecard

| Category | Score 0-10 | Reason for score |
| --- | --- | --- |
| Multi-tenant readiness | 5 | Basic organizacion/sucursal model exists, but franquicia semantics and composite tenant enforcement are under-specified. |
| Security | 4 | RBAC intent exists, but support access, super_admin, JWT staleness, MFA and service-role boundaries are incomplete. |
| Scalability | 4 | Indexes are listed, but realtime fan-out, partitions, hot tables and RLS performance are not sufficiently specified. |
| Auditability | 5 | Audit tables are planned, but immutability, legal hold, audit access logging and redaction are incomplete. |
| Event architecture | 4 | Outbox exists conceptually, but worker semantics, replay controls, dead-letter handling and schema enforcement are missing. |
| Supabase compatibility | 5 | Supabase concepts are recognized, but auth token staleness, realtime limits, storage policy risks and vendor-lock boundaries are not hardened. |
| Operational readiness | 4 | Kitchen/delivery future load is acknowledged but lacks queue projection, realtime degradation and surge controls. |
| Payment readiness | 3 | Mercado Pago is expected, but foundational webhook dedupe, dispute, retry and reconciliation requirements are not strong enough. |

Overall risk score: **High**.

---

## 18. Final Recommendation

Do not approve implementation of Wave 1 migrations yet.

The architecture should be treated as incomplete until the P0 findings are resolved in the migration specification and database implementation specification. The review board position is that the current documents provide useful direction but leave too many security, tenant isolation, audit, event replay, Supabase realtime, and payment-readiness decisions to future implementers.

Minimum approval gate before SQL migration authoring:

1. P0 findings resolved and documented.
2. P1 findings converted into tracked production-readiness requirements with owners.
3. RLS helper semantics and test matrix approved.
4. Audit immutability and access logging path approved.
5. Event outbox/replay worker semantics approved.
6. Supabase Realtime scale strategy approved.
7. Support/super-admin access model approved.
8. Tenant/franchise hierarchy model approved.

Until then, migration implementation should remain blocked.
