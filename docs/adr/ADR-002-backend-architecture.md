# ADR-002 - Backend Architecture

## Status

Accepted

## Context

Se necesita una API escalable y modular para soportar múltiples aplicaciones.

## Decision

NestJS será el framework backend oficial.

La arquitectura seguirá:

- Domain Driven Design (DDD)
- Arquitectura modular
- Casos de uso explícitos
- Eventos de dominio

## Consequences

### Positivas

- Escalable.
- Mantenible.
- Compatible con crecimiento futuro.

### Negativas

- Mayor complejidad inicial.
