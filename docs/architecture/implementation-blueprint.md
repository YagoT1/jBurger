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
│   ├── domain-types/
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
│   ├── shared-kernel/
│   ├── audit-compliance/
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



### 2.3 Canonical Updated Monorepo Tree with Foundational Domains

The following tree is the official implementation structure after adding `packages/domain-types`, `domains/shared-kernel`, and `domains/audit-compliance`.

```text
/
├── apps/
│   ├── customer/
│   │   ├── app/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── providers/
│   │   │   ├── services/
│   │   │   ├── lib/
│   │   │   ├── analytics/
│   │   │   └── observability/
│   │   ├── public/
│   │   └── tests/
│   ├── admin/
│   │   ├── app/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   ├── components/
│   │   │   ├── providers/
│   │   │   ├── services/
│   │   │   └── lib/
│   │   └── tests/
│   ├── operations/
│   │   ├── app/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   ├── realtime/
│   │   │   ├── providers/
│   │   │   └── services/
│   │   └── tests/
│   ├── storybook/
│   └── mobile/
├── packages/
│   ├── ui/
│   ├── tokens/
│   ├── types/
│   ├── domain-types/
│   │   ├── catalog/
│   │   ├── entities/
│   │   ├── lifecycles/
│   │   ├── references/
│   │   ├── relationships/
│   │   ├── docs/
│   │   └── tests/
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
├── domains/
│   ├── shared-kernel/
│   │   ├── concepts/
│   │   ├── policies/
│   │   ├── tests/
│   │   └── docs/
│   ├── audit-compliance/
│   │   ├── model/
│   │   ├── subdomains/
│   │   ├── policies/
│   │   ├── events/
│   │   ├── projections/
│   │   ├── workers/
│   │   ├── analytics/
│   │   └── tests/
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
├── supabase/
│   ├── migrations/
│   ├── seeds/
│   ├── policies/
│   │   ├── shared-kernel/
│   │   ├── audit-compliance/
│   │   └── <domain>/
│   ├── functions/
│   ├── database/
│   │   ├── shared-kernel/
│   │   ├── audit-compliance/
│   │   ├── domain-types/
│   │   ├── extensions/
│   │   ├── schemas/
│   │   ├── tables/
│   │   ├── indexes/
│   │   ├── constraints/
│   │   ├── enums/
│   │   └── comments/
│   ├── schemas/
│   ├── views/
│   ├── triggers/
│   ├── rpc/
│   ├── storage/
│   ├── realtime/
│   ├── tests/
│   │   ├── shared-kernel/
│   │   ├── audit-compliance/
│   │   ├── rls/
│   │   └── migrations/
│   └── generated/
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
├── tools/
├── .github/
├── .changeset/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── CODEOWNERS
├── SECURITY.md
├── CONTRIBUTING.md
└── README.md
```

### 2.4 Workspace Rules

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
- `@jburguer/domain-types`
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
- `@jburguer/domain-types`
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
- `@jburguer/domain-types`
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
- `@jburguer/domain-types`
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
| `@jburguer/types` | `packages/types` | Technical TypeScript primitives, branded IDs, helper generics, and non-business compile-time utilities. |
| `@jburguer/domain-types` | `packages/domain-types` | Canonical shared business type names, lifecycle enums, identifiers, and cross-boundary DTO type contracts. |
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



### 4.5 Domain Types Foundation (`packages/domain-types`)

#### 4.5.1 Purpose

`packages/domain-types` is the canonical TypeScript vocabulary for business entities that cross application, package, API, event, analytics, and documentation boundaries. It exists before implementation so engineers do not invent competing names, lifecycle states, identifiers, or DTO shapes for the same business concepts in separate apps or domains.

It prevents:

- Duplicate `Order`, `MenuItem`, `Payment`, `Customer`, or `Branch` definitions across apps.
- Divergent lifecycle names such as `paid`, `approved`, `payment_success`, and `paymentApproved` for the same concept.
- Frontend-specific domain drift from backend and event contracts.
- Analytics event payloads using concepts that do not match operational contracts.
- Refactors caused by inconsistent primitive naming after database design starts.

`packages/domain-types` is not the domain model implementation. It is the **shared language layer** used at boundaries.

#### 4.5.2 What Belongs Inside

The package owns:

- Entity identity types and canonical IDs.
- Cross-boundary entity snapshots and references.
- Lifecycle state enums and state labels.
- Public DTO-friendly type shapes shared by apps, contracts, events, analytics, and test fixtures.
- Stable relationship references between entities.
- Business taxonomies used by multiple domains.
- Shared discriminated unions for provider-neutral statuses.
- Readonly boundary types for projections and event payloads.

Examples:

- `OrderId`, `OrderStatus`, `OrderReference`.
- `CartId`, `CartItemSnapshot`.
- `PaymentStatus`, `PaymentProvider`, `RefundStatus`.
- `BranchId`, `OrganizationId`, `TenantScopedReference`.
- `KitchenTicketStatus`, `DeliveryStatus`.
- `PromotionStatus`, `CouponRedemptionStatus`.

#### 4.5.3 What Must Never Belong Inside

The package must never contain:

- Database query logic.
- Supabase client logic.
- Next.js components or hooks.
- Validation schemas with runtime side effects.
- State machines that enforce domain behavior.
- Business services or orchestration.
- Provider SDK adapters.
- RLS policy logic.
- Secrets or environment access.
- Domain-specific calculations such as pricing, loyalty earning, ETA, delivery fee, or refund eligibility.
- App-specific view models.
- Analytics adapter implementation.

If a type requires behavior, invariants, or decision-making, it belongs in a domain module or the shared kernel, not in `packages/domain-types`.

#### 4.5.4 Ownership Rules

- Primary owner: Platform Architecture and Domain Modeling Council.
- Required reviewers: owning business domain, API Contracts owner, Event Platform owner, Data Platform owner, and Security owner when PII, payments, permissions, or audit fields are affected.
- No team may add a new canonical entity type without documenting lifecycle, owner, relationships, and boundary usage.
- Domain-specific extensions must stay in the owning domain unless two or more domains require the same concept.
- Deprecations must include replacement types, migration notes, affected packages, and removal date.

#### 4.5.5 Dependency Rules

Allowed dependencies:

- `@jburguer/types` for technical branded IDs and compile-time helpers.
- `domains/shared-kernel` exported value-object type contracts only when packaged through a stable shared export or mirrored as boundary-compatible shapes.

Forbidden dependencies:

- Any application package.
- Any domain implementation package.
- `@jburguer/contracts`.
- `@jburguer/events`.
- `@jburguer/db`.
- `@jburguer/auth`.
- Provider packages such as payments or notifications.

Dependency direction must be:

```text
shared-kernel concepts → domain-types boundary vocabulary → contracts/events/apps
```

Contracts and events may depend on `domain-types`; `domain-types` must never depend on contracts or events.

#### 4.5.6 Versioning Strategy

- The package is versioned with the monorepo during early platform development.
- Breaking type changes require an ADR when they affect more than one domain.
- Lifecycle enum removals or semantic changes require a migration plan and compatibility window.
- Additive fields must be optional unless every producer can populate them immediately.
- Deprecated fields remain until all contracts, events, analytics definitions, and app consumers are migrated.
- Event schemas must pin the type meaning at publication time; event history is never reinterpreted because a domain type changed.

### 4.6 Domain Types Catalog

| Type | Responsibility | Ownership | Lifecycle | Relationships |
| --- | --- | --- | --- | --- |
| `Organization` | Represents the tenant-level business entity that owns brands, branches, users, billing context, configuration, and governance scope. | Tenant/Branch domain with Security review. | Created during onboarding, configured, active, suspended, archived. | Owns branches, staff memberships, brand settings, audit scope, feature flags, analytics scope. |
| `Brand` | Represents customer-facing identity, theme, assets, and brand-specific configuration under an organization. | Brand/Design System plus Tenant/Branch domain. | Draft, active, retired. | Belongs to organization; selected by branches and apps; references tokens and assets. |
| `Branch` | Represents a physical restaurant branch with address, hours, capacity, fulfillment modes, and operational state. | Tenant/Branch and Operations. | Draft, onboarding, open, paused, closed, incident, archived. | Belongs to organization and brand; owns orders, kitchen queues, delivery zones, staff assignments, branch analytics. |
| `Customer` | Represents an ordering customer identity and profile context. | Identity/Access and Customer domain. | Anonymous session, registered, verified, restricted, deleted/anonymized. | Owns carts, orders, addresses, loyalty accounts, support cases, notification preferences. |
| `Address` | Represents a postal/delivery address boundary type for customers, branches, and delivery destinations. | Shared Kernel owns value semantics; consuming domains own persistence. | Draft, validated, active, inactive, deleted. | Used by customers, branches, delivery, payments risk context, support. |
| `MenuItem` | Represents a sellable catalog item with pricing reference, media, availability, modifiers, and branch visibility. | Catalog/Menu domain. | Draft, active, unavailable, hidden, retired. | Belongs to category; references modifiers, combos, images, branch availability, order items. |
| `Category` | Represents menu grouping and merchandising order. | Catalog/Menu domain. | Draft, active, hidden, retired. | Contains menu items and combos; scoped by tenant, brand, and optionally branch. |
| `Modifier` | Represents an option or customization attached to menu items or combos. | Catalog/Menu domain. | Draft, active, unavailable, retired. | Belongs to modifier groups; selected by cart items and order items. |
| `ModifierGroup` | Represents rules around modifier selection such as required, min, max, and display order. | Catalog/Menu domain. | Draft, active, unavailable, retired. | Attached to menu items and combos; contains modifiers. |
| `Combo` | Represents a bundled sellable offer composed from items, groups, and pricing rules. | Catalog/Menu with Promotions review. | Draft, active, unavailable, retired. | References menu items, modifier groups, promotions, cart items, order items. |
| `Cart` | Represents a customer's mutable pre-order basket for a branch and fulfillment mode. | Cart/Checkout domain. | Empty, active, validating, ready_for_checkout, checked_out, expired, abandoned. | Owned by customer/session; contains cart items; references branch, coupons, promotion eligibility, delivery destination. |
| `CartItem` | Represents a selected menu item/combo and customization inside a cart. | Cart/Checkout domain. | Added, updated, invalid, removed, converted_to_order_item. | Belongs to cart; references menu item/combo, modifiers, pricing snapshot. |
| `Order` | Represents a confirmed commercial transaction and fulfillment lifecycle. | Orders domain. | Created, awaiting_payment, paid, accepted, preparing, ready, dispatched, completed, cancelled, failed, refunded/partially_refunded. | Created from cart; references customer, branch, payment, kitchen tickets, delivery, notifications, support cases, audit logs. |
| `OrderItem` | Represents immutable purchased item snapshot within an order. | Orders domain. | Created, routed_to_kitchen, preparing, ready, cancelled, fulfilled. | Belongs to order; references catalog snapshot and kitchen ticket lines. |
| `Payment` | Represents a provider-neutral payment attempt or settled payment associated with checkout/order. | Payments domain. | Created, pending, approved, rejected, cancelled, expired, refunded, partially_refunded, reconciled. | Belongs to order; references provider transaction, refunds, payment reviews, audit records. |
| `PaymentAttempt` | Represents a single attempt to authorize or capture money through Mercado Pago or future provider. | Payments domain. | Initialized, preference_created, redirected, pending_provider, approved, rejected, expired, errored. | Belongs to payment/order; produces webhook records and reconciliation entries. |
| `Refund` | Represents full or partial money return workflow. | Payments with Support and Audit/Compliance review. | Requested, under_review, approved, rejected, submitted, completed, failed, cancelled. | Belongs to payment/order/support case; requires refund review and audit event. |
| `Delivery` | Represents fulfillment delivery workflow for an order. | Delivery domain. | Pending_assignment, assigned, picking_up, picked_up, en_route, delivered, failed, cancelled. | Belongs to order and branch; references courier/driver, address, delivery zone, incidents. |
| `DeliveryAssignment` | Represents assignment of a delivery task to a driver/courier or dispatch mechanism. | Delivery domain. | Proposed, assigned, accepted, rejected, reassigned, completed, cancelled. | Belongs to delivery; references staff/driver, branch, operational override. |
| `KitchenTicket` | Represents kitchen execution unit for order preparation. | Kitchen domain. | Queued, claimed, preparing, blocked, ready, handed_off, cancelled. | Belongs to order/branch; contains ticket items; references station, staff actor, operational incidents. |
| `KitchenStation` | Represents a prep station or routing unit within a branch kitchen. | Kitchen domain. | Active, paused, overloaded, closed. | Owns kitchen ticket routing and capacity metrics. |
| `Notification` | Represents outbound communication to customer, staff, or admin via WhatsApp/email. | Notifications domain. | Created, queued, sent, delivered, failed, suppressed, expired. | References order, payment, delivery, support case, recipient, template, provider receipt. |
| `NotificationTemplate` | Represents versioned message template for WhatsApp/email. | Notifications with Compliance review. | Draft, approved, active, deprecated, retired. | Used by notifications; linked to consent, locale, brand, and audit trail. |
| `Coupon` | Represents redeemable code or entitlement. | Promotions/Loyalty domain. | Draft, active, paused, expired, exhausted, retired. | Associated with promotion, customer eligibility, cart validation, redemption records. |
| `Promotion` | Represents commercial campaign or discount rule. | Promotions/Loyalty with Admin and Finance review. | Draft, scheduled, active, paused, expired, archived. | Owns coupons, eligibility rules, discount effects, analytics, audit records. |
| `LoyaltyAccount` | Represents customer loyalty participation state. | Promotions/Loyalty domain. | Created, active, suspended, closed, anonymized. | Belongs to customer/organization; owns loyalty transactions and rewards. |
| `LoyaltyTransaction` | Represents points or reward ledger movement. | Promotions/Loyalty and Data review. | Pending, posted, reversed, expired. | Belongs to loyalty account; references order, promotion, reward, audit record. |
| `Reward` | Represents earned benefit or redemption option. | Promotions/Loyalty domain. | Draft, active, earned, redeemed, expired, cancelled. | Belongs to loyalty program/customer; may create coupon or checkout discount. |
| `SupportCase` | Represents customer/staff issue investigation and resolution workflow. | Support domain. | Open, triaged, waiting_customer, waiting_internal, resolved, closed, escalated. | References customer, order, payment, refund, delivery, branch, audit notes. |
| `IncidentRecord` | Represents operational, security, provider, or branch incident record. | Audit/Compliance plus owning operational domain. | Detected, acknowledged, investigating, mitigated, resolved, reviewed. | References branch, orders, provider, operational overrides, alerts, runbooks. |
| `AuditEvent` | Represents immutable normalized audit fact created from sensitive business/security actions. | Audit/Compliance domain. | Recorded, indexed, retained, archived, purged according to policy. | References actor, tenant, branch, affected entity, source event, compliance category. |
| `AnalyticsEvent` | Represents product or operational tracking fact with privacy classification. | Analytics/Data Platform. | Defined, emitted, validated, ingested, transformed, retired. | References domain entity IDs when allowed; mapped to metrics and warehouse contracts. |
| `UserMembership` | Represents user-to-tenant/branch relationship and role assignment. | Identity/Access with Audit/Compliance review. | Invited, active, suspended, revoked, expired. | Links user, organization, branch, roles, permission changes, access reviews. |
| `Role` | Represents named permission bundle. | Identity/Access with Security governance. | Draft, active, deprecated, retired. | Contains permissions; assigned through memberships; changes audited. |
| `FeatureFlag` | Represents controlled rollout or kill switch. | Platform Admin with SRE/Security review. | Draft, enabled, partially_enabled, disabled, retired. | Scoped by tenant, branch, brand, app, or user segment; changes audited. |

### 4.7 Domain Type Promotion and Change Control

A business type may be added to `packages/domain-types` only when at least one of the following is true:

- The concept appears in API contracts and event contracts.
- The concept appears in two or more apps.
- The concept appears in analytics or audit records and one operational domain.
- The concept is a lifecycle state used by multiple bounded contexts.

Change control requires:

- Type owner assignment.
- Lifecycle documentation.
- Relationship documentation.
- Compatibility review.
- Migration plan for existing contracts/events/fixtures.
- Test fixture update.

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
| `shared-kernel` | DDD shared kernel for value objects and universal concepts such as money, address, tenant context, pagination, audit metadata, and event metadata. |
| `audit-compliance` | First-class auditability, compliance records, access reviews, security events, retention policy, and regulated operational review workflows. |
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



### 6.5 Shared Kernel Foundation (`domains/shared-kernel`)

#### 6.5.1 Purpose

`domains/shared-kernel` is the intentionally small Domain Driven Design shared kernel for universal business concepts that must have one meaning across all bounded contexts. It is created before database schema, contracts, events, frontend features, and backend implementation so every domain uses the same definitions for money, address, contact data, tenant context, branch context, date/time ranges, pagination, domain errors, audit metadata, and domain event metadata.

The shared kernel is not a convenience library. It is a governed business-language dependency with strict compatibility and review requirements.

#### 6.5.2 Ownership

- Primary owner: Architecture Council and Domain Modeling Council.
- Required reviewers: Security for identity/audit/context concepts, Data Platform for event metadata and analytics compatibility, Backend Platform for runtime constraints, Frontend Platform for boundary usability.
- Consuming domains may propose changes but may not merge changes without shared-kernel owner approval.

#### 6.5.3 Boundaries

The shared kernel owns value semantics and cross-domain rules for universal concepts. It does not own domain-specific workflows.

Belongs in shared kernel:

- Universal value objects.
- Universal metadata models.
- Universal context objects.
- Universal error and pagination concepts.
- Cross-domain invariants that are stable and accepted by all consuming domains.

Does not belong in shared kernel:

- Order lifecycle.
- Payment provider behavior.
- Menu pricing rules.
- Kitchen routing rules.
- Delivery assignment logic.
- Promotion eligibility.
- Notification templates.
- Analytics adapters.
- Database repositories.

#### 6.5.4 Governance

- Shared kernel changes require an ADR when semantics change.
- Additive metadata fields require consumer impact assessment.
- Breaking changes require architecture approval and a migration window.
- Concepts must include examples of valid and invalid usage.
- Shared kernel must remain runtime-neutral and free of provider SDK dependencies.

#### 6.5.5 Shared Kernel Structure

```text
domains/shared-kernel/
├── README.md
├── ownership.yaml
├── concepts/
│   ├── money.md
│   ├── currency.md
│   ├── address.md
│   ├── contact.md
│   ├── geo.md
│   ├── temporal.md
│   ├── media.md
│   ├── audit-metadata.md
│   ├── tenant-context.md
│   ├── branch-context.md
│   ├── pagination.md
│   ├── domain-error.md
│   └── domain-event-metadata.md
├── policies/
│   ├── change-control.md
│   ├── compatibility.md
│   └── consumption-rules.md
├── tests/
│   ├── contract/
│   └── compatibility/
└── docs/
    ├── examples.md
    └── anti-patterns.md
```

#### 6.5.6 Shared Concepts Catalog

| Concept | Purpose | Usage Rules | Ownership | Dependency Constraints |
| --- | --- | --- | --- | --- |
| `Money` | Represents monetary amount with currency and precision expectations. | Use for prices, fees, discounts, refunds, loyalty monetary value, and reconciliation totals. Never represent money as floating point in contracts or events. | Shared Kernel with Payments and Finance review. | May depend on `Currency`; must not depend on payments, catalog, or order logic. |
| `Currency` | Represents ISO currency and platform-supported currency metadata. | Use in all monetary values; default must be explicit per tenant/branch. | Shared Kernel with Finance review. | No provider dependencies; provider-specific currency mapping belongs in payments. |
| `Address` | Represents postal and delivery address semantics. | Use for branch, customer, delivery, and billing context. Domain-specific validation extensions stay in owning domains. | Shared Kernel with Delivery and Compliance review. | May use `Coordinates`; must not depend on delivery zones or branch tables. |
| `Email` | Represents normalized email contact value and privacy classification. | Use for customer, staff, notification, support, and auth contact fields. | Shared Kernel with Security review. | Must not depend on notification providers or auth implementation. |
| `Phone` | Represents normalized phone contact value suitable for WhatsApp/SMS future use. | Use for customer, branch, staff, delivery, WhatsApp notifications. | Shared Kernel with Notifications and Security review. | Must not depend on WhatsApp provider SDK. |
| `Coordinates` | Represents latitude/longitude pair and precision expectations. | Use for branch location, delivery destination, geofencing, and distance calculations. | Shared Kernel with Delivery review. | No map-provider dependency. |
| `GeoArea` | Represents polygon/radius/service-area boundary at a conceptual level. | Use for delivery zones, branch service areas, and operational coverage. | Shared Kernel with Delivery and Operations review. | Must not include routing algorithms or provider-specific geospatial logic. |
| `DateRange` | Represents inclusive/exclusive date interval semantics. | Use for promotions, reporting periods, access reviews, retention windows, campaign scheduling. | Shared Kernel. | No domain dependencies. |
| `TimeRange` | Represents time-of-day interval semantics. | Use for business hours, delivery windows, kitchen shifts, campaign windows. | Shared Kernel. | No domain dependencies. |
| `BusinessHours` | Represents weekly/exception calendar opening windows. | Use for branch availability, scheduled ordering, admin configuration. | Shared Kernel with Tenant/Branch and Operations review. | Must not decide branch open/closed state without branch domain context. |
| `ImageAsset` | Represents asset identity, alt text, focal point, dimensions, and usage classification. | Use for menu media, brand assets, category images, promotion banners. | Shared Kernel with Design System and Catalog review. | Must not depend on storage provider implementation. |
| `AuditMetadata` | Represents created/updated/deleted actor and timestamp metadata for mutable records. | Use on business records requiring traceability. Must not replace immutable audit events. | Shared Kernel with Audit/Compliance review. | Must not depend on audit log persistence. |
| `TenantContext` | Represents tenant/organization scope required for authorization, events, logs, and analytics. | Mandatory for tenant-scoped commands, queries, events, metrics, and logs. | Shared Kernel with Security review. | Must not embed permission decision logic. |
| `BranchContext` | Represents branch scope and operational context. | Mandatory for branch-scoped operations, kitchen, delivery, branch analytics, and realtime channels. | Shared Kernel with Operations review. | Must not decide branch capacity or incident behavior. |
| `Pagination` | Represents pagination cursor/limit/sort semantics. | Use for list queries and admin/operations dashboards. Offset pagination requires explicit approval for large datasets. | Shared Kernel and API Platform. | No database-specific implementation details. |
| `DomainError` | Represents stable domain error category, code, message safety, and retryability. | Use in contracts, events, logs, and UI error mapping. Public messages must be safe. | Shared Kernel with Platform API and Security review. | Must not include app rendering or provider SDK errors directly. |
| `DomainEventMetadata` | Represents universal event metadata such as event ID, version, correlation, causation, actor, tenant, branch, occurrence time, and classification. | Mandatory for all domain events and audit events. | Shared Kernel with Event Platform and Audit/Compliance review. | Must not depend on event bus implementation. |

#### 6.5.7 Consumption and Modification Rules

May consume shared kernel:

- All domains.
- All shared packages.
- API contracts.
- Event contracts.
- Analytics definitions.
- Supabase Edge Functions.
- Frontend apps through stable exported boundary types only.

May modify shared kernel:

- Architecture Council.
- Domain Modeling Council.
- Explicitly assigned shared-kernel maintainers.

May not modify shared kernel directly:

- Feature teams without approved RFC/ADR.
- Application teams for app-specific convenience.
- Provider integration owners for provider-specific requirements.
- Analytics teams for tracking-only fields.

### 6.6 Audit and Compliance Foundation (`domains/audit-compliance`)

#### 6.6.1 Purpose

`domains/audit-compliance` treats auditability as a first-class business capability rather than a side effect of logging. It defines immutable audit facts, compliance events, security event normalization, retention policy, privileged access review, and operational review workflows for sensitive actions such as refunds, payment changes, permission changes, operational overrides, menu changes, promotion changes, and branch configuration changes.

#### 6.6.2 Ownership

- Primary owner: Security and Governance Platform Team.
- Required reviewers: Legal/Compliance representative where applicable, SRE for incident records, Payments for payment/refund reviews, Operations for branch overrides, Commerce for menu/promotion changes, Identity for access reviews.

#### 6.6.3 Scope

In scope:

- Immutable audit events.
- Queryable audit logs.
- Security events.
- Compliance events.
- Retention policies.
- Access reviews.
- Permission changes.
- Refund and payment reviews.
- Operational overrides.
- Promotion/menu/branch configuration changes.
- Incident records.
- Audit exports for authorized reviewers.

Out of scope:

- Product analytics optimization.
- General application logs.
- Low-level infrastructure logs unless security/compliance relevant.
- Domain workflow ownership. Audit records observe and preserve facts; they do not own order/payment/kitchen state transitions.

#### 6.6.4 Boundary Rules

- Audit/compliance consumes domain events and command metadata; it does not orchestrate business workflows.
- Audit records are immutable except for retention lifecycle metadata.
- Audit storage is append-only from application perspective.
- Audit readers require privileged permissions and access is itself audited.
- Audit/compliance may publish derived compliance events, but must not publish replacement business events for other domains.

#### 6.6.5 Audit and Compliance Structure

```text
domains/audit-compliance/
├── README.md
├── ownership.yaml
├── model/
│   ├── audit-event.md
│   ├── audit-log.md
│   ├── security-event.md
│   ├── compliance-event.md
│   ├── retention-policy.md
│   └── review-case.md
├── subdomains/
│   ├── audit-events/
│   ├── audit-logs/
│   ├── security-events/
│   ├── compliance-events/
│   ├── retention-policies/
│   ├── access-reviews/
│   ├── permission-changes/
│   ├── refund-reviews/
│   ├── payment-reviews/
│   ├── operational-overrides/
│   ├── promotion-changes/
│   ├── menu-changes/
│   ├── branch-configuration-changes/
│   └── incident-records/
├── policies/
│   ├── immutability.md
│   ├── retention.md
│   ├── privileged-access.md
│   ├── export-control.md
│   └── privacy-redaction.md
├── events/
│   ├── consumed-events.md
│   ├── emitted-events.md
│   └── mandatory-audit-events.md
├── projections/
│   ├── audit-log-read-model.md
│   ├── reviewer-workbench.md
│   └── compliance-dashboard.md
├── workers/
│   ├── audit-event-ingestion.md
│   ├── retention-enforcement.md
│   └── review-sla-monitor.md
├── analytics/
└── tests/
    ├── immutability/
    ├── rls/
    ├── retention/
    └── access-review/
```

#### 6.6.6 Audit and Compliance Subdomain Catalog

| Subdomain | Event Model | Ownership | Retention Requirements | Compliance Implications |
| --- | --- | --- | --- | --- |
| Audit Events | Immutable normalized facts with event metadata, actor, action, entity, before/after summary, reason, source, risk category, and correlation IDs. | Audit/Compliance. | Minimum 7 years for financial/security-sensitive actions; shorter configurable retention for low-risk operational events. | Primary evidence trail for regulated or disputed actions. |
| Audit Logs | Query-optimized read model of audit events with redacted summaries and reviewer metadata. | Audit/Compliance with Data Platform. | Follows source audit event retention; read model can be rebuilt. | Reviewer access must be permissioned and logged. |
| Security Events | Authentication, authorization, RLS denial, privilege escalation, suspicious access, secret rotation, support impersonation, and break-glass events. | Security Platform. | Minimum 7 years for privileged/security events; hot access period at least 13 months. | Supports incident investigation and access control assurance. |
| Compliance Events | Events documenting policy decisions, retention enforcement, export requests, privacy actions, and review outcomes. | Governance/Security. | Minimum 7 years unless legal requirement differs. | Establishes compliance evidence and policy adherence. |
| Retention Policies | Versioned policies defining data class, retention duration, archive rules, purge rules, and legal hold behavior. | Governance with Data Platform. | Retention policy records are retained permanently or until superseded plus 7 years. | Policy changes affect audit, analytics, provider payload, and PII lifecycle. |
| Access Reviews | Periodic review records for staff/admin/support access and privileged roles. | Identity/Access with Audit/Compliance. | Minimum 7 years. | Required to prove least-privilege governance. |
| Permission Changes | Role assignment, revocation, permission bundle edit, support access grant, and break-glass authorization records. | Identity/Access and Security. | Minimum 7 years. | High-risk category; must include actor, approver, reason, scope, before/after. |
| Refund Reviews | Approval workflow and evidence for refund decisions. | Payments and Support with Audit/Compliance. | Minimum 7 years due to financial relevance. | Supports dispute handling, fraud review, and financial reconciliation. |
| Payment Reviews | Manual payment reconciliation, provider anomaly investigation, webhook replay, and settlement review records. | Payments with Finance/Data Platform. | Minimum 7 years. | Financial audit evidence; must preserve provider references safely. |
| Operational Overrides | Manual branch, order, kitchen, delivery, capacity, or availability override records. | Operations with Audit/Compliance. | Minimum 3 years; 7 years if tied to financial/customer dispute. | Demonstrates why staff changed operational state outside normal automation. |
| Promotion Changes | Campaign creation, approval, eligibility change, budget/limit change, pause/resume, and retirement events. | Promotions/Loyalty with Commerce review. | Minimum 5 years; 7 years when financial liability is material. | Prevents untraceable discount liability and supports campaign audits. |
| Menu Changes | Price, availability, modifier, combo, allergen/label, and media changes. | Catalog/Menu with Branch/Admin review. | Minimum 3 years; price changes retained at least 7 years when tied to orders. | Supports customer dispute resolution and price history. |
| Branch Configuration Changes | Hours, fulfillment modes, delivery zone, capacity, address, tax/fee settings, and branch status configuration changes. | Tenant/Branch and Operations. | Minimum 5 years; incident-related changes at least 7 years. | Critical for explaining availability, delivery eligibility, and operational incidents. |
| Incident Records | Operational, provider, security, data, or branch incidents with timeline, severity, affected scope, mitigation, and postmortem linkage. | SRE/Security/Operations depending on incident type. | Minimum 7 years for security/payment/data incidents; 3 years for low-severity operational incidents. | Evidence for incident management, customer impact, and corrective actions. |

#### 6.6.7 Audit Foundation Implementation Requirements

Before feature development begins:

- Define audit event metadata using shared-kernel `DomainEventMetadata` and `AuditMetadata`.
- Define required actor types: customer, staff, admin, support, system, provider, worker.
- Define entity reference format for all domain entities in `packages/domain-types`.
- Define risk categories: low, operational, financial, privacy, security, compliance, legal.
- Define immutable append-only write path.
- Define RLS and privileged reader policies.
- Define retention classes and legal hold behavior.
- Define audit event ingestion from command handlers and domain events.
- Define audit export approval and audit of audit access.

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



### 7.8 Foundational Database Impact Analysis

The introduction of `shared-kernel`, `domain-types`, and `audit-compliance` changes database design order. The database foundation must not start from feature tables. It must start from shared schemas, context columns, audit tables, event metadata, retention classes, and RLS helper functions.

#### 7.8.1 PostgreSQL Schema Impact

New or clarified schemas:

| Schema | Impact |
| --- | --- |
| `app_public` | Publicly accessible RLS-protected business tables must use shared tenant/branch/audit columns consistently. |
| `app_private` | Sensitive domain tables must include shared audit metadata and entity references. |
| `app_internal` | Outbox, idempotency, provider payloads, retention jobs, and audit ingestion state live here. |
| `audit` | New first-class schema for immutable audit events, audit read models, review cases, retention policies, legal holds, and audit access logs. |
| `analytics` | Analytics tables must reference canonical domain entity IDs and privacy classifications from domain-types. |

#### 7.8.2 Supabase Structure Impact

Required additions:

```text
supabase/
├── database/
│   ├── shared-kernel/
│   │   ├── tenant-context.sql
│   │   ├── branch-context.sql
│   │   ├── audit-metadata.sql
│   │   ├── money.sql
│   │   └── temporal.sql
│   ├── audit-compliance/
│   │   ├── audit-schema.sql
│   │   ├── audit-events.sql
│   │   ├── audit-logs.sql
│   │   ├── retention-policies.sql
│   │   ├── review-cases.sql
│   │   └── audit-access.sql
│   └── domain-types/
│       ├── entity-references.sql
│       └── lifecycle-enums.sql
├── policies/
│   ├── shared-kernel/
│   └── audit-compliance/
├── tests/
│   ├── audit-compliance/
│   └── shared-kernel/
└── generated/
```

#### 7.8.3 RLS Policy Impact

RLS must be designed around shared context first:

- Tenant scope must use a consistent tenant membership function.
- Branch scope must use a consistent branch membership function.
- Audit tables require deny-by-default policies.
- Audit write policies must allow only trusted server/worker paths.
- Audit read policies require privileged roles and must create audit-access records.
- Support access and break-glass access must be time-bound and audited.
- RLS tests must prove cross-tenant and cross-branch denial for every foundational table.

#### 7.8.4 Event Table Impact

Event/outbox tables must include shared-kernel metadata:

- `event_id`
- `event_name`
- `event_version`
- `correlation_id`
- `causation_id`
- `tenant_id`
- `branch_id`
- `actor_type`
- `actor_id`
- `aggregate_type`
- `aggregate_id`
- `occurred_at`
- `published_at`
- `classification`
- `payload`
- `schema_hash`
- `retention_class`

#### 7.8.5 Audit Tables Required

Minimum audit foundation tables:

| Table | Purpose | Partitioning | Retention |
| --- | --- | --- | --- |
| `audit.audit_events` | Immutable normalized audit facts. | Monthly by `occurred_at`; optionally tenant hash subpartition at scale. | By retention class; financial/security usually 7 years. |
| `audit.audit_event_entities` | Links audit events to affected domain entities. | Co-partition with audit events or indexed by entity reference. | Same as parent audit event. |
| `audit.audit_logs_read_model` | Reviewer-optimized audit view/projection. | Rebuildable; partition by month if stored. | Same as source or shorter hot retention if rebuildable. |
| `audit.security_events` | Security-sensitive events requiring dedicated review. | Monthly by `occurred_at`. | Minimum 7 years. |
| `audit.compliance_events` | Compliance policy and review facts. | Monthly by `occurred_at`. | Minimum 7 years. |
| `audit.retention_policies` | Versioned retention definitions. | No time partition required. | Permanent/superseded plus 7 years. |
| `audit.legal_holds` | Holds preventing purge for entities/time ranges. | No time partition required initially. | Until released plus audit retention. |
| `audit.review_cases` | Access, refund, payment, incident, or operational review cases. | Optional monthly by `created_at`. | Based on review type, usually 7 years. |
| `audit.review_case_events` | Timeline of review actions and decisions. | Same as review cases. | Same as review case. |
| `audit.audit_access_logs` | Records who viewed/exported audit data. | Monthly by `accessed_at`. | Minimum 7 years. |
| `audit.operational_overrides` | Structured records of manual operational overrides. | Monthly by `occurred_at`. | 3 to 7 years by risk. |
| `audit.permission_change_records` | Before/after permission and role changes. | Monthly by `occurred_at`. | Minimum 7 years. |
| `audit.refund_review_records` | Refund review evidence and approval state. | Monthly by `created_at`. | Minimum 7 years. |
| `audit.payment_review_records` | Payment reconciliation and anomaly review evidence. | Monthly by `created_at`. | Minimum 7 years. |
| `audit.incident_records` | Incident timeline and postmortem-linked record. | Monthly by `detected_at`. | 3 to 7 years by severity/category. |

#### 7.8.6 Indexes Required

Minimum indexes:

- `(tenant_id, occurred_at desc)` on audit and event tables.
- `(tenant_id, branch_id, occurred_at desc)` for branch-operational audits.
- `(actor_type, actor_id, occurred_at desc)` for privileged actor investigations.
- `(entity_type, entity_id, occurred_at desc)` through `audit_event_entities`.
- `(correlation_id)` on audit, event, logs, and outbox tables.
- `(event_name, occurred_at desc)` on event/outbox tables.
- `(risk_category, occurred_at desc)` on audit events.
- `(review_type, status, created_at desc)` on review cases.
- `(retention_class, occurred_at)` for retention enforcement.
- Unique provider webhook dedupe indexes in payment internal tables.

#### 7.8.7 Analytics Table Impact

Analytics tables must use canonical domain type references and privacy classifications:

- Analytics event definitions must map entity IDs to `domain-types` catalog names.
- PII-bearing properties must be classified before ingestion.
- Audit/compliance events are not product analytics by default; only approved derived metrics may flow into analytics.
- Warehouse contracts must preserve tenant/branch context while applying privacy rules.

#### 7.8.8 Partitioning and Retention Requirements

- High-volume event, audit, notification, and analytics event tables should be time-partitioned from the first production migration.
- Payment webhook payloads require short hot retention and longer redacted audit references.
- Audit events must support legal hold exceptions.
- Analytics raw events must have privacy-based retention independent from immutable audit records.
- Operational low-risk audit records may have shorter retention only if not linked to financial, security, privacy, or legal categories.

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



### 8.6 Foundational Event Governance Update

#### 8.6.1 Shared Kernel Participation in Events

Shared kernel provides the universal metadata and value-object semantics used by event schemas. Every domain event must use shared-kernel concepts for:

- `DomainEventMetadata`.
- `TenantContext`.
- `BranchContext` when branch-scoped.
- `AuditMetadata` when the event reflects a persisted mutable entity.
- `Money` and `Currency` for monetary payload fields.
- `DateRange`, `TimeRange`, and `BusinessHours` for temporal payload fields.
- `DomainError` for failure events that are safe to publish.

Shared kernel does not publish business events. It defines the common language used by events.

#### 8.6.2 Audit/Compliance as Event Consumer

Audit/compliance is a mandatory consumer for security-sensitive, financial, permission, configuration, and operational override events. It consumes events to produce immutable audit records and review cases.

Audit/compliance must consume:

- Permission and role changes.
- Login/security anomalies and break-glass events.
- Order cancellation and manual status changes.
- Payment approval/rejection/reconciliation anomalies.
- Refund requests, approvals, rejections, and completions.
- Menu price and availability changes.
- Promotion/coupon/reward changes.
- Branch hours, delivery zone, capacity, and status changes.
- Operational overrides for kitchen, delivery, branch, and order state.
- Provider webhook replay or manual reconciliation.
- Audit data export/access events.

#### 8.6.3 Domain Types Interaction with Event Contracts

- Event payloads may use `packages/domain-types` for stable entity references, lifecycle names, and boundary snapshots.
- Event schemas must not import mutable domain implementation models.
- Event payloads must snapshot business facts at occurrence time; later changes to `domain-types` do not rewrite historical event meaning.
- Domain type deprecations require event compatibility review.
- Event entity names must match the Domain Types Catalog.

#### 8.6.4 Audit Event Generation Rules

An audit event must be generated when:

- A privileged actor changes business or security state.
- A customer-visible financial, fulfillment, or account state changes.
- A role, permission, membership, support access, or break-glass state changes.
- A payment/refund decision is created, changed, reconciled, or manually reviewed.
- Branch operations are manually overridden.
- Menu prices, item availability, promotions, coupons, or loyalty balances change.
- Provider webhooks are replayed, ignored, deduplicated, or manually reconciled.
- Audit data is viewed, exported, retained, purged, or placed on legal hold.

Audit events must include actor, reason when human-triggered, before/after summary where safe, affected entity references, risk category, correlation ID, tenant/branch context, source command/event, and retention class.

#### 8.6.5 Mandatory Audit Events

Mandatory audit event categories:

| Category | Mandatory Events |
| --- | --- |
| Identity and Access | User invited, role assigned, role revoked, permission bundle changed, staff suspended, support access granted, support access revoked, break-glass started, break-glass ended. |
| Orders | Order created, order cancelled, manual status override, order issue marked, order refund linked, order completion corrected. |
| Payments | Payment preference created, webhook received, webhook deduplicated, payment approved, payment rejected, payment manually reconciled, provider payload quarantined. |
| Refunds | Refund requested, refund review opened, refund approved, refund rejected, refund submitted, refund completed, refund failed. |
| Kitchen | Ticket claimed, ticket blocked, ticket manually reassigned, ticket cancelled, prep state manually overridden. |
| Delivery | Assignment created, assignment changed, delivery failed, delivery manually completed, courier reassigned, delivery incident created. |
| Menu | Item created, price changed, availability changed, modifier changed, combo changed, media changed, category visibility changed. |
| Promotions/Loyalty | Promotion created, promotion approved, promotion paused, coupon limit changed, coupon redeemed, loyalty points adjusted, reward redeemed. |
| Branch | Hours changed, branch paused, branch reopened, delivery zone changed, capacity changed, fulfillment mode changed. |
| Notifications | Template approved, template changed, notification suppressed by compliance rule, provider delivery failure spike reviewed. |
| Audit/Compliance | Audit record accessed, audit export requested, audit export approved, retention policy changed, legal hold created, legal hold released. |

#### 8.6.6 Security-Sensitive Event Categories

Security-sensitive events require restricted payloads, longer retention, and privileged review:

- Authentication anomalies.
- Authorization denials for privileged resources.
- RLS policy denial anomalies.
- Permission and role changes.
- Support impersonation or customer account access.
- Break-glass access.
- Service-role usage.
- Secret rotation and secret access failures.
- Audit data access/export.
- Payment provider credential or webhook verification failures.
- Repeated checkout/payment abuse signals.

Security-sensitive events must never expose raw secrets, full provider payloads, full payment details, or unnecessary PII.

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



### 18.5 Foundational Cross-Domain Governance

#### 18.5.1 Allowed Dependency Rules

- All domains may depend on `shared-kernel` concepts.
- All domains may emit events that audit/compliance consumes.
- Business domains must depend on `domain-types` only through contracts/events or explicit boundary types.
- Audit/compliance may consume events from all domains but must not call domain repositories to infer missing audit facts.
- Analytics may consume approved events and read models but must not become a source of operational truth.
- Admin may depend on contracts for managed domains, not on private domain implementation.
- Support may depend on orders, payments, delivery, notifications, and audit read models through approved query contracts only.

#### 18.5.2 Forbidden Dependency Rules

- No domain may modify `shared-kernel` without governance approval.
- No domain may write directly to audit tables except through approved audit ingestion/write paths.
- Orders must not depend on kitchen or delivery implementation details.
- Payments must not depend on promotions, kitchen, or delivery.
- Kitchen must not depend on payments provider details.
- Delivery must not depend on kitchen internals; it consumes order/readiness signals.
- Notifications must not own business state transitions.
- Analytics must not mutate operational domains.
- Admin must not bypass domain commands for configuration changes.

#### 18.5.3 Dependency Matrix

Legend:

- `A` = may depend on public contracts/events/read models of target.
- `K` = may consume shared-kernel concepts.
- `E` = emits events consumed by target.
- `R` = read-only approved query dependency.
- `N` = not allowed.
- `Self` = internal dependency only.

| Source \ Target | shared-kernel | audit-compliance | orders | payments | delivery | kitchen | promotions | notifications | analytics | support | admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| shared-kernel | Self | N | N | N | N | N | N | N | N | N | N |
| audit-compliance | K | Self | R/E | R/E | R/E | R/E | R/E | R/E | R/E | R/E | R/E |
| orders | K | E | Self | A | A | A | A | A | E | A | A |
| payments | K | E | A | Self | N | N | N | A | E | A | A |
| delivery | K | E | A | N | Self | A | N | A | E | A | A |
| kitchen | K | E | A | N | A | Self | N | A | E | A | A |
| promotions | K | E | A | N | N | N | Self | A | E | A | A |
| notifications | K | E | R | R | R | R | R | Self | E | A | A |
| analytics | K | R | R | R | R | R | R | R | Self | R | R |
| support | K | E | R/A | R/A | R/A | R/A | R/A | A | E | Self | A |
| admin | K | E | A | A | A | A | A | A | E | A | Self |

#### 18.5.4 Matrix Interpretation

- `orders → payments` means orders may call payment contracts to initiate or query payment state; it must not import payment repositories.
- `payments → orders` means payments may use order references/contracts for reconciliation; it must not mutate order state except through approved order commands/events.
- `audit-compliance → all domains` is read/consume only; audit/compliance does not own business workflows.
- `notifications → domains` is read-only for rendering message context; notifications must not decide order, payment, kitchen, or delivery transitions.
- `analytics → domains` is read-only and event/read-model based; analytics never blocks operational transactions.
- `admin → domains` is through approved command/query contracts; admin cannot directly mutate database tables.

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

### 20.1 Updated Roadmap Principles

The three foundational layers change implementation order. No database schema, backend implementation, frontend implementation, or feature development may begin until shared language, domain types, and audit/compliance foundations are defined and validated.

Implementation now proceeds in this order:

1. Shared Kernel.
2. Domain Types.
3. Audit Foundation.
4. Database Foundation.
5. Event Catalog.
6. Auth.
7. Commerce.
8. Operations.

This sequence minimizes future refactors by establishing universal value semantics, canonical business vocabulary, auditability, and security context before feature teams create tables, contracts, events, or UI flows.

### 20.2 Phase 0 — Repository Governance Preparation

Build first:

- Architecture blueprint update.
- CODEOWNERS entries for `packages/domain-types`, `domains/shared-kernel`, and `domains/audit-compliance`.
- ADR template for shared-kernel changes.
- RFC template for domain type additions.
- Audit/compliance review checklist.
- Dependency boundary policy for foundational domains.

Validate first:

- Architecture Council approval.
- Security and Data Platform approval.
- No application or database implementation has started ahead of foundations.

Dependencies:

- Existing platform architecture documents.

Risk reduction:

- Prevents teams from implementing inconsistent business concepts before foundations are approved.

### 20.3 Phase 1 — Shared Kernel Foundation

Build first:

- `domains/shared-kernel` structure.
- Shared kernel ownership and change policy.
- Concept documentation for Money, Currency, Address, Email, Phone, Coordinates, GeoArea, DateRange, TimeRange, BusinessHours, ImageAsset, AuditMetadata, TenantContext, BranchContext, Pagination, DomainError, and DomainEventMetadata.
- Compatibility rules for value semantics.
- Shared-kernel anti-patterns document.

Validate first:

- Every concept has purpose, usage rules, owner, and dependency constraints.
- Money and Currency semantics are approved by Payments/Finance.
- TenantContext and BranchContext semantics are approved by Security/Operations.
- DomainEventMetadata is approved by Event Platform and Audit/Compliance.
- No concept contains workflow logic belonging to a bounded context.

Dependencies:

- Architecture Council and Domain Modeling Council decisions.

Risk reduction:

- Prevents inconsistent money, address, tenant, branch, audit, pagination, and event metadata definitions across the platform.

### 20.4 Phase 2 — Domain Types Foundation

Build first:

- `packages/domain-types` structure.
- Domain Types Catalog.
- Entity reference model.
- Lifecycle state vocabulary.
- Relationship documentation.
- Type promotion and deprecation policy.
- Fixture alignment rules.

Validate first:

- Each canonical type has responsibility, owner, lifecycle, and relationships.
- Domain type names match event, API, analytics, and documentation naming.
- `domain-types` has no dependency on contracts, events, apps, database, or provider adapters.
- Domain types are boundary vocabulary only and contain no domain behavior.

Dependencies:

- Shared Kernel foundation approved.

Risk reduction:

- Prevents duplicated business entity definitions across customer, admin, operations, contracts, events, analytics, and database planning.

### 20.5 Phase 3 — Audit and Compliance Foundation

Build first:

- `domains/audit-compliance` structure.
- Audit event model.
- Security event model.
- Compliance event model.
- Retention policy model.
- Review case model for access, permission, refund, payment, operational override, menu, promotion, branch configuration, and incident records.
- Audit access policy.
- Audit event mandatory category catalog.

Validate first:

- Audit events include shared-kernel DomainEventMetadata and AuditMetadata.
- Audit entity references align with `packages/domain-types`.
- Retention classes are approved by Security, Governance, and Data Platform.
- Audit write path is append-only by design.
- Audit read access is privileged and self-auditing.
- Required audit events are mapped to future commands and domain events.

Dependencies:

- Shared Kernel foundation.
- Domain Types foundation.

Risk reduction:

- Ensures auditability is not retrofitted after payments, refunds, permissions, menu changes, or operational overrides already exist.

### 20.6 Phase 4 — Database Foundation

Build first:

- Supabase schema layout.
- Shared context database conventions.
- Tenant and branch context helper functions.
- Audit schema and foundational audit tables.
- Event/outbox table metadata structure.
- Retention class tables.
- Legal hold tables.
- RLS policy framework.
- Migration naming and partitioning strategy.

Validate first:

- Cross-tenant RLS denial tests.
- Cross-branch RLS denial tests.
- Audit table deny-by-default read policy.
- Trusted audit ingestion/write path.
- Partitioning strategy for audit, event, analytics, and notification logs.
- Index strategy for tenant, branch, actor, entity, correlation, retention, and review workflows.

Dependencies:

- Shared Kernel concept approval.
- Domain Types catalog approval.
- Audit Foundation approval.

Risk reduction:

- Prevents schema refactors caused by missing tenant/branch/audit/event metadata and avoids unpartitioned high-volume audit/event tables.

### 20.7 Phase 5 — Event Catalog Foundation

Build first:

- `packages/events` catalog.
- Event metadata standard based on shared-kernel DomainEventMetadata.
- Event schema versioning policy.
- Audit event generation rules.
- Security-sensitive event category policy.
- Mandatory audit event mappings.
- Event compatibility tests.

Validate first:

- Every event includes tenant context and branch context where applicable.
- Every event payload uses domain-types entity names and lifecycle states.
- Every security/financial/configuration/override event maps to audit-compliance.
- Event schemas preserve historical meaning.
- Consumers and producers are documented.

Dependencies:

- Shared Kernel.
- Domain Types.
- Audit Foundation.
- Database event/outbox structure.

Risk reduction:

- Prevents ungoverned event drift and ensures audit/compliance can consume required domain events from day one.

### 20.8 Phase 6 — Auth and Access Foundation

Build first:

- `packages/auth` permission model.
- Identity/access domain membership model.
- Tenant and branch membership rules.
- RBAC permissions aligned with domain-types and audit-compliance.
- Support access and break-glass model.
- Access review workflow contracts.
- Permission change audit events.

Validate first:

- Role and permission changes produce mandatory audit events.
- Tenant and branch scope are consistently represented through shared-kernel context.
- RLS policies use approved context functions.
- Support access is time-bound, scoped, and audited.
- Break-glass access requires reason, expiry, and audit event generation.

Dependencies:

- Database Foundation.
- Audit Foundation.
- Shared Kernel TenantContext and BranchContext.

Risk reduction:

- Ensures every later commerce and operations workflow has correct authorization and audit primitives.

### 20.9 Phase 7 — Commerce Foundation

Build first:

- Catalog/menu tables and contracts.
- Cart and checkout contracts.
- Orders lifecycle.
- Payments and Mercado Pago integration contracts.
- Refund review workflow.
- Promotions and loyalty foundation.
- Customer-facing commerce UI skeletons.
- Admin commerce management skeletons.

Validate first:

- Menu changes produce audit events.
- Promotion changes produce audit events.
- Checkout uses Money/Currency semantics.
- Orders use canonical domain-types lifecycle states.
- Payment and refund workflows are idempotent and audited.
- Payment webhooks produce event, audit, and reconciliation records.
- Commerce analytics use domain-types entity references and privacy classifications.

Dependencies:

- Shared Kernel.
- Domain Types.
- Audit Foundation.
- Database Foundation.
- Event Catalog.
- Auth Foundation.

Risk reduction:

- Builds revenue path only after money, identity, audit, event, and database foundations are stable.

### 20.10 Phase 8 — Operations Foundation

Build first:

- Kitchen queue projection and ticket lifecycle.
- Branch-scoped realtime channel contracts.
- Delivery assignment and tracking foundation.
- Operational override model.
- Branch availability and capacity controls.
- Notification dispatch foundation.
- Operations app dashboard skeletons.
- Incident record workflow.

Validate first:

- Kitchen and delivery actions are branch-scoped.
- Operational overrides produce audit events with reason and actor.
- Branch configuration changes produce audit events.
- Realtime channels use tenant/branch context.
- Notifications do not mutate business state.
- Incident records are linked to audit/compliance and observability.

Dependencies:

- Commerce order lifecycle.
- Auth Foundation.
- Event Catalog.
- Audit Foundation.
- Database Foundation.

Risk reduction:

- Adds realtime operational execution after commerce state transitions, audit, and branch isolation are reliable.

### 20.11 Phase 9 — Reliability, Performance, and Launch Hardening

Build:

- E2E critical journey tests.
- RLS regression suite.
- Audit immutability and audit-access tests.
- Contract and event compatibility checks.
- Load tests for checkout, audit ingestion, event outbox, kitchen projections, and realtime channels.
- Observability dashboards and alerts.
- Runbooks for checkout, payments, webhooks, audit access, realtime degradation, branch outages, and database rollback.
- Release and rollback playbooks.
- Staging production-like validation.

Validate:

- Audit and event tables sustain expected write volume.
- Retention and partitioning jobs are safe.
- Critical alerts include tenant/branch/correlation context.
- Production release has rollback and repair plans.

Dependencies:

- All foundational and core commerce/operations phases.

Risk reduction:

- Converts feature-complete implementation into an operable production platform.

### 20.12 Post-Launch Iteration

Build:

- Advanced analytics dashboards.
- Multi-brand theme activation.
- Mobile app discovery and contract compatibility checks.
- AI assistance RFCs if justified.
- Advanced delivery optimization.
- Audit review workbench improvements.
- Cost optimization and retention tuning.
- Performance tuning based on production telemetry.

Dependencies:

- Production telemetry.
- Governance review.
- Security and Data Platform approval for new sensitive capabilities.

Risk reduction:

- Evolves platform capability without weakening foundational language, audit, or domain boundaries.

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
