# jBurger AI Operating Rules

## Fuente de verdad

Antes de modificar cualquier archivo:

1. Leer /docs
2. Leer /docs/adr
3. Leer arquitectura del monorepo
4. Verificar decisiones existentes

Los documentos tienen prioridad sobre cualquier sugerencia de IA.

## Prohibiciones

No:

- Cambiar arquitectura sin aprobación.
- Agregar dependencias sin aprobación.
- Crear PR automáticamente.
- Hacer commits automáticamente.
- Modificar más archivos de los autorizados.
- Ignorar ADR existentes.

## Flujo obligatorio

1. Analizar problema.
2. Identificar causa raíz.
3. Generar Change Set Preview.
4. Esperar aprobación.
5. Implementar.
6. Ejecutar validaciones.
7. Entregar informe final.

## Validaciones obligatorias

Siempre ejecutar:

pnpm lint
pnpm typecheck
pnpm test
pnpm build

## Monorepo

Estrategia actual:

- Build-First
- Turbo
- Next.js
- NestJS
- Supabase
- Railway

No introducir:

- Conditional exports
- Project references
- Cambios masivos de arquitectura

sin aprobación explícita.
