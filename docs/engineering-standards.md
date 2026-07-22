# Engineering Standards

Business vocabulary remains Spanish in domain contracts and user-facing concepts. Technical implementation remains English for code structures, services, repositories, components, and tooling.

## Dependency Boundaries

- Applications may depend on packages and domain contracts.
- Packages must not depend on applications.
- Domain folders contain bounded-context placeholders and must not import application code.
- Shared foundations must remain business-logic free until Wave 1 implementation begins.

## Environment Strategy

- `.env.example` documents required local variables.
- Runtime validation is mandatory at application startup.
- Secrets are never committed; managed values must be injected by the deployment platform.

## Validation Gate

- Estándar mínimo por checkpoint: `pnpm validate` (lint, typecheck, test, build) en verde.
- Si el bloque modificó cualquier `package.json` del workspace, el gate obligatorio es `pnpm install && pnpm validate`. Ejecutar `pnpm validate` sin el install previo produce falsos negativos por links de workspace ausentes (incidente registrado en el Bloque 3 — Carrito, 2026-07-18).
- Todo Acceptance Test se ejecuta con el pipeline ya en verde; nunca lo reemplaza.

## Workspace Dependency Hygiene

- Las dependencias `workspace:*` declaradas en cada `package.json` deben coincidir **exactamente** con los paquetes `@jburger/*` importados por ese paquete: ni de más (deps mentirosas / acoplamiento oculto) ni de menos (falla de resolución `TS2307`).
- Tras un rebase o merge que toque un `package.json`, deduplicar claves y revisar deps huérfanas antes del gate. Los conflictos de `package.json` tienden a **concatenar** listas de dependencias.
- Incidente de referencia (Bloque 4, 2026-07-19): `services/api/package.json` quedó con claves duplicadas y 10 deps sin uso (8 dominios placeholder de origin + `domain-branches`/`domain-users`) y le faltaba `@jburger/shared-kernel` (importado por el módulo de pedidos). Saneado para reflejar los imports reales.
