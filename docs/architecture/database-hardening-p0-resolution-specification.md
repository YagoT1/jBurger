# J Burguer — Database Hardening Committee P0 Resolution Specification

## 0. Alcance y autoridad

> **Language policy:** Este documento cumple `docs/architecture/language-standard-business-spanish-technical-english.md`: negocio en español, técnica en inglés.

Este documento es la especificación obligatoria de hardening que resuelve los hallazgos P0 del Architecture Review Board antes de generar SQL migrations. No rediseña el producto, no crea nuevos dominios, no genera SQL, no genera migrations y no contiene código. Define decisiones de implementación que deben incorporarse en `docs/architecture/database-implementation-specification.md` y `docs/architecture/first-migration-set-specification.md` antes de Prompt 13 — SQL Migration Generation.

P0 findings resueltos:

- MT-01, MT-03, MT-05, MT-07.
- RLS-01, RLS-03, RLS-04, RLS-07.
- AU-01, AU-02, AU-04.
- EV-01, EV-03.
- SB-01, SB-02.
- SEC-01, SEC-05.

Regla de gate:

```text
No SQL migration authoring is allowed until this hardening specification is accepted and all P0 controls are reflected in the Wave 1 migration plan.
```

---

## 1. Tenant Hierarchy Hardening

### 1.1 Modelo jerárquico definitivo

La jerarquía canónica es:

```text
Platform
└── Organizacion
    ├── Franquiciante
    │   └── Franquiciado(s)
    ├── Marca(s)
    └── Sucursal(es)
```

`Platform` es la operación técnica de J Burguer. `Organizacion` es el boundary tenant. `Franquiciante` y `Franquiciado` son roles jerárquicos de organizaciones, no nuevos dominios. `Marca` es identidad comercial. `Sucursal` es unidad operacional física o virtual.

### 1.2 Tipos canónicos de organizacion

| Tipo | Descripción | Puede operar sucursales | Puede ver otras organizaciones | Puede imponer configuración |
| --- | --- | --- | --- | --- |
| `platform` | Organización técnica interna J Burguer. | No como negocio regular. | Solo con permisos break-glass o platform operator autorizados. | Solo configuración técnica/plataforma. |
| `empresa` | Organización independiente. | Sí. | No. | Solo sus propias marcas/sucursales. |
| `franquiciante` | Organización dueña de franquicia/marca. | Puede operar sucursales propias. | Solo franquiciados vinculados y solo según derechos definidos. | Puede publicar plantillas y estándares, no operar franquiciado por defecto. |
| `franquiciado` | Organización operadora bajo franquicia. | Sí. | No puede ver otros franquiciados. | Control operativo sobre sus sucursales salvo restricciones contractuales. |

### 1.3 Ownership, visibility and authority

| Nivel | Owns | Can see | Cannot see | Operational authority | Reporting rights |
| --- | --- | --- | --- | --- | --- |
| Platform | Configuración técnica, service roles, system policies. | Metadata técnica necesaria para operación. | Datos de negocio tenant sin grant/break-glass. | Ninguna sobre sucursal sin flujo autorizado. | Solo métricas agregadas permitidas. |
| Organizacion empresa | Marcas, sucursales, personal, catálogo, promociones, pedidos propios. | Todo dentro de su `organizacion_id`. | Otras organizaciones. | Total sobre sus sucursales. | Sus métricas. |
| Franquiciante | Marcas franquiciadas, plantillas, estándares, reportes agregados autorizados. | Franquiciados vinculados mediante vistas agregadas o grants explícitos. | Datos personales, pagos detallados, soporte privado de franquiciados salvo permiso contractual. | No puede operar sucursal franquiciada por defecto. | Agregados por franquiciado/sucursal con políticas de minimización. |
| Franquiciado | Sucursales propias, personal propio, operación propia. | Sus datos. | Otros franquiciados y operaciones privadas del franquiciante. | Total sobre sus sucursales. | Sus métricas. |
| Marca | Identidad comercial, assets, theme, menu templates. | Datos asociados a marca dentro de organización autorizada. | Otras marcas sin relación. | Ninguna por sí sola; autoridad viene de organización/sucursal. | Métricas de marca en scope. |
| Sucursal | Operación local, cocina, entregas, horarios, disponibilidad. | Sus datos operativos. | Otras sucursales salvo rol multi-sucursal. | Operación diaria. | Métricas de sucursal. |

### 1.4 Franchise reporting model

Franquiciante reporting nunca debe usar acceso directo a tablas operativas de franquiciados. Debe usar uno de tres mecanismos:

1. Read models agregados por `organizacion_id_franquiciante` + `organizacion_id_franquiciado`.
2. Vistas analytics con minimización de PII.
3. Grants explícitos de reporting con alcance, propósito y expiración.

Reglas:

- No raw pedidos, pagos, perfiles privados o soporte privado para franquiciante por defecto.
- Métricas financieras deben agregarse por ventana temporal y sucursal/marca, sin exponer datos personales.
- Si el contrato exige acceso detallado, debe modelarse como permiso explícito auditado.

### 1.5 Franchise operational model

Franquiciante no puede operar sucursales de franquiciado por defecto. Acciones operativas permitidas solamente con permiso explícito:

- Publicar plantillas de marca o catálogo.
- Sugerir configuración.
- Aplicar estándares si contrato lo permite.
- Ver cumplimiento agregado.

Acciones prohibidas sin grant explícito:

- Pausar sucursal franquiciada.
- Cambiar horarios de sucursal franquiciada.
- Cambiar precios locales.
- Cancelar pedidos.
- Aprobar reembolsos.
- Reasignar entregas.
- Ver perfiles privados de clientes.

### 1.6 Franchise data isolation model

Las tablas de negocio siguen aisladas por `organizacion_id`. Las relaciones franquiciante/franquiciado se modelan con una relación jerárquica explícita y no reemplazan el tenant boundary.

Controles obligatorios:

- `organizacion_id` de la fila siempre es el propietario operacional.
- `organizacion_padre_id` o relación jerárquica solo otorga reporting/plantillas si RLS helper lo permite.
- Ninguna policy debe decir: “parent organization can read all child rows” sin filtrar tipo de dato, permiso y propósito.
- Analytics de franquicia debe consultar agregados, no OLTP raw tables.

### 1.7 RLS implications

RLS debe distinguir:

- `es_miembro_organizacion(organizacion_id)`.
- `es_miembro_sucursal(sucursal_id)`.
- `tiene_permiso_franquicia_reporte(franquiciante_id, franquiciado_id, recurso)`.
- `tiene_permiso_operativo_delegado(franquiciante_id, sucursal_id, accion)`.

Parent hierarchy alone is never sufficient authorization.

### 1.8 Future multi-brand and white-label support

Multi-brand:

- Una `organizacion` puede tener múltiples `marcas`.
- Una `sucursal` puede operar una o más `marcas` solamente si existe relación explícita `sucursales_marcas` en una migration futura.
- Hasta que exista esa relación, `marca_id` en `sucursales` significa marca principal, no exclusividad global.

White-label:

- White-label no puede compartir `organizacion_id` entre clientes distintos.
- Branding, domains, themes y assets pueden ser compartidos o heredados, pero datos operativos permanecen aislados por organización.

---

## 2. Tenant Consistency Enforcement

### 2.1 Principle

Toda relación tenant-owned debe ser imposible de corromper por accidente. No basta con RLS; la integridad debe estar protegida por constraints, composite keys o validation triggers aprobados.

### 2.2 Composite FK strategy

Regla obligatoria:

- Toda tabla hija con `organizacion_id` que referencia una tabla padre tenant-owned debe validar que el padre pertenece a la misma organización.
- La estrategia preferida es composite FK contra una unique key `(organizacion_id, id)` en la tabla padre.
- Cuando PostgreSQL constraints no sean viables por particiones o diseño, se requiere validation trigger controlado y testeado.

Ejemplos normativos:

| Relación | Requisito |
| --- | --- |
| `sucursales.organizacion_id -> organizaciones.id` | FK directa y unique `(organizacion_id, id)` para referencias compuestas. |
| `marcas.organizacion_id -> organizaciones.id` | FK directa y unique `(organizacion_id, id)`. |
| `sucursales.marca_id` | Debe validar `(organizacion_id, marca_id)` contra `marcas(organizacion_id, id)`. |
| `roles_usuario.sucursal_id` | Debe validar que sucursal pertenece al mismo `organizacion_id`. |
| `configuracion_sucursal.sucursal_id` | Debe validar `(organizacion_id, sucursal_id)`. |
| `zonas_entrega_sucursal.sucursal_id` | Debe validar `(organizacion_id, sucursal_id)`. |

### 2.3 Mandatory tenant rules for every domain

| Domain | Mandatory rule |
| --- | --- |
| identidad-acceso | Role assignments must include correct scope and cannot point to sucursal from another organización. |
| organizaciones-sucursales | Marca/sucursal/configuración relations must be organization-consistent. |
| catalogo-menu | Producto, categoría, combo and branch overrides must share `organizacion_id`. |
| carrito-finalizacion-compra | Carrito must reference sucursal in same organización and all items must inherit same organization. |
| pedidos | Pedido, items, payment references and delivery references must share organization and branch where applicable. |
| pagos | Pago/reembolso must reference pedido in same organization; provider payload cannot override organization. |
| cocina | Ticket cocina must reference pedido/sucursal in same organization. |
| entregas | Asignacion entrega and comprobante entrega must reference pedido/sucursal in same organization. |
| promociones-fidelizacion | Cupon/canje/cuenta fidelity must not cross organization unless explicit franchise promotion model exists. |
| notificaciones | Delivery records must inherit organization from source entity and cannot be manually reassigned across tenant. |
| soporte | Caso soporte scope must match customer/order/payment organization; support grants are scoped. |
| audit | Entity references may be generic, but organization/branch context must be captured at occurrence time. |
| analytics | Raw events must include organization context or be explicitly platform technical events. |

### 2.4 Relationship validation

Every migration introducing FK-like relationship must document:

- Parent table.
- Child table.
- Whether relationship is tenant-owned or global.
- Tenant consistency enforcement mechanism.
- Negative test proving cross-tenant insert/update fails.

---

## 3. RLS Engine Specification

### 3.1 RLS philosophy

RLS is the containment boundary. Application authorization improves UX and command safety, but RLS must prevent tenant leakage even if application code is wrong.

Rules:

- JWT claims are identity hints, not authorization truth for privileged access.
- Active membership and permissions are resolved from database state.
- Every helper must be deterministic, reviewed and performance-tested.
- Every exposed table must have positive and negative policy tests before migration approval.

### 3.2 RLS architecture

RLS is composed of:

1. Identity resolution from Supabase `auth.uid()`.
2. Membership resolution from active `roles_usuario`.
3. Permission resolution through `roles`, `permisos_rol`, `permisos` or approved permission projection.
4. Scope resolution for organización, sucursal, support grant, break-glass grant.
5. Table policies using helper functions only.

### 3.3 Helper function hardening rules

All RLS helper functions must specify:

- `SECURITY DEFINER` only when strictly necessary; otherwise `SECURITY INVOKER`.
- Fixed `search_path` to trusted schemas only.
- No dynamic SQL.
- No dependence on mutable client-provided settings except Supabase auth context.
- No broad exception swallowing.
- Stable naming and comments with owner.
- Query plans validated with realistic role counts.

### 3.4 Helper function catalog

| Helper | Purpose | Inputs | Output | Security mode | search_path | Caching/performance |
| --- | --- | --- | --- | --- | --- | --- |
| `auth_usuario_id()` | Resolve current Supabase user. | None. | UUID nullable. | INVOKER. | `pg_catalog, auth`. | Cheap; may rely on `auth.uid()`. |
| `es_miembro_organizacion(p_organizacion_id)` | Active organization membership. | Organization UUID. | boolean. | DEFINER if private tables queried. | fixed `app_private, app_public, pg_catalog`. | Must use index `(usuario_id, organizacion_id, estado)`. |
| `es_miembro_sucursal(p_sucursal_id)` | Active branch membership. | Sucursal UUID. | boolean. | DEFINER. | fixed. | Must validate organization consistency. |
| `tiene_permiso_organizacion(p_organizacion_id, p_permiso)` | Permission at organization scope. | UUID, permission code. | boolean. | DEFINER. | fixed. | May use permission projection if joins become slow. |
| `tiene_permiso_sucursal(p_sucursal_id, p_permiso)` | Permission at branch scope. | UUID, permission code. | boolean. | DEFINER. | fixed. | Checks branch role or organization-level permission. |
| `tiene_permiso_franquicia_reporte(p_franquiciante_id, p_franquiciado_id, p_recurso)` | Reporting-only franchise access. | UUIDs, resource. | boolean. | DEFINER. | fixed. | Must not allow raw operational rows unless explicitly permitted. |
| `tiene_grant_soporte(p_organizacion_id, p_sujeto_tipo, p_sujeto_id, p_permiso)` | Purpose-limited support access. | Scope and permission. | boolean. | DEFINER. | fixed. | Must check active, unexpired, approved support grant. |
| `tiene_break_glass_activo(p_scope, p_permiso)` | Emergency access. | Scope, permission. | boolean. | DEFINER. | fixed. | Must check active break-glass grant, expiry, incident ID. |
| `es_platform_operator(p_permiso)` | Technical platform operation permission. | Permission. | boolean. | DEFINER. | fixed. | Must not imply business data access. |
| `puede_leer_audit(p_organizacion_id, p_categoria)` | Audit read authorization. | Organization UUID, category. | boolean. | DEFINER. | fixed. | Direct table reads still discouraged; prefer audited endpoint. |

### 3.5 Active membership predicate

A membership/role assignment is active only if:

- `roles_usuario.estado = 'activo'`.
- `roles.estado = 'activo'`.
- Current timestamp is after `inicia_at` when set.
- Current timestamp is before `expira_at` when set.
- `revocado_at` is null.
- Related `organizacion` is active.
- Related `sucursal` is active when branch-scoped.

Any missing condition is a P0 defect.

### 3.6 Mandatory RLS test matrix

For every RLS-protected table in Wave 1:

| Test class | Required tests |
| --- | --- |
| Positive | Own organization member can read allowed row; own branch role can read allowed branch row; admin with exact permission can execute allowed operation. |
| Negative | Other organization denied; other branch denied; anonymous denied; authenticated no membership denied; missing permission denied. |
| Boundary | Parent franchisor without reporting grant denied raw child rows; franchise reporting grant allowed only approved aggregate/reporting view. |
| Revoked | Revoked role denied immediately. |
| Expired | Expired role denied immediately. |
| Future role | Role with `inicia_at` in future denied. |
| Suspended tenant | Suspended organization denied business operations. |
| Support | Support without grant denied; expired support grant denied; wrong purpose denied. |
| Break-glass | No active break-glass denied; expired break-glass denied; active approved grant allowed only scope/permission. |
| Performance | Representative query plan does not scan all `roles_usuario` or all tenant rows. |

---

## 4. Support Access Model

### 4.1 Principle

`soporte` has no unrestricted access. Support access is grant-based, temporary, purpose-bound, minimal, audited and revocable.

### 4.2 Support grant model

Wave 1 must add or reserve a support grant foundation before production support workflows.

Required logical record: `grants_soporte`.

Required fields:

- `id`.
- `organizacion_id`.
- `sucursal_id` nullable.
- `usuario_soporte_id`.
- `sujeto_tipo`: `cliente`, `pedido`, `pago`, `entrega`, `caso_soporte`, `sucursal`.
- `sujeto_id` nullable when scope is broader but justified.
- `permisos` list or scoped permission set.
- `motivo`.
- `caso_soporte_id` nullable for linkage.
- `aprobado_por`.
- `inicia_at`, `expira_at`.
- `estado`: `solicitado`, `aprobado`, `activo`, `revocado`, `expirado`.
- `created_at`, `updated_at`, `revocado_at`.

### 4.3 Approval requirements

| Access type | Approval |
| --- | --- |
| Read own support case context | Support supervisor approval or automated case-scoped grant. |
| Read cliente profile/private data | Supervisor approval, reason required. |
| Read pago/reembolso data | Supervisor + finance/security permission. |
| Export data | Security approval and audit event. |
| Cross-organization support | Break-glass or explicit organization support contract. |

### 4.4 Support workflow

1. Support user opens or is assigned `caso_soporte`.
2. System creates requested grant with minimal subject scope.
3. Approver approves grant or automated policy approves low-risk case-scoped read.
4. Grant becomes active for short TTL.
5. Every sensitive read/action writes audit access log.
6. Grant expires automatically or is revoked.
7. Case closure revokes remaining grants.

### 4.5 Customer privacy protections

- Redact payment provider payloads by default.
- Show only masked contact fields unless permission requires full value.
- Never expose unrelated pedidos/pagos outside grant subject.
- Export requires explicit approval and audit.

### 4.6 Support escalation

Escalation to broader access requires:

- Existing case.
- Business justification.
- Higher approval.
- Shorter expiration for high-risk grants.
- Audit event and incident link if emergency.

---

## 5. Break Glass Access Model

### 5.1 Replacement of super_admin

`super_admin` must not be a normal operational role. It is replaced by three access models:

| Model | Purpose | Business data access |
| --- | --- | --- |
| `platform_operator` | Technical platform operations. | No tenant business data by default. |
| `security_admin` | Security administration and policy review. | Scoped, audited, least privilege. |
| `break_glass_access` | Emergency access during incident. | Temporary, approved, audited, postmortem-required. |

### 5.2 platform_operator

Scope:

- Technical health, migrations, worker operations, event pipeline operations.

Cannot:

- Read raw cliente, pedido, pago, soporte or audit contents unless separate grant exists.

Audit:

- All service-role actions logged.

### 5.3 security_admin

Scope:

- Roles, permisos, security events, access reviews, support grants, break-glass approvals.

Restrictions:

- Cannot use security_admin to perform tenant business operations.
- Sensitive audit export requires second approval.

### 5.4 break_glass_access

Required logical record: `grants_break_glass`.

Fields:

- `id`.
- `usuario_id`.
- `scope_tipo`: platform, organizacion, sucursal.
- `organizacion_id`, `sucursal_id` nullable.
- `permisos`.
- `incidente_id` required.
- `motivo` required.
- `aprobado_por` required unless life-safety/critical outage policy permits delayed approval.
- `inicia_at`, `expira_at`.
- `estado`.
- `created_at`, `revocado_at`.

Rules:

- Default max duration: 2 hours.
- High-risk data export: separate approval.
- All reads/actions audited.
- Mandatory postmortem for production use.

### 5.5 Emergency workflow

1. Incident declared.
2. User requests break-glass grant with scope and reason.
3. Security/admin approval recorded.
4. Grant activates with TTL.
5. All accesses write audit access log.
6. Grant expires/revokes.
7. Postmortem completed and linked to incident record.

---

## 6. Audit Immutability Specification

### 6.1 Append-only guarantees

Audit fact tables are append-only:

- `eventos_audit`.
- `eventos_seguridad`.
- `eventos_compliance`.
- `cambios_permisos`.
- `overrides_operativos`.
- `registros_incidente` timeline records when implemented as event rows.

No application role may update or delete audit fact rows.

### 6.2 Immutability enforcement

Required controls:

- No direct grants to client roles for insert/update/delete on audit fact tables.
- Insert only through trusted audit writer path.
- Update blocked except approved retention/legal hold technical fields.
- Delete blocked except retention worker operating under retention policy and legal hold checks.
- All privileged retention operations write compliance event.

### 6.3 Retention model

Retention is policy-driven, not ad hoc string interpretation.

Required logical record: `politicas_retencion`.

Fields:

- `id`.
- `clase_retencion`.
- `descripcion`.
- `duracion_dias`.
- `aplica_a`.
- `requiere_legal_hold_check`.
- `estado`.
- `version`.
- `created_at`, `effective_at`, `deprecated_at`.

### 6.4 Legal hold model

A boolean `legal_hold` is insufficient alone. Required logical record: `legal_holds`.

Fields:

- `id`.
- `scope_tipo`: entidad, organizacion, sucursal, categoria, rango_tiempo.
- `scope` jsonb.
- `motivo`.
- `solicitado_por`.
- `aprobado_por`.
- `inicia_at`.
- `liberado_at` nullable.
- `estado`.
- `evidencia` jsonb.

### 6.5 audit_access_logs

Required logical table: `audit_access_logs` or canonical Spanish physical name `logs_acceso_audit`.

Records every privileged audit read/export.

Required fields:

- `id`.
- `usuario_id`.
- `tipo_actor`.
- `organizacion_id`, `sucursal_id` nullable.
- `tipo_acceso`: read, export, search, report.
- `recurso_audit`: eventos_audit, eventos_seguridad, eventos_compliance, logs_audit.
- `filtro_consulta_hash`.
- `cantidad_registros`.
- `motivo`.
- `grant_soporte_id` nullable.
- `break_glass_id` nullable.
- `correlation_id`.
- `occurred_at`.

Access:

- Only security/audit reviewers can read.
- Access to audit access logs is itself logged.

Retention:

- Minimum 7 years.
- Legal hold aware.

---

## 7. Audit Write Authority

### 7.1 Who can write audit records

Allowed writers:

- Central audit writer service/function.
- Trusted server command handlers through audit writer.
- Event consumers specifically authorized for audit ingestion.
- Retention/legal hold workers through compliance writer path.

Forbidden writers:

- Browser clients.
- Direct application table access.
- Generic service-role scripts.
- Support users.
- Platform operators outside approved audit writer.

### 7.2 Audit event validation

Audit writer must validate:

- Event category is allowed.
- `organizacion_id` and `sucursal_id` consistency.
- Actor type and actor identity.
- Entity type and entity reference.
- Required reason for human privileged action.
- Correlation ID exists.
- Retention class exists.
- Payload is redacted.

### 7.3 Redaction rules

Audit summaries must not contain:

- Full payment provider payloads.
- Full card/payment instrument data.
- Raw secrets/tokens.
- Full private support notes unless audit category requires protected storage.
- WhatsApp/email message body when not necessary.
- Unmasked customer contact data unless security/compliance requires it.

### 7.4 Mandatory audit event categories

- Permission/role changes.
- Support grants and support sensitive reads.
- Break-glass grants and all break-glass reads/actions.
- Organization/sucursal/marca configuration changes.
- Audit read/export access.
- Event replay requests/approvals/execution.
- Retention/legal hold changes.
- Service-role privileged operations.
- Future pagos/reembolsos/payment reconciliation actions.

---

## 8. Event Runtime Hardening

### 8.1 Delivery guarantee

The platform event runtime is **at-least-once**. Exactly-once delivery is not promised. Every consumer must be idempotent.

### 8.2 Outbox worker claiming strategy

Worker claiming requirements:

- Workers claim eligible rows by status and `available_at`.
- Claim must be atomic.
- Multiple workers must not publish the same event concurrently.
- Claimed rows move through explicit statuses: `pendiente`, `procesando`, `publicado`, `fallido`, `dead_letter`.
- Processing timeout returns row to retryable state or dead-letter depending attempt count.

Implementation may use row locking (`SKIP LOCKED`) or advisory locks, but strategy must be documented before SQL.

### 8.3 Retry and backoff

- Exponential backoff with jitter.
- Max attempts per event category.
- Provider/network failures retry.
- Schema validation failures go to dead-letter immediately or after minimal retry.
- Poison events must not block unrelated events.

### 8.4 Dead-letter and poison event strategy

Dead-letter record must include:

- Original event ID.
- Failure category.
- Last error safe message.
- Attempt count.
- Consumer or publisher that failed.
- Timestamps.
- Required owner team.

Poison event rules:

- Alert when event enters dead-letter.
- Owner must triage.
- Replay requires approval.
- Manual payload mutation is forbidden; correction requires compensating event or code fix plus replay.

### 8.5 Replay ownership and authorization

Replay is a privileged operation.

Required controls:

- Requester and approver must be different for high-risk replay.
- Replay scope must be bounded by event name, time range, tenant/sucursal and aggregate when possible.
- Dry-run count required.
- Max event count threshold requires escalation.
- Financial/audit/security event replay requires security approval.
- Every replay writes audit event.

### 8.6 Replay blast-radius controls

Replay operation must define:

- Event filters.
- Consumer targets.
- Side effects enabled/disabled.
- Idempotency proof.
- Roll-forward repair plan.
- Monitoring plan.
- Abort criteria.

---

## 9. Supabase Realtime Hardening

### 9.1 Channel model

Canonical channel families:

| Channel | Pattern | Payload class |
| --- | --- | --- |
| Tenant channel | `tenant:<organizacion_id>:system` | Low-rate tenant notices only. |
| Branch operations | `tenant:<organizacion_id>:sucursal:<sucursal_id>:operaciones` | Branch status, capacity, incidents. |
| Cocina | `tenant:<organizacion_id>:sucursal:<sucursal_id>:cocina` | Ticket cocina projection only. |
| Entregas | `tenant:<organizacion_id>:sucursal:<sucursal_id>:entregas` | Assignment/status projection only. |
| Cliente pedidos | `tenant:<organizacion_id>:cliente:<usuario_id>:pedidos` | Own pedido status only. |
| Notificaciones | `tenant:<organizacion_id>:cliente:<usuario_id>:notificaciones` | Own notification delivery status only. |

No raw pagos, audit, support private notes, provider payloads or internal outbox on realtime channels.

### 9.2 Fan-out and payload limits

Before production, define environment-specific limits:

- Max subscribers per sucursal channel.
- Max messages per second per channel.
- Max payload bytes per message.
- Max fields per payload.
- Max reconnect attempts before fallback.

Default design target:

- Publish projections, not raw tables.
- Payload contains IDs/status/timestamps only when possible.
- Clients refetch canonical state after reconnect.

### 9.3 Fallback strategy

If realtime degrades:

1. Client enters degraded mode.
2. Exponential reconnect backoff with jitter.
3. Polling fallback for branch dashboards.
4. Canonical refetch after reconnect.
5. Operations UI displays stale/degraded banner.
6. SRE alert if reconnect/message lag crosses threshold.

### 9.4 Realtime observability

Required metrics:

- Subscribers per channel.
- Messages per second per channel.
- Payload size distribution.
- Reconnect rate.
- Realtime lag by sucursal.
- Polling fallback activation count.
- Dropped/error messages.
- Client stale-state duration.

---

## 10. Supabase Auth Hardening

### 10.1 JWT trust policy

May trust JWT for:

- User identity hint (`auth.uid()`).
- Basic authenticated/anonymous distinction.
- Non-privileged UX personalization if no sensitive data exposure.

May never trust JWT alone for:

- Role assignment.
- Permission checks.
- Organization membership.
- Sucursal membership.
- Support grants.
- Break-glass grants.
- Payment/refund/audit/export permissions.

### 10.2 Role and permission updates

When roles/permisos change:

- Database state is authoritative immediately.
- RLS helpers consult active database rows.
- Existing JWTs must not preserve revoked privilege.
- Sensitive UI should force session refresh after role changes where practical.

### 10.3 Revocation and session invalidation

Revocation events:

- Role revoked.
- User suspended.
- Organization membership removed.
- Support grant revoked/expired.
- Break-glass grant revoked/expired.

Required response:

- Database RLS denies immediately.
- Application invalidates active session metadata if possible.
- Realtime subscriptions are closed or become unauthorized on refetch.
- Audit/security event emitted.

### 10.4 Token refresh requirements

- Privileged admin/support screens must refresh auth/session context on focus and before high-risk action.
- Step-up actions require fresh authentication state.
- Long-lived sessions must be bounded by active DB membership checks.

---

## 11. Security Hardening

### 11.1 Least privilege model

- No role receives wildcard tenant access.
- Permissions are granular by domain, resource, action and scope.
- High-risk operations require explicit permission and often approval/step-up.
- Service-role usage must be narrow, server-only and audited.

### 11.2 High-risk permissions

High-risk categories:

- Role/permission assignment.
- Support grant approval.
- Break-glass approval/use.
- Audit read/export.
- Future reembolso approval.
- Future pago reconciliation.
- Sucursal operational override.
- Event replay.
- Retention/legal hold changes.
- Storage private artifact access/export.

### 11.3 Step-up authorization

Step-up required for:

- Audit export.
- Break-glass activation.
- High-risk support grant.
- Permission changes with security/compliance scope.
- Event replay with financial/security/audit scope.
- Future refunds above configured threshold.

Step-up may include MFA, fresh auth, second approver or incident association depending risk.

### 11.4 Support isolation

Support access is isolated by:

- Grant scope.
- TTL.
- Subject/entity reference.
- Purpose.
- Approval.
- Audit access logs.
- Redacted views.

No support role can read arbitrary tenant rows through role alone.

---

## 12. P0 Mitigation Matrix

| Finding | Root cause | Required mitigation | Validation strategy | Production monitoring | Incident response |
| --- | --- | --- | --- | --- | --- |
| MT-01 | Franchise hierarchy under-specified. | Adopt hierarchy model with reporting vs operational authority. | RLS tests for franquiciante/franquiciado raw vs aggregate access. | Cross-franchise access denials and report query logs. | Disable franchise reporting grants and investigate audit logs. |
| MT-03 | Tenant FK consistency not mandatory. | Composite FK/validation strategy for every tenant relationship. | Negative cross-tenant insert/update tests. | Constraint violation alerts. | Quarantine corrupted rows, forward repair, audit incident. |
| MT-05 | Support role could become broad access. | Grant-based support access with TTL/purpose/audit. | Support no-grant denied; expired grant denied; scoped grant allowed. | Support access logs and anomaly detection. | Revoke grants, suspend account, incident review. |
| MT-07 | super_admin too broad. | Replace with platform_operator/security_admin/break_glass. | No normal role has unrestricted tenant read. | Break-glass activation alerts. | Revoke grant, rotate credentials, postmortem. |
| RLS-01 | Helper functions under-specified. | Define security mode/search_path/performance/test matrix. | Function review and RLS tests. | RLS denial/error metrics. | Disable exposed endpoint, patch policy/helper. |
| RLS-03 | Active membership predicate incomplete. | Canonical active predicate. | Revoked/expired/future/suspended tests. | Permission-denied and revoked-access attempts. | Force session invalidation and audit. |
| RLS-04 | Support access missing. | `grants_soporte` model or deny support access. | Support access matrix. | Support grant usage dashboard. | Revoke and investigate. |
| RLS-07 | Super-admin bypass. | Break-glass grant helper and deny broad bypass. | Expired/no grant denied. | Break-glass audit alerts. | Incident protocol. |
| AU-01 | Immutability not enforced. | DB-level append-only grants/guards. | Attempted update/delete fails. | Audit mutation attempt alerts. | Lock audit writer, security incident. |
| AU-02 | Audit write boundary unclear. | Central audit writer with validation/redaction. | Invalid audit event rejected. | Audit write failure/gap metrics. | Replay/repair audit with compliance event. |
| AU-04 | Audit access not logged. | `logs_acceso_audit`. | Audit read creates access log. | Audit reads without log alert. | Suspend audit access, investigate. |
| EV-01 | Worker claim race. | Atomic claim/retry/dead-letter model. | Concurrent worker tests. | Outbox duplicate/lag/dead-letter metrics. | Pause consumers, dedupe, replay safely. |
| EV-03 | Replay blast radius. | Approved bounded replay workflow. | Dry-run and approval required. | Replay operation alerts. | Abort replay, compensating events. |
| SB-01 | Realtime limits not concrete. | Channel/fan-out/payload/fallback limits. | Load and reconnect tests. | Realtime lag/reconnect dashboards. | Switch to polling/degraded mode. |
| SB-02 | JWT staleness. | DB-authoritative permissions and revocation. | Revoked token denied by RLS. | Stale-token denial metrics. | Force refresh/revoke sessions. |
| SEC-01 | Privileged access too broad. | Least privilege + break-glass. | Role permission diff tests. | High-risk permission usage alerts. | Revoke, rotate, incident. |
| SEC-05 | Support abuse risk. | Support grant lifecycle and redacted views. | Support abuse negative tests. | Support access anomaly alerts. | Revoke grants, privacy incident workflow. |

---

## 13. Approval Checklists

### 13.1 Implementation Checklist

- [ ] Tenant hierarchy semantics reflected in Wave 1 spec.
- [ ] Composite FK/tenant validation rules documented per table.
- [ ] RLS helper catalog approved.
- [ ] RLS test matrix added to migration gate.
- [ ] Support grant model added or support denied by default.
- [ ] Break-glass model replaces unrestricted `super_admin`.
- [ ] Audit immutability controls specified.
- [ ] Audit write authority specified.
- [ ] Audit access logging specified.
- [ ] Outbox claiming/retry/dead-letter specified.
- [ ] Replay blast-radius controls specified.
- [ ] Realtime limits/fallback specified.
- [ ] JWT trust policy specified.

### 13.2 Architecture Approval Checklist

- [ ] No new business domain introduced.
- [ ] Language policy followed.
- [ ] P0 findings mapped to mitigations.
- [ ] Franchise model accepted.
- [ ] Multi-brand/white-label constraints accepted.

### 13.3 Security Approval Checklist

- [ ] No broad super_admin remains.
- [ ] Support access is purpose-bound.
- [ ] High-risk permissions require approval/step-up.
- [ ] JWT is not authoritative for authorization.
- [ ] Service-role use is constrained and audited.

### 13.4 Database Approval Checklist

- [ ] All tenant relations have consistency enforcement plan.
- [ ] RLS helpers have safe security mode/search_path.
- [ ] Audit tables have immutability plan.
- [ ] Event runtime tables have worker semantics.
- [ ] Realtime publication tables are projections only.

### 13.5 Production Readiness Checklist

- [ ] P0 validation tests pass.
- [ ] RLS negative tests pass.
- [ ] Support/break-glass audit tests pass.
- [ ] Outbox concurrency tests pass.
- [ ] Realtime degradation tests pass.
- [ ] Audit access logging tests pass.
- [ ] Incident runbooks updated.

---

## 14. ADR Package

### ADR-001 — Tenant Hierarchy

Decision:

- `organizacion_id` remains tenant boundary.
- Franquiciante/franquiciado relationship grants reporting or delegated operational rights only through explicit permissions.
- Parent hierarchy never grants raw data access by default.

Consequences:

- RLS must distinguish membership, franchise reporting and delegated operations.
- Analytics roll-ups use approved aggregate views.

### ADR-002 — RLS Engine

Decision:

- Database state is authoritative for membership and permissions.
- RLS helpers must have fixed security mode, fixed `search_path`, no dynamic SQL and mandatory tests.
- JWT is identity hint only for privileged access.

Consequences:

- More database reads in policies; permission projection may be required for performance.

### ADR-003 — Support Access

Decision:

- Support access requires temporary approved grant.
- No unrestricted support role exists.
- Sensitive reads are audited and redacted.

Consequences:

- Support tooling must request/refresh grants.

### ADR-004 — Break Glass Access

Decision:

- Replace unrestricted `super_admin` with platform_operator, security_admin and break_glass_access.
- Break-glass requires incident, reason, approval, TTL and postmortem.

Consequences:

- Emergency workflows are slower but auditable.

### ADR-005 — Audit Immutability

Decision:

- Audit fact tables are append-only.
- Writes occur only through trusted audit writer.
- Reads/exports are logged in `logs_acceso_audit`.

Consequences:

- Retention and legal hold operations need controlled workers.

### ADR-006 — Event Runtime

Decision:

- Event delivery is at-least-once.
- Consumers must be idempotent.
- Outbox workers require atomic claim, retry, backoff and dead-letter handling.
- Replay requires approval and blast-radius controls.

Consequences:

- Consumer implementations must prove idempotency before production.

### ADR-007 — Supabase Realtime

Decision:

- Realtime publishes scoped projections only.
- Raw sensitive/internal tables are never published.
- Fan-out, payload, reconnect and fallback limits are mandatory.

Consequences:

- Clients must implement polling fallback and canonical refetch.

### ADR-008 — Supabase Auth

Decision:

- Supabase JWT can identify user but cannot authorize privileged operations alone.
- Role, membership and permission changes are effective immediately through database checks.
- Revoked/expired grants must deny access even with stale JWT.

Consequences:

- RLS and server commands must query active membership/permission state.

---

## 15. Final Gate

SQL migration generation remains blocked until:

1. This hardening specification is accepted.
2. `docs/architecture/first-migration-set-specification.md` is updated to reflect these controls.
3. `docs/architecture/database-implementation-specification.md` is updated to reflect these controls.
4. Architecture, Security, Database, Event, Audit/Compliance, Supabase Platform and SRE owners approve the final gate.
