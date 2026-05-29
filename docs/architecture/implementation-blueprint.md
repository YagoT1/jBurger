# J Burguer — Enterprise Implementation Blueprint

## 0. Blueprint Scope

This document translates the completed product, commerce, operations, delivery, security, frontend, design system, infrastructure, DevOps, data, and governance architectures into the implementation structure engineers will use before writing production code.

The blueprint defines repository organization, domain boundaries, shared package strategy, frontend and backend layering, database project structure, event and API contracts, testing, security, analytics, observability, CI/CD, naming conventions, dependency rules, scalability rules, and the implementation roadmap.

This is not application code. It is the repository foundation and execution model for an enterprise-grade food-tech platform built with Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, Supabase, PostgreSQL, Supabase Edge Functions, Vercel, Mercado Pago, WhatsApp, and email.

---

## 1. Repository Strategy

### 1.1 Decision

J Burguer will use a **monorepo**.

### 1.2 Rationale

A monorepo is the correct structure because the platform contains multiple applications that must evolve together while sharing contracts, UI primitives, design tokens, authentication policies, event schemas, analytics definitions, database types, and operational tooling.

The monorepo enables:

- Atomic changes across customer, admin, operations, API contracts, and database migrations.
- Shared CI rules for type safety, linting, contract validation, RLS tests, and security checks.
- Centralized dependency governance.
- Consistent design system usage across product surfaces.
- Single source of truth for domain contracts and events.
- Easier migration from one web app to multiple apps without duplicating foundational code.
- Clear ownership metadata through CODEOWNERS, package boundaries, and domain folders.

### 1.3 Ownership Model

Ownership is split by **domain**, **platform capability**, and **application surface**.

| Area | Primary Owner | Secondary Owner |
| --- | --- | --- |
| `apps/customer` | Customer Experience Team | Design System Team |
| `apps/admin` | Commerce/Admin Team | Security Team |
| `apps/operations` | Restaurant Operations Team | Realtime Platform Team |
| `apps/mobile` | Mobile Team | Customer Experience Team |
| `packages/ui` | Design System Team | Frontend Platform Team |
| `packages/tokens` | Design System Team | Brand Team |
| `packages/contracts` | Platform API Team | Domain Teams |
| `packages/events` | Event Platform Team | Domain Teams |
| `packages/auth` | Security Platform Team | Frontend Platform Team |
| `packages/analytics` | Data Platform Team | Product Teams |
| `packages/observability` | SRE Team | Platform Team |
| `supabase` | Backend/Data Platform Team | Security Team |
| `infrastructure` | DevOps/SRE Team | Security Team |
| `docs` | Architecture Council | All Teams |

Every domain must have:

- A code owner.
- A product owner.
- A data owner for tables, events, and analytics definitions.
- An operational owner for runbooks and alerts.
- A security owner for privileged actions and policies.

### 1.4 Package Strategy

Packages are internal workspace packages. They are versioned together initially and must maintain stable public exports. Each package must expose a narrow API through its package entrypoints. Deep imports are forbidden unless explicitly declared.

Package categories:

1. **Foundational packages**: types, utilities, config, tokens.
2. **Platform packages**: auth, contracts, events, analytics, observability, feature flags.
3. **Experience packages**: UI, motion, form helpers, app shell.
4. **Backend packages**: database types, edge runtime helpers, provider adapters.
5. **Quality packages**: testing utilities, mocks, fixtures, contract validators.

### 1.5 Domain Isolation Strategy

Domains are isolated by folder, package boundaries, database schema ownership, event ownership, and dependency rules.

Domain modules must not reach directly into another domain's internals. Cross-domain communication happens through:

- API contracts.
- Events.
- Read models.
- Shared primitive packages.
- Explicit domain service interfaces.

Domain isolation applies to:

- Frontend features.
- Backend services.
- Database objects.
- Edge Functions.
- Analytics events.
- Operational runbooks.
- Tests and fixtures.

---

## 2. Root Folder Architecture

### 2.1 Complete Root Structure

```text
/
├── apps/
│   ├── customer/
│   ├── admin/
│   ├── operations/
│   ├── storybook/
│   └── mobile/
├── packages/
│   ├── ui/
│   ├── tokens/
│   ├── types/
│   ├── contracts/
│   ├── events/
│   ├── auth/
│   ├── analytics/
│   ├── observability/
│   ├── feature-flags/
│   ├── config/
│   ├── utils/
│   ├── validation/
│   ├── db/
│   ├── edge/
│   ├── payments/
│   ├── notifications/
│   ├── realtime/
│   ├── testing/
│   └── fixtures/
├── supabase/
│   ├── migrations/
│   ├── seeds/
│   ├── policies/
│   ├── functions/
│   ├── database/
│   ├── schemas/
│   ├── views/
│   ├── triggers/
│   ├── rpc/
│   ├── storage/
│   ├── realtime/
│   ├── tests/
│   └── generated/
├── domains/
│   ├── identity-access/
│   ├── tenant-branch/
│   ├── catalog-menu/
│   ├── cart-checkout/
│   ├── orders/
│   ├── payments/
│   ├── kitchen/
│   ├── delivery/
│   ├── notifications/
│   ├── promotions-loyalty/
│   ├── support/
│   ├── analytics/
│   └── platform-admin/
├── infrastructure/
│   ├── vercel/
│   ├── supabase/
│   ├── environments/
│   ├── secrets/
│   ├── observability/
│   ├── ci/
│   ├── release/
│   └── disaster-recovery/
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── rfc/
│   ├── runbooks/
│   ├── playbooks/
│   ├── onboarding/
│   ├── product/
│   ├── security/
│   ├── data/
│   ├── qa/
│   └── operations/
├── tests/
│   ├── e2e/
│   ├── integration/
│   ├── contract/
│   ├── performance/
│   ├── security/
│   ├── accessibility/
│   └── smoke/
├── scripts/
│   ├── dev/
│   ├── db/
│   ├── ci/
│   ├── release/
│   ├── security/
│   ├── analytics/
│   └── maintenance/
├── tools/
│   ├── generators/
│   ├── eslint/
│   ├── typescript/
│   ├── tailwind/
│   ├── testing/
│   ├── codemods/
│   └── policy-checks/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .changeset/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── eslint.config.js
├── prettier.config.js
├── tailwind.config.ts
├── CODEOWNERS
├── SECURITY.md
├── CONTRIBUTING.md
└── README.md
```

### 2.2 Folder Responsibilities

| Folder | Responsibility |
| --- | --- |
| `apps` | Deployable user-facing or internal applications. |
| `packages` | Shared workspace libraries with explicit exports and ownership. |
| `supabase` | Database, RLS, Edge Functions, storage, realtime, migrations, seeds, and tests. |
| `domains` | Canonical backend domain modules, domain documentation, domain-level contracts, and ownership manifests. |
| `infrastructure` | Deployment, environment, Vercel, Supabase project configuration, observability, release, and DR assets. |
| `docs` | Architecture, ADRs, RFCs, runbooks, playbooks, onboarding, and governance. |
| `tests` | Cross-application quality suites that validate complete system behavior. |
| `scripts` | Repeatable operational scripts. Scripts must be idempotent where possible. |
| `tools` | Repository tooling, generators, linters, policy checks, and codemods. |
| `.github` | CI/CD workflows, templates, automation, and code review rules. |

### 2.3 Workspace Rules

- Each app and package must have a README describing purpose, ownership, dependencies, commands, and boundaries.
- Every package must define explicit exports.
- Shared packages must not import from applications.
- Application code may import packages but must not import another application.
- Generated files must live in `generated` folders and must not be edited manually.
- Architecture and governance docs are first-class artifacts and must be updated with major structural changes.

---

## 3. Application Layer Structure

### 3.1 Customer App

Path: `apps/customer`

#### Responsibility

The customer app handles public commerce and authenticated customer journeys:

- Home and brand experience.
- Menu browsing.
- Product detail and customization.
- Cart.
- Checkout.
- Mercado Pago payment initiation and return flows.
- Order tracking.
- Reorder.
- Loyalty and promotions.
- Customer account and support entry points.

#### Ownership

Owned by the Customer Experience Team with shared governance from Design System, Commerce, Payments, Analytics, and Security.

#### Dependencies

Allowed dependencies:

- `@jburguer/ui`
- `@jburguer/tokens`
- `@jburguer/types`
- `@jburguer/contracts`
- `@jburguer/auth`
- `@jburguer/analytics`
- `@jburguer/feature-flags`
- `@jburguer/observability`
- `@jburguer/realtime`
- `@jburguer/utils`
- `@jburguer/validation`

Forbidden dependencies:

- Direct imports from `apps/admin` or `apps/operations`.
- Direct imports from Supabase service-role helpers.
- Direct imports from payment secret adapters.
- Direct database query helpers that bypass contracts.

### 3.2 Admin App

Path: `apps/admin`

#### Responsibility

The admin app manages business configuration and back-office workflows:

- Tenant and branch configuration.
- Menu, category, item, modifier, price, and availability management.
- Promotions and loyalty configuration.
- Order management and support tools.
- Payment reconciliation views.
- Customer support workflows.
- Analytics dashboards.
- Staff and permission management.
- Audit log review.

#### Ownership

Owned by the Commerce/Admin Team with Security and Data Platform review for privileged workflows.

#### Dependencies

Allowed dependencies:

- `@jburguer/ui`
- `@jburguer/contracts`
- `@jburguer/auth`
- `@jburguer/analytics`
- `@jburguer/observability`
- `@jburguer/feature-flags`
- `@jburguer/realtime`
- `@jburguer/validation`

Admin-only workflows may use privileged server-side contract clients, but service-role usage must be server-only and audited.

### 3.3 Operations App

Path: `apps/operations`

#### Responsibility

The operations app supports real-time restaurant execution:

- Kitchen queue.
- Preparation stations.
- Branch availability controls.
- Dispatch and delivery assignment.
- Pickup queue.
- Order issue resolution.
- Operational incidents.
- Branch capacity.
- Staff shift context.

#### Ownership

Owned by the Restaurant Operations Team with Realtime Platform and SRE review.

#### Dependencies

Allowed dependencies:

- `@jburguer/ui`
- `@jburguer/contracts`
- `@jburguer/auth`
- `@jburguer/realtime`
- `@jburguer/observability`
- `@jburguer/feature-flags`
- `@jburguer/utils`

Operations must prefer branch-scoped read models and realtime channels. It must not subscribe to global unbounded feeds.

### 3.4 Storybook App

Path: `apps/storybook`

#### Responsibility

The Storybook app documents and validates the design system, shared components, motion patterns, accessibility states, data-density components, and domain UI examples.

#### Ownership

Owned by the Design System Team.

#### Dependencies

- `@jburguer/ui`
- `@jburguer/tokens`
- `@jburguer/fixtures`
- `@jburguer/testing`

Storybook must use mocked data only and must not connect to production services.

### 3.5 Future Mobile App

Path: `apps/mobile`

#### Responsibility

The future mobile app will support native or React Native customer and staff workflows. It starts as an empty reserved workspace with contracts and design token compatibility requirements.

#### Ownership

Owned by the Mobile Team after activation.

#### Dependencies

The mobile app may consume contracts, events, auth, analytics, tokens, validation, and shared utilities. It must not depend on web-only UI components unless a cross-platform abstraction is explicitly introduced.

---

## 4. Package Architecture

### 4.1 Package Inventory

| Package | Path | Responsibility |
| --- | --- | --- |
| `@jburguer/ui` | `packages/ui` | shadcn/ui-based primitives, composed components, layout primitives, accessibility patterns, and visual states. |
| `@jburguer/tokens` | `packages/tokens` | Design tokens, themes, semantic colors, typography, spacing, radius, shadows, motion tokens, brand tokens. |
| `@jburguer/types` | `packages/types` | Shared TypeScript domain primitives that are not API-specific. |
| `@jburguer/contracts` | `packages/contracts` | API commands, queries, DTOs, validation schemas, versioning, client contracts. |
| `@jburguer/events` | `packages/events` | Domain event schemas, event names, versioning, publisher/consumer contracts, event catalog. |
| `@jburguer/auth` | `packages/auth` | Auth client helpers, RBAC types, permission checks, session utilities, route guards. |
| `@jburguer/analytics` | `packages/analytics` | Tracking APIs, event definitions, consent rules, metric mappings, client/server analytics adapters. |
| `@jburguer/observability` | `packages/observability` | Logging, tracing, metrics, correlation IDs, error normalization, alert labels. |
| `@jburguer/feature-flags` | `packages/feature-flags` | Flag definitions, rollout contexts, evaluation helpers, kill switches. |
| `@jburguer/config` | `packages/config` | Shared TypeScript, ESLint, Tailwind, Prettier, test, and build config. |
| `@jburguer/utils` | `packages/utils` | Generic dependency-light utilities. No domain logic. |
| `@jburguer/validation` | `packages/validation` | Reusable validators and parsing helpers. |
| `@jburguer/db` | `packages/db` | Generated database types, database constants, query result types, schema metadata. |
| `@jburguer/edge` | `packages/edge` | Supabase Edge Function runtime helpers, CORS, auth context, idempotency, response envelopes. |
| `@jburguer/payments` | `packages/payments` | Mercado Pago server-side adapters, webhook verification contracts, idempotent payment operation interfaces. |
| `@jburguer/notifications` | `packages/notifications` | WhatsApp and email templates, provider contracts, delivery status types. |
| `@jburguer/realtime` | `packages/realtime` | Channel naming, subscription contracts, reconnection strategy, realtime state helpers. |
| `@jburguer/testing` | `packages/testing` | Test utilities, mocks, contract test helpers, accessibility helpers. |
| `@jburguer/fixtures` | `packages/fixtures` | Synthetic tenant, branch, menu, order, payment, and user fixtures. |

### 4.2 Package Rules

- Packages must expose stable public APIs through `src/index.ts` or declared subpath exports.
- Packages must be independently testable.
- Packages must document runtime compatibility: browser, server, edge, node, or universal.
- Browser-compatible packages must not import server-only code.
- Edge-compatible packages must avoid Node-only APIs.
- Domain-specific logic belongs in `domains` or app feature folders unless intentionally promoted to a shared package.
- Shared packages must avoid circular dependencies.

### 4.3 Suggested Internal Package Structure

```text
packages/<package-name>/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── internal/
│   └── testing/
├── tests/
└── CHANGELOG.md
```

### 4.4 Package Promotion Criteria

Code may be promoted from an app/domain to a package only when:

- At least two consumers need it.
- Ownership is clear.
- Runtime constraints are documented.
- Public exports can remain stable.
- Tests exist at package level.
- It does not leak domain internals.

---

## 5. Frontend Domain Structure

### 5.1 Standard Next.js App Structure

Each deployable Next.js app follows this structure:

```text
apps/<app>/
├── app/
│   ├── (public)/
│   ├── (authenticated)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── global-error.tsx
├── src/
│   ├── features/
│   ├── components/
│   ├── hooks/
│   ├── providers/
│   ├── services/
│   ├── lib/
│   ├── config/
│   ├── styles/
│   ├── analytics/
│   ├── observability/
│   └── test/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── accessibility/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### 5.2 Frontend Feature Structure

```text
src/features/<domain-feature>/
├── README.md
├── components/
├── hooks/
├── services/
├── server/
├── state/
├── schemas/
├── mappers/
├── analytics/
├── realtime/
├── tests/
└── index.ts
```

### 5.3 Frontend Boundary Rules

#### `features`

Feature folders own domain-specific UI composition, feature hooks, feature services, route-level orchestration, schemas, and state.

Rules:

- A feature may import shared packages.
- A feature may import app-level providers and app-level lib helpers.
- A feature must not import another feature's private files.
- Cross-feature sharing must happen through contracts, events, or promoted shared components.
- Feature services must call typed API contracts, not raw provider endpoints unless the feature owns that integration.

#### `components`

App-level components are non-domain shell components or small compositions specific to the app.

Rules:

- Components that are reusable across apps move to `packages/ui`.
- Components that know domain concepts belong in `features/<feature>/components`.
- Components must not own data fetching unless explicitly designed as route-level or server components.

#### `hooks`

App-level hooks are generic app hooks. Domain hooks live in feature folders.

Rules:

- Hooks must state whether they run client-only or universal.
- Hooks must not hide authorization checks.
- Hooks that subscribe to realtime must include cleanup and reconnect behavior.

#### `providers`

Providers initialize app-wide concerns: theme, auth session, analytics, feature flags, observability, realtime client, and toast system.

Rules:

- Providers must remain thin.
- Provider ordering must be documented.
- Providers must not contain domain workflows.

#### `services`

App services adapt app runtime to shared contracts: server actions, route handlers, API clients, browser clients, and cache helpers.

Rules:

- Services must preserve server/client boundaries.
- Secrets and service-role clients are server-only.
- Client services must only call public, authenticated, or scoped endpoints.

#### `lib`

App-specific low-level helpers. Shared helpers must be promoted to packages.

Rules:

- `lib` must not become a dumping ground.
- Domain logic is forbidden in app-level `lib`.

### 5.4 Rendering Rules

- Public menu and marketing pages should use server rendering or static rendering where safe.
- Cart, checkout, payment return, and operational dashboards require client interactivity with explicit server boundaries.
- Realtime UIs must refetch canonical state on reconnect.
- Route handlers must never expose service-role capabilities to clients.
- All privileged mutations must validate auth, tenant, branch, role, idempotency, and input schemas server-side.

---

## 6. Backend Domain Structure

### 6.1 Domain Module Structure

Canonical backend domain modules live in `domains/<domain>`.

```text
domains/<domain>/
├── README.md
├── ownership.yaml
├── model/
├── commands/
├── queries/
├── services/
├── repositories/
├── policies/
├── events/
├── workers/
├── projections/
├── integrations/
├── analytics/
├── tests/
└── docs/
```

### 6.2 Domain Inventory

| Domain | Responsibility |
| --- | --- |
| `identity-access` | Users, sessions, roles, permissions, staff access, support access, audit identity. |
| `tenant-branch` | Organizations, brands, branches, opening hours, capacity, branch status, tenant settings. |
| `catalog-menu` | Menu categories, items, modifiers, pricing, media, availability. |
| `cart-checkout` | Cart validation, checkout orchestration, price calculation, fees, scheduling, order draft. |
| `orders` | Order lifecycle, status transitions, fulfillment state, issue state, customer tracking. |
| `payments` | Mercado Pago integration, payment intents, webhooks, reconciliation, refunds. |
| `kitchen` | Kitchen queue, preparation stations, item routing, prep timing, operational load. |
| `delivery` | Delivery zones, assignment, dispatch, tracking, pickup handoff, delivery incidents. |
| `notifications` | WhatsApp, email, templates, notification preferences, delivery receipts. |
| `promotions-loyalty` | Coupons, campaigns, rewards, points, eligibility, redemption. |
| `support` | Customer service workflows, refunds, issue resolution, internal notes. |
| `analytics` | Business metrics, event ingestion, derived metrics, warehouse contracts. |
| `platform-admin` | Global administration, feature flags, audit controls, operational tooling. |

### 6.3 Backend Layer Rules

#### `model`

Contains domain language, entities, value objects, state machines, invariants, and lifecycle definitions.

#### `commands`

Defines mutations that change state. Commands must include input schema, authorization requirements, idempotency strategy, emitted events, and expected side effects.

#### `queries`

Defines read operations and read model requirements. Queries must state tenant, branch, role, pagination, sorting, and cache semantics.

#### `services`

Contains orchestration logic across repositories, contracts, events, and integrations. Services must not bypass domain invariants.

#### `repositories`

Own persistence access patterns for the domain. Repositories are internal to the domain and must not be imported directly by unrelated domains.

#### `policies`

Documents domain authorization, RLS intent, data visibility rules, and privileged operation rules.

#### `events`

Owns domain event definitions and event lifecycle. Public event schemas are mirrored to `packages/events` after approval.

#### `workers`

Owns asynchronous processing such as outbox consumers, payment reconciliation, notification dispatch, projection rebuilds, and scheduled maintenance.

#### `projections`

Owns read models optimized for dashboard, realtime, analytics, or operational workloads.

#### `integrations`

Contains domain-specific adapters to external systems. Provider-neutral interfaces should be separated from provider-specific implementation.

### 6.4 Supabase Edge Function Structure

Edge Functions live under `supabase/functions/<function-name>` and must map to domain commands, queries, or provider webhooks.

```text
supabase/functions/<function-name>/
├── README.md
├── index.ts
├── handler.ts
├── schema.ts
├── auth.ts
├── errors.ts
├── tests/
└── fixtures/
```

Function categories:

- `command-*` for authenticated mutations.
- `query-*` for privileged or server-side reads.
- `webhook-*` for provider webhooks.
- `worker-*` for scheduled/background jobs.
- `internal-*` for restricted platform operations.

---

## 7. Database Project Structure

### 7.1 Supabase Folder Structure

```text
supabase/
├── migrations/
│   ├── 000001_init_extensions.sql
│   ├── 000002_create_identity_access.sql
│   └── YYYYMMDDHHMMSS_<verb>_<object>.sql
├── seeds/
│   ├── local/
│   ├── staging/
│   ├── demo/
│   └── fixtures/
├── policies/
│   ├── identity_access/
│   ├── tenant_branch/
│   ├── catalog_menu/
│   ├── orders/
│   └── payments/
├── functions/
├── database/
│   ├── extensions/
│   ├── schemas/
│   ├── tables/
│   ├── indexes/
│   ├── constraints/
│   ├── enums/
│   └── comments/
├── schemas/
│   ├── app_public/
│   ├── app_private/
│   ├── app_internal/
│   ├── analytics/
│   └── audit/
├── views/
│   ├── read_models/
│   ├── operational/
│   ├── analytics/
│   └── admin/
├── triggers/
├── rpc/
├── storage/
│   ├── buckets/
│   └── policies/
├── realtime/
│   ├── publications/
│   ├── channels/
│   └── filters/
├── tests/
│   ├── rls/
│   ├── migrations/
│   ├── functions/
│   ├── triggers/
│   └── performance/
└── generated/
    ├── database.types.ts
    └── schema.graph.json
```

### 7.2 Database Schema Strategy

Recommended schemas:

| Schema | Purpose |
| --- | --- |
| `app_public` | Tables and views safely exposed through RLS to authenticated clients. |
| `app_private` | Sensitive operational data not directly exposed to clients. |
| `app_internal` | Outbox, workers, provider payloads, idempotency, system state. |
| `analytics` | Analytics events, derived facts, metric snapshots. |
| `audit` | Immutable audit log and privileged access records. |

### 7.3 Migration Naming

Migration format:

```text
YYYYMMDDHHMMSS_<action>_<domain>_<object>.sql
```

Examples:

- `20260601090000_create_orders_order_tables.sql`
- `20260601100000_add_payments_webhook_dedupe_index.sql`
- `20260601110000_create_kitchen_branch_queue_projection.sql`

### 7.4 Table Naming

- Tables use plural snake_case names.
- Join tables use `<left>_<right>` with plural domain nouns when clear.
- Event/outbox tables include domain prefix.
- Projection tables end with `_projection` or `_read_model`.
- Audit tables end with `_audit_log` when domain-scoped.

Examples:

- `orders`
- `order_items`
- `payment_attempts`
- `kitchen_queue_projection`
- `branch_status_events`
- `support_case_audit_log`

### 7.5 Policy Naming

RLS policy format:

```text
<operation>_<role>_<scope>_on_<table>
```

Examples:

- `select_customer_own_orders_on_orders`
- `update_staff_branch_orders_on_orders`
- `select_admin_tenant_menu_items_on_menu_items`

### 7.6 Function and RPC Naming

RPC format:

```text
<domain>_<verb>_<object>
```

Examples:

- `orders_transition_status`
- `cart_validate_checkout`
- `payments_record_webhook`
- `kitchen_claim_order_item`

### 7.7 Database Rules

- Every tenant-scoped table must include `tenant_id` or be provably derived through a scoped parent.
- Every branch-scoped table must include `branch_id` or derive from branch ownership through a strict foreign key.
- Every mutable business table must include audit metadata.
- Critical mutations must be idempotent.
- Provider webhook payloads must be stored in private/internal schema with retention policy.
- RLS must be tested before exposing any table to clients.
- Views exposed to clients must have explicit comments documenting security assumptions.

---

## 8. Event Architecture Structure

### 8.1 Event Folder Structure

```text
packages/events/
├── README.md
├── catalog/
│   ├── identity-access.md
│   ├── tenant-branch.md
│   ├── catalog-menu.md
│   ├── cart-checkout.md
│   ├── orders.md
│   ├── payments.md
│   ├── kitchen.md
│   ├── delivery.md
│   ├── notifications.md
│   └── promotions-loyalty.md
├── schemas/
│   ├── orders/
│   │   ├── order-created.v1.schema.ts
│   │   ├── order-status-changed.v1.schema.ts
│   │   └── order-cancelled.v1.schema.ts
│   ├── payments/
│   └── kitchen/
├── versioning/
│   ├── compatibility-rules.md
│   └── deprecation-policy.md
├── consumers/
│   ├── analytics.md
│   ├── notifications.md
│   └── projections.md
├── publishers/
└── tests/
```

### 8.2 Event Naming

Event name format:

```text
<domain>.<aggregate>.<past-tense-action>.v<major>
```

Examples:

- `orders.order.created.v1`
- `orders.order.status_changed.v1`
- `payments.payment.approved.v1`
- `kitchen.ticket.claimed.v1`
- `delivery.assignment.created.v1`

### 8.3 Event Schema Requirements

Every event schema must define:

- Event name.
- Major version.
- Event ID.
- Correlation ID.
- Causation ID when applicable.
- Tenant ID.
- Branch ID when applicable.
- Actor ID or system actor.
- Aggregate ID and aggregate type.
- Occurred timestamp.
- Published timestamp.
- Payload schema.
- Data classification.
- Retention class.
- Producer.
- Consumers.

### 8.4 Versioning Rules

- Additive optional fields are minor-compatible and do not require a new event name.
- Removing fields, changing semantics, or changing field types requires a new major version.
- Consumers must tolerate unknown fields.
- Producers must publish only one canonical major version per event unless migration is active.
- Deprecated events must include a sunset date and migration path.

### 8.5 Ownership Rules

- The publishing domain owns event semantics.
- Consumers own failure handling and replay behavior.
- Event Platform owns catalog governance and compatibility checks.
- Data Platform owns analytics mapping for event-derived metrics.

---

## 9. API Architecture

### 9.1 Contract Folder Structure

```text
packages/contracts/
├── README.md
├── commands/
│   ├── cart-checkout/
│   ├── orders/
│   ├── payments/
│   ├── kitchen/
│   └── delivery/
├── queries/
│   ├── catalog-menu/
│   ├── orders/
│   ├── kitchen/
│   └── admin/
├── schemas/
│   ├── request/
│   ├── response/
│   ├── errors/
│   └── shared/
├── clients/
│   ├── browser/
│   ├── server/
│   └── edge/
├── versioning/
│   ├── api-version-policy.md
│   └── compatibility.md
├── errors/
└── tests/
```

### 9.2 API Model

The API is organized around **commands** and **queries**.

Commands:

- Change state.
- Require idempotency where retries are possible.
- Emit events where business state changes.
- Must define authorization and validation.
- Return minimal state plus identifiers and next actions.

Queries:

- Read state.
- Must declare pagination, sorting, filters, tenant/branch scope, and cache behavior.
- Must not mutate state.
- Should use read models for operational dashboards.

### 9.3 API Naming

Command name format:

```text
<domain>.<verb><Object>
```

Examples:

- `cartCheckout.validateCart`
- `orders.createOrder`
- `orders.cancelOrder`
- `payments.createPaymentPreference`
- `kitchen.claimTicket`

Endpoint path format for route handlers or Edge Functions:

```text
/api/<version>/<domain>/<resource>/<action>
```

Examples:

- `/api/v1/orders/create`
- `/api/v1/payments/mercado-pago/webhook`
- `/api/v1/kitchen/tickets/claim`

### 9.4 Validation Rules

- All external inputs require schema validation.
- Validation schemas live with contracts and are reused by clients and servers when runtime-compatible.
- Server validation is mandatory even if client validation exists.
- Error responses must use a typed error envelope.
- Validation errors must be safe to expose and must not leak secrets or private provider payloads.

### 9.5 Versioning Rules

- Public API versions use `/v1`, `/v2`, etc.
- Internal contract versions use package exports and schema versioning.
- Breaking changes require a new version or a controlled migration plan.
- Deprecated endpoints require docs, telemetry, and removal date.

---

## 10. Design System Integration

### 10.1 Design System Structure

```text
packages/tokens/
├── src/
│   ├── base/
│   ├── semantic/
│   ├── brand/
│   ├── themes/
│   ├── motion/
│   └── index.ts
├── generated/
├── docs/
└── tests/

packages/ui/
├── src/
│   ├── primitives/
│   ├── components/
│   ├── patterns/
│   ├── layouts/
│   ├── feedback/
│   ├── data-display/
│   ├── forms/
│   ├── navigation/
│   ├── motion/
│   ├── accessibility/
│   └── index.ts
├── stories/
├── tests/
└── docs/

apps/storybook/
├── stories/
│   ├── foundations/
│   ├── primitives/
│   ├── components/
│   ├── patterns/
│   ├── commerce/
│   ├── operations/
│   └── accessibility/
└── docs/
```

### 10.2 Token Storage

Token layers:

1. **Base tokens**: raw scales such as colors, spacing, typography, radius, z-index, duration.
2. **Semantic tokens**: intent-based tokens such as background, foreground, danger, success, warning, surface, border, focus.
3. **Component tokens**: component-level values for buttons, cards, modals, badges, inputs, tables, and status indicators.
4. **Brand tokens**: brand-specific overrides for colors, typography, imagery, and personality.
5. **Operational tokens**: high-legibility status colors for kitchen, delivery, incidents, SLA, and payment states.

### 10.3 Component Ownership

- `packages/ui/primitives`: owned by Design System.
- `packages/ui/components`: owned by Design System with product review.
- `packages/ui/patterns`: jointly owned by Design System and product domain teams.
- Domain-specific components remain in app feature folders until generalized.

### 10.4 Theme Architecture

Theme strategy:

- CSS variables generated from tokens.
- Tailwind reads semantic variables.
- shadcn/ui components are customized through tokenized variants.
- Dark mode and high-contrast mode are first-class themes.
- Brand themes are data-driven and can be switched by tenant or brand context.

### 10.5 Multi-Brand Readiness

Every brand theme must define:

- Brand identity tokens.
- Semantic token mapping.
- Logo and asset references.
- Motion personality constraints.
- Component variant overrides where allowed.
- Accessibility contrast validation.

Brand-specific code in product features is forbidden unless approved by architecture review.

### 10.6 Storybook Requirements

Storybook must include:

- Token documentation.
- Component variants.
- Accessibility states.
- Keyboard interaction examples.
- Loading, empty, error, degraded, and success states.
- Mobile viewport examples.
- Dense operations dashboard examples.
- Motion and reduced-motion examples.
- Multi-brand theme switcher.

---

## 11. Documentation Architecture

### 11.1 Documentation Structure

```text
docs/
├── architecture/
│   ├── implementation-blueprint.md
│   ├── product-foundation.md
│   ├── commerce-engine-architecture.md
│   ├── restaurant-operations-architecture.md
│   ├── security-tenant-isolation-architecture.md
│   ├── frontend-ux-design-system-architecture.md
│   ├── infrastructure-devops-observability-architecture.md
│   └── data-analytics-intelligence-architecture.md
├── adr/
│   ├── README.md
│   └── YYYY-MM-DD-<decision-title>.md
├── rfc/
│   ├── README.md
│   ├── proposed/
│   ├── accepted/
│   ├── rejected/
│   └── superseded/
├── runbooks/
│   ├── checkout-incident.md
│   ├── payment-webhook-delay.md
│   ├── realtime-degradation.md
│   ├── database-rollback.md
│   └── branch-outage.md
├── playbooks/
│   ├── release-playbook.md
│   ├── migration-playbook.md
│   ├── incident-playbook.md
│   └── security-response-playbook.md
├── onboarding/
│   ├── local-development.md
│   ├── repository-tour.md
│   ├── domain-ownership.md
│   └── first-pr.md
├── product/
├── security/
├── data/
├── qa/
└── operations/
```

### 11.2 ADR Rules

ADRs are required for:

- Runtime architecture changes.
- Database schema strategy changes.
- Cross-domain dependency changes.
- Provider selection.
- Security model changes.
- Design system governance changes.
- Event versioning or contract versioning changes.

### 11.3 RFC Rules

RFCs are required before large implementation work that affects multiple teams or domains. RFCs must include problem, constraints, proposal, alternatives, migration plan, rollout plan, risks, observability, and ownership.

### 11.4 Runbook Rules

Every critical production capability must have a runbook before launch:

- Checkout.
- Payments.
- Webhooks.
- Orders.
- Kitchen dashboard.
- Delivery dispatch.
- Notifications.
- Realtime.
- Database migrations.
- Provider incidents.

---

## 12. Testing Architecture

### 12.1 Test Structure

```text
tests/
├── e2e/
│   ├── customer/
│   ├── admin/
│   ├── operations/
│   └── cross-app/
├── integration/
│   ├── supabase/
│   ├── edge-functions/
│   ├── payments/
│   ├── notifications/
│   └── realtime/
├── contract/
│   ├── api/
│   ├── events/
│   └── analytics/
├── performance/
│   ├── frontend/
│   ├── database/
│   ├── realtime/
│   └── checkout/
├── security/
│   ├── rls/
│   ├── authz/
│   ├── secrets/
│   ├── dependency-scan/
│   └── abuse-cases/
├── accessibility/
│   ├── customer/
│   ├── admin/
│   └── operations/
└── smoke/
    ├── preview/
    ├── staging/
    └── production/
```

### 12.2 Test Types

| Test Type | Scope | Owner |
| --- | --- | --- |
| Unit | Functions, components, validators, state machines. | Owning team. |
| Integration | Supabase, Edge Functions, provider adapters, realtime, storage. | Owning team plus Platform. |
| Contract | API, event, analytics, webhook contracts. | Platform API/Event/Data teams. |
| E2E | Critical customer, admin, and operations journeys. | QA Architecture plus product teams. |
| Performance | Web vitals, database queries, realtime channels, checkout path. | SRE plus owning team. |
| Security | RLS, RBAC, tenant isolation, secrets, dependency scanning, abuse cases. | Security team. |
| Accessibility | Keyboard, screen reader, contrast, reduced motion, focus. | Design System plus QA. |

### 12.3 Quality Gates

A pull request must pass:

- Typecheck.
- Lint.
- Unit tests for changed packages/apps.
- Contract compatibility checks when contracts change.
- Event schema compatibility checks when events change.
- RLS tests when policies or exposed tables change.
- Migration validation when database changes.
- Accessibility checks when UI changes.
- E2E smoke checks for critical flows before production release.

### 12.4 Critical E2E Flows

- Browse menu and add item to cart.
- Validate cart and checkout.
- Initiate payment and handle return.
- Receive Mercado Pago webhook and update order.
- Track order status.
- Staff accepts kitchen ticket.
- Staff marks item ready.
- Dispatch delivery.
- Admin updates item availability.
- Customer sees availability change.

---

## 13. CI/CD Integration Structure

### 13.1 CI/CD Folder Structure

```text
.github/
├── workflows/
│   ├── pr-checks.yml
│   ├── preview-deploy.yml
│   ├── staging-deploy.yml
│   ├── production-deploy.yml
│   ├── database-migration-check.yml
│   ├── security-scan.yml
│   ├── contract-check.yml
│   └── scheduled-maintenance.yml
└── PULL_REQUEST_TEMPLATE.md

infrastructure/ci/
├── checks/
├── policies/
├── environments/
└── reusable-workflows/

infrastructure/release/
├── release-flow.md
├── rollback-flow.md
├── migration-gates.md
└── changelog-policy.md
```

### 13.2 Pipeline Stages

1. Install and cache dependencies.
2. Validate workspace configuration.
3. Typecheck affected apps/packages.
4. Lint affected apps/packages.
5. Run unit tests.
6. Validate API contracts.
7. Validate event schemas.
8. Validate analytics event schemas.
9. Validate database migrations.
10. Run RLS/security tests when database security changes.
11. Build affected apps.
12. Run accessibility checks for UI changes.
13. Deploy preview for app changes.
14. Run preview smoke tests.
15. Promote to staging after merge.
16. Run staging E2E, payment sandbox, and migration checks.
17. Production release with approval and rollback plan.

### 13.3 Environment Strategy

| Environment | Purpose | Data | Providers |
| --- | --- | --- | --- |
| Local | Developer iteration. | Synthetic seeds. | Mock/sandbox. |
| Preview | PR validation. | Isolated preview data. | Mock/sandbox. |
| Staging | Production-like validation. | Representative non-production data. | Sandbox providers. |
| Production | Customer and operations traffic. | Production data. | Live providers. |

### 13.4 Release Flow

- Feature branches open PRs.
- PRs produce preview deployments.
- Merges to main deploy to staging.
- Release candidates are tagged from main.
- Production deploy requires green staging checks and approval.
- Database migrations use expand-contract strategy.
- Rollback plans must include application rollback and data repair strategy.

---

## 14. Security Structure

### 14.1 Security Repository Structure

```text
packages/auth/
├── src/
│   ├── session/
│   ├── rbac/
│   ├── permissions/
│   ├── guards/
│   ├── tenant-scope/
│   ├── branch-scope/
│   └── audit/
└── tests/

docs/security/
├── auth-model.md
├── rbac-model.md
├── tenant-isolation.md
├── branch-isolation.md
├── secret-handling.md
├── threat-models/
└── abuse-cases/

supabase/policies/
├── identity_access/
├── tenant_branch/
├── catalog_menu/
├── orders/
├── payments/
└── operations/

tests/security/
├── rls/
├── authz/
├── tenant-isolation/
├── branch-isolation/
└── secrets/
```

### 14.2 Auth Strategy

- Supabase Auth is the identity provider.
- Application sessions are validated server-side for privileged operations.
- Auth context must include user ID, tenant memberships, branch memberships, roles, and permissions.
- Route guards improve UX but are not authorization boundaries.
- Server-side authorization is mandatory for mutations and privileged reads.

### 14.3 RBAC Strategy

Roles are permission bundles, not hard-coded branching logic.

Permission format:

```text
<domain>:<resource>:<action>:<scope>
```

Examples:

- `orders:order:read:own`
- `orders:order:update:branch`
- `catalog:item:update:tenant`
- `payments:refund:create:tenant`
- `platform:audit:read:global`

### 14.4 Tenant and Branch Isolation

Isolation is enforced with:

- RLS policies.
- Tenant-scoped claims or membership lookup functions.
- Branch-scoped membership checks.
- Tenant-aware event metadata.
- Tenant-aware storage paths.
- Tenant-aware logs and analytics.
- Support access auditing.

### 14.5 Secret Handling

- Secrets live in Vercel and Supabase environment secret stores.
- No secrets are committed to the repository.
- `.env.example` documents required variables without values.
- Provider secrets are environment-scoped.
- Service-role keys are server-only and never enter browser bundles.
- Rotation runbooks are required for Mercado Pago, WhatsApp, email, Supabase, and observability keys.

---

## 15. Analytics Structure

### 15.1 Analytics Repository Structure

```text
packages/analytics/
├── src/
│   ├── events/
│   ├── tracking/
│   ├── consent/
│   ├── identity/
│   ├── adapters/
│   ├── metrics/
│   └── warehouse/
├── catalog/
│   ├── customer-events.md
│   ├── commerce-events.md
│   ├── operations-events.md
│   └── admin-events.md
└── tests/

docs/data/
├── metrics-definitions.md
├── warehouse-contracts.md
├── analytics-taxonomy.md
├── privacy-classification.md
└── dashboard-catalog.md
```

### 15.2 Analytics Event Naming

Format:

```text
<surface>.<domain>.<object>.<action>
```

Examples:

- `customer.menu.item_viewed`
- `customer.cart.item_added`
- `customer.checkout.started`
- `customer.payment.preference_created`
- `operations.kitchen.ticket_claimed`
- `admin.catalog.item_updated`

### 15.3 Analytics Event Requirements

Each analytics event must define:

- Event name.
- Owner.
- Description.
- Trigger condition.
- Properties.
- Required context.
- Privacy classification.
- Consent requirement.
- Destination.
- Retention.
- Metric mappings.

### 15.4 Metrics Definitions

Metrics must be defined before dashboard implementation.

Core metric categories:

- Conversion funnel.
- Average order value.
- Checkout failure rate.
- Payment approval rate.
- Webhook delay.
- Order preparation time.
- Kitchen queue time.
- Delivery assignment time.
- Delivery completion time.
- Branch availability uptime.
- Promotion redemption.
- Customer reorder rate.

---

## 16. Observability Structure

### 16.1 Observability Repository Structure

```text
packages/observability/
├── src/
│   ├── logging/
│   ├── tracing/
│   ├── metrics/
│   ├── errors/
│   ├── correlation/
│   ├── redact/
│   └── runtime/
└── tests/

infrastructure/observability/
├── dashboards/
│   ├── commerce/
│   ├── payments/
│   ├── kitchen/
│   ├── delivery/
│   ├── realtime/
│   └── infrastructure/
├── alerts/
│   ├── checkout.yml
│   ├── payments.yml
│   ├── realtime.yml
│   ├── database.yml
│   └── branch-operations.yml
├── slo/
│   ├── checkout.md
│   ├── payments.md
│   ├── realtime.md
│   └── operations.md
└── runbooks-map.md
```

### 16.2 Required Correlation Fields

Every critical log, trace, event, and metric should include where applicable:

- `correlation_id`
- `request_id`
- `tenant_id`
- `branch_id`
- `user_id` or redacted actor reference
- `order_id`
- `payment_id`
- `provider_reference`
- `deployment_id`
- `environment`

### 16.3 Logging Rules

- Logs must be structured.
- Sensitive fields must be redacted before emission.
- Provider payloads must not be logged in full.
- Error logs must include safe error codes and correlation IDs.
- Operational state transitions must be logged at business-event level.

### 16.4 Metrics and Alerts

Critical alerts:

- Checkout error rate exceeds threshold.
- Mercado Pago webhook delay exceeds SLO.
- Payment approval drop.
- Order status transition failure.
- Kitchen queue projection stale.
- Realtime reconnect storm.
- Database connection or query latency spike.
- RLS authorization anomaly.
- Notification delivery failure spike.

---

## 17. Naming Conventions

### 17.1 Folders

- Use kebab-case for folders.
- Domain folders use bounded-context names: `cart-checkout`, `catalog-menu`, `identity-access`.
- Avoid vague names such as `common`, `misc`, `shared-stuff`, or `helpers`.

### 17.2 Files

- React components: `kebab-case.tsx` file names with PascalCase exports.
- Hooks: `use-<name>.ts`.
- Services: `<domain>-service.ts` or `<action>-service.ts`.
- Schemas: `<object>.schema.ts`.
- Tests: `<subject>.test.ts` or `<subject>.spec.ts`.
- E2E tests: `<journey>.e2e.ts`.
- SQL migrations: `YYYYMMDDHHMMSS_<action>_<domain>_<object>.sql`.

### 17.3 Packages

Package names use the internal scope:

```text
@jburguer/<package-name>
```

Examples:

- `@jburguer/ui`
- `@jburguer/contracts`
- `@jburguer/events`

### 17.4 Components

- Component exports use PascalCase.
- Component variants use explicit semantic names.
- Domain components include domain prefix only when ambiguity exists.
- UI package primitives must not include business nouns.

Examples:

- `Button`
- `StatusBadge`
- `OrderStatusTimeline`
- `KitchenTicketCard`

### 17.5 Events

Business events:

```text
<domain>.<aggregate>.<past-tense-action>.v<major>
```

Analytics events:

```text
<surface>.<domain>.<object>.<action>
```

### 17.6 Tables

- Use plural snake_case.
- Foreign keys use `<referenced_singular>_id`.
- Timestamps use `created_at`, `updated_at`, `deleted_at`, `occurred_at`, `processed_at`.
- Boolean fields use positive names such as `is_active`, `is_available`, `requires_approval`.

### 17.7 APIs

- REST-like paths use kebab-case resource names.
- Commands use verbs.
- Queries use nouns and filters.
- Webhooks include provider in path.

Examples:

- `/api/v1/orders/create`
- `/api/v1/orders/{orderId}`
- `/api/v1/payments/mercado-pago/webhook`

---

## 18. Dependency Rules

### 18.1 Allowed Dependencies

Applications may depend on:

- Shared packages.
- Their own feature modules.
- Generated types.
- Public contract clients.

Domain modules may depend on:

- Foundational packages.
- Their own internal layers.
- Public contracts/events from other domains when integration is required.

Shared packages may depend on:

- Lower-level shared packages.
- Runtime-compatible utilities.
- Explicit peer dependencies.

### 18.2 Dependency Direction

Dependency direction:

```text
apps → packages → external dependencies
apps → domains through contracts only
domains → packages
domains → other domains through contracts/events only
supabase/functions → domains/contracts/packages
```

### 18.3 Forbidden Dependencies

Forbidden:

- App-to-app imports.
- Feature-to-feature private imports.
- UI package importing app or domain code.
- Browser package importing server-only package.
- Edge Function importing browser-only code.
- Domain repository imported directly by another domain.
- Direct database access from frontend client code when a contract is required.
- Analytics package importing product feature code.
- Observability package importing application code.
- Circular dependencies between packages.

### 18.4 Boundary Enforcement

Boundaries are enforced by:

- Workspace package exports.
- ESLint import rules.
- TypeScript project references.
- CI dependency graph checks.
- CODEOWNERS review.
- Architecture review for boundary exceptions.

---

## 19. Scalability Rules

### 19.1 More Teams

As teams grow:

- Ownership remains domain-based.
- CODEOWNERS becomes mandatory for every package and domain.
- RFCs are required for cross-domain changes.
- Shared package changes require compatibility checks.
- Domain scorecards track tests, docs, alerts, and operational readiness.

### 19.2 More Brands

For additional brands:

- Add brand token sets in `packages/tokens/src/brand`.
- Add brand assets through approved asset pipelines.
- Tenant configuration selects brand theme.
- Business rules remain domain-driven, not brand hard-coded.
- Brand-specific promotions use configuration and feature flags.

### 19.3 More Branches

For additional branches:

- Branch-scoped tables, queues, realtime channels, and projections remain mandatory.
- Dashboards query branch-scoped read models.
- Kitchen and delivery load is partitioned by branch.
- Branch incidents degrade locally before global degradation.
- Operational alerts include branch labels.

### 19.4 Mobile Apps

For mobile expansion:

- Reuse contracts, events, auth, analytics, validation, and tokens.
- Avoid coupling mobile to web UI package.
- Introduce cross-platform primitives only after clear reuse needs.
- Preserve API compatibility and offline-friendly query/command design.
- Add mobile-specific E2E and release workflows.

### 19.5 AI Systems

For AI expansion:

- Create `domains/ai-assistance` only when production AI workflows exist.
- AI systems must consume approved events, read models, or warehouse contracts.
- Prompt templates, evaluation datasets, and safety policies must be versioned.
- AI-generated decisions affecting customers or operations require audit trails.
- PII access must be minimized and governed by security and data policies.
- AI recommendations must be observable and reversible.

### 19.6 Platform Evolution

The monorepo may later support:

- Separate deployment units per app.
- Separately versioned internal packages.
- Dedicated worker runtime if Supabase Edge Functions become insufficient.
- Dedicated data warehouse when analytics volume grows.
- Regional deployments if latency or compliance requires it.

Any evolution must preserve contracts, events, tenant isolation, auditability, and operational visibility.

---

## 20. Implementation Roadmap

### 20.1 Roadmap Principles

Implementation proceeds by reducing foundational risk first:

1. Establish repository and governance.
2. Establish design system and shared contracts.
3. Establish database security and domain foundations.
4. Implement critical commerce path.
5. Add operational execution.
6. Add admin and analytics.
7. Harden reliability, security, and release processes.

### 20.2 Week 1 — Repository Foundation

Build:

- Monorepo workspace.
- Root folder structure.
- Package manager and build orchestration.
- Base TypeScript, ESLint, Prettier, Tailwind configuration.
- CODEOWNERS.
- PR template.
- Initial README and CONTRIBUTING.
- Documentation skeleton.
- ADR and RFC templates.

Dependencies:

- None.

Risk reduction:

- Prevents unstructured code growth.
- Establishes ownership and quality gates before feature development.

### 20.3 Week 2 — Design System and Frontend Shells

Build:

- `packages/tokens` initial base and semantic token structure.
- `packages/ui` primitive structure using shadcn/ui conventions.
- `apps/storybook` foundation.
- `apps/customer`, `apps/admin`, and `apps/operations` route skeletons.
- Theme provider, app shell, error boundaries, loading states.
- Accessibility baseline checks.

Dependencies:

- Week 1 workspace foundation.

Risk reduction:

- Ensures UI consistency before product screens multiply.
- Validates Next.js 15 app structure early.

### 20.4 Week 3 — Supabase and Security Foundation

Build:

- Supabase project structure.
- Database schemas.
- Initial identity, tenant, branch, and audit tables.
- RLS policy framework.
- Generated database types pipeline.
- `packages/auth` permission model.
- Security documentation and initial tenant isolation tests.

Dependencies:

- Week 1 repository foundation.

Risk reduction:

- Validates multi-tenant model and authorization before commerce data is introduced.

### 20.5 Week 4 — Contracts, Events, Observability, and Analytics Foundations

Build:

- `packages/contracts` command/query structure.
- `packages/events` catalog and schema rules.
- `packages/observability` correlation, logging, error envelope rules.
- `packages/analytics` taxonomy and consent model.
- Contract and event compatibility CI checks.

Dependencies:

- Week 1 foundation.
- Week 3 identity and tenant model for context fields.

Risk reduction:

- Prevents untyped API drift.
- Establishes correlation and analytics before production workflows.

### 20.6 Week 5 — Catalog and Menu Foundation

Build:

- Catalog database tables, policies, seeds, and read models.
- Menu contracts and queries.
- Customer menu browsing feature skeleton.
- Admin menu management skeleton.
- Menu analytics events.
- Menu availability event definitions.

Dependencies:

- Weeks 2 to 4.

Risk reduction:

- Proves customer/admin shared domain flow.
- Validates RLS on customer-visible data.

### 20.7 Week 6 — Cart and Checkout Foundation

Build:

- Cart validation contracts.
- Pricing and fee calculation model.
- Checkout command contract.
- Customer cart and checkout UI skeleton.
- Checkout observability and analytics events.
- Idempotency strategy for checkout commands.

Dependencies:

- Catalog/menu foundation.
- Contracts and observability foundation.

Risk reduction:

- Exercises the most important conversion path before payment integration.

### 20.8 Week 7 — Orders and Payment Integration

Build:

- Order tables, status lifecycle, policies, and audit records.
- Mercado Pago payment preference contract.
- Payment attempt tables.
- Webhook Edge Function structure.
- Payment idempotency and deduplication.
- Payment sandbox tests.
- Customer order confirmation and tracking skeleton.

Dependencies:

- Cart and checkout foundation.
- Security and observability foundations.

Risk reduction:

- Validates external payment flow, webhook reliability, and order state transitions.

### 20.9 Week 8 — Kitchen Operations Foundation

Build:

- Kitchen queue projection.
- Kitchen ticket state machine.
- Operations app kitchen dashboard skeleton.
- Branch-scoped realtime channel contracts.
- Staff permissions for kitchen actions.
- Kitchen performance metrics.

Dependencies:

- Orders foundation.
- Realtime and auth foundations.

Risk reduction:

- Validates operational realtime flow and branch-scoped isolation.

### 20.10 Week 9 — Delivery and Notifications Foundation

Build:

- Delivery assignment model.
- Pickup and delivery status contracts.
- WhatsApp and email notification templates.
- Notification dispatch worker structure.
- Customer notification preferences.
- Delivery tracking UI skeleton.

Dependencies:

- Orders and kitchen foundations.

Risk reduction:

- Validates post-payment fulfillment and customer communication.

### 20.11 Week 10 — Admin Operations, Support, and Reconciliation

Build:

- Admin order management.
- Support case foundation.
- Payment reconciliation views.
- Refund command contract skeleton.
- Audit log views.
- Staff management foundation.

Dependencies:

- Orders, payments, auth, and audit foundations.

Risk reduction:

- Provides operational recovery tools before production launch.

### 20.12 Week 11 — Promotions, Loyalty, and Branch Controls

Build:

- Promotion eligibility model.
- Coupon redemption contracts.
- Loyalty point ledger foundation.
- Branch opening hours and availability controls.
- Customer promotion UI skeleton.
- Admin campaign skeleton.

Dependencies:

- Checkout, orders, tenant/branch foundations.

Risk reduction:

- Introduces revenue-driving features after core order reliability is proven.

### 20.13 Week 12 — Reliability, Performance, and Launch Hardening

Build:

- E2E critical journey tests.
- Load tests for checkout and kitchen projections.
- RLS regression suite.
- Security abuse-case suite.
- Observability dashboards and alerts.
- Runbooks for critical incidents.
- Release and rollback playbooks.
- Staging production-like validation.

Dependencies:

- All core domains.

Risk reduction:

- Converts feature-complete system into operable production platform.

### 20.14 Post-Launch Iteration

Build:

- Advanced analytics dashboards.
- Multi-brand theme activation.
- AI assistance RFCs if justified.
- Mobile app discovery and contract compatibility checks.
- Advanced delivery optimization.
- Performance tuning based on production telemetry.
- Cost optimization and retention policies.

---

## 21. Developer Workflow

### 21.1 Local Development Flow

1. Read repository onboarding.
2. Install workspace dependencies.
3. Start local Supabase or connect to approved development project.
4. Apply migrations.
5. Seed synthetic data.
6. Start target app.
7. Run affected tests before opening PR.
8. Update docs, contracts, or events when boundaries change.

### 21.2 Pull Request Requirements

Every PR must include:

- Scope and domain.
- Risk level.
- Test evidence.
- Migration notes if database changes exist.
- Security impact if auth, RLS, secrets, payments, or PII are touched.
- Observability impact if production workflows change.
- Screenshots for visible UI changes.
- Docs updates for architecture or operational changes.

### 21.3 Definition of Done

A feature is done when:

- Code is typed, linted, tested, and reviewed.
- Contracts are versioned and documented.
- Events are cataloged if emitted.
- RLS and authorization are tested.
- Observability is implemented for critical flows.
- Analytics events are defined and validated.
- Runbooks are updated for operationally critical behavior.
- Accessibility states are validated for UI changes.
- Documentation is updated.

---

## 22. Architecture Governance

### 22.1 Architecture Review Required For

- New app.
- New shared package.
- New domain.
- New database schema.
- Breaking API or event change.
- New external provider.
- Security model change.
- Runtime/deployment topology change.
- Cross-domain dependency exception.
- New analytics identity strategy.

### 22.2 Governance Artifacts

- ADR for decisions.
- RFC for major proposals.
- CODEOWNERS for review routing.
- Contract catalog for APIs.
- Event catalog for events.
- Metric catalog for analytics.
- Runbooks for operations.
- Threat models for sensitive workflows.

---

## 23. Final Implementation Rules

1. Build foundations before features.
2. Keep domains isolated.
3. Share contracts, not internals.
4. Treat RLS as mandatory infrastructure, not an afterthought.
5. Treat events and analytics as versioned products.
6. Keep UI primitives domain-agnostic.
7. Keep operational dashboards branch-scoped and realtime-safe.
8. Keep payment flows idempotent and observable.
9. Keep provider secrets server-only.
10. Keep documentation synchronized with architecture changes.
11. Prefer explicit ownership over informal conventions.
12. Prefer measured scalability over premature abstraction.

This blueprint is the implementation foundation for the repository. Production implementation should begin only after the repository structure, ownership model, quality gates, and security foundations described here are in place.
