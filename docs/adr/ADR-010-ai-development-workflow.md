# ADR-010: AI Development Workflow

## Estado

Aprobado

## Contexto

El proyecto jBurger utiliza múltiples asistentes de IA para acelerar análisis, diseño, desarrollo y revisión.

Sin reglas explícitas, distintos modelos pueden producir decisiones contradictorias y generar deriva arquitectónica.

## Decisión

Se establece el siguiente flujo:

### Claude Code

Responsabilidad principal:

- Implementación
- Refactorización
- Corrección de errores
- Generación de código

### Codex

Responsabilidad principal:

- Auditorías técnicas
- Revisiones arquitectónicas
- Detección de inconsistencias

### ChatGPT

Responsabilidad principal:

- Diseño
- Arquitectura
- ADR
- Estrategia
- Validación de decisiones

## Reglas

1. Los ADR son la fuente oficial de verdad arquitectónica.
2. Ninguna IA puede modificar arquitectura sin actualizar el ADR correspondiente.
3. Todo cambio relevante debe incluir:
   - Problema
   - Decisión
   - Impacto
   - Riesgos
   - Rollback
4. Ante conflictos entre modelos:
   - Ganan los ADR.
   - Luego la documentación de /docs.
   - Luego el código existente.

## Consecuencias

### Positivas

- Menos deriva arquitectónica.
- Mayor consistencia.
- Mejor trazabilidad.

### Negativas

- Mayor disciplina documental.
