# ADR-003 - Database

## Status

Accepted

## Context

Se requiere una base de datos relacional moderna con autenticación integrada.

## Decision

Supabase PostgreSQL será la base de datos principal.

Se utilizará:

- PostgreSQL
- Row Level Security (RLS)
- Supabase Auth
- Storage

## Consequences

### Positivas

- Menos infraestructura.
- Escalabilidad.
- Excelente integración con Next.js.

### Negativas

- Dependencia de un proveedor externo.
