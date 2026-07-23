# ADR-025: Pagos — implementación del adaptador Mercado Pago y PaymentsModule

## Estado

Aprobado (implementado 2026-07-22; Acceptance HTTP pendiente de credenciales sandbox)

## Contexto

Bloque 5 (`phase-2-block-5-payments-plan.md`): cobrar un pedido `borrador` de forma idempotente y auditable, confirmándolo solo con pago aprobado, sin acoplar el dominio al proveedor. Migración `202607220010_payments_foundation.sql` aplicada; dominio `@jburger/domain-payments` con 12 tests.

## Decisiones

1. **Confirmación del pedido DENTRO de la transacción del RPC** (`apply_payment_transition` reusa `transition_order`), no como puerto separado del dominio. No puede existir pago aprobado sin intento de confirmación registrado: correctitud > pureza del puerto. El puerto `PaymentOrderSource` queda de solo lectura (validar pagabilidad) para no depender de domain-orders. El borde "pago aprobado sobre pedido ya no-borrador" queda en bitácora como `applied_order_not_confirmed` para conciliación manual.
2. **Idempotencia en tres niveles de DB**: única clave por tenant; único intento `pendiente` y único `aprobado` por pedido (índices parciales, PT-2/PT-9); única referencia del proveedor aplicable (PT-4). El servicio reusa intentos pendientes y sobrevive a caídas del proveedor sin doble preferencia (`x-idempotency-key` también del lado MP).
3. **Verificación de webhooks**: firma HMAC-SHA256 sobre el manifiesto `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con `timingSafeEqual`; tras validar, **el estado se lee de `/v1/payments/:id` en MP** (fuente de verdad), nunca del payload entrante. Estados no terminales no producen transición.
4. **`external_reference` = `tenantId:paymentId`**: el webhook es tenant-agnóstico sin habilitar consultas cross-tenant en el repositorio.
5. **Endpoint público `POST /webhooks/mercadopago`** sin guards: la confianza proviene exclusivamente de la firma; responde 200 salvo error de infraestructura (evita reintentos infinitos del proveedor); todo intento queda en `payment_events` (incl. firma inválida) o en log.
6. **`MockPaymentGateway`** para desarrollo sin credenciales: crea checkouts falsos y **rechaza toda notificación entrante** (no simula un canal confiable). Producción sin credenciales: fail-fast (mismo criterio que persistencia).
7. **`POST /orders/:id/confirm` pasa a exigir `orders.write`**: desde este bloque la confirmación del cliente la dispara el pago aprobado; el endpoint queda como confirmación manual de staff (efectivo/mostrador). Completa el supuesto 2 de ADR-024.
8. `OrdersModule` exporta `ORDER_REPOSITORY` para que Pagos reutilice la misma instancia (crítico en in-memory).

## Deuda registrada

Reembolsos (`payments.refund`) fuera del MVP; Acceptance PT-1..PT-10 por HTTP pendiente de credenciales sandbox + URL pública (túnel); expiración de intentos pendiente (junto a expiración de carritos/borradores).

## Referencias

ADR-024, `phase-2-block-5-payments-plan.md`, migración `202607220010`, [documentación de webhooks de Mercado Pago].
