# ADR-009 - Shopping Cart Strategy

## Status

Accepted

## Context

Los usuarios necesitan mantener pedidos antes del checkout.

## Decision

Usuarios anónimos:

- Local Storage

Usuarios autenticados:

- Persistencia en base de datos

Sincronización:

- Al iniciar sesión se fusionan los carritos.

## Consequences

### Positivas

- Mejor experiencia de usuario.
- Recuperación de pedidos.

### Negativas

- Lógica adicional de sincronización.
