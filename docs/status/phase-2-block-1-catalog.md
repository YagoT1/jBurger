# Fase 2 — Bloque 1: Catálogo (CERRADO)

Fecha de cierre: 2026-07-17. Estado: **aceptado con evidencia objetiva** (ver Acceptance Test en ADR-020).

## Entregado

- Dominios `@jburger/domain-categories` y `@jburger/domain-products` (contratos, `CategoryService`, `ProductService`, `AvailabilityService`, `MenuService` con puerto `MenuSource`) con tests unitarios.
- Migraciones `202607160003_catalog_foundation.sql` y `202607160004_security_hardening.sql`, aplicadas al proyecto Supabase `jburger` (`atlhxzclsmcahqlfwdrm`, sa-east-1) junto con `foundation` y `auth_access_foundation`.
- Seeds reproducibles: `000_permissions.sql` (vocabulario canónico) y `001_jburger_base.sql` (tenant, sucursal Roque Pérez, catálogo inicial).
- `CatalogModule` en la API: `GET /menu` público por tenant/sucursal, CRUD admin de categorías y productos, disponibilidad con override de precio por sucursal; persistencia por puertos con implementación Supabase (PostgREST, service role) e in-memory como fallback de desarrollo, con fail-fast en producción.
- Correcciones transversales: vocabulario de permisos unificado en `@jburger/domain-permissions`, `ARS` en `CurrencyCode`.

## Validación

- `pnpm validate` en verde (37 paquetes).
- Acceptance Test funcional aprobado contra Supabase (detalle en ADR-020).
- Advisors de seguridad de Supabase sin hallazgos pendientes tras `security_hardening`.

## Deuda técnica registrada

- `AuthenticatedGuard` era stub al cierre de este bloque; su reemplazo es el Bloque 2 (autenticación real).
- Repositorios PostgREST operan con service role desde el servidor; el aislamiento por tenant se aplica en cada consulta. Al introducir acceso directo desde clientes deberán revisarse policies RLS de escritura.
- Eventos de auditoría de dominio se publican vía logger estructurado; el outbox durable llegará con la arquitectura event-driven.

## Incidentes

- TLS local (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`): cerrado, causa raíz en el entorno de desarrollo, sin cambios de código. Ver `docs/troubleshooting.md` y ADR-020.
