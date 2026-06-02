# J Burguer — Especificación Wave 1 de Migraciones PostgreSQL/Supabase

## 0. Alcance y autoridad

> **SQL implementation plan:** The exact Wave 1 SQL file breakdown is defined in `docs/architecture/wave1-sql-migration-implementation-plan.md`; migration files must follow that sequence.

> **P0 hardening:** Wave 1 migrations must incorporate `docs/architecture/database-hardening-p0-resolution-specification.md` before SQL generation.

> **Architecture Review Board:** This migration specification is challenged by `docs/architecture/database-architecture-review-board-report.md`; P0 findings in that report must be resolved before SQL migration authoring begins.

> **Language policy:** Este documento cumple `docs/architecture/language-standard-business-spanish-technical-english.md`: los conceptos de negocio usan español y los conceptos técnicos permanecen en inglés.

Este documento define el **First Migration Set Specification** para la primera ola de migraciones PostgreSQL/Supabase de J Burguer. No contiene SQL, no genera migrations y no define código ejecutable. Es la fuente de verdad para que ingeniería cree las primeras migrations de forma segura, auditable y consistente.

La Wave 1 establece:

1. Database foundations.
2. Multi-tenant foundations.
3. Identidad foundations.
4. Authorization foundations.
5. Audit foundations.
6. Event foundations.
7. Nucleo compartido foundations.

Principios obligatorios:

- Aislamiento por `organizacion_id` y `sucursal_id` desde la primera tabla de negocio.
- RLS habilitado desde la creación de tablas expuestas o sensibles.
- Auditabilidad de permisos, accesos privilegiados, overrides e incidentes desde el inicio.
- Event consistency mediante `outbox_events`, `event_catalog`, `event_consumers`, `replay_operations` e `idempotency_keys`.
- Forward-only migrations para entornos compartidos y producción.
- Rollback destructivo prohibido si existe dato de negocio, audit o event.

---

## 1. Migration Strategy

### 1.1 Migration Philosophy

La primera ola de migrations debe crear capacidades fundacionales, no features comerciales. El objetivo no es modelar pedidos, pagos o cocina todavía; el objetivo es crear el suelo seguro para que esas migrations posteriores puedan existir sin rediseñar aislamiento, permisos, audit, eventos, idempotency o contexto multi-tenant.

Reglas:

- Cada migration debe ser pequeña, revisable y con owner explícito.
- Cada migration debe tener dependencia clara con la anterior.
- Las migrations deben ser reproducibles en local, staging y production.
- Toda tabla con datos de negocio debe nacer con RLS, indexes mínimos y comentarios de ownership.
- Toda tabla fundacional debe usar nombres de negocio en español y términos técnicos en inglés.
- Ninguna migration Wave 1 debe crear datos de ejemplo de producción.
- Seeds de desarrollo deben vivir separados de migrations estructurales.

### 1.2 Migration Naming Convention

Formato obligatorio:

```text
YYYYMMDDHHMMSS_<orden>_<area>_<accion>_<objeto>.sql
```

Donde:

- `YYYYMMDDHHMMSS`: timestamp UTC generado por la herramienta de migrations.
- `<orden>`: número lógico de wave, por ejemplo `w1_001`.
- `<area>`: área técnica o dominio español: `schemas`, `nucleo`, `identidad`, `organizaciones`, `audit`, `events`, `rls`, `indexes`, `seeds_base`.
- `<accion>`: `create`, `enable`, `seed`, `grant`, `comment`, `prepare`.
- `<objeto>`: objeto principal en español si es negocio, inglés si técnico.

Ejemplos:

```text
20260601090000_w1_001_schemas_create_base.sql
20260601091000_w1_002_extensions_enable_required.sql
20260601093000_w1_010_organizaciones_create_organizaciones.sql
20260601100000_w1_020_identidad_create_roles_permisos.sql
20260601110000_w1_040_audit_create_eventos_audit.sql
20260601113000_w1_050_events_create_outbox_events.sql
20260601120000_w1_070_rls_enable_foundation_policies.sql
```

### 1.3 Migration Folder Strategy

Supabase migration files remain in the technical folder:

```text
supabase/migrations/
```

Planning and domain breakdown live in documentation and optional non-executable folders:

```text
supabase/database/
├── schemas/
├── nucleo-compartido/
├── identidad-acceso/
├── organizaciones-sucursales/
├── audit-compliance/
├── events/
├── rls/
└── indexes/
```

Rules:

- Executable migration files only in `supabase/migrations`.
- Planning fragments may live outside migrations but are not source of execution.
- One migration may create multiple closely related tables only when atomic dependency requires it.
- RLS policies may be in separate migrations after table creation but before any table is exposed.
- Base permission seeds must be deterministic and idempotent.

### 1.4 Forward-Only Strategy

Production and staging are forward-only.

Allowed:

- Add schema/table/column/index/policy.
- Add nullable column before enforcing data.
- Add new role/permission.
- Add replacement policy and then retire old policy.
- Add compatibility view.

Forbidden in production without special recovery plan:

- Dropping tables.
- Dropping columns.
- Rewriting enum values destructively.
- Truncating audit/event tables.
- Removing RLS policy before replacement exists.
- Changing permission semantics without audit trail.

### 1.5 Rollback Strategy

Rollback is logical and forward-repair based.

Safe rollback in local/dev:

- Reset database.
- Re-run migrations.
- Recreate test data.

Safe rollback in staging before shared data:

- Restore staging snapshot.
- Re-run previous migration set.

Production rollback:

- Prefer application rollback plus forward database repair.
- Create corrective migration to restore compatibility.
- Never delete audit/event data to undo a deployment.
- If structural corruption exists, use PITR into isolated environment and compare.

### 1.6 Environment Strategy

#### Development

- Developers can reset local Supabase freely.
- Seeds may create organizaciones, sucursales, perfiles, roles and permisos synthetic data.
- Local service-role secrets are development-only.
- RLS tests must run locally before PR.

#### Staging

- Staging mirrors production schema posture.
- Migrations are applied exactly as production will receive them.
- No destructive reset after shared validation begins.
- Staging must validate RLS, grants, event workers, audit immutability and seed determinism.

#### Production

- Migrations require approval from Database Architecture, Security and Platform owner.
- Maintenance window required for initial foundation deployment if production already exists.
- Migration execution must be observed with logs, metrics and correlation to release.
- Post-migration verification is mandatory before enabling feature development on top.

---

## 2. Database Foundations

### 2.1 Wave 1 Foundation Migrations

| Order | Migration Area | Purpose | Depends On | Owner |
| --- | --- | --- | --- | --- |
| W1-001 | schemas | Create `app_public`, `app_private`, `app_internal`, `audit`, `analytics`. | None | Database Platform |
| W1-002 | extensions | Enable approved PostgreSQL extensions. | W1-001 | Database Platform |
| W1-003 | roles_grants | Establish grants and revoke unsafe defaults. | W1-001 | Security/Database |
| W1-004 | base_functions | Create technical helper functions for timestamps, context and safe checks. | W1-002 | Database Platform |
| W1-005 | base_comments | Add ownership comments and schema documentation. | W1-001 | Governance |

### 2.2 Schemas

| Schema | Purpose | Access posture | Migration ownership |
| --- | --- | --- | --- |
| `app_public` | RLS-protected business tables/views that may be exposed through Supabase client when safe. | No broad anonymous access; RLS required. | Domain owner + Security. |
| `app_private` | Sensitive business state, private identity, permissions and provider-normalized state. | Server-only; RLS defense in depth. | Backend Platform + Security. |
| `app_internal` | Outbox, idempotency, event consumers, replay operations, worker state. | Never direct client access. | Platform/Event Architecture. |
| `audit` | Immutable audit, security and compliance records. | Privileged server-only; reads audited. | Audit/Compliance + Security. |
| `analytics` | Raw/aggregate analytics and metrics. | Restricted Data Platform and approved views. | Data Platform. |

### 2.3 Extensions Required

Approved extensions for Wave 1:

| Extension | Purpose | Required In Wave 1 | Notes |
| --- | --- | --- | --- |
| `pgcrypto` | UUID generation and hashing support. | Yes | Required for secure identifiers/hashes. |
| `citext` | Case-insensitive email/code fields if approved. | Recommended | Useful for correo electrónico normalization; may be replaced by normalized text. |
| `btree_gin` | Composite/index support when needed later. | Optional | Enable only if query plans require it. |
| `pg_stat_statements` | Query observability if available in Supabase tier. | Recommended | Technical observability. |
| PostGIS | Coordenadas/áreas geográficas. | Defer unless approved | Wave 1 can prepare without requiring geometry. |

### 2.4 UUID Strategy

- Primary keys use UUID for all business and internal foundation tables.
- UUIDs are generated database-side for server-created rows and accepted from trusted server commands where idempotency requires deterministic references.
- Business public references such as future `numero_pedido` are not part of Wave 1.
- Do not expose sequential IDs for tenant/business records.

### 2.5 Timestamp Strategy

Technical timestamps remain in English:

- `created_at`
- `updated_at`
- `deleted_at`
- `recorded_at`
- `occurred_at`
- `processed_at`
- `expires_at` for technical TTL

Business-specific timestamp columns use Spanish concept plus `_at` when appropriate:

- `aprobado_at`
- `revocado_at`
- `completado_at`
- `detectado_at`

Wave 1 minimum:

- Every mutable table has `created_at` and `updated_at`.
- Soft-deletable business tables have `deleted_at`.
- Audit/event tables have immutable `occurred_at` and recording timestamp.

### 2.6 Soft-Delete Strategy

- Business configuration tables use `deleted_at` for soft-delete.
- Audit and event tables are never soft-deleted by business workflows.
- Role/permission assignments use status and revocation fields, not deletion.
- Foundational reference rows should be deactivated instead of deleted.

### 2.7 Ownership Strategy

Each migration must include owner metadata in PR description and database comments:

| Area | Owner |
| --- | --- |
| Schemas/extensions/grants | Database Platform + Security |
| Nucleo compartido conventions | Architecture Council |
| Identidad/acceso | Security Platform |
| Organizaciones/sucursales | Platform/Tenant Team |
| Audit/compliance | Audit/Compliance + Security |
| Events/outbox | Event Architecture + Platform |
| Analytics foundations | Data Platform |

---

## 3. Shared Kernel Foundations

### 3.1 Classification of Shared Concepts

| Concepto | Implementación Wave 1 | Rationale |
| --- | --- | --- |
| Dinero | Value object column group, optional `monedas_soportadas` table. | Dinero appears in later commerce tables; Wave 1 defines convention. |
| Direccion | Composite column group; reusable tables later. | Organizaciones/sucursales need address-like fields. |
| Telefono | Normalized text column + validation convention. | Used in perfiles/sucursales; no table. |
| CorreoElectronico | Normalized text column + optional `citext`. | Supabase auth owns primary email; private profile may store normalized copy. |
| Coordenadas | `latitud`, `longitud` numeric columns; PostGIS deferred. | Enough for sucursal/geography preparation. |
| HorarioComercial | Tables `horarios_sucursal`, `excepciones_horario_sucursal`. | Requires lifecycle, query and branch-specific rules. |
| ContextoOrganizacion | Mandatory `organizacion_id` columns + RLS helper semantics. | Core tenant isolation. |
| ContextoSucursal | Mandatory `sucursal_id` for branch-scoped tables + RLS helper semantics. | Core branch isolation. |

### 3.2 Dinero

Wave 1 creates convention, not commerce tables.

Column group:

- `<concepto>_monto_minor` for integer minor units.
- `codigo_moneda` for ISO currency code.

Optional foundation table: `app_public.monedas_soportadas`.

Purpose:

- Define allowed currencies, decimals and active status.
- Seed `ARS` as initial production currency if approved.

Constraints:

- `codigo_moneda` uppercase.
- `decimales` non-negative.
- Money amounts never use floating point.

### 3.3 Direccion

Value object column group:

- `direccion_linea_1`
- `direccion_linea_2`
- `barrio`
- `ciudad`
- `provincia`
- `codigo_postal`
- `codigo_pais`
- `referencia_direccion`
- `latitud`
- `longitud`

Wave 1 uses these on `sucursales`. Customer address tables come later.

### 3.4 Telefono and CorreoElectronico

Column conventions:

- `telefono` stores normalized E.164-like text when available.
- `correo_electronico_normalizado` stores lowercased normalized email copy where needed.
- Primary authentication email remains in Supabase `auth.users`.

Constraints:

- No raw provider contact payloads in public tables.
- Private contact fields live in `app_private` unless public business display requires them.

### 3.5 Coordenadas

Column conventions:

- `latitud` numeric nullable.
- `longitud` numeric nullable.
- Validate allowed ranges.
- Add coordinate index only when query patterns require.

### 3.6 HorarioComercial

Tables:

- `app_public.horarios_sucursal`.
- `app_public.excepciones_horario_sucursal`.

Rules:

- Timezone belongs to `sucursales`.
- Day-of-week and service type must be constrained.
- Exception rows override regular hours.

### 3.7 ContextoOrganizacion and ContextoSucursal

Wave 1 must establish:

- Consistent FK pattern for `organizacion_id`.
- Consistent FK pattern for `sucursal_id`.
- Helper functions for membership/permission checks.
- Index conventions for tenant and branch predicates.

---

## 4. Identidad y Acceso Migration Specification

### 4.1 Migration Order

| Order | Migration | Tables |
| --- | --- | --- |
| W1-020 | identidad_create_perfiles | `perfiles`, `perfiles_privados_usuario` |
| W1-021 | identidad_create_roles_permisos | `roles`, `permisos`, `permisos_rol` |
| W1-022 | identidad_create_roles_usuario | `roles_usuario` |
| W1-023 | identidad_create_sesiones | `sesiones` |
| W1-024 | identidad_prepare_revisiones_acceso | `revisiones_acceso` |
| W1-025 | identidad_seed_roles_permisos_base | base roles and permissions |

### 4.2 `app_public.perfiles`

Purpose:

- Public-safe profile for Supabase auth users.

Columns:

- `id` UUID PK referencing `auth.users.id`.
- `nombre_mostrar` text nullable.
- `avatar_asset_id` UUID nullable.
- `organizacion_default_id` UUID nullable.
- `sucursal_default_id` UUID nullable.
- `locale` text.
- `timezone` text.
- `created_at`, `updated_at`, `deleted_at`.

Constraints:

- `id` references Supabase auth user.
- Default sucursal must belong to default organizacion when both exist.

Indexes:

- PK `id`.
- `organizacion_default_id`.
- `sucursal_default_id`.

RLS implications:

- User can read/update limited own profile.
- Admin scoped reads later depend on membership.

### 4.3 `app_private.perfiles_privados_usuario`

Purpose:

- Private identity/contact/risk metadata not exposed directly.

Columns:

- `usuario_id` UUID PK referencing `auth.users.id`.
- `nombre_legal` text nullable.
- `telefono` text nullable.
- `correo_electronico_normalizado` text nullable.
- `estado_riesgo` text.
- `estado_privacidad` text.
- `estado_consentimiento_marketing` text.
- `metadata` jsonb.
- `created_at`, `updated_at`.

Constraints:

- Valid known privacy/risk statuses.
- Optional unique normalized email if used outside auth.

Indexes:

- PK `usuario_id`.
- `correo_electronico_normalizado` where not null.
- `telefono` where not null.

RLS implications:

- No direct client access.
- Support/admin reads require permission and audit.

### 4.4 `app_private.roles`

Purpose:

- Role definitions for RBAC.

Columns:

- `id` UUID PK.
- `organizacion_id` UUID nullable.
- `codigo` text.
- `nombre` text.
- `descripcion` text nullable.
- `tipo_scope` text: `platform`, `organizacion`, `sucursal`, `soporte`.
- `es_sistema` boolean.
- `estado` text.
- `created_at`, `updated_at`, `deleted_at`.

Constraints:

- Unique system `codigo` when `organizacion_id` is null.
- Unique `(organizacion_id, codigo)` for custom tenant roles.
- `tipo_scope` constrained.

Indexes:

- `(organizacion_id, codigo)`.
- `(tipo_scope, estado)`.
- Partial active role index.

RLS implications:

- Read only for authorized admins/security.
- Mutations audited.

### 4.5 `app_private.permisos`

Purpose:

- Permission catalog.

Columns:

- `id` UUID PK.
- `codigo` text unique.
- `dominio` text.
- `recurso` text.
- `accion` text.
- `tipo_scope` text.
- `nivel_riesgo` text.
- `descripcion` text.
- `created_at`, `deprecated_at`.

Constraints:

- Unique `codigo`.
- Risk level constrained: `bajo`, `operativo`, `financiero`, `privacidad`, `seguridad`, `compliance`.

Indexes:

- Unique `codigo`.
- `(dominio, recurso, accion)`.
- `(nivel_riesgo)`.

RLS implications:

- Read through safe admin views.
- Mutations platform-only.

### 4.6 `app_private.permisos_rol`

Purpose:

- Many-to-many relation between roles and permisos.

Columns:

- `rol_id` UUID.
- `permiso_id` UUID.
- `created_at`.
- `created_by` UUID nullable.

Constraints:

- PK `(rol_id, permiso_id)`.
- FK to `roles` and `permisos`.

Indexes:

- PK.
- `(permiso_id, rol_id)`.

RLS implications:

- Mutations audited as permission changes.

### 4.7 `app_private.roles_usuario`

Purpose:

- Scoped role assignments for usuarios.

Columns:

- `id` UUID PK.
- `usuario_id` UUID referencing `auth.users.id`.
- `rol_id` UUID.
- `organizacion_id` UUID nullable.
- `sucursal_id` UUID nullable.
- `tipo_scope` text.
- `estado` text.
- `inicia_at` nullable.
- `expira_at` nullable.
- `asignado_por` UUID nullable.
- `motivo_asignacion` text nullable.
- `created_at`, `revocado_at`, `revocado_por`.

Constraints:

- `sucursal_id` requires `organizacion_id`.
- Active assignment uniqueness for same usuario/rol/scope.
- Expiration after start when both exist.

Indexes:

- `(usuario_id, organizacion_id, sucursal_id, estado)`.
- `(organizacion_id, sucursal_id, rol_id, estado)`.
- `(expira_at)`.
- Partial active assignment unique index.

RLS implications:

- User may read limited own role assignments.
- Admin can read/manage in scope.
- Changes create audit records.

### 4.8 `app_private.sesiones`

Purpose:

- App session metadata complementing Supabase auth.

Columns:

- `id` UUID PK.
- `usuario_id` UUID.
- `auth_session_id` text nullable.
- `organizacion_activa_id` UUID nullable.
- `sucursal_activa_id` UUID nullable.
- `tipo_actor` text.
- `ip_hash` text nullable.
- `user_agent_hash` text nullable.
- `created_at`, `last_seen_at`, `expires_at`, `revocada_at`.

Constraints:

- Active sucursal must belong to active organizacion.
- Actor type constrained.

Indexes:

- `(usuario_id, last_seen_at desc)`.
- `(expires_at)`.
- `(organizacion_activa_id, sucursal_activa_id)`.

RLS implications:

- Own session read.
- Security reads audited.

### 4.9 `audit.revisiones_acceso`

Purpose:

- Compliance records for access reviews.

Columns:

- `id` UUID PK.
- `organizacion_id` UUID nullable.
- `sucursal_id` UUID nullable.
- `tipo_revision` text.
- `usuario_sujeto_id` UUID.
- `usuario_revisor_id` UUID nullable.
- `estado` text.
- `resumen_scope` jsonb.
- `hallazgos` jsonb.
- `abierta_at`, `vence_at`, `completada_at`.
- `created_by`, `created_at`.

Constraints:

- Review status constrained.
- Due date required for periodic reviews.

Indexes:

- `(organizacion_id, estado, vence_at)`.
- `(usuario_sujeto_id, abierta_at desc)`.
- `(tipo_revision, estado)`.

RLS implications:

- Audit/security only.
- Reads are audited.

---

## 5. Organizaciones y Sucursales Migration Specification

### 5.1 Migration Order

| Order | Migration | Tables |
| --- | --- | --- |
| W1-010 | organizaciones_create_organizaciones | `organizaciones` |
| W1-011 | organizaciones_create_marcas | `marcas` |
| W1-012 | organizaciones_create_sucursales | `sucursales` |
| W1-013 | organizaciones_create_configuracion | `configuracion_sucursal`, `configuracion_operativa_sucursal` |
| W1-014 | organizaciones_create_horarios | `horarios_sucursal`, `excepciones_horario_sucursal` |
| W1-015 | organizaciones_create_zonas_entrega | `zonas_entrega_sucursal` |

### 5.2 `app_public.organizaciones`

Purpose:

- Top-level business tenant.

Columns:

- `id` UUID PK.
- `nombre` text.
- `nombre_legal` text nullable.
- `slug` text.
- `tipo_organizacion` text.
- `organizacion_padre_id` UUID nullable.
- `estado` text.
- `codigo_moneda_default` text.
- `timezone_default` text.
- `created_at`, `updated_at`, `deleted_at`.

Relationships:

- Self-reference for future franchise hierarchy.

Constraints:

- Unique active `slug`.
- Valid `tipo_organizacion`: `empresa`, `franquicia`, `franquiciado`, `plataforma`.
- Prevent self-parent.

Indexes:

- Unique `slug` active.
- `(organizacion_padre_id)`.
- `(estado)`.

Future franchise support:

- Parent organization allows franchise tree.
- Use hierarchy helpers later; do not allow cross-tenant reads by default.

### 5.3 `app_public.marcas`

Purpose:

- Business brand identity under organization.

Columns:

- `id` UUID PK.
- `organizacion_id` UUID.
- `nombre` text.
- `slug` text.
- `estado` text.
- `theme_key` text.
- `asset_root_path` text nullable.
- `created_at`, `updated_at`, `deleted_at`.

Constraints:

- FK organization.
- Unique `(organizacion_id, slug)` active.

Indexes:

- `(organizacion_id, estado)`.
- Unique active slug.

### 5.4 `app_public.sucursales`

Purpose:

- Physical and operational branch.

Columns:

- `id` UUID PK.
- `organizacion_id` UUID.
- `marca_id` UUID nullable.
- `nombre` text.
- `slug` text.
- `estado` text.
- `estado_operativo` text.
- Direccion column group.
- `latitud`, `longitud` nullable.
- `timezone` text.
- `telefono` text nullable.
- `created_at`, `updated_at`, `deleted_at`.

Constraints:

- FK organization.
- FK brand must belong to same organization.
- Unique `(organizacion_id, slug)` active.
- Valid coordinates ranges.

Indexes:

- `(organizacion_id, estado)`.
- `(organizacion_id, estado_operativo)`.
- `(marca_id)`.
- Unique active slug.

### 5.5 `app_private.configuracion_sucursal`

Purpose:

- Business configuration for ordering/fulfillment.

Columns:

- `sucursal_id` UUID PK.
- `organizacion_id` UUID.
- `acepta_retiro` boolean.
- `acepta_entrega` boolean.
- `acepta_pedidos_programados` boolean.
- `minimo_pedido_monto_minor` integer.
- `codigo_moneda` text.
- `estimacion_preparacion_minutos` integer.
- `settings` jsonb.
- `created_at`, `updated_at`.

Constraints:

- FK sucursal.
- Organization consistency.
- Non-negative money/minutes.

Indexes:

- PK `sucursal_id`.
- `(organizacion_id)`.

### 5.6 `app_public.horarios_sucursal`

Purpose:

- Regular business hours by service type.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id`.
- `dia_semana` smallint.
- `abre_at` time.
- `cierra_at` time.
- `tipo_servicio` text.
- `vigente_desde` date nullable.
- `vigente_hasta` date nullable.
- `activo` boolean.
- `created_at`, `updated_at`.

Constraints:

- `dia_semana` 0-6.
- `tipo_servicio` constrained: `retiro`, `entrega`, `operaciones`.
- Time range valid.

Indexes:

- `(sucursal_id, tipo_servicio, dia_semana, activo)`.
- `(organizacion_id, sucursal_id)`.

### 5.7 `app_public.excepciones_horario_sucursal`

Purpose:

- Date-specific overrides for business hours.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id`.
- `fecha_excepcion` date.
- `tipo_servicio` text.
- `cerrado` boolean.
- `abre_at`, `cierra_at` nullable.
- `motivo` text nullable.
- `created_at`, `updated_at`.

Constraints:

- Unique `(sucursal_id, tipo_servicio, fecha_excepcion)`.
- If closed, times may be null.

Indexes:

- Unique exception lookup.
- `(organizacion_id, fecha_excepcion)`.

### 5.8 `app_private.configuracion_operativa_sucursal`

Purpose:

- Operations capacity and override settings.

Columns:

- `sucursal_id` UUID PK.
- `organizacion_id` UUID.
- `max_pedidos_activos` integer.
- `modo_capacidad_cocina` text.
- `modo_capacidad_entrega` text.
- `requiere_motivo_pausa` boolean.
- `override_requiere_motivo` boolean.
- `settings` jsonb.
- `updated_at`, `updated_by`.

Indexes:

- PK.
- `(organizacion_id)`.

### 5.9 `app_public.zonas_entrega_sucursal`

Purpose:

- Branch delivery zones.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id`.
- `nombre` text.
- `estado` text.
- `tipo_area_geografica` text.
- `area_geografica` jsonb.
- `cargo_entrega_monto_minor` integer.
- `codigo_moneda` text.
- `minimo_pedido_monto_minor` integer.
- `estimacion_entrega_minutos` integer.
- `prioridad` integer.
- `created_at`, `updated_at`, `deleted_at`.

Constraints:

- Organization consistency.
- Money and minutes non-negative.
- Geo area required for active zone.

Indexes:

- `(sucursal_id, estado, prioridad)`.
- `(organizacion_id, sucursal_id)`.

---

## 6. Audit Foundation

### 6.1 Migration Order

| Order | Migration | Tables |
| --- | --- | --- |
| W1-040 | audit_create_core | `eventos_audit`, `logs_audit` |
| W1-041 | audit_create_security_compliance | `eventos_seguridad`, `eventos_compliance` |
| W1-042 | audit_create_review_records | `cambios_permisos`, `overrides_operativos`, `registros_incidente` |
| W1-043 | audit_prepare_retention | retention fields, partition conventions, indexes |
| W1-044 | audit_enable_immutability_guards | immutability guard strategy |

### 6.2 `audit.eventos_audit`

Purpose:

- Immutable normalized audit facts.

Columns:

- `id` UUID PK.
- `event_name` text.
- `event_version` integer.
- `organizacion_id` UUID nullable.
- `sucursal_id` UUID nullable.
- `tipo_actor` text.
- `actor_id` UUID nullable.
- `accion` text.
- `categoria_riesgo` text.
- `tipo_entidad` text.
- `entidad_id` UUID nullable.
- `resumen_antes` jsonb nullable.
- `resumen_despues` jsonb nullable.
- `motivo` text nullable.
- `source_event_id` UUID nullable.
- `correlation_id` UUID.
- `causation_id` UUID nullable.
- `occurred_at`, `recorded_at`.
- `clase_retencion` text.
- `legal_hold` boolean.

Constraints:

- Risk category constrained.
- Retention class required.
- Audit event payload must be redacted/safe.

Indexes:

- `(organizacion_id, occurred_at desc)`.
- `(organizacion_id, sucursal_id, occurred_at desc)`.
- `(tipo_actor, actor_id, occurred_at desc)`.
- `(tipo_entidad, entidad_id, occurred_at desc)`.
- `(correlation_id)`.
- `(categoria_riesgo, occurred_at desc)`.
- `(clase_retencion, occurred_at)`.

Immutability:

- Append-only.
- Updates forbidden except controlled retention/legal hold technical fields.
- Deletes only by retention worker after legal hold checks.

Partitioning preparation:

- Design as time-partition-ready by `occurred_at`.
- Production may create monthly partitioned table from first migration if operationally approved.

### 6.3 `audit.logs_audit`

Purpose:

- Query projection of audit events for privileged review.

Columns:

- `id` UUID PK.
- `evento_audit_id` UUID.
- `organizacion_id`, `sucursal_id` nullable.
- `resumen_mostrar` text.
- `tipo_entidad`, `entidad_id`.
- `tipo_actor`, `actor_id`.
- `categoria_riesgo`.
- `created_at`.

Indexes:

- `(evento_audit_id)`.
- `(organizacion_id, created_at desc)`.
- `(tipo_entidad, entidad_id, created_at desc)`.

Retention:

- Rebuildable from audit events.
- Retention aligned with source event.

### 6.4 `audit.eventos_seguridad`

Purpose:

- Security-sensitive records.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id` nullable.
- `tipo_evento_seguridad` text.
- `severidad` text.
- `usuario_id` UUID nullable.
- `ip_hash` text nullable.
- `user_agent_hash` text nullable.
- `recurso` text nullable.
- `decision` text.
- `codigo_motivo` text nullable.
- `occurred_at`.
- `clase_retencion`.

Indexes:

- `(severidad, occurred_at desc)`.
- `(usuario_id, occurred_at desc)`.
- `(organizacion_id, occurred_at desc)`.

Retention:

- Minimum 7 years for privileged/security events.

### 6.5 `audit.eventos_compliance`

Purpose:

- Compliance policy decisions and evidence.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id` nullable.
- `tipo_evento_compliance` text.
- `politica_id` UUID nullable.
- `tipo_sujeto` text.
- `sujeto_id` UUID nullable.
- `decision` text.
- `evidencia` jsonb.
- `occurred_at`, `recorded_at`.

Indexes:

- `(tipo_evento_compliance, occurred_at desc)`.
- `(politica_id)`.
- `(tipo_sujeto, sujeto_id)`.

### 6.6 `audit.cambios_permisos`

Purpose:

- Before/after records for RBAC changes.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id` nullable.
- `usuario_sujeto_id` UUID.
- `rol_id` UUID nullable.
- `codigo_permiso` text nullable.
- `tipo_cambio` text.
- `estado_antes` jsonb.
- `estado_despues` jsonb.
- `cambiado_por` UUID.
- `motivo` text.
- `occurred_at`.

Indexes:

- `(usuario_sujeto_id, occurred_at desc)`.
- `(cambiado_por, occurred_at desc)`.
- `(organizacion_id, occurred_at desc)`.

### 6.7 `audit.overrides_operativos`

Purpose:

- Manual operational overrides.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id`.
- `tipo_override` text.
- `tipo_objetivo` text.
- `objetivo_id` UUID nullable.
- `estado_antes` jsonb.
- `estado_despues` jsonb.
- `motivo` text.
- `ejecutado_por` UUID.
- `aprobado_por` UUID nullable.
- `occurred_at`.

Indexes:

- `(sucursal_id, occurred_at desc)`.
- `(tipo_objetivo, objetivo_id)`.
- `(ejecutado_por, occurred_at desc)`.

### 6.8 `audit.registros_incidente`

Purpose:

- Incident record foundation.

Columns:

- `id` UUID PK.
- `organizacion_id`, `sucursal_id` nullable.
- `tipo_incidente` text.
- `severidad` text.
- `estado` text.
- `resumen` text.
- `detectado_at`, `reconocido_at`, `resuelto_at` nullable.
- `equipo_owner` text.
- `postmortem_url` text nullable.
- `resumen_impacto` text nullable.
- `created_at`, `updated_at`.

Indexes:

- `(severidad, estado, detectado_at desc)`.
- `(organizacion_id, sucursal_id, detectado_at desc)`.

---

## 7. Event Foundation

### 7.1 Migration Order

| Order | Migration | Tables |
| --- | --- | --- |
| W1-050 | events_create_event_catalog | `event_catalog` |
| W1-051 | events_create_outbox_events | `outbox_events` |
| W1-052 | events_create_consumers | `event_consumers`, `event_consumer_offsets` |
| W1-053 | events_create_replay_operations | `replay_operations` |
| W1-054 | events_create_idempotency_keys | `idempotency_keys` |

### 7.2 `app_internal.event_catalog`

Purpose:

- Technical catalog of event definitions and schema versions.

Columns:

- `event_name` text.
- `major_version` integer.
- `owner_domain` text.
- `schema_hash` text.
- `classification` text.
- `clase_retencion` text.
- `status` text.
- `introduced_at`, `deprecated_at` nullable.
- `description` text.

Constraints:

- PK `(event_name, major_version)`.
- Version positive.
- Status constrained.

Indexes:

- `(owner_domain, status)`.

Versioning:

- Breaking business payload changes require new major version.
- Historical event meaning is immutable.

### 7.3 `app_internal.outbox_events`

Purpose:

- Durable outbox for event publication.

Columns:

- `id` UUID PK.
- `event_name` text.
- `event_version` integer.
- `aggregate_type` text.
- `aggregate_id` UUID.
- `organizacion_id`, `sucursal_id` nullable.
- `payload` jsonb.
- `metadata` jsonb.
- `correlation_id`, `causation_id` nullable.
- `tipo_actor`, `actor_id` nullable.
- `status` text.
- `available_at`, `published_at` nullable.
- `attempt_count` integer.
- `last_error` text nullable.
- `schema_hash` text.
- `clase_retencion` text.
- `created_at`.

Constraints:

- Event name/version must exist in catalog when enforceable.
- Attempt count non-negative.
- Status constrained.

Indexes:

- `(status, available_at, created_at)`.
- `(aggregate_type, aggregate_id, created_at)`.
- `(organizacion_id, sucursal_id, created_at desc)`.
- `(event_name, created_at desc)`.
- `(correlation_id)`.

Ownership:

- Event Architecture owns table.
- Domain owners own event payload semantics.

### 7.4 `app_internal.event_consumers`

Purpose:

- Registered consumers.

Columns:

- `id` UUID PK.
- `consumer_name` text unique.
- `owner_team` text.
- `status` text.
- `max_retry_count` integer.
- `created_at`, `updated_at`.

Indexes:

- Unique `consumer_name`.
- `(status)`.

### 7.5 `app_internal.event_consumer_offsets`

Purpose:

- Consumer processing state.

Columns:

- `consumer_id` UUID.
- `event_id` UUID.
- `status` text.
- `processed_at` nullable.
- `attempt_count` integer.
- `last_error` text nullable.
- `created_at`, `updated_at`.

Constraints:

- PK `(consumer_id, event_id)`.

Indexes:

- `(consumer_id, status, processed_at)`.
- `(event_id)`.

### 7.6 `app_internal.replay_operations`

Purpose:

- Approved event replay operations.

Columns:

- `id` UUID PK.
- `requested_by` UUID.
- `approved_by` UUID nullable.
- `motivo` text.
- `event_filter` jsonb.
- `status` text.
- `categoria_riesgo` text.
- `started_at`, `completed_at` nullable.
- `created_at`.

Constraints:

- Approval required for financial/security/audit categories.
- Status constrained.

Indexes:

- `(status, created_at desc)`.
- `(requested_by, created_at desc)`.

### 7.7 `app_internal.idempotency_keys`

Purpose:

- Idempotency for commands, provider callbacks and workers.

Columns:

- `id` UUID PK.
- `organizacion_id` UUID nullable.
- `scope` text.
- `key_hash` text.
- `request_hash` text.
- `response_reference` jsonb nullable.
- `status` text.
- `expires_at`.
- `created_at`, `completed_at` nullable.

Constraints:

- Unique `(organizacion_id, scope, key_hash)`; platform-scope handles null organization via explicit strategy.
- Expiry required.

Indexes:

- Unique idempotency lookup.
- `(expires_at)`.
- `(status, created_at)`.

---

## 8. Authorization Model (RBAC)

### 8.1 Permission Naming

Permission codes use Spanish business domain and action, with technical separator:

```text
<dominio>:<recurso>:<accion>:<scope>
```

Examples:

- `pedidos:pedido:leer:propio`
- `pedidos:pedido:actualizar:sucursal`
- `pagos:reembolso:aprobar:organizacion`
- `catalogo:producto_menu:actualizar:organizacion`
- `cocina:ticket_cocina:tomar:sucursal`
- `audit:evento_audit:leer:organizacion`

### 8.2 Roles

| Role | Scope | Permissions | Restrictions | Extensibility |
| --- | --- | --- | --- | --- |
| `cliente` | Own user/customer scope | Read/update own perfil, manage own carrito, read own pedidos, manage preferencias_notificacion. | Cannot access private payment internals, staff data, audit, support notes. | Future loyalty/customer permissions added in own scope. |
| `operador_cocina` | Sucursal | Read branch pedidos projection, read/update tickets_cocina assigned/in queue, create eventos_cocina. | Cannot change prices, refunds, permissions, branch settings. | Station-specific permissions can be added. |
| `operador_entrega` | Sucursal | Read assigned entregas, update asignacion_entrega status, create comprobante_entrega. | Cannot access full customer profile beyond delivery-safe snapshot. | Driver app support later. |
| `supervisor_sucursal` | Sucursal | Read operational dashboards, manage kitchen/delivery queues, create overrides_operativos with motivo, pause limited availability. | Cannot approve refunds or change organization roles unless granted. | Approval thresholds can be added. |
| `administrador_sucursal` | Sucursal | Manage sucursal config, horarios, zonas_entrega_sucursal, staff branch roles, branch catalog availability. | Cannot manage organization-wide roles/campaigns unless explicitly granted. | Multi-branch admin role can be derived. |
| `administrador_organizacion` | Organizacion | Manage organization config, marcas, sucursales, catalogo, promociones, staff roles, analytics views. | Sensitive payment/refund/audit access requires additional permissions. | Custom tenant roles can extend. |
| `soporte` | Purpose-limited support scope | Read scoped cliente/pedido/support data, create casos_soporte/interacciones/acciones. | Time-bound grant required; audit on every sensitive read/action. | Specialized support tiers can be added. |
| `super_admin` | Platform | Platform operations, emergency access, cross-tenant diagnostics. | Break-glass reason required; all access audited. Not for normal tenant work. | Split into platform/security/data roles later. |

### 8.3 Base Permissions Catalog

Wave 1 seeds only foundational permissions:

- `identidad:perfil:leer:propio`
- `identidad:perfil:actualizar:propio`
- `identidad:rol:leer:organizacion`
- `identidad:rol:asignar:organizacion`
- `identidad:permiso:leer:organizacion`
- `organizaciones:organizacion:leer:organizacion`
- `organizaciones:sucursal:leer:sucursal`
- `organizaciones:sucursal:actualizar:organizacion`
- `audit:evento_audit:leer:organizacion`
- `audit:evento_seguridad:leer:organizacion`
- `audit:acceso:exportar:organizacion`
- `events:outbox:procesar:platform`
- `events:replay:solicitar:platform`
- `events:replay:aprobar:platform`

Feature-domain permissions for pedidos/pagos/cocina/entregas are seeded later unless needed by foundational RLS tests.

---

## 9. RLS Foundation

### 9.1 Policy Strategy

Wave 1 RLS creates the foundational policy patterns and applies them to foundation tables.

Rules:

- RLS enabled immediately on `app_public`, `app_private`, `audit`, `analytics` application tables.
- `app_internal` has no client grants; RLS may still be enabled for defense in depth.
- Policies must call reviewed helper functions for membership/permission checks.
- No policy may trust client-supplied organization or branch context without membership validation.

### 9.2 Tenant Resolution

Tenant resolution must support:

- Direct membership via `roles_usuario` with `organizacion_id`.
- Branch membership via `roles_usuario` with `sucursal_id` and organization consistency.
- Support grants later through support access records.
- Super-admin through platform role.

Foundation helper semantics:

- `current_user_id` resolves Supabase `auth.uid()`.
- `usuario_tiene_rol_en_organizacion` checks active role assignment.
- `usuario_tiene_permiso_en_organizacion` checks role permission joins.
- `usuario_tiene_permiso_en_sucursal` checks branch assignment or org-level permission.
- `es_super_admin` checks platform role assignment.

Function names are implementation details but business terms remain Spanish.

### 9.3 First Policy Classes

Customer isolation:

- `perfiles`: own profile read/update limited fields.
- Later customer-owned tables use `cliente_usuario_id = auth.uid()`.

Organization isolation:

- `organizaciones`: member/admin can read organization in scope.
- `marcas`: organization member can read; public active views later.

Branch isolation:

- `sucursales`: branch member can read branch; organization admin can read all organization branches.
- Branch settings private tables require branch/org admin permission.

Admin access:

- Admin policies rely on `permisos` through roles.
- Admin writes are server-side or restricted direct mutations only when safe.

Support access:

- Wave 1 prepares support role and permission model.
- Purpose-limited support grant table may be Wave 2 if support domain not required immediately.
- Until support grant exists, `soporte` access to tenant data is denied by default.

Super-admin access:

- Platform role can read required foundation records.
- Break-glass flows and audit are required before production use.

Audit access:

- Audit reads are denied by default.
- Audit/security permissions required.
- Audit access logs must be written by read endpoint in application layer.

### 9.4 Forbidden Patterns

Forbidden:

- `USING (true)` for authenticated users on business tables.
- Service-role keys in browser/client.
- Policies based only on JWT claims that are not verified against active database membership.
- Cross-tenant support access without reason, expiry and audit.
- Direct writes to `audit.eventos_audit` from client roles.
- Exposing `app_internal` to anon/authenticated roles.

---

## 10. Initial Index Strategy

### 10.1 Primary Indexes

Every table has PK index:

- UUID PK for entity tables.
- Composite PK for join/offset tables: `permisos_rol`, `event_consumer_offsets`.
- `event_catalog` PK: `(event_name, major_version)`.

### 10.2 Foreign Key Indexes

Required FK indexes:

- `marcas.organizacion_id`.
- `sucursales.organizacion_id`, `sucursales.marca_id`.
- `configuracion_sucursal.organizacion_id`.
- `horarios_sucursal.sucursal_id`.
- `excepciones_horario_sucursal.sucursal_id`.
- `zonas_entrega_sucursal.sucursal_id`.
- `roles.organizacion_id`.
- `permisos_rol.rol_id`, `permisos_rol.permiso_id`.
- `roles_usuario.usuario_id`, `roles_usuario.rol_id`, `roles_usuario.organizacion_id`, `roles_usuario.sucursal_id`.
- `logs_audit.evento_audit_id`.
- `event_consumer_offsets.consumer_id`, `event_consumer_offsets.event_id`.

### 10.3 Lookup Indexes

Required lookup indexes:

- `organizaciones.slug` unique active.
- `marcas (organizacion_id, slug)` unique active.
- `sucursales (organizacion_id, slug)` unique active.
- `roles (organizacion_id, codigo)`.
- `permisos.codigo` unique.
- `event_consumers.consumer_name` unique.
- `idempotency_keys (organizacion_id, scope, key_hash)` unique.

### 10.4 Tenant and Branch Indexes

Required:

- `sucursales (organizacion_id, estado)`.
- `sucursales (organizacion_id, estado_operativo)`.
- `roles_usuario (usuario_id, organizacion_id, sucursal_id, estado)`.
- `roles_usuario (organizacion_id, sucursal_id, rol_id, estado)`.
- `horarios_sucursal (sucursal_id, tipo_servicio, dia_semana, activo)`.
- `zonas_entrega_sucursal (sucursal_id, estado, prioridad)`.

### 10.5 Audit Indexes

Required:

- `eventos_audit (organizacion_id, occurred_at desc)`.
- `eventos_audit (organizacion_id, sucursal_id, occurred_at desc)`.
- `eventos_audit (tipo_actor, actor_id, occurred_at desc)`.
- `eventos_audit (tipo_entidad, entidad_id, occurred_at desc)`.
- `eventos_audit (correlation_id)`.
- `eventos_seguridad (severidad, occurred_at desc)`.
- `cambios_permisos (usuario_sujeto_id, occurred_at desc)`.
- `overrides_operativos (sucursal_id, occurred_at desc)`.
- `registros_incidente (severidad, estado, detectado_at desc)`.

### 10.6 Event Indexes

Required:

- `outbox_events (status, available_at, created_at)`.
- `outbox_events (aggregate_type, aggregate_id, created_at)`.
- `outbox_events (organizacion_id, sucursal_id, created_at desc)`.
- `outbox_events (event_name, created_at desc)`.
- `outbox_events (correlation_id)`.
- `event_consumer_offsets (consumer_id, status, processed_at)`.
- `replay_operations (status, created_at desc)`.
- `idempotency_keys (expires_at)`.

---

## 11. Migration Dependency Graph

### 11.1 High-Level Graph

```text
schemas
→ extensions
→ grants/base_functions
→ organizaciones
→ marcas
→ sucursales
→ configuracion_sucursal / horarios_sucursal / zonas_entrega_sucursal
→ perfiles
→ roles / permisos
→ permisos_rol
→ roles_usuario
→ sesiones
→ audit core
→ audit security/compliance/review records
→ event_catalog
→ outbox_events
→ event_consumers / replay_operations / idempotency_keys
→ RLS helper functions
→ RLS policies
→ base indexes
→ base seeds validation
```

### 11.2 Dependency Matrix

| Migration | Requires | Unlocks |
| --- | --- | --- |
| Schemas | None | All schema objects. |
| Extensions | Schemas | UUID/hash/citext helpers. |
| Grants | Schemas | Secure object creation. |
| Organizaciones | Schemas/extensions | Marcas, sucursales, roles scoped to organization. |
| Marcas | Organizaciones | Sucursales with marca. |
| Sucursales | Organizaciones, marcas | Branch settings, hours, zones, branch RBAC. |
| Perfiles | auth.users, schemas | roles_usuario, sesiones. |
| Roles/permisos | Organizaciones optional, schemas | RBAC assignments and policies. |
| Permisos_rol | Roles/permisos | Permission resolution. |
| Roles_usuario | Perfiles, roles, organizaciones, sucursales | RLS helper functions. |
| Sesiones | Perfiles, organizaciones, sucursales | Active context metadata. |
| Revisiones_acceso | Audit schema, perfiles, roles | Access compliance. |
| Audit core | Schemas | Security/compliance logs, audit writes. |
| Event catalog | app_internal | Outbox event validation. |
| Outbox events | Event catalog optional | Event publishing. |
| Consumers/replay/idempotency | Outbox/catalog | Worker/event platform. |
| RLS helpers | Roles_usuario, permisos_rol | Policies. |
| RLS policies | Helpers and tables | Safe exposure. |
| Indexes | Tables/policies | Performance and RLS safety. |

### 11.3 Critical Path

The critical path is:

```text
schemas → extensions → organizaciones → sucursales → perfiles → roles/permisos → roles_usuario → RLS helpers → RLS policies
```

Audit and event foundations can proceed after schemas and core identity references exist, but production readiness requires them before feature-domain migrations.

---

## 12. Rollback and Recovery

### 12.1 Safe Rollback Rules

Safe before production data:

- Drop/recreate local database.
- Reset staging before shared validation.
- Re-run migrations from scratch.
- Remove seed data and re-seed deterministic roles/permisos.

Safe after production deployment:

- Add corrective migration.
- Disable feature flags that rely on broken objects.
- Add compatibility view or column.
- Recreate missing index concurrently where supported.
- Repair grants/policies with forward migration.

### 12.2 Unsafe Rollback Rules

Unsafe:

- Dropping audit tables.
- Truncating event/outbox tables.
- Deleting roles/permisos to undo a deployment.
- Removing `organizacion_id` or `sucursal_id` columns.
- Disabling RLS to fix access quickly.
- Removing policies without replacement.
- Rolling back migrations by manual database edits in production.

### 12.3 Data Preservation Strategy

- Foundation records are preserved even if app code rolls back.
- Role/permission changes are corrected with new changes, not deletion.
- Soft-delete/deactivate rather than remove business configuration.
- Idempotency keys are retained until expiry.
- Event and audit history is immutable.

### 12.4 Audit Preservation Strategy

- Audit data must survive rollback, restore and repair.
- If audit write path fails during migration, migration must stop before exposing privileged operations.
- Manual production repair must create a compliance event afterward.
- Audit partitions must not be dropped outside retention/legal hold workflow.

### 12.5 Recovery Procedures

If Wave 1 migration fails:

1. Stop migration execution.
2. Capture failing migration, error, environment, timestamp and release ID.
3. Verify whether partial objects were created.
4. In local/staging, reset if safe.
5. In production, apply forward repair or restore from PITR only if approved.
6. Validate schemas, grants, RLS helper functions, roles/permisos, audit and events.
7. Record incident if production or shared staging was affected.

---

## 13. Production Readiness Checklist

### 13.1 Pre-Migration Checklist

- [ ] Language policy validated: business identifiers in Spanish, technical identifiers in English.
- [ ] All Wave 1 migration names reviewed.
- [ ] Dependency graph approved.
- [ ] Supabase project selected and environment isolated.
- [ ] Required extensions available in Supabase tier.
- [ ] Backup/PITR posture confirmed for target environment.
- [ ] Service-role secrets stored only in approved secret stores.
- [ ] Migration runner identity approved.
- [ ] No production feature depends on non-existent foundation objects.

### 13.2 Security and RLS Checklist

- [ ] No broad public grants.
- [ ] RLS enabled on application-owned tables.
- [ ] RLS helper functions reviewed for privilege escalation.
- [ ] Cross-organization denial tests defined.
- [ ] Cross-sucursal denial tests defined.
- [ ] Super-admin access requires role and audit plan.
- [ ] Support access denied by default until grants are implemented.
- [ ] Service-role usage documented and server-only.

### 13.3 Audit Checklist

- [ ] `eventos_audit` created with immutable strategy.
- [ ] `eventos_seguridad` and `eventos_compliance` created.
- [ ] `cambios_permisos` captures RBAC changes.
- [ ] Audit indexes exist for actor/entity/correlation/tenant queries.
- [ ] Retention class field exists.
- [ ] Legal hold field exists where needed.
- [ ] Audit reads are denied by default.

### 13.4 Event Checklist

- [ ] `event_catalog` exists.
- [ ] `outbox_events` exists.
- [ ] Worker lookup indexes exist.
- [ ] `event_consumers` and offsets exist.
- [ ] `replay_operations` approval fields exist.
- [ ] `idempotency_keys` unique constraints exist.
- [ ] Event retention classes exist.

### 13.5 Performance and Index Checklist

- [ ] FK columns indexed.
- [ ] RLS predicate columns indexed.
- [ ] Tenant/branch compound indexes exist.
- [ ] Audit hot-path indexes exist.
- [ ] Outbox worker indexes exist.
- [ ] No unnecessary JSONB GIN indexes in Wave 1 without query plan.

### 13.6 Operational Checklist

- [ ] Migrations tested locally from empty database.
- [ ] Migrations tested in staging from empty database.
- [ ] Migrations tested in staging against existing baseline if applicable.
- [ ] Roll-forward repair plan exists.
- [ ] Release owner assigned.
- [ ] Database owner on-call during production execution.
- [ ] Post-migration validation checklist prepared.
- [ ] Incident/runbook link available.

### 13.7 Post-Migration Validation

- [ ] Schemas exist.
- [ ] Extensions enabled.
- [ ] Grants match security plan.
- [ ] Foundation tables exist.
- [ ] Base roles/permisos seeded deterministically.
- [ ] RLS denies unauthorized cross-organization access.
- [ ] RLS denies unauthorized cross-sucursal access.
- [ ] Audit insert path works through trusted server path.
- [ ] Outbox insert/claim path works for worker role.
- [ ] Idempotency uniqueness works.
- [ ] No direct client access to `app_private`, `app_internal` or `audit` sensitive tables.

---


## 14. Migration Wave 1 Specification and Foundation Tables Catalog

### 14.1 Migration Wave 1 Specification Summary

| Wave Order | Area | Migration Group | Objects Created | Must Run After |
| --- | --- | --- | --- | --- |
| W1-001 | Database foundations | schemas | `app_public`, `app_private`, `app_internal`, `audit`, `analytics` | None |
| W1-002 | Database foundations | extensions | approved PostgreSQL extensions | W1-001 |
| W1-003 | Database foundations | roles_grants | database grants and revoked unsafe defaults | W1-001 |
| W1-004 | Database foundations | base_functions | helper function foundations for context/RLS/timestamps | W1-002 |
| W1-010 | Organizaciones | organizaciones | `app_public.organizaciones` | W1-001/W1-002 |
| W1-011 | Organizaciones | marcas | `app_public.marcas` | W1-010 |
| W1-012 | Sucursales | sucursales | `app_public.sucursales` | W1-010/W1-011 |
| W1-013 | Sucursales | configuracion | `app_private.configuracion_sucursal`, `app_private.configuracion_operativa_sucursal` | W1-012 |
| W1-014 | Sucursales | horarios | `app_public.horarios_sucursal`, `app_public.excepciones_horario_sucursal` | W1-012 |
| W1-015 | Sucursales | zonas | `app_public.zonas_entrega_sucursal` | W1-012 |
| W1-020 | Identidad | perfiles | `app_public.perfiles`, `app_private.perfiles_privados_usuario` | Supabase `auth.users`, W1-001 |
| W1-021 | Acceso | roles_permisos | `app_private.roles`, `app_private.permisos`, `app_private.permisos_rol` | W1-010 |
| W1-022 | Acceso | roles_usuario | `app_private.roles_usuario` | W1-020/W1-021/W1-012 |
| W1-023 | Identidad | sesiones | `app_private.sesiones` | W1-020/W1-012 |
| W1-024 | Acceso | revisiones_acceso | `audit.revisiones_acceso` | W1-020/W1-021/W1-040 |
| W1-025 | Acceso | seed_roles_permisos | base RBAC rows | W1-021 |
| W1-040 | Audit | audit_core | `audit.eventos_audit`, `audit.logs_audit` | W1-001 |
| W1-041 | Audit | security_compliance | `audit.eventos_seguridad`, `audit.eventos_compliance` | W1-040 |
| W1-042 | Audit | review_records | `audit.cambios_permisos`, `audit.overrides_operativos`, `audit.registros_incidente` | W1-040/W1-021/W1-012 |
| W1-050 | Events | event_catalog | `app_internal.event_catalog` | W1-001 |
| W1-051 | Events | outbox | `app_internal.outbox_events` | W1-050 |
| W1-052 | Events | consumers | `app_internal.event_consumers`, `app_internal.event_consumer_offsets` | W1-051 |
| W1-053 | Events | replay | `app_internal.replay_operations` | W1-051 |
| W1-054 | Events | idempotency | `app_internal.idempotency_keys` | W1-001/W1-010 |
| W1-070 | RLS | foundation_helpers | membership and permission helper functions | W1-022/W1-025 |
| W1-071 | RLS | foundation_policies | first policies for foundation tables | W1-070 |
| W1-080 | Indexes | foundation_indexes | all Wave 1 indexes | after each table group, finalized after W1-071 |
| W1-090 | Validation | verification | comments, policy verification and seed checks | all previous |

### 14.2 Foundation Tables Catalog

| Table | Schema | Domain | RLS Required | Audit Required | Partition Prep | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| `organizaciones` | `app_public` | organizaciones-sucursales | Yes | Changes audited | No | Platform/Tenant |
| `marcas` | `app_public` | organizaciones-sucursales | Yes | Changes audited | No | Platform/Tenant |
| `sucursales` | `app_public` | organizaciones-sucursales | Yes | Changes audited | No | Platform/Tenant |
| `configuracion_sucursal` | `app_private` | organizaciones-sucursales | Yes | Changes audited | No | Platform/Tenant |
| `configuracion_operativa_sucursal` | `app_private` | organizaciones-sucursales | Yes | Changes audited | No | Operations/Security |
| `horarios_sucursal` | `app_public` | organizaciones-sucursales | Yes | Changes audited | No | Platform/Tenant |
| `excepciones_horario_sucursal` | `app_public` | organizaciones-sucursales | Yes | Changes audited | No | Platform/Tenant |
| `zonas_entrega_sucursal` | `app_public` | entregas | Yes | Changes audited | Future geo/index | Delivery/Platform |
| `perfiles` | `app_public` | identidad-acceso | Yes | Sensitive changes audited | No | Security Platform |
| `perfiles_privados_usuario` | `app_private` | identidad-acceso | Yes | Reads/actions audited | No | Security Platform |
| `roles` | `app_private` | identidad-acceso | Yes | Changes audited | No | Security Platform |
| `permisos` | `app_private` | identidad-acceso | Yes | Changes audited | No | Security Platform |
| `permisos_rol` | `app_private` | identidad-acceso | Yes | Changes audited | No | Security Platform |
| `roles_usuario` | `app_private` | identidad-acceso | Yes | Changes audited | No | Security Platform |
| `sesiones` | `app_private` | identidad-acceso | Yes | Security reads audited | TTL indexes | Security Platform |
| `revisiones_acceso` | `audit` | audit-compliance | Yes | Native audit/compliance | Future time partition | Audit/Compliance |
| `eventos_audit` | `audit` | audit-compliance | Yes | Immutable audit fact | Yes by `occurred_at` | Audit/Compliance |
| `logs_audit` | `audit` | audit-compliance | Yes | Audit read model | Rebuildable | Audit/Compliance |
| `eventos_seguridad` | `audit` | audit-compliance | Yes | Immutable security fact | Yes by `occurred_at` | Security |
| `eventos_compliance` | `audit` | audit-compliance | Yes | Immutable compliance fact | Yes by `occurred_at` | Audit/Compliance |
| `cambios_permisos` | `audit` | audit-compliance | Yes | Native permission audit | Future time partition | Security |
| `overrides_operativos` | `audit` | audit-compliance | Yes | Native operational audit | Future time partition | Operations/Security |
| `registros_incidente` | `audit` | audit-compliance | Yes | Incident audit | Future time partition | SRE/Security |
| `event_catalog` | `app_internal` | event platform | Internal only | Changes audited | No | Event Architecture |
| `outbox_events` | `app_internal` | event platform | Internal only | Publishing audited | Future time partition | Event Architecture |
| `event_consumers` | `app_internal` | event platform | Internal only | Changes audited | No | Event Architecture |
| `event_consumer_offsets` | `app_internal` | event platform | Internal only | Worker actions observable | High-volume prep | Event Architecture |
| `replay_operations` | `app_internal` | event platform | Internal only | Replay audited | No | Event Architecture |
| `idempotency_keys` | `app_internal` | platform | Internal only | Sensitive misuse audited | TTL cleanup | Platform |

---

## 15. Final Deliverable Index

This specification produces:

1. Migration Strategy.
2. Migration Dependency Graph.
3. Migration Wave 1 Specification.
4. Foundation Tables Catalog.
5. RBAC Specification.
6. RLS Foundation.
7. Audit Foundation.
8. Event Foundation.
9. Index Strategy.
10. Production Readiness Checklist.

No SQL should be written until this specification is approved by Database Architecture, Supabase Platform, Security, Event Architecture, Audit/Compliance and Governance owners.
