# ADR-001 - Monorepo Strategy

## Status

Accepted

## Context

jBurger está compuesto por múltiples aplicaciones, dominios y paquetes compartidos.

## Decision

Se utilizará un monorepo basado en pnpm workspaces y Turborepo.

La estrategia oficial será Build-First:

- Los paquetes internos exponen artefactos compilados en dist/.
- Las aplicaciones consumen paquetes mediante exports.
- Turbo controla el orden de compilación.

## Consequences

### Positivas

- Builds reproducibles.
- Dependencias claras.
- Mejor soporte para CI/CD.

### Negativas

- Requiere build previo de librerías.
- Desarrollo ligeramente más lento que Source-First.
