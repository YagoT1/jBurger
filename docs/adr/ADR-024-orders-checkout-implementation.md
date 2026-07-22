# ADR-024: Checkout y Pedidos (dominio, transaccionalidad e integración)

## Estado

Aprobado

## Fecha

2026-07-19

## Contexto

El Bloque 4 (plan en `docs/status/phase-2-block-4-orders-plan.md`) convierte un carrito validado en un pedido inmutable. Cierra el principio Cart ≠ Order Draft ≠ Order: el carrito es intención sin verdad financiera (ADR-023); el pedido ES verdad financiera inmutable. Aquí vive la revalidación canónica de precios (`PRICE_CHANGED`) que ADR-023 difirió del carrito.

## Decisiones

### 1. Checkout transaccional e idempotente vía `place_order`

Migración `202607190009_orders_foundation.sql`. El checkout debe: verificar idempotencia, convertir el carrito (CAS `active`+versión → `converted`) e insertar pedido+ítems+evento inicial, todo atómico. Función `place_order` (`security definer`, `search_path` fijo, EXECUTE revocado): si la `idempotency_key` ya existe devuelve el pedido previo (reintentos sin duplicar); si el carrito no puede convertirse devuelve `NULL` (→ `CART_CONFLICT`). `transition_order` hace el cambio de estado con CAS sobre el estado origen + evento, atómico (→ `TRANSITION_CONFLICT` en carrera).

#### 1.1. Contrato de idempotencia del checkout (aclaración 2026-07-19)

**Ante una segunda invocación idéntica (misma `idempotencyKey`), el comportamiento correcto es DEVOLVER EL PEDIDO EXISTENTE** — no conflicto, no un pedido nuevo. Auditoría del Bloque 4 detectó que `CheckoutService` violaba este contrato: resolvía `findActivePricedCart` **antes** de la idempotencia, de modo que un reintento tras el checkout original (con el carrito ya `converted`) lanzaba `CART_NOT_FOUND` en lugar de devolver el pedido. Impacto real: un reintento por respuesta perdida o doble submit recibía 404.

Corrección: `CheckoutService.placeOrder` consulta `OrderRepository.findByIdempotencyKey(tenant, key)` **como primer paso**; si hay pedido, lo devuelve sin exigir carrito y **sin re-emitir `ORDER_PLACED`** (es un replay, ya fue registrado y auditado). Solo si no existe procede con la validación del carrito. El contrato queda así satisfecho aunque el carrito haya sido consumido.

Borde de concurrencia documentado: dos primeros intentos simultáneos con la misma clave pueden pasar ambos el chequeo de idempotencia; el CAS de conversión del carrito serializa (solo uno convierte y crea el pedido), el otro obtiene `CART_CONFLICT`. El reintento posterior (secuencial) encuentra el pedido por clave y lo devuelve. No hay pedidos duplicados posibles (la conversión del carrito es exclusiva y `unique(tenant_id, idempotency_key)` es la última barrera). Aceptado como comportamiento eventualmente idempotente para el caso concurrente; el caso especificado (OT-2, reintento secuencial) es totalmente idempotente.

### 2. Revalidación canónica de precios en el dominio

`CheckoutService` (puertos `CheckoutCartSource` — DIP, sin dependencia de domain-cart): obtiene el carrito repreciado, exige todos los ítems `ok` (`CART_INVALID_ITEMS`), y compara el total contra el `expectedTotal` del cliente. Mismatch → `PRICE_CHANGED`: es el punto donde el precio deja de ser preview y se vuelve compromiso. El snapshot financiero (`OrderSnapshotItem`) se construye del carrito repreciado y viaja a `place_order`.

### 3. Máquina de estados explícita

`order-transitions.ts` es la fuente única: `borrador→{confirmado,cancelado}`, `confirmado→{preparacion,cancelado}`, `preparacion→entregado`, `entregado`/`cancelado` terminales. `OrderService.transition` valida contra el mapa antes del CAS (`INVALID_TRANSITION` vs `TRANSITION_CONFLICT` distinguen intención inválida de carrera). El cliente solo cancela desde `borrador`/`confirmado`.

### 4. Reemplazo de la implementación monolítica de origin

`origin/main` traía un `domain-orders` monolítico (estados en inglés, in-memory, sin CAS ni idempotencia, con snapshot de modifiers/taxes/discounts fuera de alcance). Se reemplazó por la implementación del plan, por las mismas razones que ADR-023: es la única compatible con la migración aplicada y con el tipo `EstadoPedido` en español de `domain-types`, y cubre los invariantes no negociables (idempotencia, CAS, revalidación de precio). El `index.test.ts` legado se repurpuso como smoke test de la superficie pública. Backlog rescatado: totales con impuestos/descuentos/delivery fee (llegan con Pricing avanzado y Delivery), timeline enriquecido (hoy en `order_status_events`).

### 5. API `OrdersModule`

`POST /orders` (checkout del cliente), `GET /orders` (staff con `orders.read` ve la sucursal; cliente ve los propios), `GET /orders/:id` (owner o `orders.read`), `POST /orders/:id/confirm` (transición explícita, separada para que Pagos la gatee), `POST /orders/:id/status` (`orders.write`), `POST /orders/:id/cancel` (staff por máquina de estados; cliente desde estados permitidos). `OrderDomainErrorFilter` mapea a HTTP (409 conflictos, 422 reglas de negocio, 404/400). El adaptador `CheckoutCartSourceAdapter` reutiliza `CartService`/`CartPricingService` exportados por `CartModule` — sin duplicar lógica de carrito. Persistencia por puertos Supabase/in-memory con fail-fast en producción. Los permisos `orders.read`/`orders.write` ya existían en el vocabulario canónico y los seeds; no se amplió vocabulario.

## Suposiciones documentadas

1. El checkout convierte el carrito en la misma transacción; cancelar un pedido NO restaura el carrito (el cliente inicia uno nuevo). Evita carritos zombis y simplifica la consistencia.
2. La confirmación es transición explícita separada del checkout (preparada para el gate de Pagos).
3. `numero` es correlativo global (identity); numeración por tenant queda como mejora futura.

## Deuda técnica registrada

- Totales sin impuestos/descuentos/delivery fee (el modelo `total` es único; se extenderá con Pricing y Delivery).
- Sin expiración automática de borradores (job pendiente, junto con la del carrito — bloque operativo).
- Confirmación aún no gateada por pago (por diseño, hasta el Bloque 5).
- Auditoría vía logger estructurado; outbox durable pendiente (bloque de observabilidad).

## Referencias

ADR-009, ADR-020, ADR-021, ADR-023, `docs/status/phase-2-block-4-orders-plan.md`, commerce-engine-architecture §2, §6–7.
