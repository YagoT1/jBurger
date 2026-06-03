# J Burguer — Definitive Engineering Standards and Delivery Governance Blueprint

> **Language policy:** Business language is Spanish and technical language remains English, aligned with the approved architecture corpus.

> **Implementation status:** Architecture is frozen. This document is the canonical engineering governance framework for implementation consistency, delivery quality, release safety, and long-term maintainability. It does **not** generate code, CI pipelines, GitHub Actions, implementation details, or visual designs.

## 0. Governance mission

This blueprint makes architectural drift nearly impossible by defining mandatory engineering standards, review boards, quality gates, CI/CD governance, pull request evidence, definitions of ready/done, anti-patterns, release governance, KPIs, and RACI ownership across Frontend, Backend, Database, Security, QA, DevOps, Product, UX/UI, Operations, and Support.

### 0.1 Frozen architecture rule

| Rule | Requirement |
| --- | --- |
| Architecture source of truth | Approved architecture documents are binding for scope, navigation, components, tokens, events, database, security, frontend, UX/UI, and operations behavior. |
| No silent divergence | Any implementation that deviates from approved architecture requires a documented exception before merge. |
| Evidence over intent | PRs must include concrete evidence: tests, accessibility checks, screenshots where UI changed, telemetry/audit mapping, security validation, and migration proof when applicable. |
| Least privilege delivery | Every feature must prove permission, RLS, audit, PII, and support-access behavior before release. |
| Operational readiness | Customer, cocina, entrega, soporte, analytics, and admin operational states must be observable and recoverable. |

## 1. Engineering governance model

| Review board | Responsibilities | Approval authority | Escalation process | Exception process |
| --- | --- | --- | --- | --- |
| Architecture Review Board | Protect frozen architecture, domain boundaries, event contracts, dependency rules, and cross-platform consistency. | Approves architecture exceptions, new domains, cross-cutting patterns, and breaking contract changes. | Escalate unresolved conflicts to Principal Architect + Engineering Manager + Product owner. | Requires written deviation, alternatives considered, risk, rollback, and sunset/remediation plan. |
| Frontend Review Board | Enforce frontend architecture, component inventory, token contracts, routing, data access, realtime, accessibility, telemetry, and Storybook standards. | Approves frontend patterns, component adoption, app-shell changes, route structure changes. | Escalate to Architecture Review Board if pattern affects multiple apps/domains. | Requires component/contract mapping and proof no duplicate component is introduced. |
| Backend Review Board | Enforce domain/service/repository/command/query/event/API/webhook standards. | Approves backend contracts, service boundaries, transaction patterns, API changes. | Escalate to Architecture Review Board for domain/event breaking changes. | Requires backward compatibility plan or versioned rollout. |
| Security Review Board | Enforce auth, authorization, RLS, audit, PII, secrets, support access, break glass, threat modeling. | Blocks releases for security/privacy/access risks. | Escalate to executive sponsor for accepted-risk sign-off only after mitigation plan. | Requires risk acceptance, expiry, owner, monitoring, and compensating controls. |
| Design System Review Board | Enforce approved tokens, components, variants, visual consistency, accessibility contract, and deprecation. | Approves token/component/variant changes and visual exceptions. | Escalate to Architecture Review Board for new component governance exception. | Requires design-token/component proposal and affected-screen inventory. |
| QA Review Board | Enforce test strategy, coverage, regression evidence, E2E scope, release quality, and defect severity. | Approves QA readiness and release candidate sign-off. | Escalate blocking defects to Release Review Board. | Requires explicit risk acceptance and post-release validation plan. |
| Release Review Board | Owns release readiness, deployment approvals, rollback readiness, monitoring, hotfixes, and post-release review. | Final production release authority. | Escalate launch/no-launch decisions to Engineering Manager + Product + Operations. | Requires time-boxed exception, rollback trigger, monitoring owner, and remediation issue. |

## 2. Frontend engineering standards

| Standard area | Allowed patterns | Forbidden patterns | Examples of violations |
| --- | --- | --- | --- |
| Folder standards | Apps own routes/shells; domains own business contracts; packages own UI/platform utilities; features coordinate vertical workflows. | Shared dumping grounds, app-to-app imports, domain logic inside components. | `components/misc`, importing admin route code into customer app. |
| Feature standards | Feature slices orchestrate screens, queries, mutations, telemetry, and permissions. | Feature modules becoming global utility libraries. | Checkout feature exporting generic date helpers. |
| Component standards | Use approved UI Component Inventory and component contracts. | Invented one-off components, duplicated tables/cards/modals, raw styles. | `SpecialProductCard`, `AdminTable2`, hardcoded color button. |
| Hook standards | Hooks encapsulate UI coordination, query composition, or browser APIs with clear ownership. | Hooks that hide authorization, mutate unrelated domains, or call Supabase directly from UI. | `useEverythingDashboard`, `useAdminRoleBypass`. |
| Provider standards | Providers are app-shell concerns for theme, auth session, query client, telemetry, feature flags. | Deep nested domain providers without lifecycle control. | Per-card query provider. |
| Query standards | TanStack Query owns server state; keys are stable, scoped, and permission-aware. | Global state for server data, ad hoc fetches in components, unscoped query keys. | `queryKey: ['orders']` without tenant/sucursal scope. |
| Mutation standards | Mutations are command-based, idempotent where needed, optimistic only with rollback. | Direct writes from presentational components, no error recovery. | Payment retry without idempotency key. |
| Realtime standards | Realtime subscriptions define owner, stale behavior, reconnect, fallback polling, and conflict resolution. | Silent disconnects, uncontrolled subscriptions per row/card. | Kitchen queue loses realtime with no banner. |
| Telemetry standards | Events use approved taxonomy, no PII, include screen/component/action/result. | Console-only analytics, raw customer data in events. | Sending phone/email in product event. |
| Accessibility standards | WCAG AA minimum, keyboard/focus/screen-reader/reduced-motion contracts implemented. | Unlabelled icon actions, focus traps, color-only status. | Icon-only delete button without accessible name. |
| Storybook standards | Components have stories for variants, states, responsive, accessibility, and dark/light modes. | Only happy-path stories, missing error/empty/forbidden states. | ProductCard story without sold-out/stale states. |
| Testing standards | Unit, integration, interaction, accessibility, visual regression, and E2E where journey-critical. | Snapshot-only testing, no user-event assertions. | Checkout tested only by render snapshot. |
| Naming standards | PascalCase components, `useX` hooks, Spanish business terms for domain concepts, technical English for framework terms. | Ambiguous names, numbered components. | `ThingPanel`, `CardNew2`. |
| Import standards | Respect dependency direction; use package/domain public APIs. | Deep imports across boundaries, circular dependencies, try/catch around imports. | `../../../../domains/pedidos/internal`. |
| Dependency standards | Approved packages only, shared utilities only when truly cross-cutting. | Duplicate libraries, unvetted UI kits, domain dependency from foundation package. | Adding second chart library without review. |

## 3. Backend engineering standards

| Standard area | Allowed patterns | Forbidden patterns | Examples of violations |
| --- | --- | --- | --- |
| Domain standards | Domains own business rules, commands, queries, events, invariants. | Cross-domain writes without commands/events. | Checkout directly updating delivery assignment. |
| Service standards | Services coordinate use cases and enforce authorization/audit boundaries. | Fat controllers, services returning raw database rows. | API handler contains full refund workflow. |
| Repository standards | Repositories encapsulate persistence and return typed domain/read models. | SQL scattered across services/controllers/UI. | Support endpoint querying orders inline. |
| Command standards | Commands are intent-based, validated, authorized, transactional where needed. | Generic update endpoints for sensitive state. | `PATCH /orders/:id { status:any }`. |
| Query standards | Queries are read-optimized, scoped, permission-aware, and safe for caching. | Overfetching PII, unscoped organization reads. | Customer query returns all branch orders. |
| Event standards | Events use approved names/payloads, are idempotent, versioned for breaking changes. | Unversioned payload changes, event as RPC substitute. | Renaming `pedido_estado_cambiado` without migration. |
| Transaction standards | Transactions protect invariants; external side effects occur after durable state/outbox. | Payment/webhook side effects inside fragile partial transaction. | Sending notification before order state commits. |
| Audit standards | Sensitive actions write immutable audit with actor, scope, resource, action, reason, result. | Best-effort audit after response, missing reason. | Break-glass approval without audit record. |
| Authorization standards | Centralized policy checks, least privilege, scope-aware. | UI-only authorization, role string checks in controllers. | `if role === 'admin'` in endpoint. |
| RLS standards | RLS is mandatory for tenant/customer/staff scoped data. | Service role bypass without compensating controls. | Support activity query using unrestricted service key. |
| API standards | Stable contracts, validation, typed errors, pagination, idempotency for critical commands. | Raw exceptions, unlimited lists, ambiguous errors. | Checkout submit returns 500 without recovery code. |
| Webhook standards | Verify signature, idempotency, replay protection, durable processing. | Trusting provider payload blindly. | Mercado Pago webhook updates order twice. |
| Notification standards | Channels are async, retryable, observable, and never the source of truth. | Blocking order flow on WhatsApp/email. | Payment success waits for email provider. |
| Naming standards | Business Spanish for domains/events, technical English for infrastructure. | Mixed/ambiguous names. | `burgerDoneEvent` instead of canonical pedido/cocina event. |

## 4. Database standards

| Standard area | Standard |
| --- | --- |
| Schema standards | Schemas are organized by domain/security/analytics/audit boundaries and documented with ownership. |
| Table standards | Tables have primary keys, tenant/scope fields where required, timestamps, lifecycle/status fields, comments for sensitive/business-critical tables. |
| Column standards | Columns use explicit types, constraints, defaults, nullability decisions, and PII classification where applicable. |
| Index standards | Indexes match query patterns, RLS predicates, foreign keys, event/outbox scans, and operational dashboards; unused indexes are reviewed. |
| Constraint standards | Database constraints enforce invariants that must never be violated: uniqueness, foreign keys, checks, status domains. |
| Migration standards | Migrations are forward-only, reviewed, reversible by follow-up migration, tested on representative data, and include backfill/lock analysis. |
| RLS standards | Every scoped table requires RLS policy tests for cliente, staff, support, platform, and forbidden cross-tenant access. |
| Audit standards | Audit tables are append-only, immutable to application roles, searchable by actor/resource/time/scope. |
| Event standards | Outbox/event tables use idempotency keys, status, retry count, timestamps, and dead-letter strategy. |
| Naming standards | Lowercase snake_case, Spanish business domain names where canonical, consistent id/timestamp suffixes. |
| Data retention standards | Retention and deletion policies define PII lifecycle, audit retention, analytics aggregation, support case retention, and legal hold exceptions. |

## 5. Design system governance

| Process | Standard |
| --- | --- |
| Component approval | New/changed components require Design System, Frontend Platform, Accessibility, QA, and domain approval; must map to Component Inventory or governance exception. |
| Token approval | Token changes require purpose, contrast proof, dark/light behavior, affected components/screens, and fallback strategy. |
| Variant approval | Variants require demonstrated reusable need across screens or states; one-screen variants are rejected unless exception-approved. |
| Deprecation process | Replacement, migration path, consumer list, deadline, visual regression evidence, and removal plan required. |
| Visual review | PRs with perceptible UI changes require screenshots or visual regression evidence for mobile/desktop and light/dark if supported. |
| Accessibility review | All interactive/feedback/navigation components require keyboard, screen reader, focus, contrast, and reduced motion validation. |
| Forbidden visual patterns | Hardcoded colors, arbitrary spacing, unapproved typography, unapproved variants, raw shadows, magic z-index, icon-only unlabeled actions, color-only statuses, modal stacks, non-tokenized responsive behavior. |

## 6. Accessibility standards

| Area | Standard |
| --- | --- |
| WCAG target | WCAG 2.2 AA minimum; critical operations and support/security warnings target enhanced readability where feasible. |
| Keyboard requirements | All workflows are keyboard complete; composite widgets follow expected arrow/escape/home/end behavior; destructive shortcuts require confirmation. |
| Focus requirements | Visible focus token required; overlays trap and restore focus; realtime updates never steal focus. |
| Screen reader requirements | Names, roles, values, errors, live updates, chart/map alternatives, and status changes are exposed correctly. |
| Reduced motion requirements | Nonessential motion disabled; realtime updates use static highlights/text under reduced motion. |
| Color contrast requirements | Text ≥ 4.5:1, large text ≥ 3:1, focus indicators ≥ 3:1, critical operations labels target ≥ 7:1 where feasible. |
| Form requirements | Labels, helper text, autocomplete, grouped controls, field-level errors, and ErrorSummary for multi-field forms. |
| Error handling requirements | Error messages identify problem and recovery; errors are reachable by keyboard and announced. |
| Accessibility testing requirements | Automated checks, keyboard walkthrough, screen reader smoke test, contrast validation, reduced motion validation, and E2E checks for critical journeys. |

## 7. Security engineering standards

| Area | Standard |
| --- | --- |
| Authentication standards | Use approved auth provider/session model; enforce secure redirects, MFA where required, and reauth for sensitive actions. |
| Authorization standards | Central policy enforcement with role, permission, tenant, sucursal, and ownership scope; UI gating is advisory only. |
| Session standards | Secure cookies/tokens, expiry, revocation, session listing, elevated-session watermarking. |
| Token standards | Tokens are scoped, time-bound, signed/validated, never logged, and rotated/revoked when compromised. |
| Secrets standards | Secrets live only in approved secret stores; never in repo, logs, telemetry, client bundles, or screenshots. |
| PII standards | Minimize, mask by default, reveal through approved gates, classify fields, define retention/deletion. |
| Audit standards | Security-sensitive reads/writes, support access, break glass, role/permission changes, exports, and operational exceptions are audited. |
| Logging standards | Logs exclude secrets/PII/payment-sensitive data and include correlation IDs, actor scope, and error codes. |
| Break Glass standards | Requires incident link, reason, approval, expiry, watermark, immutable audit, and post-review. |
| Support Access standards | Requires case context, purpose, least scope, time limit, approval for sensitive data, and full audit. |
| Threat modeling requirements | Required for auth, payments, support access, webhook, RLS, PII, role/permission, and external integration changes. |
| Security review requirements | Security Review Board approval required for sensitive flows, policy changes, RLS changes, secrets, webhooks, and elevated access. |

## 8. Observability standards

| Area | Standard |
| --- | --- |
| Logging standards | Structured logs with timestamp, level, service, correlation ID, actor/scope where safe, event name, and sanitized context. |
| Metrics standards | Golden signals, business KPIs, operational SLAs, queue depths, provider health, error rates, latency, retries. |
| Tracing standards | Distributed traces across frontend action, API command/query, database, external provider, event processing. |
| Audit standards | Audit logs are immutable compliance records, not debugging logs. |
| Error tracking standards | Errors include normalized code, component/service, severity, user impact, release version, and correlation ID. |
| Frontend telemetry standards | Track journey steps, conversion, realtime disconnects, accessibility-impacting errors, and user-visible failures without PII. |
| Backend telemetry standards | Track command/query latency, validation failures, authorization denials, webhook idempotency, event processing. |
| Operational telemetry standards | Cocina/entrega SLA, queue, delay, pause/saturation, incident, reassignment, proof upload. |
| Business telemetry standards | Funnel, sales, promotions, rewards, reorder, support deflection, branch/franchise performance. |

## 9. Testing standards

| Test type | Coverage requirements | Ownership | Approval criteria |
| --- | --- | --- | --- |
| Unit testing | Pure domain rules, utilities, components, hooks, validation logic. | Implementing team. | Meaningful assertions, edge cases, no brittle snapshots-only. |
| Integration testing | API + domain + repository, RLS, event outbox, provider adapters, component with data contracts. | Backend/frontend/domain teams. | Realistic scope, auth/forbidden paths, failure paths. |
| Contract testing | API, event, webhook, component contract, design token contract. | Platform + domain teams. | Backward compatibility or versioned migration. |
| E2E testing | Critical journeys: first/guest/auth purchase, payment failure, tracking, kitchen delay, delivery delay, support access, admin permissions. | QA + feature teams. | Happy, failure, recovery paths covered. |
| Accessibility testing | Automated + manual keyboard/screen reader/contrast/reduced motion. | Frontend + QA + Accessibility. | No critical blocker; AA evidence attached. |
| Security testing | Authz/RLS, secrets, PII, support access, break glass, webhook, injection, dependency scans. | Security + backend/frontend. | No critical/high unresolved without approved exception. |
| Performance testing | Core Web Vitals, API latency, queue/realtime performance, dashboard load, database query plans. | Platform + teams. | Meets budgets or exception-approved. |
| Visual regression testing | Design system components and critical screens/states. | Frontend + Design System. | No unintended diffs; approved diffs documented. |

## 10. Quality gates

| Gate | Pass criteria | Fail criteria | Blocking criteria | Approval authority |
| --- | --- | --- | --- | --- |
| Frontend | Builds, lint/typecheck/tests pass, component/token contracts followed, no forbidden imports, screenshots for UI. | Missing states, raw tokens, untested critical interaction. | Accessibility blocker, duplicated component, direct data provider from UI. | Frontend Review Board. |
| Backend | Tests pass, authz/audit/event contracts validated, API errors typed, idempotency where needed. | Missing failure path, no contract test. | RLS bypass, unaudited sensitive mutation, unsafe webhook. | Backend Review Board. |
| Database | Migration reviewed/tested, RLS tests, indexes/constraints documented, rollback plan. | Missing index/constraint rationale. | Data loss, table without RLS where scoped, long lock risk unmitigated. | Database owner + Security for RLS. |
| Security | Threat model where required, no secrets/PII leakage, authz/RLS evidence. | Missing security checklist. | Critical/high vulnerability, unsupported break glass/support access. | Security Review Board. |
| Accessibility | Automated and manual evidence, keyboard/focus/contrast/screen-reader coverage. | Missing evidence. | Keyboard trap, inaccessible checkout/support/ops critical path. | Accessibility + QA Review Board. |
| QA | Test plan executed, defects triaged, regression scope covered. | Incomplete evidence. | Critical journey broken, untriaged high-severity defect. | QA Review Board. |
| DevOps | Deployment plan, environment config, observability, rollback validated. | Missing runbook. | No rollback, missing secrets, monitoring unavailable. | DevOps + Release Review Board. |
| Release | All gates passed or exception-approved, monitoring and rollback ready. | Missing sign-off. | Security/accessibility/critical journey blocker. | Release Review Board. |

## 11. CI/CD governance

| Area | Standard |
| --- | --- |
| Branch strategy | Protected main branch; short-lived feature branches; release/hotfix branches only when needed. |
| Pull request strategy | Small, scoped PRs with explicit architecture references, risk, tests, screenshots, telemetry/audit evidence. |
| Review strategy | At least one domain reviewer and one platform reviewer for cross-cutting work; required security/accessibility/design-system reviewers when affected. |
| Protected branches | Main/release branches require status checks, review approvals, no force push, signed/verified commits where policy requires. |
| Required reviewers | Code owners by area; Security for auth/RLS/PII/access; Design System for components/tokens; QA for release-critical flows. |
| Required checks | Format/lint/typecheck/unit/integration/contract/accessibility/security scans/build/migration checks as applicable. |
| Deployment approvals | Environment promotion requires Release Review Board approval for production and owner approval for staging. |
| Rollback process | Every release has rollback owner, trigger conditions, tested rollback path, data migration rollback/forward plan. |
| Release process | Release candidate, evidence bundle, staged rollout, production validation, monitoring, post-release review. |
| Hotfix process | Minimal scoped branch, expedited reviews, focused tests, production validation, post-hotfix retrospective. |

## 12. Pull request standards

| Required PR section | Required evidence |
| --- | --- |
| Summary | What changed, why, affected screens/domains/components. |
| Architecture compliance | Approved document references and confirmation no exception needed, or linked exception. |
| Screenshots | Required for perceptible UI changes: mobile/desktop and affected states; not required for docs-only unless rendering changed. |
| Tests | Exact commands and results; explain omitted tests. |
| Accessibility validation | Keyboard/focus/screen reader/contrast/reduced motion evidence for UI changes. |
| Security validation | Authz/RLS/PII/secrets/audit/support access impact statement. |
| Telemetry validation | Events added/changed, payload safety, dashboard/monitoring impact. |
| Audit validation | Sensitive interactions audited or explicitly not applicable. |
| Performance validation | Bundle/query/API/database impact and budgets. |
| Rollback | How to revert safely, including data/migration considerations. |

## 13. Definition of Ready

| Work item | Ready criteria before implementation |
| --- | --- |
| Feature | User story, acceptance criteria, permissions, telemetry, accessibility, states, dependencies, risks, test plan. |
| Screen | Approved screen inventory ID, navigation paths, component mapping, states, permissions, data dependencies, responsive/accessibility notes. |
| Component | Component inventory entry, contract, tokens, states, variants, accessibility behavior, Storybook plan, tests. |
| Domain | Domain owner, commands/queries/events, invariants, authorization, audit, data model, integration contracts. |
| Migration | Schema design, migration/backfill plan, RLS/constraints/indexes, data impact, rollback/forward path, test dataset. |
| Integration | Provider contract, auth/secrets, failure/retry/idempotency, observability, fallback, security review. |

## 14. Definition of Done

| Work item | Done criteria |
| --- | --- |
| Feature Done | UX accepted, tests passed, accessibility evidence, telemetry/audit implemented, security validated, docs updated, monitoring ready. |
| Screen Done | Matches screen/navigation/component/token contracts, all states implemented, responsive verified, permissions enforced, E2E coverage where critical. |
| Component Done | Contract implemented, tokens only, variants/states documented, Storybook complete, accessibility/tests/visual regression passed. |
| Domain Done | Commands/queries/events implemented, invariants tested, authz/RLS/audit covered, contract tests passed. |
| Migration Done | Applied in test/staging, data verified, RLS/index/constraint tests passed, rollback/forward plan validated. |
| Integration Done | Webhook/API/provider adapter tested, idempotency/retry/fallback/observability/security validated. |
| Release Done | Production validation complete, monitoring healthy, no blocking defects, rollback window closed, post-release notes recorded. |

## 15. Architecture compliance

| Compliance area | Process |
| --- | --- |
| Compliance review | PR checklist maps changes to approved architecture documents and quality gates. Board review required for cross-cutting or high-risk changes. |
| Architecture drift detection | Automated checks for forbidden imports/raw tokens where possible; manual review for component duplication, domain leakage, missing states, missing telemetry/audit. |
| Exception process | Exception request includes deviation, reason, affected docs, risk, mitigation, expiry, owner, remediation plan, and approval authority. |
| Technical debt process | Debt is recorded with owner, severity, affected architecture rule, user/ops risk, target remediation wave. |
| Remediation process | High-risk drift blocks release; medium-risk drift requires dated remediation; low-risk drift tracked and reviewed in planning. |

## 16. Anti-pattern catalog

| # | Area | Anti-pattern | Description | Risk | Consequence | Prevention |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Frontend | Raw token values | Hardcoded color/spacing/type/shadow. | Visual drift. | Inconsistent UI, inaccessible contrast. | Token lint/review. |
| 2 | Frontend | Duplicate component | New card/table/modal instead of approved component. | UX drift. | Maintenance burden. | Component registry check. |
| 3 | Frontend | UI calls database | Component directly calls Supabase. | Boundary breach. | Security/testability issues. | Domain service contracts. |
| 4 | Frontend | UI-only authorization | Hiding buttons without backend enforcement. | Security. | Unauthorized access via API. | Backend policy checks. |
| 5 | Frontend | Unscoped query key | Query cache lacks tenant/sucursal/user scope. | Data leak. | Cross-scope stale data. | Query key standard. |
| 6 | Frontend | Silent realtime loss | Realtime disconnect not surfaced. | Ops failure. | Missed kitchen/delivery updates. | RealtimeStatus contract. |
| 7 | Frontend | Optimistic mutation no rollback | UI assumes mutation success. | Data inconsistency. | Wrong status displayed. | Rollback/error state. |
| 8 | Frontend | Modal stack | Multiple blocking overlays. | UX/accessibility. | Focus trap confusion. | Overlay governance. |
| 9 | Frontend | Icon button unlabeled | Icon-only action has no accessible name. | Accessibility. | Screen reader unusable. | Accessibility tests. |
| 10 | Frontend | Snapshot-only tests | No behavior assertions. | Quality. | Regressions pass. | User-event tests. |
| 11 | Backend | Fat controller | Handler owns domain logic. | Maintainability. | Duplicated rules. | Service/domain standards. |
| 12 | Backend | Generic status update | Endpoint permits arbitrary state transition. | Integrity. | Invalid order states. | Command-specific APIs. |
| 13 | Backend | Missing idempotency | Critical command can double-run. | Financial/ops. | Duplicate payment/order. | Idempotency keys. |
| 14 | Backend | Event payload drift | Event changes without versioning. | Integration break. | Consumers fail silently. | Contract tests/versioning. |
| 15 | Backend | External side effect before commit | Notification/payment action before durable state. | Consistency. | Customer notified incorrectly. | Outbox pattern. |
| 16 | Backend | Raw exception response | Internal error exposed. | Security/UX. | Sensitive leak, poor recovery. | Typed error codes. |
| 17 | Backend | Overfetching PII | Query returns more sensitive data than needed. | Privacy. | PII exposure. | Data minimization review. |
| 18 | Backend | Service role overuse | Bypass RLS unnecessarily. | Security. | Cross-tenant access risk. | Scoped policies. |
| 19 | Backend | Unverified webhook | Provider payload trusted blindly. | Security/fraud. | Fake payment events. | Signature verification. |
| 20 | Backend | Synchronous notification dependency | Core workflow waits on email/WhatsApp. | Reliability. | Checkout/order delays. | Async retry queues. |
| 21 | Database | Missing RLS | Scoped table lacks RLS. | Critical security. | Tenant/customer data leak. | RLS gate. |
| 22 | Database | Nullable invariant | Business-required field nullable. | Data quality. | Invalid operations. | Constraints. |
| 23 | Database | No migration lock analysis | Migration may lock large tables. | Availability. | Production outage. | Migration review. |
| 24 | Database | No index for RLS/query | Policies and dashboards slow. | Performance. | Latency/outage. | Query plan review. |
| 25 | Database | Mutable audit logs | App can update/delete audit events. | Compliance. | Audit unreliable. | Append-only permissions. |
| 26 | Database | Destructive migration without plan | Drops/rewrites data unsafely. | Data loss. | Irreversible failure. | Backups/forward plan. |
| 27 | Security | Secrets in client/logs | Sensitive credentials exposed. | Critical. | Compromise. | Secret scanning. |
| 28 | Security | Role string checks | Hardcoded roles instead of permissions. | Access drift. | Over/under-permission. | Policy engine. |
| 29 | Security | PII reveal without reason | Support sees sensitive data casually. | Privacy. | Compliance breach. | PiiRevealGate/audit. |
| 30 | Security | Break glass without expiry | Emergency access remains active. | Security. | Persistent excessive access. | Expiry/review. |
| 31 | Security | Missing threat model | High-risk change unreviewed. | Unknown risk. | Vulnerability shipped. | Threat-model gate. |
| 32 | Security | Audit afterthought | Sensitive action not logged reliably. | Compliance. | No traceability. | Audit contract. |
| 33 | UX | Dead-end error | Error page lacks retry/recovery. | Conversion/support. | Abandonment. | Feedback contract. |
| 34 | UX | Hidden fees | Fees appear late in checkout. | Trust. | Drop-off/complaints. | OrderReview/FeeBreakdown. |
| 35 | UX | Forced account perception | Guest checkout obscured. | Conversion. | Guest abandonment. | Guest-first checkout. |
| 36 | UX | Confusing operational mode | Pause/saturation impact unclear. | Ops/customer. | Wrong branch availability. | Impact preview. |
| 37 | Accessibility | Color-only status | No text/icon/pattern. | Accessibility. | Users miss state. | Status contracts. |
| 38 | Accessibility | Focus stolen by realtime | Live update moves focus. | Accessibility/ops. | Task interruption. | Realtime focus rule. |
| 39 | Accessibility | Chart without table alternative | Analytics inaccessible. | Accessibility. | Data unavailable to screen readers. | Chart contract. |
| 40 | Accessibility | Map-only workflow | No list/manual fallback. | Accessibility/resilience. | Blocked delivery/address flow. | Map fallback. |
| 41 | Accessibility | Error not associated | Field error not linked to input. | Accessibility. | Form unusable. | ErrorSummary tests. |
| 42 | Testing | No forbidden-path tests | Only happy paths tested. | Security/quality. | Unauthorized access slips. | Authz/RLS tests. |
| 43 | Testing | No failure recovery tests | Provider/realtime failures ignored. | Reliability. | Outage UX broken. | Degradation E2E. |
| 44 | Testing | Visual diffs ignored | UI changes without review. | Visual drift. | Brand inconsistency. | Visual regression gate. |
| 45 | Testing | Flaky E2E accepted | Tests unreliable. | Delivery risk. | False confidence. | Flake budget/ownership. |
| 46 | DevOps | No rollback plan | Release cannot be reverted. | Availability. | Prolonged outage. | Release gate. |
| 47 | DevOps | Missing monitoring | Release not observable. | Ops. | Issues discovered by users. | Monitoring validation. |
| 48 | DevOps | Environment drift | Staging differs from production. | Quality. | Failed production deploy. | Config governance. |
| 49 | DevOps | Manual hotfix without review | Emergency change bypasses controls. | Security/stability. | New incident. | Hotfix process. |
| 50 | DevOps | Untracked feature flag | Flag lacks owner/expiry. | Debt/risk. | Stale behavior. | Flag registry. |
| 51 | Product/Ops | Missing support path | Customer issue has no support route. | CX. | Escalation and churn. | Journey validation. |
| 52 | Analytics | PII in telemetry | Analytics event includes personal data. | Privacy. | Compliance breach. | Telemetry schema review. |
| 53 | Analytics | Metrics without freshness | Dashboard stale but not labelled. | Decision risk. | Wrong ops decisions. | DataFreshnessBanner. |
| 54 | Integration | Provider-specific UI leakage | Generic components know provider internals. | Coupling. | Hard migrations. | Adapter contracts. |
| 55 | Integration | Retry storm | Unbounded retries. | Reliability. | Provider/API overload. | Backoff/circuit breaker. |

## 17. Release governance

| Release area | Standard |
| --- | --- |
| Release readiness review | Validate scope, quality gates, migrations, monitoring, support readiness, operations readiness, rollback, known risks. |
| Release approval process | Release Review Board approves production after required board sign-offs and evidence bundle review. |
| Production validation | Smoke critical customer/ops/admin/support paths, verify health dashboards, provider integrations, telemetry, audit, and error rates. |
| Monitoring validation | Confirm logs, metrics, traces, frontend telemetry, backend telemetry, operational dashboards, alerts, and business KPIs are flowing. |
| Rollback readiness | Rollback owner, commands/runbook, data compatibility, feature flags, and communication plan confirmed before deploy. |
| Post-release review | Review incidents, KPIs, defects, user/ops feedback, telemetry anomalies, and remediation actions. |

## 18. Engineering KPI framework

| KPI category | KPIs |
| --- | --- |
| Quality KPIs | escaped defects, regression rate, defect reopen rate, flaky test rate, quality gate pass rate. |
| Delivery KPIs | cycle time, PR review time, deployment frequency, lead time, blocked work aging. |
| Performance KPIs | Core Web Vitals, API p95/p99 latency, database query latency, realtime reconnect time, dashboard load time. |
| Security KPIs | critical/high vulnerabilities, unauthorized access attempts, RLS test coverage, secrets incidents, break-glass reviews completed. |
| Accessibility KPIs | automated violations, manual blocker count, keyboard journey pass rate, contrast pass rate, screen-reader smoke pass rate. |
| Operational KPIs | order SLA, kitchen delay rate, delivery delay rate, incident MTTA/MTTR, payment failure recovery, support deflection. |
| Technical Debt KPIs | open architecture exceptions, expired exceptions, deprecated component/token usage, dependency freshness, remediation SLA. |

## 19. Team responsibility matrix

| Activity | Frontend | Backend | Database | Security | QA | DevOps | Product | UX/UI | Operations | Support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Architecture compliance | R | R | R | C | C | C | A | C | C | C |
| UI/component implementation | R/A | C | I | C | C | I | C | C/A | C | C |
| Domain/API implementation | C | R/A | C | C | C | I | C | I | C | C |
| Database migrations | I | C | R/A | C | C | C | I | I | I | I |
| Security/privacy controls | C | R | R | A | C | C | I | I | C | C |
| Accessibility validation | R | I | I | C | C/A | I | C | R | C | C |
| Test strategy/execution | R | R | R | C | A | C | C | C | C | C |
| Deployment/release | C | C | C | C | C | R/A | A | I | C | C |
| Operational readiness | C | C | C | C | C | C | A | C | R | R |
| Support access workflows | C | R | C | A | C | I | C | I | C | R |
| Telemetry/observability | R | R | C | C | C | A | C | I | C | C |
| Incident response | C | C | C | C | C | R | C | I | R | R |

Legend: R = Responsible, A = Accountable, C = Consulted, I = Informed.

## 20. Final governance audit

| Audit area | Potential gap/risk | Remediation |
| --- | --- | --- |
| Governance complexity | Multiple boards can slow delivery. | Use risk-based review routing, clear SLAs, and bundled review windows. |
| Exception sprawl | Too many exceptions can normalize drift. | Exceptions require expiry, owner, KPI tracking, and monthly review. |
| Documentation-only compliance | Teams may claim compliance without evidence. | PR templates and quality gates require concrete command/test/screenshot/audit evidence. |
| Accessibility late discovery | Accessibility defects found after build. | Definition of Ready includes accessibility requirements; component contracts include accessibility from start. |
| Security late discovery | Auth/RLS/support access issues found near release. | Security review required at design/DoR for sensitive flows and RLS tests before merge. |
| Visual drift | Component/token bypass over time. | Token lint, design-system review, visual regression, deprecated usage KPI. |
| Operational blind spots | Kitchen/delivery/support failures under-tested. | E2E degradation tests and operational telemetry gates required. |
| CI/CD bottlenecks | Required checks may become slow/flaky. | Flake ownership, test pyramid discipline, parallelization, and reliability KPIs. |
| Release risk | Migrations/provider changes can be hard to roll back. | Release gate requires rollback/forward plan and staged rollout. |
| KPI misuse | Teams optimize metrics instead of outcomes. | KPI reviews include qualitative incidents, customer/ops feedback, and architecture compliance review. |

## 21. Final deliverable checklist

| Deliverable | Status | Location |
| --- | --- | --- |
| Governance Model | Complete | Section 1. |
| Frontend Standards | Complete | Section 2. |
| Backend Standards | Complete | Section 3. |
| Database Standards | Complete | Section 4. |
| Design System Governance | Complete | Section 5. |
| Accessibility Standards | Complete | Section 6. |
| Security Standards | Complete | Section 7. |
| Observability Standards | Complete | Section 8. |
| Testing Standards | Complete | Section 9. |
| Quality Gates | Complete | Section 10. |
| CI/CD Governance | Complete | Section 11. |
| Pull Request Standards | Complete | Section 12. |
| Definition of Ready | Complete | Section 13. |
| Definition of Done | Complete | Section 14. |
| Architecture Compliance | Complete | Section 15. |
| Anti-Pattern Catalog | Complete | Section 16. |
| Release Governance | Complete | Section 17. |
| KPI Framework | Complete | Section 18. |
| RACI Matrix | Complete | Section 19. |
| Governance Audit | Complete | Section 20. |

