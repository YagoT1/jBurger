# Roadmap operativo — J Burguer

Actualizado: 2026-07-19. Fuente de verdad del orden de entrega. Cada bloque se cierra con pipeline verde + Acceptance Test + documentación (ver `docs/engineering-standards.md` § Validation Gate).

## Hecho (con Acceptance aprobado)

1. **Fundación estabilizada** (ADR-019) — monorepo, pipeline, seguridad transversal.
2. **Catálogo (Bloque 1)** (ADR-020) — dominios categorías/productos/disponibilidad/menú, DB Supabase `jburger` aprovisionada, `GET /menu` real. Cerrado 2026-07-17.
3. **Autenticación real (Bloque 2)** (ADR-021, ADR-022) — Supabase Auth + RBAC desde DB, identidad RFC 4122, sesiones auditadas. Cerrado 2026-07-17.
4. **Consolidación de historial** — rebase integrador con `origin/main`, arquitectura unificada, capa legacy eliminada. Cerrado 2026-07-18/19.
5. **Carrito (Bloque 3)** (ADR-023) — dominio + mutación atómica en DB + persistencia Supabase/in-memory + `CartModule` HTTP. Gate 45/45 verde. **Cerrado 2026-07-19.**

6. **Checkout y Pedidos (Bloque 4)** (ADR-024) — checkout idempotente y transaccional (`place_order`), revalidación canónica de precios (`PRICE_CHANGED`), snapshot financiero inmutable, máquina de estados con CAS (`transition_order`), `OrdersModule` HTTP, contrato de idempotencia corregido (ADR-024 §1.1). Gate 45/45 verde. **Cerrado 2026-07-19.**

## En curso

7. **Pagos / Mercado Pago (Bloque 5)** (plan en `phase-2-block-5-payments-plan.md`; el ADR se numera al cierre del bloque) — dominio de pagos con puerto de proveedor abstracto, intentos idempotentes, ingesta de webhooks con verificación de firma; la confirmación del pedido pasa a estar gateada por el pago aprobado. **Plan preparado — pendiente de aprobación para implementar.**
8. **Frontend cliente (apps/web)** — menú + carrito + checkout consumiendo la API real; merge guest→login automático en el login.
9. **Operación** — cocina (kitchen tickets), estados operativos de carrito/pedido (expire/abandon/recover del backlog), panel admin sobre CRUD ya existente.
10. **Observabilidad productiva** — integrar `SupabaseAuditEventPublisher` como outbox de auditoría, correlation IDs end-to-end, métricas.
11. **Hardening de sesiones** — rotación por hash de refresh token, cache de principal, verificación de sesión por request (deuda ADR-021).

## Backlog documentado (origen: integración con origin/main)

Modelo editorial de categorías (jerarquía/slug/visibility), modifiers/combos, pricing avanzado, `domains/menus` (menú como entidad), `CartSummary`, familias de permisos ampliadas.

## Deuda técnica de higiene (detectada en auditoría 2026-07-19)

- **Dominios huérfanos de origin** sin ningún consumidor tras eliminar la capa commerce/ordering: `domains/{modifiers,combos,availability,pricing,order-drafts,pricing-engine,delivery-validation}`. Candidatos a eliminación en una pasada de higiene dedicada (verificar 0 referencias por cada uno). `domains/menus` se conserva (backlog menú-como-entidad).
- **Deps foundational sin uso actual en la API** (`@jburger/config`, `@jburger/telemetry`): retenidas con justificación — `telemetry` es prerequisito del bloque de Observabilidad (#10) y `config` de configuración tipada. Revisar al abordar esos bloques.

## Decisiones tomadas por el responsable de negocio

- **Proveedor de pagos: Mercado Pago** (decidido 2026-07-19). Estándar en Argentina para operación local. El Bloque 5 se diseña alrededor de su modelo (preferencia/pago + webhooks de notificación), detrás de un puerto de dominio abstracto para no acoplar el núcleo al proveedor.

## Decisiones que aún requieren intervención humana

Credenciales de Mercado Pago (access token / public key — se cargan por entorno, nunca al repo) y su modo (sandbox vs producción); dominio y hosting productivo final (ADR-004 propone Vercel/Supabase; confirmar al llegar al despliegue).
