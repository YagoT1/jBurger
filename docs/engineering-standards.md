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
