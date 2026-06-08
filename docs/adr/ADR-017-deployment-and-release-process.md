# ADR-017: Deployment and Release Process

## Estado

Aprobado

## Decisión

Se utilizará despliegue continuo controlado.

## Entornos

- Local
- Preview
- Production

## Infraestructura

Frontend:

- Vercel

Backend:

- Railway

Base de datos:

- Supabase

## Flujo

Commit
↓
Pull Request
↓
Lint
↓
Typecheck
↓
Tests
↓
Build
↓
Deploy

## Consecuencias

### Positivas

- Despliegues repetibles.
- Menos errores manuales.
