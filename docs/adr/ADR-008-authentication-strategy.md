# ADR-008 - Authentication

## Status

Accepted

## Context

La plataforma necesita autenticación segura.

## Decision

Proveedor:

- Supabase Auth

Métodos:

- Email + Password
- Google OAuth

Roles:

- Customer
- Employee
- Manager
- Admin

## Consequences

### Positivas

- Seguridad delegada.
- Menos código propio.

### Negativas

- Dependencia de Supabase.
