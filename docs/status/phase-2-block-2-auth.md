# Fase 2 — Bloque 2: Autenticación real (CERRADO)

Fecha de cierre: 2026-07-17. Estado: **aceptado con evidencia objetiva** (Acceptance Test registrado en ADR-021).

## Entregado

- Migraciones `202607170005_users_auth_identity.sql` (identidad unificada `public.users.id` = `auth.users.id`) y `202607170006_audit_events_decouple.sql` (auditoría sin FK a entidades mutables) — aplicadas.
- Seeds `002_roles_base.sql`: 8 roles por defecto con su mapeo de permisos (OWNER 14, ADMIN 11, MANAGER 6, CAJERO 3, SOPORTE 3, COCINA 2, CLIENTE 2, DELIVERY 1) — aplicados y verificados.
- Re-identificación de todos los datos seed a UUIDs RFC 4122 (ADR-022), manteniendo validación estricta.
- API: `SupabaseAuthRepository`/`SupabaseSessionRepository` (PostgREST), infraestructura dev aislada, `AuthModule` global con selección por entorno y fail-fast en producción, `AuthenticatedGuard` real, `AuthController` completo (`login`, `refresh`, `logout` con control de pertenencia, `me`, `sessions`).
- Observabilidad: `AuthGatewayError` preserva el error original de GoTrue en `LOGIN_FAILED` y en el log interno `auth_login_failure` (sin credenciales, sin exposición al cliente); `LoggingEventPublisher` registra payloads con redacción de claves sensibles.
- Refactor de cohesión: `SupabaseRestClient` y token `EVENT_PUBLISHER` compartidos en `common/`.
- Tests del flujo de auth; pipeline `pnpm validate` en verde (lint, typecheck, test, build).
- Runbook `docs/runbooks/provision-first-user.md`; primer usuario OWNER aprovisionado y validado.

## Acceptance Test

APROBADO 2026-07-17: login real contra Supabase con resolución de principal/tenant/rol/permisos desde DB, `GET /auth/me` con el contexto completo (OWNER, 14 permisos). Detalle e incidencias en ADR-021.

## Deuda registrada (ver ADR-021)

Rotación/revocación por hash de refresh token; cache de resolución de principal (hasta 4 consultas por request); verificación de sesión por request.

## Referencias

ADR-008, ADR-015, ADR-021, ADR-022.
