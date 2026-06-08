# ADR-011: Domain Driven Design

## Estado

Aprobado

## Contexto

jBurger crecerá hacia múltiples aplicaciones, servicios y dominios de negocio.

## Decisión

Se adopta Domain Driven Design (DDD).

Cada dominio:

- Es autónomo.
- Tiene contratos públicos.
- Posee sus entidades.
- Posee sus casos de uso.
- Posee sus eventos.

## Dominios iniciales

- Auth
- Users
- Roles
- Permissions
- Products
- Categories
- Cart
- Orders
- Payments
- Delivery
- Tracking
- Notifications
- Rewards
- Feedback

## Reglas

Un dominio:

- No accede directamente a datos internos de otro dominio.
- No modifica entidades de otro dominio.
- Solo interactúa mediante contratos o eventos.

## Consecuencias

### Positivas

- Escalabilidad.
- Mantenibilidad.
- Bajo acoplamiento.

### Negativas

- Mayor cantidad de módulos.
