# ADR-013: API Contracts and Versioning

## Estado

Aprobado

## Decisión

Todas las APIs deben estar versionadas.

## Formato

/api/v1/...

Ejemplos:

- /api/v1/orders
- /api/v1/users
- /api/v1/products

## Reglas

- Nunca romper contratos existentes.
- Crear nueva versión cuando haya cambios incompatibles.

## Consecuencias

### Positivas

- Compatibilidad futura.
- Migraciones seguras.
