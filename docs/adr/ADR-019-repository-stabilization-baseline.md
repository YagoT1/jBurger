# ADR-019: Repository Stabilization Baseline

## Estado

Aprobado

## Fecha

2026-06-08

## Contexto

Durante la fase inicial de construcción del monorepo jBurger se identificaron múltiples problemas que impedían la validación completa del pipeline.

Los errores afectaban:

- Linting
- Type Checking
- Build
- Configuración de Vitest
- Configuración de pnpm
- Resolución de módulos TypeScript

Antes de continuar con nuevas funcionalidades era necesario estabilizar completamente el repositorio.

## Decisión

Se establece como línea base oficial del proyecto el estado actual del repositorio.

El repositorio se considera estabilizado cuando las siguientes validaciones finalizan exitosamente:

    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build

Todos los paquetes del monorepo deben mantener compatibilidad con estas validaciones.

## Cambios relevantes realizados

### Dependencias

Se eliminó la dependencia redundante:

    "pnpm": "^11.5.1"

manteniendo:

    "packageManager": "pnpm@10.28.1"

### TypeScript

Se eliminó:

    "paths": {
      "@jburger/*": ["packages/*/src"]
    }

para alinearse con la estrategia Build-First definida en los ADR.

### Domain Roles

Se eliminó la interfaz vacía:

    interface RemoveRoleCommand extends AssignRoleCommand {}

sustituyéndola por un alias de tipo equivalente para cumplir las reglas de ESLint.

### Vitest

Se normalizó la resolución de configuración compartida mediante:

    import base from "../../vitest.base.js";

utilizando el archivo base oficial del repositorio.

### API

Se corrigieron errores de ESLint que bloqueaban la validación completa del pipeline.

## Resultado

Estado final de validación:

    pnpm lint       PASS
    pnpm typecheck  PASS
    pnpm test       PASS
    pnpm build      PASS

El repositorio se considera estable y apto para continuar con el desarrollo de nuevas funcionalidades.

## Decisiones ratificadas

Se ratifican los siguientes ADR como base arquitectónica del proyecto:

- ADR-001 Monorepo Strategy
- ADR-002 Backend Architecture
- ADR-003 Database Strategy
- ADR-004 Hosting Strategy
- ADR-005 Frontend Architecture
- ADR-010 AI Development Workflow

## Restricciones

A partir de este ADR:

- Ningún cambio puede romper el pipeline principal.
- Todo Pull Request debe validar satisfactoriamente:
  - lint
  - typecheck
  - test
  - build
- No se introducirán cambios arquitectónicos sin un ADR correspondiente.
- Los ADR continúan siendo la fuente oficial de verdad arquitectónica.

## Próxima fase

Fase 2 del proyecto:

1. Seguridad y RBAC
2. Carrito
3. Pedidos
4. Pagos
5. Notificaciones
6. Observabilidad
7. Deploy productivo

## Consecuencias

### Positivas

- Base estable para desarrollo.
- Menor riesgo de regresiones.
- Mayor confianza en cambios futuros.
- Mejor experiencia para desarrolladores y asistentes de IA.
- Pipeline reproducible y verificable.

### Negativas

- Mayor disciplina requerida para introducir cambios.
- Más validaciones obligatorias antes de fusionar código.
- Necesidad de mantener la documentación actualizada.

## Referencias

- ADR-001 Monorepo Strategy
- ADR-002 Backend Architecture
- ADR-003 Database Strategy
- ADR-004 Hosting Strategy
- ADR-005 Frontend Architecture
- ADR-010 AI Development Workflow

## Notas

Este ADR marca oficialmente el momento en que el repositorio alcanzó un estado estable y verificable. A partir de este punto, cualquier regresión que afecte lint, typecheck, test o build deberá considerarse una incidencia de prioridad alta.

Este documento sirve como referencia histórica para futuras auditorías, refactorizaciones y evoluciones arquitectónicas del proyecto.
