# Arquitectura oficial del frontend (apps/web) — v1.0, 2026-07-22

Plataforma sobre la que se construyen las pantallas del MVP (Screen Specification v1.0). Regla de dependencia estricta: `UI → presentation → application → domain (entities) → infrastructure (lib/api) → backend`. Nunca al revés.

## Estructura

```
apps/web/src/
├─ app/              # Rutas Next (App Router). SOLO composición; cero lógica de negocio, cero fetch.
├─ entities/         # Dominio frontend PURO (sin React, sin IO): money, product, cart, order.
│                    #   Reglas: ProductRules.*, OrderState.*, CartOps.* — única fuente por regla.
├─ features/         # Un directorio por feature, aislado. Hoy: catalog, cart, orders, payments, auth.
│  └─ <feature>/
│     ├─ api.ts      # ÚNICO punto de acceso al backend del feature (usa lib/api/http).
│     ├─ mappers.ts  # DTO de red → modelo de entities. La UI JAMÁS ve un DTO.
│     └─ (hooks/, components/ llegan con las pantallas)
└─ lib/              # Infraestructura transversal sin negocio:
   ├─ api/http.ts    # cliente HTTP único (headers de contexto, timeout, retry idempotente)
   ├─ api/errors.ts  # taxonomía única AppError; ninguna pantalla interpreta HTTP crudo
   ├─ authz.ts       # can(principal, permission) — prohibido if(role===…) en componentes
   └─ routes.ts      # única fuente de rutas — prohibido hardcodear paths
```

Ninguna feature importa de otra feature; comparten solo `entities` y `lib`. `packages/ui` sigue siendo la capa presentacional compartida (design system).

## Decisiones (con justificación)

1. **DTO ≠ modelo, con mapper por feature.** El backend habla español de dominio (`nombre`, `precio`, `estado`); la UI consume modelos estables. Cambiar el contrato de red toca un mapper, no N componentes.
2. **Reglas de negocio del frontend como espejo declarado, no duplicación silenciosa.** `OrderState` (ADR-024) y las derivaciones por categoría (RN-010/011/RF-060 en `catalog/mappers.ts`) existen en UN archivo cada una, comentadas como espejo cuya fuente de verdad es el backend, que siempre revalida. Cuando el backend exponga flags de modificadores/alcohol (PRD §17), la derivación del mapper se elimina sin tocar UI.
3. **Errores: normalización única.** `AppError{kind, code}` con `isRetryable`; `PRICE_CHANGED` & cía. llegan tipados. Cumple "nunca resolver errores distinto entre pantallas" (Screen Spec §3.0).
4. **Carrito invitado = núcleo funcional puro** (`CartOps`, inmutable, sin IO) + carrito server para autenticados vía `features/cart/api.ts`, fusionados con `POST /cart/merge` (RF-021). El total local es preview declarado (RN-030).
5. **Sin fetch ni negocio en componentes** — los `app/*/page.tsx` actuales (placeholders estáticos) se reescribirán componiendo features; no se tocaron en esta fase (son las pantallas, fase siguiente).
6. **Sin dependencias nuevas.** La plataforma usa fetch nativo + React. La adopción de una librería de estado remoto (TanStack Query) es una decisión con alternativas equivalentes → elevada al PO (ver informe). Estado: local (React) para UI efímera; `entities` para derivado puro; remoto vía `features/*/api` (con o sin Query); persistente: carrito invitado (localStorage) y refresh token (política en §Seguridad).
7. **Cache (política):** menú/producto: cache corta con revalidación (cambia poco, RN-020); carrito/pedido/pago: nunca cache (estado vivo); parámetros SA-04: cache por sesión con invalidación al guardar. Implementación concreta llega con la librería de estado remoto elegida.
8. **Seguridad:** access token solo en memoria; refresh token en almacenamiento local con rotación (deuda ADR-021 ya registrada); mejora futura a cookies httpOnly requiere cambio de backend (documentado, no bloqueante MVP). Sanitización: React escapa por defecto; prohibido `dangerouslySetInnerHTML`. CSRF: API por Bearer token, sin cookies de sesión → superficie CSRF mínima.
9. **Observabilidad (preparación):** `AppError` es el punto único para error reporting; los eventos de analytics nombrados en Screen Spec §3 se emitirán desde hooks de feature (no desde componentes presentacionales). Integración concreta: fase de pantallas.
10. **Testing (preparación):** `entities/*` son puras → unit tests directos; `mappers` → tests de contrato contra fixtures de DTO; `features/*/api` → integración con fetch mockeado; componentes → testing de componentes cuando existan. Vitest ya configurado en el workspace.

## Auditoría realizada

- **Corregido:** stubs de `users`/`roles` (defecto de seguridad B1/B2) → ahora `501 Not Implemented` explícito; el listado de roles conserva el vocabulario real. Justificación en el propio código.
- **Detectado, no corregido (fuera de alcance, ya registrado):** 7 dominios huérfanos del rebase (M1); `@jburger/config`/`telemetry` retenidos con justificación (M2); páginas placeholder de `apps/web` (se reemplazan en la fase de pantallas); texto en inglés bajo `lang="es"` en placeholders.

## Deuda evitada (explícita)

Sin capa de "servicios" vacía (YAGNI: los casos de uso viven en `features/*/api` + `entities` hasta que un tercer consumidor justifique extraer); sin motor de feature flags (un solo flag real: proveedor de pagos mock/real, ya resuelto por entorno); sin estado global (el único candidato — sesión + carrito — se resolverá con providers de React en la fase de pantallas, decisión reversible).
