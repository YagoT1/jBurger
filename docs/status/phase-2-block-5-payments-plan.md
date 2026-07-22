# Fase 2 — Bloque 5: Pagos / Mercado Pago (PROPUESTA — pendiente de aprobación)

Fecha: 2026-07-19. Base: ADR-024 (la confirmación del pedido quedó separada del checkout, preparada para gatearse por el pago), commerce-engine §8 (payment orchestration), decisión de negocio registrada en roadmap (proveedor = Mercado Pago).

## Objetivo

Cobrar un pedido en `borrador` mediante Mercado Pago de forma idempotente y auditable, y **confirmar el pedido solo cuando el pago queda aprobado**, sin acoplar el núcleo del dominio al proveedor.

## Principios no negociables

- **Puerto de proveedor abstracto:** el dominio `@jburger/domain-payments` no conoce Mercado Pago. Un `PaymentProviderGateway` (puerto) se implementa con un adaptador MP en la capa API. Cambiar de proveedor = nuevo adaptador, cero cambios de dominio.
- **El pago es verdad financiera server-authoritative:** el monto a cobrar se toma del pedido (snapshot inmutable del Bloque 4), nunca del cliente.
- **Idempotencia de extremo a extremo:** iniciar un pago dos veces para el mismo pedido no genera dos cobros; la ingesta del mismo webhook dos veces no aplica el efecto dos veces.
- **Webhooks verificados:** toda notificación entrante valida firma/origen antes de mutar estado (protección contra spoofing/replay).
- **Confirmación gateada:** `pago aprobado` dispara la transición `borrador → confirmado` del pedido (vía OrderService existente); el rechazo/expiración no confirma.
- **Secretos solo por entorno:** access token / webhook secret de MP nunca en el repo.

## Alcance

### Modelo (migración `payments_foundation`)

- `public.payments`: intento de pago por pedido (`order_id`, `estado` `pendiente|aprobado|rechazado|reembolsado|expirado`, `monto`/`moneda` copiados del pedido, `provider` = `mercadopago`, `provider_payment_id`, `provider_preference_id`, `idempotency_key` única por tenant, timestamps). Un pago aprobado por pedido (índice único parcial).
- `public.payment_events`: bitácora append-only de notificaciones del proveedor (payload crudo + resultado de verificación + acción aplicada) — auditoría y trazabilidad de webhooks.
- RPC transaccional `apply_payment_transition`: cambia el estado del pago con CAS + registra evento + (si aprobado) confirma el pedido, atómico e idempotente por `provider_payment_id`.

### Dominio `@jburger/domain-payments`

- Puerto `PaymentProviderGateway`: `createPayment(order, idempotencyKey) → { providerRef, checkoutUrl }`, `verifyWebhook(headers, rawBody) → VerifiedEvent | null`, `fetchPaymentStatus(providerRef)`.
- `PaymentService`: `initiatePayment(orderId)` (idempotente — reusa el intento pendiente si existe), `handleProviderEvent(verifiedEvent)` (aplica la transición de pago y, si aprobado, confirma el pedido vía un puerto `OrderConfirmationPort` para no depender de domain-orders directamente).
- Errores tipados `PaymentDomainError` (`ORDER_NOT_PAYABLE`, `PAYMENT_ALREADY_APPROVED`, `WEBHOOK_INVALID`, `PROVIDER_UNAVAILABLE`, `PAYMENT_CONFLICT`).
- auditActions: `PAYMENT_INITIATED`, `PAYMENT_APPROVED`, `PAYMENT_REJECTED`, `PAYMENT_REFUNDED`.

### API `PaymentsModule`

- `POST /orders/:id/payment` (cliente dueño: inicia el pago de su pedido en `borrador`; devuelve `checkoutUrl` de MP). `orders.write` no requerido (es el dueño).
- `POST /webhooks/mercadopago` (endpoint público sin auth de usuario, **con verificación de firma**; idempotente; responde 200 rápido y procesa). Excluido de guards de tenant/auth; el tenant se resuelve del pago referenciado.
- `GET /orders/:id/payment` (estado del pago; dueño o `payments.read`).
- Adaptador `MercadoPagoGateway` implementando el puerto (SDK/HTTP de MP, sandbox/producción por entorno).
- Persistencia por puertos Supabase/in-memory, fail-fast en producción.
- Permisos: reutilizar `payments.read`/`payments.refund` ya presentes en el vocabulario canónico y seeds; no ampliar vocabulario.

## Decisiones confirmadas (2026-07-19)

1. **Flujo Checkout Pro** (redirect a `checkoutUrl` de MP) — CONFIRMADO por el responsable de negocio. Menor superficie PCI para un local.
2. **Credenciales:** se implementa con el adaptador MP real + un proveedor **mock** para los tests; las env vars (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`) quedan documentadas en `.env.example`. El responsable carga las credenciales **sandbox** al momento del Acceptance (mismo patrón que Supabase). Sin credenciales configuradas y fuera de producción, el módulo usa el mock; en producción, fail-fast.

## Suposiciones (vigentes)

- La confirmación del pedido la dispara **el webhook aprobado**, no el redirect de vuelta del usuario (los redirects son poco confiables; el webhook es la fuente de verdad).
- Reembolsos (`payments.refund`) quedan como operación de staff en una iteración posterior; el MVP cubre cobro + confirmación.

## Fuera de alcance

Tokenización de tarjeta en cliente, cuotas/planes, split payments, conciliación contable, notificaciones al cliente (bloque de notificaciones).

## Acceptance Tests comprometidos

| #     | Escenario                                             | Resultado esperado                                                           |
| ----- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| PT-1  | Iniciar pago de un pedido `borrador` propio           | Crea intento `pendiente`, devuelve `checkoutUrl`, evento `PAYMENT_INITIATED` |
| PT-2  | Iniciar pago dos veces (mismo pedido)                 | Reusa el intento pendiente; sin doble preferencia; idempotente               |
| PT-3  | Webhook `approved` verificado                         | Pago → `aprobado`, pedido `borrador → confirmado`, atómico                   |
| PT-4  | Reingesta del mismo webhook                           | Sin efecto duplicado (idempotente por `provider_payment_id`)                 |
| PT-5  | Webhook con firma inválida                            | 401/400, sin mutación, evento de intento fallido registrado                  |
| PT-6  | Webhook `rejected`                                    | Pago → `rechazado`, pedido permanece en `borrador`                           |
| PT-7  | Iniciar pago de un pedido ajeno / otro tenant         | 404/403 sin fuga                                                             |
| PT-8  | Iniciar pago de un pedido ya `confirmado`/`cancelado` | 422 `ORDER_NOT_PAYABLE`                                                      |
| PT-9  | Pedido con pago aprobado no admite segundo pago       | 409 `PAYMENT_ALREADY_APPROVED`                                               |
| PT-10 | Pipeline                                              | `pnpm install && pnpm validate` verde                                        |

## Secuencia (idéntica a bloques previos)

Documento (este archivo) → migración + RPCs → dominio con tests (gate) → adaptador MP + API (gate) → Acceptance → cierre (ADR-025, roadmap).

## Decisiones de negocio/credenciales pendientes (intervención humana)

- Cargar credenciales MP por entorno (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`) y elegir modo **sandbox** para el desarrollo/Acceptance. Nunca al repo.
- URL pública para el webhook (en desarrollo, túnel; en producción, dominio final — ligado a la decisión de hosting).
