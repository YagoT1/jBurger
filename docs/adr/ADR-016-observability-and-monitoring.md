# ADR-016: Observability and Monitoring

## Estado

Aprobado

## Decisión

Toda aplicación debe exponer observabilidad básica.

## Componentes

### Logs

Logs estructurados.

### Health Checks

Endpoints:

/health

/readiness

/liveness

### Métricas

- Requests
- Latencia
- Errores

### Errores

Herramientas previstas:

- Sentry
- Telemetry Package

## Consecuencias

### Positivas

- Diagnóstico rápido.
- Menor MTTR.
