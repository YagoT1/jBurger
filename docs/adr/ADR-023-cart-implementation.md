# ADR-023: Cart Implementation (dominio, persistencia atómica y API)

## Estado

Aprobado

## Fecha

2026-07-19

## Contexto

El Bloque 3 (plan aprobado en `docs/status/phase-2-block-3-cart-plan.md`) requería un carrito server-authoritative para usuarios autenticados: intención de compra sin verdad financiera, pricing recalculado contra catálogo y disponibilidad vigentes, concurrencia optimista multi-dispositivo, merge guest→login (ADR-009) y aislamiento multi-tenant. El dominio `@jburger/domain-cart` quedó implementado y testeado en los pasos 1–4; este ADR cubre los pasos 5–7: persistencia, API y decisiones de integración.

## Decisiones

### 1. Mutación de carrito atómica vía función Postgres (`apply_cart_mutation`)

La reconciliación de un carrito toca dos tablas (`carts` con CAS sobre `cart_version` + reemplazo de `cart_items`). Hacerlo con múltiples llamadas PostgREST dejaría una ventana de inconsistencia ante fallos parciales. Migración `202607190008_cart_apply_mutation_fn.sql`: función `security definer` con `search_path` fijo que ejecuta CAS + delete + insert en **una única transacción** y devuelve la nueva versión o `NULL` en conflicto. `EXECUTE` revocado para `anon`/`authenticated`/`public` (solo service role). Alternativa descartada: orquestar delete+insert desde la API (no transaccional, viola el criterio de integridad).

### 2. Persistencia por puertos, seleccionada por entorno (patrón establecido)

`SupabaseCartRepository` (RPC + PostgREST mediante `SupabaseRestClient`, que incorporó el método `rpc()`), `InMemoryCartRepository` para desarrollo con la misma semántica CAS, y fail-fast en producción sin configuración — idéntico criterio que Catalog (ADR-020) y Auth (ADR-021).

### 3. Reutilización del acceso a catálogo (sin duplicación)

`CatalogModule` exporta su token `CATALOG_PERSISTENCE`; `CartModule` lo importa y lo adapta al puerto `CartCatalogSource` con `CatalogSourceAdapter`. El carrito no conoce repositorios de catálogo ni duplica acceso a datos; la selección Supabase/in-memory del catálogo se hereda automáticamente.

### 4. Configuración operativa inyectada

`MAX_CART_ITEM_QUANTITY` (env, default 20, rango 1–99 validado por Zod) alimenta `CartConfig` del dominio. El techo absoluto (99) vive como constraint en DB; el límite operativo es configuración, no código.

### 5. Superficie HTTP y contrato de errores

`CartController` (`/cart`): `GET /` (carrito activo con pricing preview o `data: null`), `POST /items`, `PATCH /items/:productId`, `DELETE /items/:productId?version=`, `DELETE /?version=`, `POST /merge`. Toda mutación exige la versión conocida (body `cartVersion` o query `version`); toda respuesta devuelve el `PricedCart` recalculado (contrato homogéneo). Ownership por `customerId = actorId` del principal — sin permisos nuevos de vocabulario: el rol CLIENTE opera su propio carrito, y el aislamiento tenant/branch lo aplican los guards existentes. `CartDomainErrorFilter` traduce los códigos del dominio a HTTP (`VERSION_CONFLICT`→409, `QUANTITY_OUT_OF_RANGE`→400, `*_NOT_FOUND`→404, `PRODUCT_UNAVAILABLE`→422) sin acoplar el dominio a HTTP.

## Suposiciones documentadas

- El merge guest→login se invoca por endpoint dedicado (`POST /cart/merge`) desde el cliente tras autenticarse, con los ítems del carrito local (ADR-009). El disparo automático en el login queda para el bloque de frontend.
- `DELETE` transporta la versión por query param (evita cuerpos en DELETE, semántica compatible con clientes HTTP estándar).

## Deuda técnica registrada

- `expires_at`/`last_priced_at` se persisten pero la expiración automática de carritos (job/estado `expired`) queda para el bloque operativo, junto con `abandon/recover` (backlog de la integración con origin).
- `CatalogSourceAdapter.findAvailability` lista la disponibilidad de la sucursal y filtra en memoria; con catálogos grandes convendrá una consulta puntual (irrelevante para la operación actual).
- Auditoría de eventos `CART_*` vía logger estructurado; el outbox durable llega con la arquitectura event-driven (igual que Catalog/Auth). Integrar `SupabaseAuditEventPublisher` (aporte de origin) es el candidato natural del próximo bloque de observabilidad.

## Referencias

ADR-009, ADR-020, ADR-021, ADR-022, `docs/status/phase-2-block-3-cart-plan.md`, commerce-engine-architecture §3–5.
