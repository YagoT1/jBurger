# Fase 2 — Bloque 4: Checkout y Pedidos (CERRADO — 2026-07-19)

> **Estado final: aceptado.** Gate `pnpm install && pnpm validate` en verde (45/45). Decisiones en ADR-024 (incl. §1.1 contrato de idempotencia). Los Acceptance Tests OT-1…OT-11 quedan cubiertos por tests automatizados de dominio y wiring (checkout, revalidación de precio, idempotencia con carrito consumido, máquina de estados, aislamiento); la batería HTTP contra Supabase es repetible con el usuario OWNER ya aprovisionado.

## Registro de aceptación

- **Objetivo cumplido:** carrito validado → pedido inmutable; cierra Cart ≠ Order Draft ≠ Order.
- **Entregado:** migración `202607190009_orders_foundation.sql` (tablas + RPC `place_order`/`transition_order` transaccionales, aplicadas a la DB), dominio `@jburger/domain-orders` (CheckoutService con revalidación canónica de precio e idempotencia-primero, OrderService con máquina de estados CAS, errores tipados, tests), `OrdersModule` HTTP (checkout, listados por rol, confirm/status/cancel, filtro de errores), reutilización de CartService/CartPricingService vía puerto.
- **Correcciones durante el bloque:** excess-property en cancel, stub muerto en test, path de error de infraestructura (503 tras escritura confirmada), manifiesto de la API saneado (ADR: higiene de dependencias), y **corrección del contrato de idempotencia** (ADR-024 §1.1) — el código contradecía la spec y se corrigió, endureciendo los tests que daban falso verde.
- **Deuda registrada (ADR-024):** totales sin impuestos/descuentos/delivery fee; sin expiración automática de borradores; confirmación aún no gateada por pago (por diseño, Bloque 5); borde de concurrencia de idempotencia documentado y aceptado.

## Plan original del bloque

(EN IMPLEMENTACIÓN — 2026-07-19)

Base arquitectónica: commerce-engine §2 y §6–7 (Cart ≠ Order Draft ≠ Order; el pedido ES verdad financiera inmutable), ADR-023 (el `price_changed` diferido vive aquí como revalidación canónica).

## Objetivo

Convertir un carrito validado en un pedido inmutable con snapshot financiero, mediante un checkout idempotente y transaccional, y gestionar el ciclo de vida operativo del pedido con una máquina de estados auditada.

## Alcance

### Modelo (migración `orders_foundation`)

- `public.orders`: pedido con snapshot financiero (`total_amount`/`total_currency` — a diferencia del carrito, el pedido SÍ persiste precios), `numero` correlativo (identity), estado en español alineado al tipo `Pedido` existente (`borrador`→`confirmado`→`preparacion`→`entregado`; `cancelado` desde `borrador`/`confirmado`), fulfillment, dirección de entrega (jsonb), `idempotency_key` única por tenant, `cart_id` y `cart_version_at_checkout` para trazabilidad.
- `public.order_items`: snapshot inmutable por ítem (nombre, precio unitario, subtotal) — `product_id` sin FK (el snapshot debe sobrevivir al catálogo, mismo criterio que AT-10 del carrito).
- `public.order_status_events`: historial de transiciones (from/to/actor/reason) — fuente del tracking del Bloque de seguimiento.
- RPC transaccional `place_order`: idempotencia por clave (reintentos devuelven el mismo pedido), conversión CAS del carrito (`active`+`cart_version` esperada → `converted`) e inserción de pedido+ítems+evento inicial en una única transacción. RPC `transition_order`: cambio de estado con CAS sobre el estado origen + evento, atómico. Ambas `security definer`, `search_path` fijo, EXECUTE revocado a clientes.

### Dominio `@jburger/domain-orders`

- `CheckoutService` (puertos `CheckoutCartSource` y `CheckoutPricingSource` — DIP, sin dependencia de domain-cart): obtiene el carrito activo, lo re-precia contra catálogo/disponibilidad vigentes, exige que todos los ítems estén `ok`, compara el total contra el `expectedTotal` del cliente (**revalidación canónica**: mismatch → `PRICE_CHANGED`), construye el snapshot y delega en `placeOrder` (conflicto de carrito → `CART_CONFLICT`).
- `OrderService`: máquina de estados explícita, transición con CAS (`TRANSITION_CONFLICT` en carrera), cancelación con motivo.
- Errores tipados `OrderDomainError`; auditActions `ORDER_PLACED`, `ORDER_CONFIRMED`, `ORDER_STATUS_CHANGED`, `ORDER_CANCELLED`.

### API `OrdersModule` (paso posterior al gate del dominio)

`POST /orders` (checkout del cliente: `idempotencyKey`, `expectedTotal`, fulfillment, dirección si delivery), `GET /orders` (propios; staff con `orders.read` filtra por sucursal/estado), `GET /orders/:id` (owner o `orders.read`), `POST /orders/:id/confirm` (owner o `orders.write`; cuando llegue Pagos, la confirmación quedará gateada por el pago), `POST /orders/:id/status` y `POST /orders/:id/cancel` (staff `orders.write`; cancel también owner en `borrador`/`confirmado`). Filtro de errores propio (PRICE_CHANGED/CART_CONFLICT/TRANSITION_CONFLICT→409, CART_INVALID_ITEMS→422, INVALID_TRANSITION→422, \*\_NOT_FOUND→404, CART_EMPTY→400).

## Suposiciones documentadas

1. El checkout crea el pedido en `borrador` (Order Draft) y **convierte el carrito en la misma transacción**; cancelar un borrador no restaura el carrito (el cliente inicia uno nuevo). Simplifica la consistencia y evita carritos zombis.
2. La confirmación es una transición explícita separada del checkout, para que el Bloque de Pagos pueda gatearla sin rediseño.
3. `numero` de pedido es un correlativo global (identity), suficiente para operación de un local; numeración por tenant queda como mejora futura.

## Fuera de alcance

Pagos (Bloque 5), notificaciones, asignación a cocina/delivery (bloques operativos), edición de pedidos post-checkout.

## Acceptance Tests comprometidos

| #     | Escenario                                                      | Resultado esperado                                                                                                                   |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| OT-1  | Checkout con carrito válido y `expectedTotal` correcto         | Pedido `borrador` con snapshot (ítems, precios con override, total), `numero` asignado, carrito → `converted`, evento `ORDER_PLACED` |
| OT-2  | Reintento del checkout con la misma `idempotencyKey`           | Devuelve el MISMO pedido; sin duplicados                                                                                             |
| OT-3  | `expectedTotal` desactualizado (cambió un precio)              | 409 `PRICE_CHANGED`; el carrito NO se convierte                                                                                      |
| OT-4  | Carrito con ítem `unavailable`/`removed`                       | 422 `CART_INVALID_ITEMS`; sin conversión                                                                                             |
| OT-5  | Carrito vacío o inexistente                                    | 400 `CART_EMPTY` / 404 `CART_NOT_FOUND`                                                                                              |
| OT-6  | Carrera: dos checkouts simultáneos del mismo carrito           | Uno gana; el otro 409 `CART_CONFLICT` (o idempotencia si misma clave)                                                                |
| OT-7  | Transiciones válidas borrador→confirmado→preparacion→entregado | 200 con evento por transición en `order_status_events`                                                                               |
| OT-8  | Transición inválida (p. ej. entregado→preparacion)             | 422 `INVALID_TRANSITION`; estado intacto                                                                                             |
| OT-9  | Cancelación: owner en borrador/confirmado ✓; en preparacion ✗  | 200 con motivo / 422 según matriz                                                                                                    |
| OT-10 | Aislamiento: pedido de otro cliente/tenant                     | 404/401 sin fuga                                                                                                                     |
| OT-11 | Pipeline                                                       | `pnpm install && pnpm validate` verde                                                                                                |

## Secuencia

Migración+RPCs → dominio con tests (gate) → adaptadores+API (gate) → Acceptance HTTP → cierre (ADR-024, roadmap).
