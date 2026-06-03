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
