# ADR-007 - Notifications

## Status

Accepted

## Context

Los clientes deben recibir confirmaciones y comunicaciones.

## Decision

Transaccionales:

- Resend

Push Notifications:

- Firebase Cloud Messaging

Canales:

- Email
- Push

## Casos de Uso

- Confirmación de pedido
- Pedido en preparación
- Pedido entregado
- Promociones futuras

## Consequences

### Positivas

- Escalable.
- Fácil automatización.

### Negativas

- Costos futuros de mensajería.
