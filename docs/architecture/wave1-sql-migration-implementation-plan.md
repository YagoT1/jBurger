# J Burguer — Wave 1 SQL Migration Implementation Plan

## 0. Alcance y autoridad

> **Language policy:** Este documento cumple `docs/architecture/language-standard-business-spanish-technical-english.md`: negocio en español, técnica en inglés.

> **P0 hardening:** Este plan incorpora `docs/architecture/database-hardening-p0-resolution-specification.md` y mantiene bloqueada la generación de SQL hasta aprobación final.

Este documento prepara la fase SQL sin generar SQL, migrations ni código. Define la lista exacta de migrations Wave 1 que ingeniería implementará en `supabase/migrations/`.

Este plan es más operativo que `first-migration-set-specification.md`: convierte las decisiones aprobadas en una secuencia de archivos implementables con propósito, dependencias, constraints, indexes, rollback considerations, validation checklist y testing requirements.

---

## 1. Migration File Naming

### 1.1 Canonical file format

Cada archivo debe usar el formato Supabase:

```text
<timestamp_utc>_<sequence>_<area>_<action>_<object>.sql
```

Ejemplo final al crear el archivo:

```text
20260602090000_001_schemas_create_base.sql
```

La columna `Canonical file name` de este documento omite el timestamp real y define el sufijo obligatorio. El timestamp lo genera la herramienta de migrations al momento de crear el archivo.

### 1.2 Execution rules

- El orden numérico es obligatorio.
- Ninguna migration puede adelantarse a sus dependencies.
- No se permite combinar migrations de áreas distintas para acelerar implementación.
- Seeds base de roles/permisos se separan de estructura.
- RLS policies se crean después de tablas, helper functions e indexes base.
- Validation migrations no crean features; solo verifican foundation readiness.

---

## 2. Complete Wave 1 Migration List

| Seq | Canonical file name | Area | Primary objects |
| --- | --- | --- | --- |
| 001 | `001_schemas_create_base.sql` | schemas | `app_public`, `app_private`, `app_internal`, `audit`, `analytics` |
| 002 | `002_extensions_enable_required.sql` | extensions | `pgcrypto`, optional approved extensions |
| 003 | `003_security_create_database_roles_grants.sql` | security | grants, revoked defaults, role posture |
| 004 | `004_nucleo_create_monedas_soportadas.sql` | nucleo | `app_public.monedas_soportadas` |
| 005 | `005_nucleo_create_base_helper_functions.sql` | nucleo | timestamp/context helper foundations |
| 006 | `006_organizaciones_create_organizaciones.sql` | organizaciones | `app_public.organizaciones` |
| 007 | `007_organizaciones_create_marcas.sql` | organizaciones | `app_public.marcas` |
| 008 | `008_organizaciones_create_sucursales.sql` | organizaciones | `app_public.sucursales` |
| 009 | `009_organizaciones_create_sucursales_marcas.sql` | organizaciones | `app_public.sucursales_marcas` |
| 010 | `010_organizaciones_create_configuracion_sucursal.sql` | organizaciones | `app_private.configuracion_sucursal` |
| 011 | `011_organizaciones_create_configuracion_operativa_sucursal.sql` | organizaciones | `app_private.configuracion_operativa_sucursal` |
| 012 | `012_organizaciones_create_horarios_sucursal.sql` | organizaciones | `app_public.horarios_sucursal` |
| 013 | `013_organizaciones_create_excepciones_horario_sucursal.sql` | organizaciones | `app_public.excepciones_horario_sucursal` |
| 014 | `014_entregas_create_zonas_entrega_sucursal.sql` | entregas | `app_public.zonas_entrega_sucursal` |
| 015 | `015_identidad_create_perfiles.sql` | identidad | `app_public.perfiles` |
| 016 | `016_identidad_create_perfiles_privados_usuario.sql` | identidad | `app_private.perfiles_privados_usuario` |
| 017 | `017_identidad_create_roles.sql` | identidad | `app_private.roles` |
| 018 | `018_identidad_create_permisos.sql` | identidad | `app_private.permisos` |
| 019 | `019_identidad_create_permisos_rol.sql` | identidad | `app_private.permisos_rol` |
| 020 | `020_identidad_create_roles_usuario.sql` | identidad | `app_private.roles_usuario` |
| 021 | `021_identidad_create_sesiones.sql` | identidad | `app_private.sesiones` |
| 022 | `022_soporte_create_grants_soporte.sql` | soporte/security | `app_private.grants_soporte` |
| 023 | `023_security_create_grants_break_glass.sql` | security | `app_private.grants_break_glass` |
| 024 | `024_audit_create_politicas_retencion.sql` | audit | `audit.politicas_retencion` |
| 025 | `025_audit_create_legal_holds.sql` | audit | `audit.legal_holds` |
| 026 | `026_audit_create_eventos_audit.sql` | audit | `audit.eventos_audit` |
| 027 | `027_audit_create_logs_audit.sql` | audit | `audit.logs_audit` |
| 028 | `028_audit_create_logs_acceso_audit.sql` | audit | `audit.logs_acceso_audit` |
| 029 | `029_audit_create_eventos_seguridad.sql` | audit | `audit.eventos_seguridad` |
| 030 | `030_audit_create_eventos_compliance.sql` | audit | `audit.eventos_compliance` |
| 031 | `031_audit_create_cambios_permisos.sql` | audit | `audit.cambios_permisos` |
| 032 | `032_audit_create_overrides_operativos.sql` | audit | `audit.overrides_operativos` |
| 033 | `033_audit_create_registros_incidente.sql` | audit | `audit.registros_incidente` |
| 034 | `034_events_create_event_catalog.sql` | events | `app_internal.event_catalog` |
| 035 | `035_events_create_outbox_events.sql` | events | `app_internal.outbox_events` |
| 036 | `036_events_create_event_consumers.sql` | events | `app_internal.event_consumers` |
| 037 | `037_events_create_event_consumer_offsets.sql` | events | `app_internal.event_consumer_offsets` |
| 038 | `038_events_create_replay_operations.sql` | events | `app_internal.replay_operations` |
| 039 | `039_events_create_idempotency_keys.sql` | events | `app_internal.idempotency_keys` |
| 040 | `040_rls_create_authorization_helpers.sql` | rls | RLS helper functions catalog |
| 041 | `041_rls_enable_foundation_tables.sql` | rls | RLS enablement on Wave 1 tables |
| 042 | `042_rls_create_identidad_policies.sql` | rls | identidad/acceso policies |
| 043 | `043_rls_create_organizaciones_policies.sql` | rls | organizaciones/sucursales policies |
| 044 | `044_rls_create_audit_policies.sql` | rls | audit access policies |
| 045 | `045_rls_create_events_policies.sql` | rls | app_internal denial/internal policies |
| 046 | `046_indexes_create_foundation_indexes.sql` | indexes | missing FK/RLS/lookup indexes not created inline |
| 047 | `047_seeds_seed_permisos_base.sql` | seeds | base permisos |
| 048 | `048_seeds_seed_roles_base.sql` | seeds | base roles |
| 049 | `049_seeds_seed_permisos_rol_base.sql` | seeds | base role-permission mappings |
| 050 | `050_validation_create_foundation_comments.sql` | validation | table/schema/function comments and ownership metadata |
| 051 | `051_validation_verify_wave1_integrity.sql` | validation | integrity assertions/no-op validation migration |

---

## 3. Detailed Migration Specifications

### 001 — `001_schemas_create_base.sql`

Purpose:

- Create foundational schemas.
- Establish schema comments and ownership placeholders.

Tables created:

- None.

Schemas created:

- `app_public`.
- `app_private`.
- `app_internal`.
- `audit`.
- `analytics`.

Constraints:

- No public object grants beyond approved defaults.

Indexes:

- None.

Dependencies:

- None.

Rollback considerations:

- Safe only before any object exists in schemas.
- In shared environments, rollback requires forward repair, not schema drop.

Validation checklist:

- Schemas exist.
- Unsafe grants revoked.
- Supabase managed schemas unaffected.

Testing requirements:

- Apply from empty local database.
- Confirm anon/authenticated cannot create objects in these schemas.

### 002 — `002_extensions_enable_required.sql`

Purpose:

- Enable approved PostgreSQL extensions required by Wave 1.

Tables created:

- None.

Constraints:

- Only approved extensions may be enabled.
- PostGIS remains deferred unless explicitly approved.

Indexes:

- None.

Dependencies:

- 001.

Rollback considerations:

- Do not drop extensions in shared environments if dependent objects exist.

Validation checklist:

- `pgcrypto` available.
- Optional `citext` only if chosen for correo electrónico normalization.

Testing requirements:

- Verify UUID generation strategy works in local/staging.

### 003 — `003_security_create_database_roles_grants.sql`

Purpose:

- Establish secure database grants and revoke unsafe defaults.
- Prepare least-privilege posture for Supabase anon/authenticated/service roles.

Tables created:

- None.

Constraints:

- No direct client grants to `app_private`, `app_internal`, or `audit`.
- `app_public` access must still depend on RLS.

Indexes:

- None.

Dependencies:

- 001.

Rollback considerations:

- Forward repair grants; do not broadly restore defaults.

Validation checklist:

- Anonymous role cannot read private/internal/audit schemas.
- Authenticated role cannot access internal tables directly.

Testing requirements:

- Permission smoke tests for anon/authenticated/service contexts.

### 004 — `004_nucleo_create_monedas_soportadas.sql`

Purpose:

- Create currency foundation for Dinero.

Tables created:

- `app_public.monedas_soportadas`.

Constraints:

- `codigo_moneda` unique uppercase.
- `decimales` non-negative.
- `estado` constrained.

Indexes:

- Primary key.
- Unique `codigo_moneda`.
- Lookup index by `estado`.

Dependencies:

- 001, 002.

Rollback considerations:

- Safe only before dependent money columns reference it.

Validation checklist:

- `ARS` can be seeded later as active if approved.

Testing requirements:

- Constraint tests for lowercase/invalid currency and negative decimals.

### 005 — `005_nucleo_create_base_helper_functions.sql`

Purpose:

- Create foundational technical helper functions for timestamps/context conventions that do not yet perform authorization.

Tables created:

- None.

Constraints:

- Helper functions must have fixed `search_path`.
- No dynamic SQL.

Indexes:

- None.

Dependencies:

- 001, 002.

Rollback considerations:

- Function replacement must be forward-compatible once referenced.

Validation checklist:

- Function owner and security mode documented.
- No function grants beyond required usage.

Testing requirements:

- Function execution as expected roles.

### 006 — `006_organizaciones_create_organizaciones.sql`

Purpose:

- Create tenant root table.

Tables created:

- `app_public.organizaciones`.

Constraints:

- Primary key UUID.
- Unique active `slug`.
- `tipo_organizacion` constrained: `platform`, `empresa`, `franquiciante`, `franquiciado`.
- `estado` constrained.
- `organizacion_padre_id` cannot equal `id`.
- Unique `(id, tipo_organizacion)` and `(organizacion_id equivalent, id)` pattern for composite references as needed.

Indexes:

- PK.
- Unique active slug.
- `organizacion_padre_id`.
- `estado`.
- `tipo_organizacion`.

Dependencies:

- 001, 002, 004.

Rollback considerations:

- Destructive rollback unsafe once any tenant row exists.

Validation checklist:

- Can represent empresa, franquiciante, franquiciado, platform.
- Self-parent rejected.

Testing requirements:

- Constraint tests for duplicate slug and invalid hierarchy basics.

### 007 — `007_organizaciones_create_marcas.sql`

Purpose:

- Create brand table under organization.

Tables created:

- `app_public.marcas`.

Constraints:

- FK to `organizaciones`.
- Unique active `(organizacion_id, slug)`.
- Unique `(organizacion_id, id)` for composite FK references.
- `estado` constrained.

Indexes:

- PK.
- `(organizacion_id, estado)`.
- Unique active `(organizacion_id, slug)`.

Dependencies:

- 006.

Rollback considerations:

- Unsafe once sucursales or catalogo reference marca.

Validation checklist:

- Marca cannot exist without organizacion.

Testing requirements:

- Cross-tenant duplicate slugs allowed; same-tenant active duplicate denied.

### 008 — `008_organizaciones_create_sucursales.sql`

Purpose:

- Create operational branch table.

Tables created:

- `app_public.sucursales`.

Constraints:

- FK to `organizaciones`.
- Composite FK `(organizacion_id, marca_id)` to `marcas` when `marca_id` present.
- Unique active `(organizacion_id, slug)`.
- Unique `(organizacion_id, id)` for composite references.
- Coordinate range checks.
- `estado` and `estado_operativo` constrained.

Indexes:

- PK.
- `(organizacion_id, estado)`.
- `(organizacion_id, estado_operativo)`.
- `(organizacion_id, marca_id)`.
- Unique active `(organizacion_id, slug)`.

Dependencies:

- 006, 007.

Rollback considerations:

- Unsafe once branch-scoped objects exist.

Validation checklist:

- Sucursal cannot reference marca from another organizacion.

Testing requirements:

- Cross-tenant marca reference denied.
- Invalid latitud/longitud denied.

### 009 — `009_organizaciones_create_sucursales_marcas.sql`

Purpose:

- Prepare future multi-brand support without changing sucursales later.

Tables created:

- `app_public.sucursales_marcas`.

Constraints:

- Composite FK to `sucursales(organizacion_id, id)`.
- Composite FK to `marcas(organizacion_id, id)`.
- Unique `(sucursal_id, marca_id)`.
- `estado` constrained.

Indexes:

- PK or unique `(sucursal_id, marca_id)`.
- `(organizacion_id, marca_id, estado)`.
- `(organizacion_id, sucursal_id, estado)`.

Dependencies:

- 007, 008.

Rollback considerations:

- Safe only before active multi-brand assignments exist.

Validation checklist:

- Cross-tenant sucursal/marca assignment denied.

Testing requirements:

- Same organization assignment allowed; different organization denied.

### 010 — `010_organizaciones_create_configuracion_sucursal.sql`

Purpose:

- Create ordering/fulfillment configuration per sucursal.

Tables created:

- `app_private.configuracion_sucursal`.

Constraints:

- PK `sucursal_id`.
- Composite FK `(organizacion_id, sucursal_id)` to sucursales.
- Money fields non-negative.
- Boolean flags not null.

Indexes:

- PK.
- `(organizacion_id)`.

Dependencies:

- 008.

Rollback considerations:

- Unsafe once app expects branch configuration.

Validation checklist:

- Configuration cannot point to sucursal from another organization.

Testing requirements:

- Cross-tenant insert denied by FK/validation.

### 011 — `011_organizaciones_create_configuracion_operativa_sucursal.sql`

Purpose:

- Create operational capacity/override configuration per sucursal.

Tables created:

- `app_private.configuracion_operativa_sucursal`.

Constraints:

- PK `sucursal_id`.
- Composite FK `(organizacion_id, sucursal_id)`.
- Capacity values non-negative.
- Operational modes constrained.

Indexes:

- PK.
- `(organizacion_id)`.

Dependencies:

- 008.

Rollback considerations:

- Unsafe once operations depend on capacity rules.

Validation checklist:

- Requires motivo flag defaults approved.

Testing requirements:

- Negative capacity rejected.

### 012 — `012_organizaciones_create_horarios_sucursal.sql`

Purpose:

- Create regular HorarioComercial rows.

Tables created:

- `app_public.horarios_sucursal`.

Constraints:

- Composite FK `(organizacion_id, sucursal_id)`.
- `dia_semana` 0-6.
- `tipo_servicio` constrained.
- `abre_at` and `cierra_at` range valid by approved rule.

Indexes:

- PK.
- `(sucursal_id, tipo_servicio, dia_semana, activo)`.
- `(organizacion_id, sucursal_id)`.

Dependencies:

- 008.

Rollback considerations:

- Unsafe once availability depends on schedule.

Validation checklist:

- Multiple service types supported.

Testing requirements:

- Invalid day/service denied.

### 013 — `013_organizaciones_create_excepciones_horario_sucursal.sql`

Purpose:

- Create date-specific schedule overrides.

Tables created:

- `app_public.excepciones_horario_sucursal`.

Constraints:

- Composite FK `(organizacion_id, sucursal_id)` to sucursales. Implementation must use correct `sucursal_id` spelling.
- Unique `(sucursal_id, tipo_servicio, fecha_excepcion)`.
- If `cerrado = true`, time fields may be null.
- If `cerrado = false`, opening/closing times required.

Indexes:

- Unique exception lookup.
- `(organizacion_id, fecha_excepcion)`.

Dependencies:

- 008, 012.

Rollback considerations:

- Unsafe once exception logic is used by ordering.

Validation checklist:

- Closed and open exception cases validated.

Testing requirements:

- Duplicate exception rejected.

### 014 — `014_entregas_create_zonas_entrega_sucursal.sql`

Purpose:

- Create branch delivery zone foundation.

Tables created:

- `app_public.zonas_entrega_sucursal`.

Constraints:

- Composite FK `(organizacion_id, sucursal_id)`.
- Money/minute values non-negative.
- `tipo_area_geografica` constrained.
- `area_geografica` required for active zones.

Indexes:

- PK.
- `(sucursal_id, estado, prioridad)`.
- `(organizacion_id, sucursal_id)`.

Dependencies:

- 008, 004.

Rollback considerations:

- Unsafe once delivery eligibility uses zones.

Validation checklist:

- Geo JSON schema documented even if not DB-enforced yet.

Testing requirements:

- Cross-tenant zone denied.

### 015 — `015_identidad_create_perfiles.sql`

Purpose:

- Create public-safe profile mapped to Supabase auth user.

Tables created:

- `app_public.perfiles`.

Constraints:

- PK references `auth.users.id`.
- Optional defaults reference valid organization/sucursal with consistency.

Indexes:

- PK.
- `organizacion_default_id`.
- `sucursal_default_id`.

Dependencies:

- 001, 006, 008, Supabase `auth.users`.

Rollback considerations:

- Unsafe once users exist.

Validation checklist:

- Profile cannot default to sucursal from different organization.

Testing requirements:

- Auth user reference required.

### 016 — `016_identidad_create_perfiles_privados_usuario.sql`

Purpose:

- Store private user/contact/risk metadata.

Tables created:

- `app_private.perfiles_privados_usuario`.

Constraints:

- PK/FK `usuario_id` to `auth.users.id`.
- Status fields constrained.
- Normalized email uniqueness if enabled.

Indexes:

- PK.
- `correo_electronico_normalizado` where not null.
- `telefono` where not null.

Dependencies:

- 015.

Rollback considerations:

- Unsafe once private profile data exists.

Validation checklist:

- No direct public grants.

Testing requirements:

- Authenticated direct read denied before RLS policy exceptions.

### 017 — `017_identidad_create_roles.sql`

Purpose:

- Create role definitions.

Tables created:

- `app_private.roles`.

Constraints:

- FK to organizaciones when tenant-scoped.
- Unique system role code.
- Unique `(organizacion_id, codigo)`.
- `tipo_scope`, `estado` constrained.

Indexes:

- PK.
- `(organizacion_id, codigo)`.
- `(tipo_scope, estado)`.

Dependencies:

- 006.

Rollback considerations:

- Unsafe once role assignments exist.

Validation checklist:

- No wildcard business role created.

Testing requirements:

- Duplicate role code rejected in same organization.

### 018 — `018_identidad_create_permisos.sql`

Purpose:

- Create permission catalog.

Tables created:

- `app_private.permisos`.

Constraints:

- Unique `codigo`.
- `nivel_riesgo` constrained.
- `tipo_scope` constrained.

Indexes:

- PK.
- Unique `codigo`.
- `(dominio, recurso, accion)`.
- `(nivel_riesgo)`.

Dependencies:

- 001.

Rollback considerations:

- Unsafe once roles reference permissions.

Validation checklist:

- High-risk permission categories supported.

Testing requirements:

- Duplicate permission code rejected.

### 019 — `019_identidad_create_permisos_rol.sql`

Purpose:

- Create role-permission mapping.

Tables created:

- `app_private.permisos_rol`.

Constraints:

- Composite PK `(rol_id, permiso_id)`.
- FK to roles and permisos.

Indexes:

- PK.
- `(permiso_id, rol_id)`.

Dependencies:

- 017, 018.

Rollback considerations:

- Unsafe once seeded role permissions drive RLS.

Validation checklist:

- Role-permission mapping cannot reference inactive/deleted roles where enforced by lifecycle tests.

Testing requirements:

- Duplicate mapping rejected.

### 020 — `020_identidad_create_roles_usuario.sql`

Purpose:

- Create scoped user role assignments and membership source of truth.

Tables created:

- `app_private.roles_usuario`.

Constraints:

- FK to auth user, roles, organizaciones.
- Composite FK `(organizacion_id, sucursal_id)` when sucursal present.
- `sucursal_id` requires `organizacion_id`.
- Active uniqueness for same user/role/scope.
- `expira_at` after `inicia_at`.
- `estado` constrained.

Indexes:

- PK.
- `(usuario_id, organizacion_id, sucursal_id, estado)`.
- `(organizacion_id, sucursal_id, rol_id, estado)`.
- `(expira_at)`.
- Partial unique active assignment.

Dependencies:

- 015, 017, 008.

Rollback considerations:

- Unsafe once authorization relies on roles.

Validation checklist:

- Active membership predicate can be evaluated from columns.

Testing requirements:

- Revoked/expired/future roles represented.
- Cross-tenant sucursal assignment denied.

### 021 — `021_identidad_create_sesiones.sql`

Purpose:

- Create application session metadata for active context and revocation support.

Tables created:

- `app_private.sesiones`.

Constraints:

- FK to auth user.
- Active sucursal belongs to active organization when both present.
- Actor type constrained.

Indexes:

- PK.
- `(usuario_id, last_seen_at desc)`.
- `(expires_at)`.
- `(organizacion_activa_id, sucursal_activa_id)`.

Dependencies:

- 015, 006, 008.

Rollback considerations:

- Safe only before session metadata is used.

Validation checklist:

- Revocation timestamp supported.

Testing requirements:

- Invalid active context rejected.

### 022 — `022_soporte_create_grants_soporte.sql`

Purpose:

- Create support access grant model to prevent unrestricted soporte access.

Tables created:

- `app_private.grants_soporte`.

Constraints:

- FK to support user.
- FK to organizacion and optional sucursal with consistency.
- Required `motivo`.
- Required `aprobado_por` for active grants.
- `expira_at` required and after `inicia_at`.
- Estado constrained.

Indexes:

- PK.
- `(usuario_soporte_id, estado, expira_at)`.
- `(organizacion_id, sujeto_tipo, sujeto_id, estado)`.
- `(caso_soporte_id)` nullable future reference.

Dependencies:

- 006, 008, 015.

Rollback considerations:

- Unsafe once support access uses grants.

Validation checklist:

- No grant can be active without expiry and reason.

Testing requirements:

- Expired grant denied by future RLS helper.

### 023 — `023_security_create_grants_break_glass.sql`

Purpose:

- Create emergency privileged access grant model replacing unrestricted super_admin.

Tables created:

- `app_private.grants_break_glass`.

Constraints:

- FK to user.
- Scope constrained.
- Required `incidente_id` or incident reference placeholder.
- Required `motivo`.
- Required `aprobado_por` unless emergency delayed-approval policy explicitly represented.
- Max duration constraint if enforceable.
- Estado constrained.

Indexes:

- PK.
- `(usuario_id, estado, expira_at)`.
- `(scope_tipo, organizacion_id, sucursal_id, estado)`.
- `(incidente_id)`.

Dependencies:

- 006, 008, 015.

Rollback considerations:

- Unsafe once break-glass is production control.

Validation checklist:

- No active grant without incident and expiry.

Testing requirements:

- Expired/no grant denied by future helper.

### 024 — `024_audit_create_politicas_retencion.sql`

Purpose:

- Create retention policy registry.

Tables created:

- `audit.politicas_retencion`.

Constraints:

- Unique `(clase_retencion, version)`.
- Duration positive.
- Status constrained.

Indexes:

- PK.
- `(clase_retencion, estado)`.
- `(effective_at)`.

Dependencies:

- 001.

Rollback considerations:

- Unsafe once audit/events reference retention classes.

Validation checklist:

- Required retention classes can be seeded later.

Testing requirements:

- Duplicate active version rejected if enforced.

### 025 — `025_audit_create_legal_holds.sql`

Purpose:

- Create legal hold registry.

Tables created:

- `audit.legal_holds`.

Constraints:

- Scope type constrained.
- Required `motivo`, requester and approver for active hold.
- Release fields only allowed when state released.

Indexes:

- PK.
- `(scope_tipo, estado)`.
- `(inicia_at)`.
- `(liberado_at)`.

Dependencies:

- 024, 015.

Rollback considerations:

- Unsafe once legal holds exist.

Validation checklist:

- Can represent entity, organization, branch, category and time-range hold.

Testing requirements:

- Active hold requires approval.

### 026 — `026_audit_create_eventos_audit.sql`

Purpose:

- Create immutable normalized audit fact table.

Tables created:

- `audit.eventos_audit`.

Constraints:

- PK UUID.
- Retention class references registry or constrained approved class.
- Risk category constrained.
- Required correlation_id.
- Append-only enforcement strategy prepared.

Indexes:

- `(organizacion_id, occurred_at desc)`.
- `(organizacion_id, sucursal_id, occurred_at desc)`.
- `(tipo_actor, actor_id, occurred_at desc)`.
- `(tipo_entidad, entidad_id, occurred_at desc)`.
- `(correlation_id)`.
- `(categoria_riesgo, occurred_at desc)`.
- `(clase_retencion, occurred_at)`.

Dependencies:

- 024, 025.

Rollback considerations:

- Never drop after any audit fact exists.

Validation checklist:

- Direct client grants absent.
- Immutability controls planned before production.

Testing requirements:

- Update/delete denied after RLS/grants migration.

### 027 — `027_audit_create_logs_audit.sql`

Purpose:

- Create audit review projection table.

Tables created:

- `audit.logs_audit`.

Constraints:

- FK to `eventos_audit`.
- Safe display summary required.

Indexes:

- `(evento_audit_id)`.
- `(organizacion_id, created_at desc)`.
- `(tipo_entidad, entidad_id, created_at desc)`.

Dependencies:

- 026.

Rollback considerations:

- Rebuildable but do not drop in production without rebuild plan.

Validation checklist:

- Projection can be rebuilt from audit facts.

Testing requirements:

- Orphan log rejected.

### 028 — `028_audit_create_logs_acceso_audit.sql`

Purpose:

- Create mandatory audit access logging table.

Tables created:

- `audit.logs_acceso_audit`.

Constraints:

- Required actor, resource, purpose, correlation_id and occurred_at.
- Retention class required.
- Grant references nullable but must be consistent when present.

Indexes:

- PK.
- `(usuario_id, occurred_at desc)`.
- `(organizacion_id, occurred_at desc)`.
- `(recurso_audit, occurred_at desc)`.
- `(correlation_id)`.

Dependencies:

- 022, 023, 024.

Rollback considerations:

- Never drop after audit reads occur.

Validation checklist:

- Audit read path cannot be approved without this table.

Testing requirements:

- Audit read endpoint must create row in integration tests later.

### 029 — `029_audit_create_eventos_seguridad.sql`

Purpose:

- Create security event table.

Tables created:

- `audit.eventos_seguridad`.

Constraints:

- Severity constrained.
- Retention class required.
- Decision/reason fields constrained where possible.

Indexes:

- `(severidad, occurred_at desc)`.
- `(usuario_id, occurred_at desc)`.
- `(organizacion_id, occurred_at desc)`.

Dependencies:

- 024.

Rollback considerations:

- Never drop after security events exist.

Validation checklist:

- Can record RLS denial, support grant, break-glass, auth anomaly.

Testing requirements:

- Required fields enforced.

### 030 — `030_audit_create_eventos_compliance.sql`

Purpose:

- Create compliance event table.

Tables created:

- `audit.eventos_compliance`.

Constraints:

- Compliance event type constrained.
- Evidence payload safe/redacted by writer contract.

Indexes:

- `(tipo_evento_compliance, occurred_at desc)`.
- `(politica_id)`.
- `(tipo_sujeto, sujeto_id)`.

Dependencies:

- 024, 025.

Rollback considerations:

- Never drop after compliance events exist.

Validation checklist:

- Can record retention/legal hold changes.

Testing requirements:

- Required decision/evidence fields validated.

### 031 — `031_audit_create_cambios_permisos.sql`

Purpose:

- Create permission/role change audit records.

Tables created:

- `audit.cambios_permisos`.

Constraints:

- Required subject, changed_by, before/after state, motivo.
- Change type constrained.

Indexes:

- `(usuario_sujeto_id, occurred_at desc)`.
- `(cambiado_por, occurred_at desc)`.
- `(organizacion_id, occurred_at desc)`.

Dependencies:

- 017, 018, 020, 026.

Rollback considerations:

- Never drop after RBAC changes occur.

Validation checklist:

- Can link to role and permission where applicable.

Testing requirements:

- Missing reason rejected.

### 032 — `032_audit_create_overrides_operativos.sql`

Purpose:

- Create operational override audit records.

Tables created:

- `audit.overrides_operativos`.

Constraints:

- Required organization, sucursal, type, target, before/after, motivo, actor.
- Override type constrained.

Indexes:

- `(sucursal_id, occurred_at desc)`.
- `(tipo_objetivo, objetivo_id)`.
- `(ejecutado_por, occurred_at desc)`.

Dependencies:

- 008, 026.

Rollback considerations:

- Never drop after operations use overrides.

Validation checklist:

- Sucursal/organization consistency required.

Testing requirements:

- Missing motive rejected.

### 033 — `033_audit_create_registros_incidente.sql`

Purpose:

- Create incident records foundation.

Tables created:

- `audit.registros_incidente`.

Constraints:

- Severity and status constrained.
- Resolved timestamp after detected timestamp.

Indexes:

- `(severidad, estado, detectado_at desc)`.
- `(organizacion_id, sucursal_id, detectado_at desc)`.

Dependencies:

- 006, 008.

Rollback considerations:

- Never drop after incident response uses table.

Validation checklist:

- Can link break-glass grants through `incidente_id` strategy.

Testing requirements:

- Invalid lifecycle timestamps rejected.

### 034 — `034_events_create_event_catalog.sql`

Purpose:

- Create event schema/version registry.

Tables created:

- `app_internal.event_catalog`.

Constraints:

- PK `(event_name, major_version)`.
- Version positive.
- Status and classification constrained.
- Retention class constrained/referenced.

Indexes:

- PK.
- `(owner_domain, status)`.

Dependencies:

- 024.

Rollback considerations:

- Unsafe once producers reference catalog.

Validation checklist:

- Can register Spanish business event names and technical event names.

Testing requirements:

- Duplicate version rejected.

### 035 — `035_events_create_outbox_events.sql`

Purpose:

- Create durable outbox event table.

Tables created:

- `app_internal.outbox_events`.

Constraints:

- Status constrained: pending/processing/published/failed/dead-letter equivalent technical statuses as approved.
- Attempt count non-negative.
- Event catalog reference when enforceable.
- Required correlation_id.

Indexes:

- `(status, available_at, created_at)`.
- `(aggregate_type, aggregate_id, created_at)`.
- `(organizacion_id, sucursal_id, created_at desc)`.
- `(event_name, created_at desc)`.
- `(correlation_id)`.

Dependencies:

- 034.

Rollback considerations:

- Never drop after event production begins.

Validation checklist:

- Worker claim indexes exist.

Testing requirements:

- Invalid status rejected.

### 036 — `036_events_create_event_consumers.sql`

Purpose:

- Create event consumer registry.

Tables created:

- `app_internal.event_consumers`.

Constraints:

- Unique `consumer_name`.
- Status constrained.
- Max retry non-negative.

Indexes:

- Unique `consumer_name`.
- `(status)`.

Dependencies:

- 035.

Rollback considerations:

- Unsafe once consumers registered.

Validation checklist:

- Owner team required.

Testing requirements:

- Duplicate consumer rejected.

### 037 — `037_events_create_event_consumer_offsets.sql`

Purpose:

- Create per-consumer processing state.

Tables created:

- `app_internal.event_consumer_offsets`.

Constraints:

- PK `(consumer_id, event_id)`.
- FK to event_consumers and outbox_events.
- Attempt count non-negative.
- Status constrained.

Indexes:

- PK.
- `(consumer_id, status, processed_at)`.
- `(event_id)`.

Dependencies:

- 035, 036.

Rollback considerations:

- Unsafe once processing starts.

Validation checklist:

- Offset cannot exist for unknown consumer/event.

Testing requirements:

- Duplicate offset rejected.

### 038 — `038_events_create_replay_operations.sql`

Purpose:

- Create approved event replay operation table.

Tables created:

- `app_internal.replay_operations`.

Constraints:

- Required requester and motivo.
- Approval required for high-risk category.
- Status/risk category constrained.
- Scope filter required.

Indexes:

- `(status, created_at desc)`.
- `(requested_by, created_at desc)`.
- `(categoria_riesgo, created_at desc)`.

Dependencies:

- 035, 033.

Rollback considerations:

- Unsafe once replay operations exist.

Validation checklist:

- Blast-radius fields available.

Testing requirements:

- High-risk replay without approval rejected where enforceable.

### 039 — `039_events_create_idempotency_keys.sql`

Purpose:

- Create idempotency foundation for commands/workers/providers.

Tables created:

- `app_internal.idempotency_keys`.

Constraints:

- Non-null scope namespace.
- Unique idempotency tuple. Null organization ambiguity must be resolved with explicit platform namespace.
- Expiry required.
- Status constrained.

Indexes:

- Unique `(scope_namespace, scope, key_hash)` or approved equivalent.
- `(expires_at)`.
- `(status, created_at)`.

Dependencies:

- 006.

Rollback considerations:

- Unsafe once command idempotency uses table.

Validation checklist:

- Platform-scope and organization-scope keys cannot collide unexpectedly.

Testing requirements:

- Duplicate key rejected.

### 040 — `040_rls_create_authorization_helpers.sql`

Purpose:

- Create hardened RLS helper functions.

Tables created:

- None.

Constraints:

- Fixed `search_path`.
- Security mode specified per helper.
- No dynamic SQL.
- Helpers implement active membership predicate.

Indexes:

- None created here; required helper indexes must already exist or be added in 046.

Dependencies:

- 020, 022, 023, 017, 018, 019.

Rollback considerations:

- Function changes must be forward-compatible once policies depend on them.

Validation checklist:

- Helper catalog implemented: auth user, organization membership, branch membership, organization permission, branch permission, franchise reporting, support grant, break-glass, platform operator, audit read.

Testing requirements:

- Unit-style DB tests for active/revoked/expired/future roles and grants.

### 041 — `041_rls_enable_foundation_tables.sql`

Purpose:

- Enable RLS on all Wave 1 application-owned tables.

Tables affected:

- All `app_public`, `app_private`, `audit`, `analytics` Wave 1 tables where applicable.
- `app_internal` internal-only tables follow deny/no-client-grant posture and may enable RLS for defense in depth.

Constraints:

- No table can be exposed without policy.

Indexes:

- None.

Dependencies:

- 040.

Rollback considerations:

- Disabling RLS is forbidden in shared/prod environments.

Validation checklist:

- RLS enabled table inventory matches expected list.

Testing requirements:

- Anonymous/authenticated no-policy access denied.

### 042 — `042_rls_create_identidad_policies.sql`

Purpose:

- Create RLS policies for identity/access tables.

Tables affected:

- `perfiles`, `perfiles_privados_usuario`, `roles`, `permisos`, `permisos_rol`, `roles_usuario`, `sesiones`, `grants_soporte`, `grants_break_glass`.

Constraints:

- Own profile read/update limited.
- Private profiles server/support grant only.
- Roles/permisos admin/security only.
- Grants only security/support supervisors as approved.

Indexes:

- None unless inline policy performance demands are added to 046.

Dependencies:

- 040, 041.

Rollback considerations:

- Remove/replace policies only through forward migration.

Validation checklist:

- Revoked role denied.
- Expired support grant denied.
- No break-glass grant denied.

Testing requirements:

- Positive/negative RLS matrix for identity/access.

### 043 — `043_rls_create_organizaciones_policies.sql`

Purpose:

- Create RLS policies for organization/branch foundation tables.

Tables affected:

- `organizaciones`, `marcas`, `sucursales`, `sucursales_marcas`, `configuracion_sucursal`, `configuracion_operativa_sucursal`, `horarios_sucursal`, `excepciones_horario_sucursal`, `zonas_entrega_sucursal`.

Constraints:

- Organization members only within organization.
- Branch members only within sucursal scope.
- Franquiciante reporting does not grant raw operational table access.

Indexes:

- None.

Dependencies:

- 040, 041, 042.

Rollback considerations:

- Forward policy replacement only.

Validation checklist:

- Cross-organization and cross-branch reads denied.
- Parent franquiciante raw reads denied without explicit delegated permission.

Testing requirements:

- Tenant, branch, franchise boundary RLS tests.

### 044 — `044_rls_create_audit_policies.sql`

Purpose:

- Create audit table RLS and deny-by-default posture.

Tables affected:

- `eventos_audit`, `logs_audit`, `logs_acceso_audit`, `eventos_seguridad`, `eventos_compliance`, `cambios_permisos`, `overrides_operativos`, `registros_incidente`, `politicas_retencion`, `legal_holds`, `revisiones_acceso`.

Constraints:

- Direct reads restricted.
- Writes only trusted server/audit writer paths.
- Audit access logs protected.

Indexes:

- None.

Dependencies:

- 026-033, 040, 041.

Rollback considerations:

- Never open broad audit reads as rollback.

Validation checklist:

- Direct client audit access denied.
- Audit reviewer access requires permission and access logging path.

Testing requirements:

- Audit read denied without permission; access log required in integration later.

### 045 — `045_rls_create_events_policies.sql`

Purpose:

- Lock down internal event runtime tables.

Tables affected:

- `event_catalog`, `outbox_events`, `event_consumers`, `event_consumer_offsets`, `replay_operations`, `idempotency_keys`.

Constraints:

- No anon/authenticated client access.
- Worker/service access only through approved role/path.

Indexes:

- None.

Dependencies:

- 034-039, 040, 041.

Rollback considerations:

- Do not grant client access to fix worker issue.

Validation checklist:

- Client roles denied.
- Worker role path documented.

Testing requirements:

- Authenticated direct select/insert denied.

### 046 — `046_indexes_create_foundation_indexes.sql`

Purpose:

- Add any foundation indexes not created inline with table migrations.
- Ensure RLS helper and worker paths are performant.

Tables affected:

- All Wave 1 tables as needed.

Constraints:

- No constraints unless index-backed uniqueness omitted earlier.

Indexes:

- FK indexes.
- RLS predicate indexes.
- Lookup indexes.
- Audit indexes.
- Event worker indexes.

Dependencies:

- 001-045.

Rollback considerations:

- Dropping indexes in production only with query-plan review.

Validation checklist:

- Every FK has index.
- Every RLS predicate has supporting index.
- Outbox worker claim index exists.

Testing requirements:

- Query plan checks for RLS helpers and outbox claim.

### 047 — `047_seeds_seed_permisos_base.sql`

Purpose:

- Seed deterministic base permissions.

Tables changed:

- `app_private.permisos`.

Constraints:

- Idempotent seed.
- No wildcard business permissions.
- High-risk permissions flagged.

Indexes:

- Uses unique permission code index.

Dependencies:

- 018.

Rollback considerations:

- Do not delete in production; deprecate or corrective seed.

Validation checklist:

- Required base permissions present.

Testing requirements:

- Re-running seed does not duplicate.

### 048 — `048_seeds_seed_roles_base.sql`

Purpose:

- Seed deterministic base roles.

Tables changed:

- `app_private.roles`.

Constraints:

- Roles: `cliente`, `operador_cocina`, `operador_entrega`, `supervisor_sucursal`, `administrador_sucursal`, `administrador_organizacion`, `soporte`, `platform_operator`, `security_admin`.
- `super_admin` unrestricted role must not be seeded.

Indexes:

- Uses role code indexes.

Dependencies:

- 017.

Rollback considerations:

- Deprecate/correct forward, do not delete if assigned.

Validation checklist:

- No broad super_admin exists.

Testing requirements:

- Re-running seed idempotent.

### 049 — `049_seeds_seed_permisos_rol_base.sql`

Purpose:

- Seed deterministic role-permission mappings.

Tables changed:

- `app_private.permisos_rol`.

Constraints:

- Least privilege mapping.
- Support role does not receive unrestricted tenant read.
- Platform operator does not receive raw business read by default.

Indexes:

- Uses PK and reverse index.

Dependencies:

- 047, 048.

Rollback considerations:

- Correct forward with new mapping or revocation audit.

Validation checklist:

- High-risk permissions not assigned broadly.

Testing requirements:

- Expected permission matrix generated and compared.

### 050 — `050_validation_create_foundation_comments.sql`

Purpose:

- Add comments/ownership metadata to schemas, tables, columns and helper functions.

Tables created:

- None.

Constraints:

- None.

Indexes:

- None.

Dependencies:

- 001-049.

Rollback considerations:

- Safe to correct comments forward.

Validation checklist:

- Every table has owner comment.
- Every RLS helper has security comment.

Testing requirements:

- Documentation/query check for missing comments.

### 051 — `051_validation_verify_wave1_integrity.sql`

Purpose:

- Final validation migration/checkpoint for Wave 1 foundation readiness.

Tables created:

- None.

Constraints:

- No new functional constraints unless validation reveals missing requirement.

Indexes:

- None.

Dependencies:

- 001-050.

Rollback considerations:

- If validation fails, fix forward with corrective migration before any feature migration.

Validation checklist:

- Schemas exist.
- Extensions enabled.
- All tables exist.
- RLS enabled as expected.
- Base roles/permisos seeded.
- No unrestricted `super_admin` role.
- Audit access log table exists.
- Outbox/indexes exist.
- Support and break-glass grants exist.

Testing requirements:

- CI must run Wave 1 smoke checks after full migration chain.

---

## 4. Migration Dependency Graph

```text
001_schemas
→ 002_extensions
→ 003_grants
→ 004_monedas
→ 005_helpers
→ 006_organizaciones
→ 007_marcas
→ 008_sucursales
→ 009_sucursales_marcas
→ 010_configuracion_sucursal
→ 011_configuracion_operativa_sucursal
→ 012_horarios_sucursal
→ 013_excepciones_horario_sucursal
→ 014_zonas_entrega_sucursal
→ 015_perfiles
→ 016_perfiles_privados_usuario
→ 017_roles
→ 018_permisos
→ 019_permisos_rol
→ 020_roles_usuario
→ 021_sesiones
→ 022_grants_soporte
→ 023_grants_break_glass
→ 024_politicas_retencion
→ 025_legal_holds
→ 026_eventos_audit
→ 027_logs_audit
→ 028_logs_acceso_audit
→ 029_eventos_seguridad
→ 030_eventos_compliance
→ 031_cambios_permisos
→ 032_overrides_operativos
→ 033_registros_incidente
→ 034_event_catalog
→ 035_outbox_events
→ 036_event_consumers
→ 037_event_consumer_offsets
→ 038_replay_operations
→ 039_idempotency_keys
→ 040_rls_helpers
→ 041_rls_enable
→ 042_identidad_policies
→ 043_organizaciones_policies
→ 044_audit_policies
→ 045_events_policies
→ 046_indexes
→ 047_seed_permisos
→ 048_seed_roles
→ 049_seed_permisos_rol
→ 050_comments
→ 051_verify_wave1
```

Parallelization policy:

- Do not parallelize migrations inside a single environment.
- SQL authors may work on separate files in parallel, but integration order is fixed.

---

## 5. Rollback Considerations Summary

| Migration range | Safe rollback before data | Production rollback |
| --- | --- | --- |
| 001-005 | Reset local/staging only. | Forward repair grants/extensions/functions. |
| 006-014 | Reset only before tenant data. | Correct forward; never drop tenant tables. |
| 015-023 | Reset only before auth/user data. | Correct forward; never delete role/grant history. |
| 024-033 | Never destructive after any audit row. | Append corrective compliance/audit event. |
| 034-039 | Never destructive after event processing begins. | Pause workers, correct forward, replay if approved. |
| 040-045 | Do not disable RLS as rollback. | Replace policies/helpers forward. |
| 046 | Index rollback only with query-plan review. | Drop/recreate index only through approved migration. |
| 047-049 | Do not delete base RBAC in prod. | Deprecate/correct forward. |
| 050-051 | Correct forward. | Correct forward. |

---

## 6. Validation and Testing Gates

### 6.1 Required validation before merge

- Migration file order matches this document.
- No SQL file contains business entity names in English.
- No table missing owner comment.
- No tenant-owned table missing `organizacion_id` unless documented exception.
- No branch-scoped table missing `sucursal_id` unless documented exception.
- No private/internal/audit table has direct client grant.
- No unrestricted `super_admin` role seed exists.

### 6.2 Required automated tests

| Test suite | Required coverage |
| --- | --- |
| Migration reset | Apply 001-051 from empty database. |
| RLS negative | Cross-organization, cross-sucursal, anonymous, no membership, revoked, expired, future role. |
| RLS positive | Own organization, own sucursal, approved support grant, approved break-glass grant. |
| Tenant consistency | Cross-tenant FK attempts fail. |
| Audit immutability | Update/delete audit fact attempts fail. |
| Audit access | Audit read path creates `logs_acceso_audit`. |
| Outbox concurrency | Multiple workers cannot claim same event. |
| Replay authorization | High-risk replay requires approval. |
| Idempotency | Duplicate key rejected. |
| Realtime readiness | Only projection-safe tables are candidates for publications. |

### 6.3 Required manual review

- Database Architecture review.
- Security review.
- Supabase Platform review.
- Audit/Compliance review.
- Event Architecture review.
- SRE production-readiness review.

---

## 7. Final Gate Before SQL Authoring

SQL generation may begin only when:

1. This migration implementation plan is approved.
2. The P0 hardening specification is reflected in migrations 001-051.
3. The ARB report has no unresolved P0 blockers for Wave 1.
4. Test suite names and owners are assigned.
5. Rollback/forward-repair owner is assigned.
6. Production execution checklist is approved.
