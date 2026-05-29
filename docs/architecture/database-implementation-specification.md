# J Burguer — PostgreSQL and Supabase Database Implementation Specification

## 0. Specification Scope

This document is the canonical database implementation specification for J Burguer. It must be used before writing the first SQL migration. It translates the approved platform, security, tenant isolation, event-driven, commerce, operations, delivery, data, governance, shared-kernel, domain-types, and audit-compliance foundations into an implementation-ready PostgreSQL and Supabase database plan.

This document does not contain SQL migrations. It defines the database architecture, schemas, tables, relationships, RLS model, indexing, partitioning, realtime, storage, event, audit, analytics, governance, backup, recovery, and implementation order required to create safe migrations later.

The database architecture prioritizes:

1. Tenant isolation.
2. Auditability.
3. Financial integrity.
4. Event consistency.
5. Realtime safety.
6. Operational scalability.
7. Replayability.
8. Schema governance.
9. Data quality.
10. Long-term maintainability.

---

## 1. Schema Strategy

### 1.1 Schema Overview

The platform uses multiple PostgreSQL schemas to separate exposure level, security posture, operational concerns, analytics, and audit/compliance obligations.

| Schema | Purpose | Primary Owner | Client Exposure |
| --- | --- | --- | --- |
| `app_public` | RLS-protected business tables and read models safe for direct Supabase client access where appropriate. | Domain owners with Security review. | Authenticated/anonymous clients only through RLS-approved tables/views. |
| `app_private` | Sensitive business tables not intended for direct client access, including financial details, internal support data, and private operational state. | Backend Platform and owning domains. | Server-only through Edge Functions, route handlers, RPC, or service workers. |
| `app_internal` | Platform internals: outbox, idempotency, provider payloads, worker leases, replay state, integration locks, and maintenance state. | Platform/SRE/Event Platform. | Never direct client access. |
| `analytics` | Raw analytics events, metric snapshots, operational aggregates, and warehouse handoff contracts. | Data Platform. | Restricted internal readers; product dashboards use approved read models. |
| `audit` | Immutable audit facts, security events, compliance events, review records, retention policies, legal holds, and audit access logs. | Audit/Compliance and Security. | Privileged server-only; audit reads are audited. |
| `storage_meta` | Optional database-side metadata for Supabase Storage objects requiring domain links, retention, and audit. | Platform and owning domains. | RLS-protected metadata only; object access is via storage policies. |

Supabase-managed schemas such as `auth`, `storage`, `realtime`, `extensions`, and `vault` must be treated as platform schemas. Application migrations may reference them through stable supported interfaces only.

### 1.2 Schema Purposes, Access Rules, RLS, and Migration Ownership

#### `app_public`

Purpose:

- Tenant and branch-scoped business data that can be safely accessed by clients under strict RLS.
- Customer-readable menu/catalog projections.
- Customer-owned carts and orders where data minimization allows direct access.
- Branch-scoped operations projections for kitchen and delivery dashboards.
- Public or authenticated read models, not raw sensitive internals.

Access rules:

- Anonymous access is allowed only for explicitly public views such as active menu browsing where no tenant-private data leaks.
- Authenticated access is governed by RLS and helper functions.
- Mutations from clients are limited to low-risk customer-owned records where contracts permit; privileged mutations must go through server-side commands.

RLS expectations:

- RLS enabled on every table and exposed view dependency.
- Policies must include tenant and branch predicates where relevant.
- Customer policies must use `auth.uid()` mapped to platform user/profile records.
- Staff policies must validate active organization/branch membership and permission.

Migration ownership:

- Owning domain authors migration.
- Security reviews every RLS-bearing migration.
- Database Architecture reviews every new public table/view.

#### `app_private`

Purpose:

- Sensitive domain state and operational records not safe for direct browser access.
- Payment summaries, support notes, private customer profile extensions, fraud signals, operational control tables, provider-normalized state.

Access rules:

- No direct Supabase client access.
- Access through Edge Functions, Next.js server route handlers, audited RPC functions, workers, or admin/support APIs.
- Service-role access must be wrapped by narrow, reviewed operations.

RLS expectations:

- RLS enabled by default for defense in depth.
- Most policies deny direct authenticated access.
- Server-side operations must enforce authorization before using privileged database roles.

Migration ownership:

- Owning domain plus Backend Platform.
- Security review required for PII, payments, support, fraud, or operational overrides.

#### `app_internal`

Purpose:

- Event outbox.
- Idempotency keys.
- Worker leases and job state.
- Provider webhook raw payload quarantine.
- Replay operations.
- Reconciliation cursors.
- Integration dedupe records.

Access rules:

- Never exposed to anon/authenticated clients.
- Worker and server-only access.
- Service role access must be narrow and observable.

RLS expectations:

- RLS enabled where practical; otherwise explicit grants must restrict access to internal roles only.
- No public grants.
- All write paths include correlation ID and actor/system context.

Migration ownership:

- Platform/Event/SRE owner with domain review when table is domain-specific.

#### `analytics`

Purpose:

- Raw analytics event ingestion.
- Operational metric snapshots.
- Business metric snapshots.
- Warehouse export contracts.
- Privacy-classified facts derived from trusted events/read models.

Access rules:

- Writes from server or controlled analytics ingestion only.
- Product/admin dashboards read approved aggregate views, not raw PII-bearing events.
- Raw event access restricted to Data Platform and approved analysts.

RLS expectations:

- RLS enabled for tenant-scoped analytics access.
- Cross-tenant analytics requires explicit super-admin/data-platform permission.
- PII-bearing fields must not be available through tenant dashboard roles unless approved.

Migration ownership:

- Data Platform owns schema.
- Domain owners approve domain event-to-metric mappings.

#### `audit`

Purpose:

- Immutable audit trail.
- Security event history.
- Compliance evidence.
- Review workflow records.
- Retention policy and legal hold state.
- Audit access logs.

Access rules:

- Append-only write path for audit facts.
- No direct client writes.
- Privileged reads only through audited server-side endpoints.
- Reading or exporting audit data writes an audit access record.

RLS expectations:

- Deny by default.
- Security/audit roles can read only scoped audit records.
- Support roles can read minimal audit summaries through approved views only.
- Audit tables must not be updated except retention lifecycle fields controlled by audit workers.

Migration ownership:

- Audit/Compliance and Security own migrations.
- Database Architecture reviews partitioning and immutability constraints.

### 1.3 Schema Boundaries

- `app_public` may reference `app_private` only through stable IDs when no sensitive data leaks.
- `app_private` may reference `app_public` tenant, branch, catalog, order, and customer IDs.
- `app_internal` may reference business entities for operational processing but must not become the source of truth for business state.
- `audit` may reference any entity through generic entity reference fields and optional foreign keys where safe; audit integrity must not be broken by business record deletion.
- `analytics` references canonical domain entity IDs but should not enforce hard foreign keys to hot OLTP tables when it harms ingestion or retention independence.

### 1.4 Dependency Rules

Allowed:

- Domain tables reference tenant and branch tables for isolation.
- Operational tables reference orders and branches.
- Payment tables reference orders and customers through stable IDs.
- Audit tables reference domain entities through immutable entity references.
- Event outbox rows reference aggregate type and aggregate ID.

Forbidden:

- Browser-facing tables exposing service-role-only data.
- Cross-schema joins in RLS policies that become unbounded or slow.
- Analytics tables controlling operational state.
- Audit tables depending on mutable business records for meaning.
- Direct client access to `app_internal`.
- Direct updates/deletes to financial ledgers, loyalty ledgers, outbox history, or audit facts.

---

## 2. Tenant Model

### 2.1 Tenant Hierarchy

The tenant hierarchy is:

```text
Organization
├── Brand(s)
├── Branch(es)
│   ├── Branch settings
│   ├── Branch hours
│   ├── Branch delivery zones
│   ├── Kitchen stations
│   └── Staff branch memberships
├── Organization roles and permissions
├── Users/memberships
├── Catalog/menu configuration
├── Promotions and loyalty programs
└── Audit, analytics, feature flags, and operational configuration
```

### 2.2 Core Tenant Concepts

| Concept | Database Representation | Rules |
| --- | --- | --- |
| Organization | `app_public.organizations` | Top-level tenant boundary. Every tenant-scoped table must include `organization_id` or derive it through a mandatory parent. |
| Brand | `app_public.brands` | Brand/theme/commercial identity under organization. Future multi-brand support must not require table rewrites. |
| Branch | `app_public.branches` | Physical/operational restaurant unit. Branch-scoped tables include `branch_id`. |
| User | Supabase `auth.users` plus application profile. | Auth identity must be mapped to app profile and memberships. |
| Role | `app_private.roles` or RLS-safe role projection. | Roles are scoped to platform, organization, branch, or support context. |
| Permission | `app_private.permissions` | Permissions are granular action strings. |
| Membership | `app_private.user_memberships` / `user_roles` | Active user relationship to organization/branch. |

### 2.3 Relationships

- One organization has many brands.
- One organization has many branches.
- One branch belongs to one organization and optionally one primary brand.
- One user may belong to many organizations.
- One user may have different roles in different organizations and branches.
- One role has many permissions.
- One permission may appear in many roles.
- Branch-scoped roles must include organization and branch scope.
- Support access is separate from tenant membership and is time-bound, reason-bound, and audited.

### 2.4 Tenant Ownership Rules

- `organization_id` is mandatory on tenant-owned records unless the record is globally managed or purely platform-level.
- Tenant ownership cannot be inferred from client input alone; server-side functions must validate membership.
- Tenant-scoped foreign keys must preserve organization consistency.
- Moving records between organizations is forbidden except approved data migration with audit trail.
- Organization deletion is soft-delete/anonymization workflow, never a simple delete.

### 2.5 Branch Ownership Rules

- `branch_id` is mandatory on branch-operational records: orders, kitchen tickets, delivery assignments, branch availability, branch metrics, branch notifications where relevant.
- `branch_id` must belong to the same `organization_id` as the parent record.
- Staff branch access requires active membership or an organization-level permission that includes branch scope.
- Branch closure, pause, delivery zone changes, and capacity overrides are audited.

### 2.6 Cross-Tenant Restrictions

- No query may return records across organizations unless the actor has platform super-admin or approved analytics permission.
- Support access must be purpose-limited, time-limited, and audited.
- Foreign keys must not allow cross-tenant references.
- Realtime channels must include tenant and branch segmentation.
- Storage paths must include organization and branch/customer scope where applicable.

### 2.7 Future Franchise Support

The data model must support:

- Parent franchise organization or franchisor group.
- Franchisee organizations with scoped autonomy.
- Shared brand assets and menu templates with branch/local overrides.
- Franchise-level reporting using approved aggregate views.
- Franchise-wide campaigns with local eligibility overrides.

Implementation guidance:

- Add `organization_type` and optional `parent_organization_id` when franchise support is activated.
- Do not hard-code single-owner assumptions in branch, menu, promotion, or analytics schemas.
- Use hierarchy-aware permissions only through reviewed helper functions.

### 2.8 Future Multi-Brand Support

The data model must support:

- Multiple brands per organization.
- Brand-specific design tokens and assets.
- Brand-specific menu categories/items where required.
- Shared kitchen and branch operations across brands where applicable.
- Brand-level analytics and promotion segmentation.

Implementation guidance:

- Include `brand_id` on records that are brand-specific: menu, campaigns, assets, public settings.
- Keep branch operations primarily branch-scoped; brand is a classification, not always an operational boundary.

---

## 3. Shared Kernel Database Support

### 3.1 Shared Kernel Storage Principles

Shared-kernel concepts must be implemented consistently, but not every value object requires a global table. The strategy is:

- Store simple value objects inline using standardized column groups.
- Normalize reusable entities when they have lifecycle, ownership, validation state, or many references.
- Use JSON only for provider payloads, flexible metadata, or append-only snapshots where schema agility is required and queried fields are indexed separately.
- Do not create a generic shared table that hides domain ownership.

### 3.2 Money

Storage strategy:

- Store monetary amount as integer minor units: `amount_minor`.
- Store currency as uppercase ISO code: `currency_code`.
- Store derived display values only outside canonical financial tables.
- Store all order/payment/refund/discount/tax/fee snapshots as immutable money fields.

Normalization strategy:

- No global `money` table.
- Optional `app_public.supported_currencies` table for allowed currencies and precision.

Reuse strategy:

- Column naming convention: `<meaning>_amount_minor`, `<meaning>_currency_code`.
- Examples: `subtotal_amount_minor`, `delivery_fee_amount_minor`, `refund_amount_minor`.

### 3.3 Address

Storage strategy:

- Customer saved addresses: normalized table.
- Branch addresses: columns on branch or branch address table when lifecycle is needed.
- Order/delivery addresses: immutable snapshot fields captured at checkout.

Recommended table:

- `app_public.customer_addresses` for reusable customer addresses.
- Branch address fields on `branches` unless multiple historical addresses are required.

Reuse strategy:

- Standard address column group: line1, line2, district/neighborhood, city, region/state, postal_code, country_code, complement, reference_notes, latitude, longitude, validation_status.
- Delivery/order snapshots must not depend on mutable customer address rows.

### 3.4 BusinessHours

Storage strategy:

- Branch hours normalized in `branch_hours`.
- Exceptions and holidays stored in `branch_hour_exceptions`.
- Promotion/campaign time windows use date/time range columns in promotion rules.

Reuse strategy:

- Standard day-of-week, opens_at, closes_at, timezone, effective date range.
- Avoid JSON-only hours because operations and availability queries require indexes.

### 3.5 GeoArea

Storage strategy:

- Delivery zones and service areas stored as rows with geometry-compatible representation.
- If PostGIS is available and approved, use geometry/geography. If not, store radius or polygon JSON plus indexed bounding coordinates.

Reuse strategy:

- Branch delivery zones use `branch_delivery_zones`.
- Delivery assignment stores selected zone snapshot for auditability.

### 3.6 TenantContext and BranchContext

Storage strategy:

- `organization_id` on every tenant-scoped table.
- `branch_id` on every branch-scoped table.
- Composite indexes begin with `organization_id` and often `branch_id` for high-volume branch tables.

Reuse strategy:

- RLS helper functions must read active context from JWT claims and membership tables.
- Event, audit, analytics, and logs include tenant/branch context columns.

---

## 4. Identity and Access Domain Tables

### 4.1 Identity Table Placement

Supabase owns authentication identities in `auth.users`. Application identity state lives in application schemas. Sensitive role/membership tables live in `app_private`; safe profile projections may live in `app_public`.

### 4.2 Tables

#### `app_public.profiles`

Purpose: public-safe application profile mapped to Supabase auth user.

Columns:

- `id` UUID primary key, references `auth.users.id`.
- `display_name` text.
- `avatar_asset_id` UUID nullable.
- `default_organization_id` UUID nullable.
- `default_branch_id` UUID nullable.
- `locale` text.
- `timezone` text.
- `created_at`, `updated_at`.
- `deleted_at` nullable.

Primary key: `id`.

Foreign keys:

- `id` → `auth.users.id`.
- Optional default organization/branch references.

Indexes:

- PK on `id`.
- `(default_organization_id)`.
- `(deleted_at)` partial index for active profiles if needed.

Ownership: Identity/Access.

RLS implications:

- Users can read/update limited own profile fields.
- Staff/admin profile reads require shared organization/branch membership or explicit permission.

#### `app_private.user_private_profiles`

Purpose: private user attributes, risk flags, compliance metadata, support-sensitive notes.

Columns:

- `user_id` UUID primary key.
- `legal_name` text nullable.
- `phone` text nullable.
- `email_normalized` text nullable.
- `risk_status` text.
- `privacy_status` text.
- `marketing_consent_status` text.
- `metadata` jsonb.
- `created_at`, `updated_at`.

Indexes:

- PK on `user_id`.
- Unique nullable normalized email where appropriate.
- Normalized phone index where appropriate.

RLS implications:

- No direct customer access except through safe profile endpoints.
- Support/admin reads require permission and audit.

#### `app_private.roles`

Columns:

- `id` UUID PK.
- `organization_id` UUID nullable for tenant-scoped custom roles.
- `name` text.
- `code` text.
- `scope_type` text: platform, organization, branch, support.
- `description` text.
- `is_system_role` boolean.
- `status` text.
- `created_at`, `updated_at`, `deleted_at`.

Indexes:

- Unique `(organization_id, code)` where organization-scoped.
- Unique `(code)` for platform system roles.
- `(scope_type, status)`.

RLS:

- Role reads only for actors with permission in the relevant scope.
- Role mutations are privileged and audited.

#### `app_private.permissions`

Columns:

- `id` UUID PK.
- `code` text unique.
- `domain` text.
- `resource` text.
- `action` text.
- `scope_type` text.
- `description` text.
- `risk_level` text.
- `created_at`, `deprecated_at`.

Indexes:

- Unique `code`.
- `(domain, resource, action)`.
- `(risk_level)`.

RLS:

- Readable to admin/security roles through safe views.
- Mutations platform-only and audited.

#### `app_private.role_permissions`

Columns:

- `role_id` UUID.
- `permission_id` UUID.
- `created_at`.
- `created_by` UUID.

Primary key: `(role_id, permission_id)`.

Foreign keys:

- `role_id` → roles.
- `permission_id` → permissions.

Indexes:

- PK.
- `(permission_id, role_id)`.

RLS:

- Mutations privileged and audited as permission changes.

#### `app_private.user_roles`

Purpose: scoped role assignments.

Columns:

- `id` UUID PK.
- `user_id` UUID.
- `role_id` UUID.
- `organization_id` UUID nullable.
- `branch_id` UUID nullable.
- `scope_type` text.
- `status` text.
- `starts_at`, `expires_at` nullable.
- `assigned_by` UUID.
- `assignment_reason` text nullable.
- `created_at`, `revoked_at`, `revoked_by`.

Indexes:

- `(user_id, organization_id, branch_id, status)`.
- `(organization_id, branch_id, role_id, status)`.
- `(expires_at)` for expiry jobs.
- Partial unique active assignment where appropriate.

RLS:

- User may read limited own assignments.
- Admins read assignments in scope.
- Changes require permission, reason for sensitive roles, and audit event.

#### `app_private.sessions`

Purpose: application session metadata complementing Supabase Auth when needed.

Columns:

- `id` UUID PK.
- `user_id` UUID.
- `auth_session_id` text nullable.
- `active_organization_id` UUID nullable.
- `active_branch_id` UUID nullable.
- `actor_type` text.
- `ip_hash` text nullable.
- `user_agent_hash` text nullable.
- `created_at`, `last_seen_at`, `expires_at`, `revoked_at`.

Indexes:

- `(user_id, last_seen_at desc)`.
- `(expires_at)`.
- `(active_organization_id, active_branch_id)`.

RLS:

- Own session read only.
- Security/admin read through audited endpoint.

#### `audit.access_reviews`

Purpose: compliance review records for privileged access.

Columns:

- `id` UUID PK.
- `organization_id` UUID nullable.
- `branch_id` UUID nullable.
- `review_type` text.
- `subject_user_id` UUID.
- `reviewer_user_id` UUID nullable.
- `status` text.
- `scope_summary` jsonb.
- `findings` jsonb.
- `opened_at`, `due_at`, `completed_at`.
- `created_by` UUID.

Indexes:

- `(organization_id, status, due_at)`.
- `(subject_user_id, opened_at desc)`.
- `(review_type, status)`.

RLS:

- Audit/security roles only.
- Reads are audited.

---

## 5. Tenant and Branch Domain Tables

### 5.1 `app_public.organizations`

Columns:

- `id` UUID PK.
- `name` text.
- `legal_name` text nullable.
- `slug` text unique.
- `organization_type` text.
- `parent_organization_id` UUID nullable.
- `status` text.
- `default_currency_code` text.
- `default_timezone` text.
- `created_at`, `updated_at`, `deleted_at`.

Relationships:

- Self-reference for franchise hierarchy.
- Has many branches, brands, roles, campaigns, orders.

Indexes:

- Unique `slug`.
- `(parent_organization_id)`.
- `(status)`.

Constraints:

- No active duplicate slug.
- Parent organization cannot create cycles.

RLS:

- Public reads only if explicitly exposed through public views.
- Members read organization in scope.
- Mutations admin-only and audited.

### 5.2 `app_public.brands`

Columns:

- `id` UUID PK.
- `organization_id` UUID.
- `name` text.
- `slug` text.
- `status` text.
- `theme_key` text.
- `asset_root_path` text nullable.
- `created_at`, `updated_at`, `deleted_at`.

Indexes:

- Unique `(organization_id, slug)`.
- `(organization_id, status)`.

RLS:

- Public active brand data exposed through safe views.
- Admin mutations audited.

### 5.3 `app_public.branches`

Columns:

- `id` UUID PK.
- `organization_id` UUID not null.
- `brand_id` UUID nullable.
- `name` text.
- `slug` text.
- `status` text.
- `operational_status` text.
- Address column group.
- `latitude`, `longitude` nullable.
- `timezone` text.
- `phone` text nullable.
- `created_at`, `updated_at`, `deleted_at`.

Indexes:

- Unique `(organization_id, slug)`.
- `(organization_id, status)`.
- `(organization_id, operational_status)`.
- Geo index if PostGIS/coordinates enabled.

Constraints:

- Branch organization matches brand organization when brand is set.

RLS:

- Public reads active branch summaries.
- Staff reads branches where member.
- Admin reads organization branches.
- Mutations privileged and audited.

### 5.4 `app_private.branch_settings`

Columns:

- `branch_id` UUID PK.
- `organization_id` UUID.
- `accepts_pickup` boolean.
- `accepts_delivery` boolean.
- `accepts_scheduled_orders` boolean.
- `minimum_order_amount_minor`, `currency_code`.
- `estimated_prep_minutes` integer.
- `settings` jsonb.
- `created_at`, `updated_at`.

Indexes:

- PK `branch_id`.
- `(organization_id)`.

RLS:

- Read through public/operations projections.
- Mutations admin/operations with audit.

### 5.5 `app_public.branch_hours`

Columns:

- `id` UUID PK.
- `organization_id`, `branch_id`.
- `day_of_week` smallint.
- `opens_at` time.
- `closes_at` time.
- `service_type` text: pickup, delivery, dine_in, operations.
- `effective_from`, `effective_to` nullable.
- `is_active` boolean.
- `created_at`, `updated_at`.

Indexes:

- `(branch_id, service_type, day_of_week, is_active)`.
- `(organization_id, branch_id)`.

RLS:

- Public active hours readable.
- Mutations audited.

### 5.6 `app_public.branch_hour_exceptions`

Columns:

- `id` UUID PK.
- `organization_id`, `branch_id`.
- `exception_date` date.
- `service_type` text.
- `is_closed` boolean.
- `opens_at`, `closes_at` nullable.
- `reason` text nullable.
- `created_at`, `updated_at`.

Indexes:

- Unique `(branch_id, service_type, exception_date)`.
- `(organization_id, exception_date)`.

RLS: same as branch hours.

### 5.7 `app_public.branch_delivery_zones`

Columns:

- `id` UUID PK.
- `organization_id`, `branch_id`.
- `name` text.
- `status` text.
- `geo_area_type` text.
- `geo_area` jsonb or geometry.
- `delivery_fee_amount_minor`, `currency_code`.
- `minimum_order_amount_minor`.
- `estimated_delivery_minutes` integer.
- `priority` integer.
- `created_at`, `updated_at`, `deleted_at`.

Indexes:

- `(branch_id, status, priority)`.
- Geo index when supported.
- `(organization_id, branch_id)`.

RLS:

- Active zones readable for ordering.
- Mutations privileged and audited.

### 5.8 `app_private.branch_operational_settings`

Columns:

- `branch_id` UUID PK.
- `organization_id` UUID.
- `max_active_orders` integer.
- `kitchen_capacity_mode` text.
- `delivery_capacity_mode` text.
- `pause_reason_required` boolean.
- `override_requires_reason` boolean.
- `settings` jsonb.
- `updated_at`, `updated_by`.

Indexes:

- PK.
- `(organization_id)`.

RLS:

- Operations/admin read in scope.
- Mutations require operations permission and audit event.

---

## 6. Catalog and Menu Domain Tables

### 6.1 Catalog Principles

- Catalog definitions are tenant/brand scoped.
- Branch-specific availability and price overrides are separate from global menu item definitions.
- Order records capture immutable item, modifier, and price snapshots.
- Menu versioning is prepared through version and effective columns even if full version tables are introduced later.

### 6.2 `app_public.categories`

Columns: `id`, `organization_id`, `brand_id`, `parent_category_id`, `name`, `slug`, `description`, `display_order`, `status`, `image_asset_id`, `available_from`, `available_to`, `created_at`, `updated_at`, `deleted_at`.

PK: `id`.

FKs: organization, brand, parent category, image.

Indexes:

- `(organization_id, brand_id, status, display_order)`.
- Unique `(organization_id, brand_id, slug)` where active.
- `(parent_category_id)`.

RLS: active public categories readable; admin mutations audited.

### 6.3 `app_public.menu_items`

Columns: `id`, `organization_id`, `brand_id`, `category_id`, `name`, `slug`, `description`, `base_price_amount_minor`, `currency_code`, `sku`, `status`, `is_featured`, `tax_category`, `prep_station_hint`, `image_asset_id`, `version`, `effective_from`, `effective_to`, `created_at`, `updated_at`, `deleted_at`.

Indexes:

- `(organization_id, brand_id, status)`.
- `(category_id, status)`.
- Unique `(organization_id, brand_id, slug)` where active.
- Search index on name/description.

Pricing strategy:

- Base price on `menu_items`.
- Branch-specific price in `menu_item_branch_overrides`.
- Promotional discount is never persisted by mutating base price; checkout snapshots computed effects.

### 6.4 `app_public.modifier_groups`

Columns: `id`, `organization_id`, `brand_id`, `name`, `display_name`, `selection_min`, `selection_max`, `is_required`, `display_order`, `status`, `created_at`, `updated_at`.

Indexes: `(organization_id, brand_id, status)`, `(display_order)`.

### 6.5 `app_public.modifiers`

Columns: `id`, `organization_id`, `brand_id`, `modifier_group_id`, `name`, `price_delta_amount_minor`, `currency_code`, `status`, `sku`, `display_order`, `created_at`, `updated_at`, `deleted_at`.

Indexes: `(modifier_group_id, status, display_order)`, `(organization_id, brand_id, status)`.

### 6.6 `app_public.menu_item_modifier_groups`

Purpose: many-to-many relation between items and modifier groups.

Columns: `menu_item_id`, `modifier_group_id`, `display_order`, `is_required_override`, `created_at`.

PK: `(menu_item_id, modifier_group_id)`.

Indexes: `(modifier_group_id)`.

### 6.7 `app_public.combos`

Columns: `id`, `organization_id`, `brand_id`, `category_id`, `name`, `slug`, `description`, `base_price_amount_minor`, `currency_code`, `status`, `image_asset_id`, `version`, `created_at`, `updated_at`, `deleted_at`.

Indexes: `(organization_id, brand_id, status)`, unique active slug.

### 6.8 `app_public.combo_items`

Columns: `id`, `combo_id`, `menu_item_id`, `quantity`, `group_name`, `is_required`, `min_quantity`, `max_quantity`, `display_order`.

Indexes: `(combo_id, display_order)`, `(menu_item_id)`.

### 6.9 `app_public.images` / `app_private.asset_metadata`

Columns for public image reference: `id`, `organization_id`, `brand_id`, `bucket`, `path`, `alt_text`, `width`, `height`, `focal_point`, `status`, `created_at`, `updated_at`.

Private metadata may include moderation, upload actor, checksum, retention class.

Indexes: `(organization_id, brand_id, status)`, `(bucket, path)` unique.

### 6.10 `app_public.availability_rules`

Columns: `id`, `organization_id`, `branch_id` nullable, `entity_type`, `entity_id`, `rule_type`, `day_of_week`, `starts_at`, `ends_at`, `date_start`, `date_end`, `status`, `priority`, `created_at`, `updated_at`.

Indexes:

- `(organization_id, branch_id, entity_type, entity_id, status)`.
- `(date_start, date_end)`.

Availability strategy:

- Base catalog status determines whether item can be sold anywhere.
- Availability rules determine time/date eligibility.
- Branch overrides determine local availability, sold out, or price override.

### 6.11 `app_public.menu_item_branch_overrides`

Columns: `id`, `organization_id`, `branch_id`, `menu_item_id`, `status_override`, `price_override_amount_minor`, `currency_code`, `sold_out_until`, `reason`, `updated_by`, `updated_at`.

Indexes:

- Unique `(branch_id, menu_item_id)`.
- `(organization_id, branch_id, status_override)`.

RLS: branch staff can update availability if permissioned; price changes require admin permission and audit.

---

## 7. Cart and Checkout Domain Tables

### 7.1 Cart Principles

- Carts are mutable and expire.
- Checkout sessions create immutable validation/payment context.
- Cart pricing is not financial truth; order/payment snapshots are truth.
- Anonymous carts may exist with session token hash, then attach to customer after login.

### 7.2 `app_public.carts`

Columns: `id`, `organization_id`, `branch_id`, `customer_user_id` nullable, `anonymous_session_id_hash` nullable, `status`, `fulfillment_type`, `currency_code`, `subtotal_amount_minor`, `discount_amount_minor`, `delivery_fee_amount_minor`, `total_amount_minor`, `expires_at`, `last_activity_at`, `created_at`, `updated_at`.

Indexes:

- `(customer_user_id, status, updated_at desc)`.
- `(anonymous_session_id_hash, status)`.
- `(organization_id, branch_id, status)`.
- `(expires_at)` for cleanup.

RLS:

- Customer reads/writes own active cart.
- Anonymous cart access requires secure session token pattern, not exposed predictable IDs.

Expiration rules:

- Expire inactive carts after configured window.
- Expire immediately after checkout conversion.
- Scheduled carts may have longer controlled retention.

### 7.3 `app_public.cart_items`

Columns: `id`, `cart_id`, `organization_id`, `branch_id`, `menu_item_id` nullable, `combo_id` nullable, `quantity`, `unit_price_amount_minor`, `total_amount_minor`, `item_snapshot` jsonb, `validation_status`, `created_at`, `updated_at`.

Indexes:

- `(cart_id)`.
- `(organization_id, branch_id)`.

RLS: inherits cart ownership via policy helper.

### 7.4 `app_public.cart_modifiers`

Columns: `id`, `cart_item_id`, `modifier_id`, `quantity`, `price_delta_amount_minor`, `modifier_snapshot` jsonb`, `created_at`.

Indexes: `(cart_item_id)`, `(modifier_id)`.

### 7.5 `app_private.checkout_sessions`

Columns: `id`, `cart_id`, `organization_id`, `branch_id`, `customer_user_id`, `status`, `idempotency_key_hash`, `pricing_snapshot` jsonb, `delivery_snapshot` jsonb nullable, `payment_preference_id` nullable, `expires_at`, `created_at`, `completed_at`, `failed_at`, `failure_reason`.

Indexes:

- Unique `(organization_id, idempotency_key_hash)`.
- `(cart_id)`.
- `(customer_user_id, created_at desc)`.
- `(expires_at)`.

Recovery strategy:

- Checkout session can be resumed if not expired and no order created.
- Idempotency key returns existing outcome.
- Failed sessions keep safe error context for support/debugging.

Cleanup strategy:

- Expired carts and checkout sessions are soft-expired and later purged/anonymized based on retention policy.

---

## 8. Order Domain Tables

### 8.1 Order Principles

- Orders are financial and operational truth after checkout.
- Order item and pricing fields are immutable snapshots.
- Status changes are append-only in history.
- Realtime uses safe branch/customer projections, not all raw order internals.

### 8.2 `app_public.orders`

Columns:

- Identity/scope: `id`, `organization_id`, `branch_id`, `customer_user_id` nullable.
- Public reference: `order_number`, `public_tracking_code`.
- Status: `status`, `payment_status`, `fulfillment_status`, `fulfillment_type`.
- Monetary snapshots: `currency_code`, `subtotal_amount_minor`, `discount_amount_minor`, `delivery_fee_amount_minor`, `tax_amount_minor`, `tip_amount_minor`, `total_amount_minor`.
- Customer snapshot: `customer_snapshot` jsonb.
- Address/delivery snapshot: `delivery_address_snapshot` jsonb nullable.
- Timing: `scheduled_for`, `accepted_at`, `prepared_at`, `ready_at`, `completed_at`, `cancelled_at`.
- Audit: `created_at`, `updated_at`, `created_by`, `cancelled_by`, `cancellation_reason`.

PK: `id`.

Indexes:

- Unique `(organization_id, order_number)`.
- `(customer_user_id, created_at desc)`.
- `(organization_id, branch_id, status, created_at desc)`.
- `(organization_id, branch_id, fulfillment_status, created_at desc)`.
- `(public_tracking_code)` unique.
- Partition key/index if partitioned by `created_at`.

RLS:

- Customer can read own orders using `customer_user_id`.
- Branch staff can read branch orders.
- Admin can read organization orders.
- Mutations through server commands only except safe customer cancellation if contract permits.

Realtime:

- Publish safe order status projections.
- Avoid publishing sensitive customer/payment snapshots on broad channels.

### 8.3 `app_public.order_items`

Columns: `id`, `order_id`, `organization_id`, `branch_id`, `menu_item_id` nullable, `combo_id` nullable, `name_snapshot`, `sku_snapshot`, `quantity`, `unit_price_amount_minor`, `modifier_total_amount_minor`, `total_amount_minor`, `item_snapshot` jsonb, `kitchen_routing_hint`, `status`, `created_at`.

Indexes: `(order_id)`, `(organization_id, branch_id, status)`, `(menu_item_id)`.

Immutable fields: menu item snapshot, unit price, selected modifiers, quantity after order confirmation unless corrected via explicit adjustment record.

### 8.4 `app_public.order_modifiers`

Columns: `id`, `order_item_id`, `modifier_id` nullable, `name_snapshot`, `quantity`, `price_delta_amount_minor`, `modifier_snapshot` jsonb.

Indexes: `(order_item_id)`.

### 8.5 `app_private.order_status_history`

Columns: `id`, `order_id`, `organization_id`, `branch_id`, `from_status`, `to_status`, `transition_reason`, `actor_type`, `actor_id`, `source`, `correlation_id`, `created_at`.

Indexes:

- `(order_id, created_at)`.
- `(organization_id, branch_id, created_at desc)`.
- `(correlation_id)`.

RLS: staff/admin/support reads through scoped APIs; writes only through status transition service.

### 8.6 `app_internal.order_events`

Purpose: domain-specific order event staging or projection source if separate from global outbox.

Columns: event metadata, `order_id`, `event_name`, `event_version`, `payload`, `created_at`, `processed_at`.

Indexes: `(order_id, created_at)`, `(event_name, created_at)`, `(processed_at)`.

---

## 9. Payments Domain Tables

### 9.1 Payment Principles

- Payments are provider-neutral at the domain level.
- Mercado Pago details are isolated in provider fields/payload tables.
- Payment attempts, webhooks, refunds, and reconciliations are idempotent and auditable.
- Financial records are append-only or correction-by-event.

### 9.2 `app_private.payments`

Columns: `id`, `organization_id`, `branch_id`, `order_id`, `customer_user_id`, `provider`, `status`, `currency_code`, `amount_amount_minor`, `approved_amount_minor`, `refunded_amount_minor`, `provider_payment_id`, `provider_preference_id`, `created_at`, `updated_at`, `approved_at`, `rejected_at`, `cancelled_at`, `reconciled_at`.

Indexes:

- `(order_id)` unique for primary payment where applicable.
- `(organization_id, branch_id, status, created_at desc)`.
- `(provider, provider_payment_id)` unique nullable.
- `(provider_preference_id)`.

RLS: no direct client access; safe payment status exposed through order/payment projections.

### 9.3 `app_private.payment_attempts`

Columns: `id`, `payment_id`, `organization_id`, `branch_id`, `provider`, `status`, `idempotency_key_hash`, `provider_preference_id`, `provider_init_payload_redacted` jsonb, `failure_code`, `failure_message_safe`, `created_at`, `completed_at`.

Indexes:

- Unique `(organization_id, idempotency_key_hash)`.
- `(payment_id, created_at desc)`.
- `(provider, provider_preference_id)`.

### 9.4 `app_private.payment_webhooks`

Columns: `id`, `organization_id` nullable until resolved, `provider`, `provider_event_id`, `provider_resource_id`, `event_type`, `signature_valid`, `payload_hash`, `payload_redacted` jsonb, `received_at`, `processed_at`, `processing_status`, `dedupe_key`.

Indexes:

- Unique `(provider, provider_event_id)` where available.
- Unique `(provider, dedupe_key)`.
- `(processing_status, received_at)`.
- `(provider_resource_id)`.

Retention: raw/redacted payload retention per security policy; audit summary retained longer.

### 9.5 `app_private.refunds`

Columns: `id`, `organization_id`, `branch_id`, `order_id`, `payment_id`, `status`, `refund_amount_minor`, `currency_code`, `reason_code`, `reason_detail`, `requested_by`, `approved_by`, `provider_refund_id`, `idempotency_key_hash`, `requested_at`, `approved_at`, `submitted_at`, `completed_at`, `failed_at`.

Indexes:

- `(payment_id, created_at desc)`.
- `(order_id)`.
- `(organization_id, branch_id, status)`.
- Unique `(organization_id, idempotency_key_hash)`.

Auditability: every status transition emits audit event and refund review record.

### 9.6 `app_private.payment_reconciliations`

Columns: `id`, `organization_id`, `branch_id`, `payment_id`, `provider`, `status`, `provider_status`, `local_status`, `difference_type`, `difference_amount_minor`, `currency_code`, `checked_at`, `resolved_at`, `resolved_by`, `resolution_notes`, `evidence` jsonb.

Indexes: `(organization_id, status, checked_at desc)`, `(payment_id)`, `(provider, checked_at desc)`.

---

## 10. Loyalty and Promotions Domain Tables

### 10.1 Principles

- Promotion definitions are mutable with audited changes.
- Redemption and loyalty ledger records are append-only.
- Fraud resistance relies on unique constraints, idempotency, customer limits, order linkage, and audit.
- Replay safety requires deterministic redemption IDs and ledger causation references.

### 10.2 `app_public.promotions`

Columns: `id`, `organization_id`, `brand_id`, `name`, `description`, `status`, `promotion_type`, `starts_at`, `ends_at`, `budget_amount_minor`, `currency_code`, `usage_limit_total`, `usage_limit_per_customer`, `created_at`, `updated_at`, `approved_at`, `approved_by`.

Indexes: `(organization_id, status, starts_at, ends_at)`, `(brand_id, status)`.

### 10.3 `app_private.promotion_rules`

Columns: `id`, `promotion_id`, `organization_id`, `rule_type`, `rule_config` jsonb, `priority`, `created_at`, `updated_at`.

Indexes: `(promotion_id, priority)`, `(organization_id, rule_type)`.

### 10.4 `app_public.coupons`

Columns: `id`, `organization_id`, `promotion_id`, `code_hash`, `display_code_masked`, `status`, `starts_at`, `expires_at`, `max_redemptions`, `max_redemptions_per_customer`, `created_at`, `updated_at`.

Indexes:

- Unique `(organization_id, code_hash)`.
- `(promotion_id, status)`.
- `(expires_at)`.

### 10.5 `app_private.coupon_redemptions`

Columns: `id`, `organization_id`, `coupon_id`, `promotion_id`, `customer_user_id`, `order_id`, `cart_id`, `status`, `discount_amount_minor`, `currency_code`, `idempotency_key_hash`, `redeemed_at`, `reversed_at`.

Indexes:

- Unique `(organization_id, idempotency_key_hash)`.
- Unique `(coupon_id, order_id)`.
- `(customer_user_id, coupon_id)`.
- `(promotion_id, redeemed_at desc)`.

Append-only: redemptions are not deleted; reversal creates status/reversal event.

### 10.6 `app_private.loyalty_accounts`

Columns: `id`, `organization_id`, `customer_user_id`, `status`, `points_balance_cached`, `tier`, `created_at`, `updated_at`, `closed_at`.

Indexes: Unique `(organization_id, customer_user_id)`, `(organization_id, status)`.

### 10.7 `app_private.loyalty_ledger`

Columns: `id`, `organization_id`, `loyalty_account_id`, `customer_user_id`, `transaction_type`, `points_delta`, `points_balance_after`, `source_type`, `source_id`, `order_id`, `promotion_id`, `idempotency_key_hash`, `status`, `occurred_at`, `created_at`, `reversed_by_ledger_id`.

Indexes:

- `(loyalty_account_id, occurred_at)`.
- Unique `(organization_id, idempotency_key_hash)`.
- `(source_type, source_id)`.

Append-only: balance corrections are compensating ledger entries.

### 10.8 `app_public.rewards`

Columns: `id`, `organization_id`, `promotion_id` nullable, `name`, `description`, `reward_type`, `cost_points`, `value_amount_minor`, `currency_code`, `status`, `starts_at`, `ends_at`, `created_at`, `updated_at`.

Indexes: `(organization_id, status)`, `(promotion_id)`.

---

## 11. Kitchen Domain Tables

### 11.1 Principles

- Kitchen data is branch-scoped and realtime-sensitive.
- Queue queries must be indexed by branch, status, priority, and creation time.
- Kitchen events are append-only for operational traceability.
- Realtime publishes limited ticket projection data.

### 11.2 `app_public.kitchen_stations`

Columns: `id`, `organization_id`, `branch_id`, `name`, `station_type`, `status`, `display_order`, `capacity`, `created_at`, `updated_at`.

Indexes: `(branch_id, status, display_order)`, `(organization_id, branch_id)`.

RLS: branch staff reads; operations/admin mutate with audit.

### 11.3 `app_public.kitchen_tickets`

Columns: `id`, `organization_id`, `branch_id`, `order_id`, `ticket_number`, `status`, `priority`, `station_id` nullable, `claimed_by` nullable, `claimed_at`, `started_at`, `blocked_at`, `ready_at`, `cancelled_at`, `sla_due_at`, `created_at`, `updated_at`.

Indexes:

- `(organization_id, branch_id, status, priority, created_at)`.
- `(branch_id, station_id, status)`.
- `(order_id)`.
- `(sla_due_at)`.

Realtime: publish branch-scoped ticket changes to operations channels.

### 11.4 `app_public.kitchen_ticket_items`

Columns: `id`, `kitchen_ticket_id`, `order_item_id`, `status`, `quantity`, `item_snapshot`, `routing_notes`, `created_at`, `updated_at`.

Indexes: `(kitchen_ticket_id)`, `(order_item_id)`, `(status)`.

### 11.5 `app_private.kitchen_assignments`

Columns: `id`, `organization_id`, `branch_id`, `kitchen_ticket_id`, `station_id`, `assigned_to`, `status`, `assigned_at`, `completed_at`, `assignment_reason`.

Indexes: `(branch_id, status, assigned_at)`, `(assigned_to, status)`.

### 11.6 `app_internal.kitchen_events`

Columns: event metadata, `kitchen_ticket_id`, `event_type`, `payload`, `occurred_at`.

Indexes: `(kitchen_ticket_id, occurred_at)`, `(branch_id, occurred_at desc)`.

---

## 12. Delivery Domain Tables

### 12.1 Principles

- Delivery is branch-scoped and order-linked.
- Reassignment is first-class and audited.
- Delivery proof files live in Supabase Storage with metadata linked in database.
- Customer-facing tracking uses safe projections.

### 12.2 `app_private.drivers`

Columns: `id`, `organization_id`, `branch_id` nullable, `user_id` nullable, `name`, `phone`, `status`, `driver_type`, `metadata`, `created_at`, `updated_at`.

Indexes: `(organization_id, branch_id, status)`, `(user_id)`.

RLS: staff/admin only; customer never reads raw driver private data.

### 12.3 `app_public.delivery_zones`

May reuse `branch_delivery_zones`; if delivery domain requires separate operational zones, table includes `id`, `organization_id`, `branch_id`, `name`, `status`, `geo_area`, `fee`, `priority`.

### 12.4 `app_public.delivery_assignments`

Columns: `id`, `organization_id`, `branch_id`, `order_id`, `driver_id` nullable, `status`, `delivery_address_snapshot`, `zone_id`, `estimated_pickup_at`, `estimated_delivery_at`, `assigned_at`, `picked_up_at`, `delivered_at`, `failed_at`, `failure_reason`, `created_at`, `updated_at`.

Indexes:

- `(organization_id, branch_id, status, created_at)`.
- `(order_id)` unique where one active delivery.
- `(driver_id, status)`.

Realtime: safe branch/customer projections only.

### 12.5 `app_internal.delivery_events`

Columns: event metadata, `delivery_assignment_id`, `event_type`, `from_status`, `to_status`, `actor_id`, `payload`, `occurred_at`.

Indexes: `(delivery_assignment_id, occurred_at)`, `(branch_id, occurred_at desc)`.

### 12.6 `app_private.delivery_proofs`

Columns: `id`, `organization_id`, `branch_id`, `delivery_assignment_id`, `proof_type`, `storage_bucket`, `storage_path`, `captured_by`, `captured_at`, `metadata`, `retention_class`.

Indexes: `(delivery_assignment_id)`, `(organization_id, branch_id, captured_at desc)`, `(retention_class, captured_at)`.

Auditability: proof creation, access, and deletion/retention actions audited.

---

## 13. Notifications Domain Tables

### 13.1 Principles

- Notifications are side effects; they do not own business state.
- Templates are versioned and approved.
- Delivery attempts are retryable and provider-specific details are isolated.
- WhatsApp and email share a provider-neutral delivery model.

### 13.2 `app_private.notification_templates`

Columns: `id`, `organization_id` nullable, `brand_id` nullable, `channel`, `template_key`, `version`, `status`, `locale`, `subject_template` nullable, `body_template`, `provider_template_id` nullable, `approved_by`, `approved_at`, `created_at`, `updated_at`.

Indexes: Unique `(organization_id, channel, template_key, version, locale)`, `(status)`.

RLS: admin read in scope; template changes audited.

### 13.3 `app_internal.notification_events`

Columns: event metadata, `notification_type`, `recipient_type`, `recipient_id`, `source_type`, `source_id`, `payload`, `created_at`, `processed_at`.

Indexes: `(source_type, source_id)`, `(processed_at)`, `(created_at)`.

### 13.4 `app_private.notification_deliveries`

Columns: `id`, `organization_id`, `branch_id` nullable, `template_id`, `channel`, `recipient_hash`, `recipient_user_id` nullable, `provider`, `status`, `attempt_count`, `next_attempt_at`, `last_attempt_at`, `provider_message_id`, `failure_code`, `failure_message_safe`, `source_type`, `source_id`, `created_at`, `delivered_at`, `expired_at`.

Indexes:

- `(organization_id, status, next_attempt_at)`.
- `(source_type, source_id)`.
- `(provider, provider_message_id)`.
- Partition by `created_at` at scale.

Retry support:

- Exponential backoff with max attempts.
- Suppression after compliance/privacy opt-out.
- Idempotency key per source/template/channel/recipient.

### 13.5 `app_public.notification_preferences`

Columns: `id`, `organization_id`, `user_id`, `channel`, `notification_type`, `status`, `updated_at`.

Indexes: Unique `(organization_id, user_id, channel, notification_type)`.

RLS: user manages own preferences; admin/support changes audited and limited.

---

## 14. Support Domain Tables

### 14.1 Principles

- Support access is purpose-limited and audited.
- Support cases reference orders/payments/deliveries without duplicating sensitive data.
- Internal notes have stricter access than customer-visible messages.

### 14.2 `app_private.support_cases`

Columns: `id`, `organization_id`, `branch_id` nullable, `customer_user_id`, `order_id` nullable, `payment_id` nullable, `delivery_assignment_id` nullable, `status`, `priority`, `case_type`, `subject`, `summary`, `assigned_to`, `opened_at`, `resolved_at`, `closed_at`, `created_at`, `updated_at`.

Indexes:

- `(organization_id, status, priority, opened_at desc)`.
- `(customer_user_id, opened_at desc)`.
- `(order_id)`.
- `(assigned_to, status)`.

RLS: support/admin only; customers may see safe case summary through separate view if product requires.

### 14.3 `app_private.support_interactions`

Columns: `id`, `support_case_id`, `organization_id`, `actor_type`, `actor_id`, `visibility`, `channel`, `message_body`, `attachments` jsonb, `created_at`, `redacted_at`.

Indexes: `(support_case_id, created_at)`, `(organization_id, created_at desc)`.

Retention: based on support/compliance policy; PII redaction supported.

### 14.4 `app_private.support_actions`

Columns: `id`, `support_case_id`, `organization_id`, `action_type`, `target_type`, `target_id`, `reason`, `performed_by`, `status`, `created_at`, `completed_at`.

Indexes: `(support_case_id, created_at)`, `(target_type, target_id)`, `(performed_by, created_at desc)`.

Audit requirements: every support action that changes customer/order/payment/permission state must emit audit event.

---

## 15. Audit and Compliance Domain Tables

### 15.1 Audit Principles

- Audit facts are immutable.
- Audit reads are audited.
- Audit events can reference deleted/anonymized business records through durable entity references.
- Retention is policy-driven and legal holds override purge.
- Financial/security records have longer retention and stricter access.

### 15.2 `audit.audit_events`

Columns: `id`, `event_name`, `event_version`, `organization_id`, `branch_id` nullable, `actor_type`, `actor_id` nullable, `action`, `risk_category`, `entity_type`, `entity_id`, `before_summary` jsonb nullable, `after_summary` jsonb nullable, `reason` text nullable, `source_event_id` UUID nullable, `correlation_id`, `causation_id`, `occurred_at`, `recorded_at`, `retention_class`, `legal_hold` boolean default false.

Indexes:

- `(organization_id, occurred_at desc)`.
- `(organization_id, branch_id, occurred_at desc)`.
- `(actor_type, actor_id, occurred_at desc)`.
- `(entity_type, entity_id, occurred_at desc)`.
- `(correlation_id)`.
- `(risk_category, occurred_at desc)`.
- `(retention_class, occurred_at)`.

Partitioning: monthly by `occurred_at`; tenant hash subpartition later if necessary.

Immutability: no updates except controlled retention/legal hold metadata; no deletes except retention worker with legal hold checks.

### 15.3 `audit.audit_logs`

Purpose: query-optimized projection/read model.

Columns: `id`, `audit_event_id`, scope fields, display-safe summary, reviewer_tags, indexed entity/actor fields, `created_at`.

Retention: rebuildable but aligned with source retention.

### 15.4 `audit.security_events`

Columns: `id`, metadata, `security_event_type`, `severity`, `user_id`, `ip_hash`, `user_agent_hash`, `resource`, `decision`, `reason_code`, `occurred_at`, `retention_class`.

Indexes: `(severity, occurred_at desc)`, `(user_id, occurred_at desc)`, `(organization_id, occurred_at desc)`.

Partitioning: monthly by `occurred_at`.

### 15.5 `audit.compliance_events`

Columns: `id`, metadata, `compliance_event_type`, `policy_id`, `subject_type`, `subject_id`, `decision`, `evidence` jsonb, `occurred_at`.

Indexes: `(compliance_event_type, occurred_at desc)`, `(policy_id)`, `(subject_type, subject_id)`.

### 15.6 `audit.permission_changes`

Columns: `id`, `organization_id`, `branch_id` nullable, `subject_user_id`, `role_id`, `permission_code`, `change_type`, `before_state`, `after_state`, `changed_by`, `reason`, `occurred_at`.

Indexes: `(subject_user_id, occurred_at desc)`, `(changed_by, occurred_at desc)`, `(organization_id, occurred_at desc)`.

### 15.7 `audit.operational_overrides`

Columns: `id`, `organization_id`, `branch_id`, `override_type`, `target_type`, `target_id`, `before_state`, `after_state`, `reason`, `performed_by`, `approved_by` nullable, `occurred_at`.

Indexes: `(branch_id, occurred_at desc)`, `(target_type, target_id)`, `(performed_by, occurred_at desc)`.

### 15.8 `audit.incident_records`

Columns: `id`, `organization_id` nullable, `branch_id` nullable, `incident_type`, `severity`, `status`, `summary`, `detected_at`, `acknowledged_at`, `resolved_at`, `owner_team`, `postmortem_url`, `impact_summary`, `created_at`, `updated_at`.

Indexes: `(severity, status, detected_at desc)`, `(organization_id, branch_id, detected_at desc)`.

### 15.9 Retention Policies

Tables:

- `audit.retention_policies`: versioned retention definitions.
- `audit.legal_holds`: legal hold by entity, tenant, time range, or category.
- `audit.audit_access_logs`: audit reads/exports.

Retention requirements:

- Financial/security/permission/refund/payment records: minimum 7 years.
- Operational low-risk overrides: 3 years unless linked to dispute/security/financial incident.
- Support records: policy-based with PII redaction.
- Audit access logs: minimum 7 years.

---

## 16. Event Architecture Database Support

### 16.1 Outbox Pattern

`app_internal.outbox_events` is the durable event publishing source.

Columns: `id`, `event_name`, `event_version`, `aggregate_type`, `aggregate_id`, `organization_id`, `branch_id`, `payload`, `metadata`, `correlation_id`, `causation_id`, `actor_type`, `actor_id`, `status`, `available_at`, `published_at`, `attempt_count`, `last_error`, `schema_hash`, `retention_class`, `created_at`.

Indexes:

- `(status, available_at, created_at)` for workers.
- `(aggregate_type, aggregate_id, created_at)`.
- `(organization_id, branch_id, created_at desc)`.
- `(event_name, created_at desc)`.
- `(correlation_id)`.

Partitioning: monthly by `created_at` when volume requires; keep hot unpublished rows efficient.

Ownership: Event Platform.

### 16.2 Event Catalog

`app_internal.event_catalog` stores event definitions and compatibility metadata.

Columns: `event_name`, `major_version`, `owner_domain`, `schema_hash`, `classification`, `retention_class`, `status`, `introduced_at`, `deprecated_at`, `description`.

Indexes: PK `(event_name, major_version)`, `(owner_domain, status)`.

### 16.3 Event Consumers

`app_internal.event_consumers`:

- `id`, `consumer_name`, `owner_team`, `status`, `max_retry_count`, `created_at`.

`app_internal.event_consumer_offsets`:

- `consumer_id`, `event_id`, `status`, `processed_at`, `attempt_count`, `last_error`.

Indexes: `(consumer_id, status, processed_at)`, `(event_id)`.

### 16.4 Replay Operations

`app_internal.replay_operations`:

- `id`, `requested_by`, `reason`, `event_filter`, `status`, `started_at`, `completed_at`, `created_at`, `approved_by`, `risk_category`.

Replay rules:

- Replays require approval for financial, audit, payment, or notification events.
- Replayed side effects must be idempotent.
- Replay operations are audited.

### 16.5 Event Idempotency

`app_internal.idempotency_keys`:

- `id`, `organization_id`, `scope`, `key_hash`, `request_hash`, `response_reference`, `status`, `expires_at`, `created_at`, `completed_at`.

Indexes: Unique `(organization_id, scope, key_hash)`, `(expires_at)`.

---

## 17. Analytics Architecture

### 17.1 Analytics Principles

- OLTP tables remain optimized for transactions and operations.
- Analytics uses event ingestion, snapshots, and aggregates.
- Raw analytics does not drive operational state.
- PII is classified before ingestion and limited in dashboards.

### 17.2 `analytics.analytics_events`

Columns: `id`, `organization_id`, `branch_id` nullable, `user_id` nullable, `anonymous_id` nullable, `event_name`, `event_version`, `surface`, `properties` jsonb, `context` jsonb, `privacy_classification`, `occurred_at`, `ingested_at`, `session_id`, `source`.

Indexes:

- `(organization_id, occurred_at desc)`.
- `(organization_id, branch_id, occurred_at desc)`.
- `(event_name, occurred_at desc)`.
- `(user_id, occurred_at desc)`.
- Partition by `occurred_at`.

### 17.3 `analytics.operational_metrics`

Columns: `id`, `organization_id`, `branch_id`, `metric_name`, `metric_value`, `unit`, `dimensions` jsonb, `window_start`, `window_end`, `computed_at`, `source`.

Indexes: `(organization_id, branch_id, metric_name, window_start)`, `(computed_at)`.

### 17.4 `analytics.business_metrics`

Columns: `id`, `organization_id`, `brand_id` nullable, `branch_id` nullable, `metric_name`, `metric_value`, `currency_code` nullable, `dimensions` jsonb, `window_start`, `window_end`, `computed_at`.

Indexes: `(organization_id, metric_name, window_start)`, `(branch_id, metric_name, window_start)`.

### 17.5 OLTP/OLAP Boundaries

- Do not run unbounded analytics queries against hot order/payment/kitchen tables.
- Use incremental metric jobs and materialized aggregates.
- Export to warehouse when volume or query complexity exceeds Supabase/Postgres OLTP expectations.

Retention:

- Raw analytics: privacy-class-based retention.
- Aggregates: longer retention where no PII.
- Operational metrics: retain hot detail for incident analysis, aggregate long term.

---

## 18. Row-Level Security Strategy

### 18.1 RLS Principles

- RLS is enabled on every application-owned table unless formally exempted by ADR.
- RLS is defense in depth, not a replacement for command authorization.
- Policies must be tenant-aware and branch-aware.
- Service role bypass must be wrapped, audited, and minimized.
- Helper functions must be stable, reviewed, indexed, and safe from privilege escalation.

### 18.2 Access Classes

Customer access:

- Read public menu/branch data.
- Read/write own cart.
- Read own orders and safe status projections.
- Manage own addresses/preferences.
- No direct access to private payment, audit, support notes, or provider payloads.

Branch access:

- Staff reads branch orders, kitchen tickets, delivery assignments, operational projections.
- Staff mutations require permissions and audit.

Organization access:

- Organization admins manage catalog, branch settings, promotions, staff, and reports within organization.

Admin access:

- Admin is tenant-scoped unless platform super-admin.
- Admin cannot bypass domain commands for sensitive mutations.

Support access:

- Purpose-limited, time-limited, audited.
- Reads only fields required for case.
- Sensitive exports require approval.

Super-admin access:

- Platform-level, break-glass or operational need only.
- All access audited.
- Must not be used for normal tenant operations.

### 18.3 Policy Patterns

Tenant-aware policy:

- Record `organization_id` must be in active memberships for `auth.uid()`.

Branch-aware policy:

- Record `branch_id` must be in active branch memberships or user has organization-level branch permission.

Customer-owned policy:

- Record `customer_user_id = auth.uid()` or profile mapping equivalent.

Support policy:

- Active support grant exists for subject/scope, unexpired, purpose recorded.

### 18.4 Forbidden Bypass Patterns

- Using service role in browser or client bundle.
- Creating broad `USING (true)` policies for authenticated users.
- Relying on hidden UI for authorization.
- Policies that depend on mutable client-provided tenant context without membership validation.
- Direct table writes for financial, audit, permission, refund, or operational override actions.
- Exposing raw provider payloads through RLS.

---

## 19. Indexing Strategy

### 19.1 Global Index Rules

- Every foreign key used in joins has an index.
- Every RLS predicate column used at scale has an index.
- High-volume tenant tables use leading `organization_id`; branch-operational tables use `(organization_id, branch_id, ...)`.
- Realtime tables index status and recency predicates.
- JSONB queried fields require expression or GIN indexes only after query patterns are approved.
- Partial indexes should target active records where lifecycle is status-heavy.

### 19.2 Domain Index Matrix

| Domain | Primary/Secondary Indexes | Compound Indexes | Search Indexes | Analytics/Realtime Indexes |
| --- | --- | --- | --- | --- |
| Identity | PK user/role/permission; role permission joins. | `(user_id, organization_id, branch_id, status)`, `(organization_id, branch_id, role_id, status)`. | User/profile search by normalized fields in private admin views. | Access review due/status indexes. |
| Tenant/Branch | Organization/branch PKs, slugs. | `(organization_id, status)`, `(organization_id, operational_status)`. | Branch name/location search. | Branch status realtime indexes. |
| Catalog/Menu | Item/category/modifier PK/FK. | `(organization_id, brand_id, status)`, `(category_id, status)`, `(branch_id, menu_item_id)`. | Menu item name/description full text. | Availability by branch/status. |
| Cart/Checkout | Cart/customer/session keys. | `(customer_user_id, status, updated_at)`, `(organization_id, branch_id, status)`. | None initially. | Expiration cleanup indexes. |
| Orders | Order PK/reference/tracking. | `(organization_id, branch_id, status, created_at)`, `(customer_user_id, created_at)`. | Admin order number/customer search via projection. | Status/branch realtime indexes. |
| Payments | Payment/order/provider IDs. | `(organization_id, branch_id, status, created_at)`, `(provider, provider_payment_id)`. | Provider reference search. | Reconciliation status/time. |
| Promotions/Loyalty | Coupon code hash, ledger IDs. | `(customer_user_id, coupon_id)`, `(loyalty_account_id, occurred_at)`. | Promotion/coupon admin search. | Redemption metrics indexes. |
| Kitchen | Ticket/station PK/FK. | `(organization_id, branch_id, status, priority, created_at)`. | None initially. | Branch queue realtime indexes. |
| Delivery | Assignment/order/driver keys. | `(organization_id, branch_id, status, created_at)`, `(driver_id, status)`. | Address search only in approved projections. | Tracking status indexes. |
| Notifications | Delivery/provider/source IDs. | `(organization_id, status, next_attempt_at)`, `(source_type, source_id)`. | Template key search. | Retry queue indexes. |
| Support | Case/customer/order IDs. | `(organization_id, status, priority, opened_at)`, `(assigned_to, status)`. | Case subject/summary search in private views. | SLA/due indexes. |
| Audit | Entity, actor, correlation. | `(organization_id, occurred_at)`, `(entity_type, entity_id, occurred_at)`. | Audit summary search restricted. | Retention and review indexes. |
| Events | Outbox status and aggregate. | `(status, available_at, created_at)`, `(aggregate_type, aggregate_id, created_at)`. | None. | Consumer offset indexes. |
| Analytics | Event/time/org. | `(organization_id, branch_id, occurred_at)`, `(event_name, occurred_at)`. | Rare, approved only. | Partition pruning on time. |

---

## 20. Partitioning Strategy

### 20.1 Partitioning Principles

Partition high-volume append-heavy tables by time when retention, query pruning, and maintenance benefits exceed complexity. Start with tables that are guaranteed high-volume or long-retention.

### 20.2 Tables

Orders:

- Partition by `created_at` only when volume requires or before franchise scale.
- Monthly partitions recommended once order volume is significant.
- Keep indexes local and include tenant/branch/status.

Payments:

- Payments may remain unpartitioned initially if volume is tied to orders and manageable.
- Payment webhooks and reconciliation records should partition by `received_at`/`checked_at` earlier due append volume and retention.

AuditEvents:

- Partition from first production migration by `occurred_at` monthly.
- Legal hold and retention workers operate partition-aware.

AnalyticsEvents:

- Partition from first production migration by `occurred_at` monthly or weekly depending volume.
- Retention purges entire partitions when possible.

NotificationDeliveries:

- Partition by `created_at` once volume grows; index retry queue across hot partitions.

SecurityEvents:

- Partition from first production migration by `occurred_at` monthly due retention and investigation workloads.

### 20.3 When and How

When:

- Tables exceed operational query/index maintenance thresholds.
- Retention requires efficient purge/archive.
- Append volume creates vacuum/index bloat risk.

How:

- Define partition key in initial table design for known high-volume tables.
- Automate future partition creation.
- Ensure unique constraints include partition key where PostgreSQL requires.
- Test RLS and query plans against partitions.

---

## 21. Realtime Strategy

### 21.1 Realtime Principles

- Realtime is a scoped projection mechanism, not the source of truth.
- Publish only tables/projections safe for subscribers.
- Use branch/tenant-specific channels.
- Avoid high-churn raw internal tables in realtime publications.
- Reconnect clients must refetch canonical state.

### 21.2 Tables That May Publish Realtime

Allowed with RLS/projection safeguards:

- `orders` safe status fields or order status projection.
- `kitchen_tickets` branch queue projection.
- `kitchen_ticket_items` if needed for station views.
- `delivery_assignments` safe status projection.
- `branch_status` or branch operational projection.
- `menu_item_branch_overrides` for availability changes.
- `notification preference/status` only for own customer context if needed.

### 21.3 Tables That Must Not Publish Realtime Directly

- Payment provider payloads.
- Payment webhooks.
- Raw audit events.
- Security events.
- Support private notes.
- User private profiles.
- Outbox events.
- Idempotency keys.
- Raw analytics events.
- Provider secrets or integration state.

### 21.4 Channel Segmentation

Channel patterns:

- `tenant:<organization_id>:branch:<branch_id>:orders`
- `tenant:<organization_id>:branch:<branch_id>:kitchen`
- `tenant:<organization_id>:branch:<branch_id>:delivery`
- `tenant:<organization_id>:customer:<user_id>:orders`
- `tenant:<organization_id>:branch:<branch_id>:catalog-availability`

Performance protection:

- Limit payload columns through projections where possible.
- Use branch-scoped filters.
- Rate-limit high-churn updates.
- Use polling fallback for dashboards during realtime degradation.

---

## 22. Supabase Storage Strategy

### 22.1 Bucket Strategy

| Bucket | Purpose | Access |
| --- | --- | --- |
| `public-brand-assets` | Logos, public brand images, public marketing assets. | Public read, admin write. |
| `public-menu-media` | Menu item/category/combo images. | Public read, catalog/admin write. |
| `private-customer-uploads` | Customer support attachments or private uploads. | Owner/support scoped read. |
| `private-delivery-proofs` | Delivery proof images/signatures. | Branch/support/admin scoped read; no public read. |
| `private-audit-artifacts` | Audit exports, evidence bundles, incident artifacts. | Audit/security only; access audited. |
| `private-admin-media` | Draft menu/promotion/admin uploads before publication. | Admin scoped. |

### 22.2 Storage Metadata

Use database metadata rows for:

- Organization/branch/brand ownership.
- Entity references.
- Retention class.
- Uploaded by.
- Checksum/hash.
- Content type.
- Moderation/status.
- Audit access requirements.

### 22.3 Access Rules

- Storage object paths include organization and entity scope.
- Public buckets only contain assets approved for public exposure.
- Private bucket reads use signed URLs or Supabase storage policies with RLS-backed metadata.
- Delivery proofs and audit artifacts access is audited.
- Deleting storage objects follows retention and legal hold policy.

---

## 23. Database Governance

### 23.1 Migration Naming

Format:

```text
YYYYMMDDHHMMSS_<action>_<schema_or_domain>_<object>.sql
```

Examples:

- `20260601090000_create_app_schemas.sql`
- `20260601100000_create_identity_profiles.sql`
- `20260601110000_create_audit_events.sql`

### 23.2 Schema Evolution

Rules:

- Use expand-contract migrations.
- Add nullable columns before backfill and enforcement.
- Backfills are batched and observable.
- Destructive changes require ADR, backup/restore plan, and rollback/repair plan.
- Public contract changes require compatibility window.

### 23.3 Deprecation Strategy

- Mark deprecated columns/tables in comments and docs.
- Stop writes first.
- Migrate readers.
- Backfill replacement.
- Validate no remaining consumers.
- Drop only after approved removal window.

### 23.4 Database ADR Requirements

ADR required for:

- New schema.
- New high-volume partitioned table.
- RLS helper semantic change.
- Service-role access pattern.
- Financial/audit table design change.
- Breaking contract/event storage change.
- Analytics retention change.
- Cross-tenant reporting design.

---

## 24. Backup and Recovery

### 24.1 Backup Policy

- Use Supabase-managed backups appropriate to production tier.
- Enable PITR for production when available/required.
- Validate backups with scheduled restore drills.
- Store migration history and release metadata separately from database.
- Storage bucket backup/export strategy must cover private proofs and audit artifacts.

### 24.2 PITR Strategy

- Define RPO/RTO by launch readiness.
- PITR recovery must validate RLS, roles/grants, extensions, partitions, policies, and indexes.
- Payment/audit/event consistency must be checked after restore.

### 24.3 Recovery Procedures

Recovery order:

1. Freeze writes if corruption/integrity incident requires it.
2. Identify recovery point.
3. Restore database to isolated environment.
4. Validate schema, RLS, partitions, and critical counts.
5. Validate orders/payments/audit/outbox consistency.
6. Replay or reconcile events/webhooks after recovery point.
7. Promote recovered environment or repair production through audited forward fixes.

### 24.4 Replay Procedures

- Outbox events replay from durable event table.
- Payment webhooks replay from provider or webhook table with idempotency.
- Notification replay requires suppression/idempotency checks.
- Audit events are not casually replayed; corrections require linked compliance events.

### 24.5 Audit Preservation

- Audit schema backup and restore are mandatory.
- Audit records must not be truncated for operational convenience.
- Legal holds survive restore and migration.
- Audit access during recovery is logged when systems are available, or recorded manually and backfilled as compliance event.

---

## 25. Database Implementation Order

### Phase 1 — Schemas and Extensions

Build:

- Required schemas: `app_public`, `app_private`, `app_internal`, `analytics`, `audit`, optional `storage_meta`.
- Approved extensions.
- Base grants and role posture.
- Migration comments and ownership markers.

Validate:

- Schemas exist with no unsafe public grants.
- Migration pipeline can apply, reset, and diff safely.

### Phase 2 — Shared Kernel Database Foundation

Build:

- Supported currencies.
- Standard timestamp/audit metadata conventions.
- Tenant/branch context conventions.
- Address, business hours, geo area storage patterns.

Validate:

- Money uses minor units and currency codes everywhere.
- Tenant/branch columns and naming conventions are finalized.

### Phase 3 — Identity and Access Foundation

Build:

- Profiles.
- Private profiles.
- Roles.
- Permissions.
- Role permissions.
- User roles/memberships.
- Session metadata where needed.
- Access review foundation.

Validate:

- Supabase Auth mapping works.
- RLS helper functions can determine user, organization, branch, role, and support scope.
- Permission changes are auditable.

### Phase 4 — Tenant and Branch Foundation

Build:

- Organizations.
- Brands.
- Branches.
- Branch settings.
- Branch hours/exceptions.
- Branch delivery zones.
- Branch operational settings.

Validate:

- Tenant/branch ownership constraints.
- Cross-tenant denial tests.
- Public branch/menu-safe read path separation.

### Phase 5 — Audit and Event Foundation

Build:

- Audit events.
- Security events.
- Compliance events.
- Audit access logs.
- Retention policies and legal holds.
- Outbox events.
- Event catalog.
- Event consumers.
- Idempotency keys.
- Replay operations.

Validate:

- Audit immutability.
- Outbox idempotency and worker claiming.
- Retention partition strategy.
- Audit reads are audited.

### Phase 6 — Catalog and Menu

Build:

- Categories.
- Menu items.
- Modifier groups.
- Modifiers.
- Menu item modifier relations.
- Combos and combo items.
- Images/asset metadata.
- Availability rules.
- Branch overrides.

Validate:

- Public active catalog views.
- Branch overrides.
- Price/availability changes audited.
- Search and menu query indexes.

### Phase 7 — Cart and Checkout

Build:

- Carts.
- Cart items.
- Cart modifiers.
- Checkout sessions.

Validate:

- Customer/anonymous cart RLS.
- Expiration cleanup.
- Idempotent checkout session creation.

### Phase 8 — Orders

Build:

- Orders.
- Order items.
- Order modifiers.
- Order status history.
- Order events/projections.

Validate:

- Immutable financial snapshots.
- Customer and branch RLS.
- Realtime-safe order projections.
- Status transitions audited.

### Phase 9 — Payments and Refunds

Build:

- Payments.
- Payment attempts.
- Payment webhooks.
- Refunds.
- Payment reconciliations.

Validate:

- Mercado Pago idempotency.
- Webhook dedupe.
- Financial audit records.
- Reconciliation workflow.

### Phase 10 — Promotions and Loyalty

Build:

- Promotions.
- Promotion rules.
- Coupons.
- Coupon redemptions.
- Loyalty accounts.
- Loyalty ledger.
- Rewards.

Validate:

- Append-only ledger.
- Redemption uniqueness/fraud controls.
- Replay-safe ledger operations.

### Phase 11 — Kitchen Operations

Build:

- Kitchen stations.
- Kitchen tickets.
- Kitchen ticket items.
- Kitchen assignments.
- Kitchen events.

Validate:

- Branch queue performance.
- Realtime channel isolation.
- Operational override audit.

### Phase 12 — Delivery

Build:

- Drivers.
- Delivery assignments.
- Delivery events.
- Delivery proofs.
- Delivery zone integration.

Validate:

- Reassignment auditability.
- Customer-safe tracking projections.
- Proof storage policies.

### Phase 13 — Notifications

Build:

- Notification templates.
- Notification events.
- Notification deliveries.
- Notification preferences.

Validate:

- WhatsApp/email provider-neutral delivery model.
- Retry indexes.
- Consent/suppression rules.

### Phase 14 — Support

Build:

- Support cases.
- Support interactions.
- Support actions.

Validate:

- Support access scopes.
- Retention/redaction.
- Support actions audited.

### Phase 15 — Analytics

Build:

- Analytics events.
- Operational metrics.
- Business metrics.
- Initial aggregate views.

Validate:

- OLTP/OLAP separation.
- Privacy classification.
- Partition pruning.

### Phase 16 — Realtime and Storage Policies

Build:

- Realtime publications for approved projections.
- Storage buckets.
- Storage metadata.
- Storage RLS/policies.

Validate:

- Tenant and branch channel isolation.
- Private bucket access controls.
- Delivery proof/audit artifact access logging.

### Phase 17 — Production Readiness

Build:

- Full RLS regression suite.
- Load tests for orders, outbox, audit, kitchen, analytics ingestion.
- Partition maintenance jobs.
- Backup/restore drill.
- Migration rollback/repair playbooks.
- Database runbooks.

Validate:

- Cross-tenant and cross-branch isolation.
- Financial reconciliation after test restore.
- Audit preservation.
- Realtime degradation fallback.
- Production release checklist.


## Appendix A. Required Logical Table Name Mapping

The user-facing logical table names below are canonical architecture terms. Physical PostgreSQL names use snake_case in the schema sections, but migrations must preserve this mapping in table comments and documentation.

| Logical Name | Physical Table / Area |
| --- | --- |
| Users | Supabase `auth.users` plus `app_public.profiles` and `app_private.user_private_profiles`. |
| Profiles | `app_public.profiles`. |
| Roles | `app_private.roles`. |
| Permissions | `app_private.permissions`. |
| RolePermissions | `app_private.role_permissions`. |
| UserRoles | `app_private.user_roles`. |
| Sessions | `app_private.sessions`. |
| AccessReviews | `audit.access_reviews`. |
| Organizations | `app_public.organizations`. |
| Branches | `app_public.branches`. |
| BranchSettings | `app_private.branch_settings`. |
| BranchHours | `app_public.branch_hours` and `app_public.branch_hour_exceptions`. |
| BranchDeliveryZones | `app_public.branch_delivery_zones`. |
| BranchOperationalSettings | `app_private.branch_operational_settings`. |
| Categories | `app_public.categories`. |
| MenuItems | `app_public.menu_items`. |
| Modifiers | `app_public.modifiers`. |
| ModifierGroups | `app_public.modifier_groups`. |
| Combos | `app_public.combos`. |
| ComboItems | `app_public.combo_items`. |
| Images | `app_public.images` and `app_private.asset_metadata`. |
| AvailabilityRules | `app_public.availability_rules`. |
| Carts | `app_public.carts`. |
| CartItems | `app_public.cart_items`. |
| CartModifiers | `app_public.cart_modifiers`. |
| CheckoutSessions | `app_private.checkout_sessions`. |
| Orders | `app_public.orders`. |
| OrderItems | `app_public.order_items`. |
| OrderModifiers | `app_public.order_modifiers`. |
| OrderStatusHistory | `app_private.order_status_history`. |
| OrderEvents | `app_internal.order_events`. |
| Payments | `app_private.payments`. |
| PaymentAttempts | `app_private.payment_attempts`. |
| Refunds | `app_private.refunds`. |
| PaymentReconciliations | `app_private.payment_reconciliations`. |
| Coupons | `app_public.coupons`. |
| Promotions | `app_public.promotions`. |
| PromotionRules | `app_private.promotion_rules`. |
| CouponRedemptions | `app_private.coupon_redemptions`. |
| LoyaltyAccounts | `app_private.loyalty_accounts`. |
| LoyaltyLedger | `app_private.loyalty_ledger`. |
| Rewards | `app_public.rewards`. |
| KitchenTickets | `app_public.kitchen_tickets`. |
| KitchenStations | `app_public.kitchen_stations`. |
| KitchenAssignments | `app_private.kitchen_assignments`. |
| KitchenEvents | `app_internal.kitchen_events`. |
| Drivers | `app_private.drivers`. |
| DeliveryAssignments | `app_public.delivery_assignments`. |
| DeliveryEvents | `app_internal.delivery_events`. |
| DeliveryZones | `app_public.branch_delivery_zones` or `app_public.delivery_zones` if operational zones diverge. |
| DeliveryProofs | `app_private.delivery_proofs`. |
| NotificationTemplates | `app_private.notification_templates`. |
| NotificationEvents | `app_internal.notification_events`. |
| NotificationDeliveries | `app_private.notification_deliveries`. |
| NotificationPreferences | `app_public.notification_preferences`. |
| SupportCases | `app_private.support_cases`. |
| SupportInteractions | `app_private.support_interactions`. |
| SupportActions | `app_private.support_actions`. |
| AuditEvents | `audit.audit_events`. |
| AuditLogs | `audit.audit_logs`. |
| SecurityEvents | `audit.security_events`. |
| ComplianceEvents | `audit.compliance_events`. |
| PermissionChanges | `audit.permission_changes`. |
| OperationalOverrides | `audit.operational_overrides`. |
| IncidentRecords | `audit.incident_records`. |
| OutboxEvents | `app_internal.outbox_events`. |
| EventConsumers | `app_internal.event_consumers` and `app_internal.event_consumer_offsets`. |
| ReplayOperations | `app_internal.replay_operations`. |
| AnalyticsEvents | `analytics.analytics_events`. |
| OperationalMetrics | `analytics.operational_metrics`. |
| BusinessMetrics | `analytics.business_metrics`. |

Event Replay, Event Versioning, and Event Idempotency are implemented through `app_internal.replay_operations`, `app_internal.event_catalog`, `app_internal.event_consumer_offsets`, and `app_internal.idempotency_keys` as defined in the event architecture section.

---

## 26. Final Database Rules

1. Every tenant-owned table must have `organization_id` or a documented derivation path.
2. Every branch-operational table must have `branch_id`.
3. Financial truth is immutable snapshot plus append-only history.
4. Audit facts are immutable and privileged reads are audited.
5. Events are persisted before side effects are considered durable.
6. Client access is RLS-controlled and minimized.
7. Service-role access is server-only, narrow, observable, and audited.
8. Realtime publishes safe scoped projections, not raw sensitive tables.
9. Analytics does not mutate operational state.
10. Storage access follows database ownership, retention, and audit rules.
11. Destructive schema changes require ADR, compatibility plan, backup, and rollback/repair plan.
12. No migration may introduce a tenant data table without RLS tests.
