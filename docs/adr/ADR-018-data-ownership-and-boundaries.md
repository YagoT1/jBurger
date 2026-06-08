# ADR-018: Data Ownership and Boundaries

## Estado

Aprobado

## Contexto

Cada dominio debe ser dueño de su información.

## Decisión

Cada dominio controla exclusivamente sus datos.

## Ejemplos

Users:

- usuarios
- perfiles

Orders:

- pedidos
- estados

Payments:

- pagos
- transacciones

Rewards:

- recompensas

## Reglas

Prohibido:

- modificar tablas ajenas directamente
- acceder a datos internos de otro dominio

Permitido:

- eventos
- contratos públicos
- servicios de aplicación

## Consecuencias

### Positivas

- Límites claros.
- Escalabilidad.
- Menor acoplamiento.
