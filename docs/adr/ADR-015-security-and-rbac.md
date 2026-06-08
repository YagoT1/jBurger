# ADR-015: Security and RBAC

## Estado

Aprobado

## Decisión

Se adopta RBAC.

## Roles

- Customer
- Employee
- Manager
- Admin
- SuperAdmin

## Reglas

- Todo acceso sensible requiere autorización.
- El backend es la autoridad final.
- El frontend nunca decide permisos.

## Consecuencias

### Positivas

- Seguridad consistente.
- Escalabilidad organizacional.
