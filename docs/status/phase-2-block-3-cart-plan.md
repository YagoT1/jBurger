# Fase 2 — Bloque 3: Carrito (IMPLEMENTADO 2026-07-19 — pendiente de gate + Acceptance)

> Estado: dominio (pasos 1–4) y adaptadores/API (pasos 5–7) implementados. Decisiones de persistencia y HTTP en ADR-023. Pendiente: `pnpm install && pnpm validate` y Acceptance Tests AT-1…AT-10 contra la API.

Fecha: 2026-07-17. Base arquitectónica: ADR-009 (guest en cliente, autenticado en DB, merge al login), commerce-engine-architecture §3–5 (Cart ≠ Order Draft ≠ Order; el carrito es intención, nunca verdad financiera).

## Ajustes aprobados en la revisión

1. **Límite de cantidad configurable**: `MAX_CART_ITEM_QUANTITY` se inyecta al dominio vía `CartConfig` (default 20, sobre-escribible por entorno sin tocar el dominio). La base de datos aplica un techo absoluto de sanidad (99) como defensa en profundidad; el límite operativo vive en configuración.
2. **AT-9 (idempotencia)** y **AT-10 (producto eliminado)** incorporados a la batería de aceptación.
3. **`price_changed` se difiere al bloque de Checkout**: detectar cambio de precio requiere persistir un snapshot de precios en el carrito, lo que tensiona el principio "el carrito nunca es verdad financiera". La revalidación canónica de precios pertenece al checkout (commerce-engine §1.2.2). En este bloque `validation_state` ∈ {`ok`, `unavailable`, `removed`}.
4. **`cart_items.product_id` sin FK al catálogo** (decisión requerida por AT-10): el carrito debe sobrevivir a la desaparición de un producto y reportarlo como `removed`, no bloquear el borrado del catálogo (FK restrict) ni perder silenciosamente el ítem (FK cascade). La validez del producto se resuelve en el pricing preview, igual que la disponibilidad. El carrito es intención efímera con expiración; la integridad dura pertenece a Orders.

## Integración con la implementación paralela de origin/main (2026-07-18)

Durante el rebase de consolidación se detectó en `origin/main` una implementación alternativa del dominio de carrito (monolítica, con carritos guest server-side, modifiers y `unitPricePreview` persistido, sin compare-and-set y con `addItem` no idempotente). Se resolvió conservar la implementación de este plan por tres razones objetivas: es la aprobada con sus Acceptance Tests, es la única compatible con la migración `cart_foundation` aplicada (unique `cart_id+product_id`, `cart_version`), y las carencias de la alternativa coinciden con los requisitos no negociables del bloque (CAS, idempotencia, ADR-009). Del lado descartado se rescatan como backlog: casos de uso explícitos `expire/abandon/recover` de carrito, `CartSummary` como vista derivada, y modifiers/combos (ya diferidos al catálogo extendido). Las familias de permisos ampliadas detectadas en origin (`categories.*`, `menus.*`, `cart.*`, `orders.*`, etc.) se evaluarán para el vocabulario canónico al planificar los bloques correspondientes.

La misma resolución se aplicó a los dominios de catálogo: origin/main contenía versiones monolíticas in-memory de `domain-categories`/`domain-products` y su superficie HTTP (`CommerceModule`, `OrderingModule`) cuyos controllers instanciaban los servicios sin inyección (`new ProductService()`), incompatible con los dominios DB-backed conservados. Se mantuvieron nuestras implementaciones y `CatalogModule`, y se eliminó la capa `commerce/ordering` de origin. Backlog rescatado de origin: modelo editorial de categorías (jerarquía `parentCategoryId`, `slug`, `visibility`, ciclo draft/published), superficie de rutas de modifiers/combos/pricing y order drafts (insumo del Bloque 4), el paquete `domains/menus` (se conserva sin registrar, para el futuro bloque de Menú como entidad) y `SupabaseAuditEventPublisher` (adición de origin que se conserva integrada).

## Reglas de resolución del merge Guest → Login (definidas antes de implementar)

1. Solo se fusionan ítems guest con producto **existente y activo** en el tenant; el resto se descarta y se reporta con su motivo (`removed`).
2. Ítem guest ya presente en el carrito del servidor → **se suman las cantidades**; si el resultado excede `MAX_CART_ITEM_QUANTITY`, se aplica cap al máximo y se reporta (`capped`). Nunca se generan duplicados.
3. Cantidades guest inválidas (< 1) se descartan con reporte (`invalid_quantity`); cantidades > máximo se capean con reporte.
4. Notas: si el ítem del servidor ya tiene notas, prevalecen (server-authoritative); si no tiene y el guest sí, se adoptan las del guest.
5. Sucursal: si el carrito del servidor no tiene `branchId` y el guest aporta uno, se adopta; si difieren, prevalece el del servidor.
6. El merge es una única mutación versionada (un solo incremento de `cart_version`) y emite `CART_MERGED` con el detalle de descartes.

## Objetivo

Carrito persistente server-authoritative para usuarios autenticados, con pricing preview calculado siempre contra catálogo y disponibilidad vigentes, concurrencia optimista multi-dispositivo y merge del carrito guest al iniciar sesión.

## Alcance

### 1. Base de datos — `cart_foundation`

- `public.carts`: id, tenant_id, branch_id (nullable hasta selección), customer_id → users, `cart_version` (concurrencia optimista), status (`active` | `converted` | `expired` | `abandoned`), fulfillment_type (`pickup` | `delivery`, nullable), `expires_at`, `last_priced_at`, timestamps. Restricción: un único carrito `active` por (tenant, customer) — índice único parcial.
- `public.cart_items`: id, cart_id (cascade), product_id (restrict), quantity (check 1–20), item_notes, timestamps. Unique (cart_id, product_id): agregar un producto existente fusiona cantidades.
- Sin precios persistidos en el carrito: el precio se calcula en cada lectura (server-authoritative); `last_priced_at` habilita detección de cambios.
- RLS tenant-scoped e índices: carts(tenant_id, customer_id) parcial sobre `active`, cart_items(cart_id).

### 2. Dominio `@jburger/domain-cart`

- Contratos: `CartRepository` (carrito activo por customer, create, add/update/remove item con `expectedVersion`, clear, transiciones de estado) y comandos con tenant/actor.
- `CartService`: invariantes (cantidad 1–20, producto activo y disponible en la sucursal al agregar — vía puertos de catálogo), concurrencia optimista (mismatch de versión → error de conflicto tipado), merge guest→autenticado (fusión de cantidades, revalidación de cada ítem), expiración.
- `CartPricingService` (read-model determinista): compone carrito + catálogo + disponibilidad → subtotales con override de sucursal, total, y `validation_state` por ítem (`ok` | `unavailable` | `price_changed`). Los ítems no disponibles se excluyen del total y se reportan.
- Nuevas `auditActions`: `CART_CREATED`, `CART_ITEM_ADDED`, `CART_ITEM_UPDATED`, `CART_ITEM_REMOVED`, `CART_MERGED`, `CART_EXPIRED`.

### 3. API — `CartModule`

Endpoints autenticados (ownership por `customer_id = actorId`; el carrito guest vive en el cliente según ADR-009 y entra al sistema por el merge):

- `GET /cart` — carrito activo + pricing preview.
- `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart` — mutaciones con `cartVersion` obligatoria (409 en mismatch).
- `POST /cart/merge` — items del carrito guest al iniciar sesión.
- Persistencia por puertos: Supabase (PostgREST) + in-memory dev, patrón establecido. Headers de tenant y sucursal obligatorios; sin permisos nuevos de vocabulario (ownership, no RBAC — el rol CLIENTE opera su propio carrito).

### 4. Calidad

Tests unitarios de dominio (invariantes, concurrencia, merge, pricing con override y no disponible), test de wiring de API, `pnpm validate` verde, ADR-023 con decisiones y deuda.

## Fuera de alcance (explícito)

Modifiers/combos (requiere modelado de catálogo extendido), promociones y cupones, checkout/order draft (Bloque 4), reserva de inventario, carrito guest server-side.

## Acceptance Tests comprometidos

| #     | Escenario                                                    | Resultado esperado                                                                                   |
| ----- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| AT-1  | Agregar producto del catálogo y leer el carrito              | Ítem presente; precio de sucursal aplicado (Gaseosa a 2200 por override); subtotal y total correctos |
| AT-2  | Producto inexistente/inactivo; cantidad 0 o 21               | 404/422 y 400 respectivamente; el carrito no se altera                                               |
| AT-3  | Dos mutaciones concurrentes con la misma `cartVersion`       | La segunda recibe 409; el estado queda consistente                                                   |
| AT-4  | `POST /cart/merge` con ítems guest, uno ya existente         | Cantidades fusionadas; sin duplicados; ítems inválidos reportados                                    |
| AT-5  | Aislamiento: tenant ajeno en header; carrito de otro usuario | 401 y 404 respectivamente; sin fuga de datos                                                         |
| AT-6  | Producto marcado no disponible en la sucursal tras agregarlo | `GET /cart` lo reporta `unavailable` y lo excluye del total                                          |
| AT-7  | Auditoría                                                    | Eventos `CART_*` en logs estructurados con actor/tenant                                              |
| AT-8  | Pipeline                                                     | `pnpm validate` verde completo                                                                       |
| AT-9  | Idempotencia: agregar dos veces el mismo producto            | Actualiza la cantidad del ítem existente; jamás duplica filas                                        |
| AT-10 | Producto eliminado del catálogo con ítem en carrito          | Lectura y totales del resto intactos; ítem marcado `removed` y excluido del total                    |

## Secuencia estimada

Migración + seeds → dominio con tests → API + persistencia → Acceptance conjunto → cierre documental (ADR-023 + status).
