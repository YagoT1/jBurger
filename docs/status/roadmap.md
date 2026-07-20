# Roadmap operativo — J Burguer

Actualizado: 2026-07-19. Fuente de verdad del orden de entrega. Cada bloque se cierra con pipeline verde + Acceptance Test + documentación (ver `docs/engineering-standards.md` § Validation Gate).

## Hecho (con Acceptance aprobado)

1. **Fundación estabilizada** (ADR-019) — monorepo, pipeline, seguridad transversal.
2. **Catálogo** (ADR-020) — dominios categorías/productos/disponibilidad/menú, DB Supabase `jburger` aprovisionada, `GET /menu` real. Cerrado 2026-07-17.
3. **Autenticación real** (ADR-021, ADR-022) — Supabase Auth + RBAC desde DB, identidad RFC 4122, sesiones auditadas. Cerrado 2026-07-17.
4. **Consolidación de historial** — rebase integrador con `origin/main`, arquitectura unificada, capa legacy eliminada. Cerrado 2026-07-18/19.

## En curso

5. **Carrito** (ADR-023, plan en `phase-2-block-3-cart-plan.md`) — dominio y tests ✅, mutación atómica en DB ✅, persistencia Supabase/in-memory ✅, `CartModule` HTTP ✅. **Pendiente: gate (`pnpm install && pnpm validate`) + Acceptance Tests AT-1…AT-10 y cierre documental.**

## Próximo (orden ratificado: Seguridad → Carrito → Pedidos → Pagos)

6. **Checkout y Pedidos** — order draft inmutable desde carrito validado (Cart ≠ Order Draft ≠ Order), revalidación canónica de precios (`price_changed` vive aquí), tablas orders/order_items/status events, transiciones operativas. Insumo: superficie order-drafts del backlog de integración.
7. **Pagos** — orquestación de intentos de pago e idempotencia (proveedor local a definir con negocio: decisión humana pendiente).
8. **Frontend cliente (apps/web)** — menú + carrito + checkout consumiendo la API real; merge guest→login automático en el login.
9. **Operación** — cocina (kitchen tickets), estados operativos de carrito/pedido (expire/abandon/recover del backlog), panel admin sobre CRUD ya existente.
10. **Observabilidad productiva** — integrar `SupabaseAuditEventPublisher` como outbox de auditoría, correlation IDs end-to-end, métricas.
11. **Hardening de sesiones** — rotación por hash de refresh token, cache de principal, verificación de sesión por request (deuda ADR-021).

## Backlog documentado (origen: integración con origin/main)

Modelo editorial de categorías (jerarquía/slug/visibility), modifiers/combos, pricing avanzado, `domains/menus` (menú como entidad), `CartSummary`, familias de permisos ampliadas.

## Decisiones que requieren intervención humana

Proveedor de pagos (Mercado Pago u otro — decisión de negocio/económica), dominio y hosting productivo final (ADR-004 propone Vercel/Supabase; confirmar al llegar al despliegue).
