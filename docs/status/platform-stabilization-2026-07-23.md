# Platform Stabilization — Lessons Learned y Release Notes (2026-07-23)

## Incidentes de la fase

| #   | Incidente                                                                              | Causa raíz                                                                                                                           | Resolución                                                                      |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 1   | `@jburger/web#lint` rojo: `Parsing error: Module declaration names…` en `http.ts:6:82` | El glob `` `features/*/api.ts` `` en un JSDoc: **la secuencia `*/` cierra el comentario de bloque** y el resto se parsea como código | Reescribir el glob como prosa (1 línea). Auditoría: única ocurrencia en el repo |
| 2   | Dos "correcciones" previas no resolvieron el fallo                                     | Se corrigió por hipótesis (arrow genéricas, script lint) **sin reproducir el error**                                                 | Reproducción real en entorno limpio → causa raíz en un comando                  |
| 3   | Script `lint` de web roto por diseño                                                   | `next lint` eliminado en Next 16, oculto tras `\|\|`                                                                                 | `eslint src --ext .ts,.tsx` (convención del monorepo)                           |
| 4   | Divergencia índice/working tree (Bloque 4)                                             | Snapshot staged obsoleto pre-correcciones + hooks fallando sobre él                                                                  | Forense por reflog; índice reconstruido desde el working tree validado          |

## Lecciones (errores que no deben repetirse)

1. **Reproducir antes de corregir es obligatorio, no aspiracional.** Dos rondas de hipótesis plausibles fallaron; la evidencia resolvió en un comando. Ningún fallo de pipeline se corrige sin su salida exacta.
2. **Nunca escribir `*/` dentro de un comentario de bloque** (globs: usar prosa o comillas sin asterisco-barra).
3. **Los mensajes de parser señalan el síntoma, no la causa** (el error hablaba de "module declaration"; la causa era un comentario).
4. **Lo commiteado debe ser lo validado**; el índice nunca es fuente de verdad.
5. **`git add` amplio + hooks que mutan = divergencias**; staging siempre por listas explícitas del commit en curso.

## Convenciones nuevas (institucionalizadas en engineering-standards)

Globs en comentarios (regla 2); reproducción obligatoria de fallos de pipeline (regla 1); gate con `pnpm install` previo si cambió un manifiesto (ya vigente).

## Checklist para futuras estabilizaciones

Reconstruir cadena real de ejecución desde archivos → reproducir el comando exacto → aislar por nivel → clasificar en una categoría → auditar el patrón en todo el repo → corrección mínima → validar completo → commits atómicos por intención.

## Release Notes — Plataforma v0 (interna)

**Arquitectura alcanzada:** backend transaccional completo (catálogo, auth+RBAC, carrito CAS, checkout idempotente con snapshot, pagos MP con confirmación atómica) sobre Supabase con RPCs `security definer`; frontend por capas (`lib` infraestructura / `entities` dominio puro / `features` acceso aislado con mappers DTO→modelo) sin dependencias nuevas; `users`/`roles` no implementados devuelven **501 explícito**.

**Pipeline:** `pnpm validate` verde (lint/typecheck/test/build).

**Implementado:** Bloques 1–5 + plataforma frontend (Fase 0 del B6). **Pendiente:** los 9 backend NUEVO del PRD §17, pantallas SC-01..SA-04, catálogo real, Acceptance B5, deploy.

**Riesgos conocidos:** modificadores sin modelar (bloquea UI de producto); sin registro de clientes (bloquea funnel); fotos de 34 productos (workstream del dueño, bloquea lanzamiento por decisión de marca); hosting/dominio sin confirmar (bloquea webhook real).
