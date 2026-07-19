# ADR-022: Estándar de identificadores RFC 4122 y desacople referencial de auditoría

## Estado

Aprobado

## Fecha

2026-07-17

## Contexto

Durante el Acceptance Test del Bloque 2, `POST /auth/login` devolvió `400 tenantId must be a UUID` para el id de tenant seed `00000000-0000-0000-0000-000000000001`. Diagnóstico: `class-validator`/`validator.js` actual valida en modo `'all'` la conformidad **RFC 4122** (nibble de versión 1–8, nibble de variante `[89ab]`), no solo el formato hexadecimal. Los IDs seed originales tenían versión y variante `0`: Postgres los acepta como tipo `uuid`, pero no son UUIDs RFC válidos y cualquier validador o SDK conforme los rechazará.

Al corregirlo emergió un segundo defecto: eliminar el tenant legacy disparó los triggers de auditoría durante el cascade, cuyos INSERT en `audit_events` violaban el FK `audit_events.tenant_id → tenants` (la fila del tenant ya no existía dentro de la misma sentencia).

## Decisiones

### 1. Todos los identificadores del sistema son UUID RFC 4122

- Los IDs generados en runtime ya cumplían (`gen_random_uuid()`, `crypto.randomUUID()` producen v4).
- Los IDs fijos de seeds y fixtures usan formato v4 determinista y legible: prefijo por tipo de entidad, versión `4`, variante `8` (tenant `a…`, sucursal `b…`, categoría `c…`, producto `d…`, rol `e…`). Ejemplo: `a0000000-0000-4000-8000-000000000001`.
- La validación de entrada permanece estricta (`@IsUUID()`, `ParseUUIDPipe`): se corrigieron los datos, no se debilitó el validador.
- Los datos existentes se re-identificaron mediante transacción (grafo nuevo → re-vinculación de usuarios → eliminación del grafo legacy por cascade). Sin datos productivos afectados. Los documentos históricos (ADR-020, registro del Acceptance de Catalog) conservan los IDs viejos como registro fiel de aquel momento.

### 2. `audit_events` no tiene claves foráneas hacia entidades de negocio

Migración `202607170006_audit_events_decouple.sql`: se elimina el FK `audit_events.tenant_id → tenants`. Fundamento: la auditoría es un registro histórico inmutable que debe sobrevivir a la eliminación de las entidades que referencia; el `on delete set null` anterior además destruía el dato histórico (contrario a su propósito de compliance), y el FK hacía fallar operaciones legítimas de borrado en cascada cuando los triggers de auditoría insertaban durante la propia eliminación.

## Consecuencias

Positivas: identificadores interoperables con cualquier validador/SDK conforme a RFC; auditoría íntegra e independiente del ciclo de vida de las entidades; el bug quedó cubierto por la validación estricta existente. Negativas: `audit_events.tenant_id` ya no tiene garantía referencial (aceptado: es un dato histórico, no relacional), y los IDs seed son levemente menos "legibles" que los anteriores.

## Referencias

- ADR-020 Catalog Foundation (Acceptance Test con IDs legacy, registro histórico)
- ADR-021 Authentication Implementation
