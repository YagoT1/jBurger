# ADR-012: Event Driven Architecture

## Estado

Aprobado

## Contexto

Los dominios necesitan comunicarse sin dependencias directas.

## Decisión

La comunicación entre dominios se realizará mediante eventos.

## Eventos de ejemplo

- UserRegistered
- OrderCreated
- OrderConfirmed
- OrderPaid
- OrderCancelled
- RewardGranted
- DeliveryAssigned

## Reglas

Los consumidores:

- No conocen detalles internos del productor.
- Solo conocen el contrato del evento.

## Consecuencias

### Positivas

- Desacoplamiento.
- Escalabilidad.
- Extensibilidad.

### Negativas

- Mayor complejidad de trazabilidad.
