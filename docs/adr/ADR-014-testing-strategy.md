# ADR-014: Testing Strategy

## Estado

Aprobado

## Decisión

Se adopta una estrategia de pruebas por capas.

## Niveles

### Unit Tests

Herramienta:

- Vitest

### Integration Tests

Herramienta:

- Vitest

### E2E Tests

Herramienta:

- Playwright

## Objetivos

Módulos críticos:

- Auth
- Payments
- Orders

Cobertura mínima:

80%

## Consecuencias

### Positivas

- Menos regresiones.
- Mayor estabilidad.

### Negativas

- Mayor tiempo de desarrollo inicial.
