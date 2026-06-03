# J Burguer — Frontend Implementation Blueprint

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Business domains, routes, features, entities, labels, statuses, commands, queries, and events use Spanish. Technical architecture terms such as app, package, component, hook, provider, middleware, repository, service, contract, query, mutation, cache, event, schema, and route group may remain English.

> **Implementation status:** This is the canonical frontend implementation blueprint for the J Burguer ecosystem. It defines structure, ownership, dependencies, routing, features, domains, components, state, data access, realtime, forms, auth, authorization, errors, performance, accessibility, testing, security, observability, governance, anti-patterns, and roadmap. It does not generate application code or create folders.

## 0. Architecture mandate

### 0.1 Mission

The frontend must operate as an enterprise-grade digital ordering ecosystem, not a marketing website. Engineers must be able to build customer ordering, administration, cocina, entregas, loyalty, analytics, franchise management, and support experiences without inventing folder structures, ownership models, or dependency rules.

### 0.2 Approved stack

- Next.js 15.
- TypeScript.
- App Router.
- TailwindCSS.
- shadcn/ui.
- Framer Motion.
- TanStack Query.
- Supabase.

### 0.3 Non-negotiable frontend principles

1. **Business Spanish, technical English:** features and domains use Spanish names; technical folders keep English names when they represent framework or architecture concepts.
2. **No UI-to-database leakage:** UI components never call Supabase directly.
3. **Domain logic stays out of components:** components render and coordinate; domains own business rules.
4. **Server state is not global state:** TanStack Query owns remote data cache; local UI state must remain local when possible.
5. **Design system is mandatory:** no one-off visual systems, raw colors, duplicated primitives, or unapproved component variants.
6. **Apps are deployable shells:** apps own routing, composition, environment, and auth boundaries; packages/domains own reusable logic.
7. **Features are vertical slices:** features coordinate screens and workflows, but do not become unbounded shared utilities.
8. **Domains are stable business contracts:** domains expose typed contracts, services, commands, queries, and events.
9. **Realtime is explicitly owned:** subscriptions, reconnect behavior, stale states, and fallbacks are designed per domain.
10. **Future brands and franchises are first-class constraints:** no hardcoded brand, sucursal, organizacion, or franchise assumptions.

## 1. Monorepo Frontend Strategy

### 1.1 Canonical frontend workspace model

The monorepo frontend layer is organized around deployable apps, reusable packages, business domains, shared platform utilities, and tooling.

| Root area | Purpose | Primary owner | Dependency direction |
| --- | --- | --- | --- |
| `apps/` | Deployable Next.js applications. | App owners and Platform Frontend. | May depend on packages, domains, shared. |
| `packages/` | Reusable technical/product packages. | Platform / Design System / Shared owners. | May depend on shared and approved domain-types only. |
| `domains/` | Business domain modules and contracts. | Domain owners. | May depend on shared-kernel and domain-types; no app dependency. |
| `shared/` | Cross-cutting technical utilities that are not business domains. | Platform Frontend. | Must not depend on apps or features. |
| `tools/` | Build, lint, testing, generators, compliance tooling. | Platform Engineering. | May inspect repo but not become runtime dependency. |

### 1.2 Frontend-relevant repository tree

```text
apps/
  web/
  admin/
  operations/
packages/
  ui/
  design-tokens/
  frontend-config/
  frontend-auth/
  frontend-observability/
  frontend-analytics/
  frontend-feature-flags/
  frontend-test-utils/
  api-contracts/
  domain-types/
domains/
  clientes/
  productos/
  carrito/
  checkout/
  pedidos/
  pagos/
  promociones/
  recompensas/
  entregas/
  notificaciones/
  sucursales/
  cocina/
  soporte/
  administracion/
  analytics/
  franquicias/
  shared-kernel/
  audit-compliance/
shared/
  config/
  constants/
  env/
  errors/
  http/
  i18n/
  logging/
  security/
  validation/
tools/
  lint-rules/
  generators/
  visual-regression/
  accessibility/
  dependency-checks/
```

This tree is a blueprint. Folder creation happens only during implementation phases and must follow this structure.

### 1.3 Ownership rules

- `apps/web` is owned by Customer Product + Frontend Platform.
- `apps/admin` is owned by Administration/Franchise Product + Frontend Platform.
- `apps/operations` is owned by Operations Product + Frontend Platform.
- `packages/ui` and `packages/design-tokens` are owned by Design System.
- `packages/frontend-auth`, `frontend-observability`, `frontend-analytics`, and `frontend-feature-flags` are owned by Platform.
- Each `domains/<dominio>` folder is owned by its domain squad.
- `shared/` is owned by Platform and requires stricter review because it can easily become a dumping ground.

### 1.4 Dependency rules

Allowed:

- apps depend on features, packages, domains, shared;
- features depend on packages, domains, shared;
- domains depend on `domains/shared-kernel`, `packages/domain-types`, `packages/api-contracts`, and shared technical utilities;
- packages may depend on shared technical utilities;
- UI packages may consume design tokens and technical primitives;
- tests may depend on test utilities.

Forbidden:

- domains depending on apps;
- packages depending on apps;
- shared depending on features;
- UI components importing domain services directly;
- feature-to-feature imports except through declared public APIs;
- direct Supabase access from components;
- circular dependencies between domains;
- business logic inside `shared/`;
- duplicated query/mutation implementations across apps.

### 1.5 Boundary enforcement

Boundary compliance is enforced by:

- TypeScript project references;
- import boundary lint rules;
- dependency graph checks in CI;
- package export maps;
- feature public API files;
- domain public API files;
- architecture review for new cross-domain dependencies.

## 2. Application Structure

### 2.1 `apps/web`

| Dimension | Definition |
| --- | --- |
| Purpose | Customer ordering, menu browsing, carrito, checkout, seguimiento_pedido, perfil, direcciones, pedidos, recompensas, promociones. |
| Ownership | Customer Product + Frontend Platform + Design System for shared visual patterns. |
| Personas | First-time cliente, returning cliente, frequent cliente, family pedido cliente, group pedido cliente, late-night cliente, pickup cliente, delivery cliente. |
| Dependencies | `packages/ui`, `packages/design-tokens`, `packages/frontend-auth`, `frontend-analytics`, `frontend-observability`, `domains/clientes`, `productos`, `carrito`, `checkout`, `pedidos`, `pagos`, `promociones`, `recompensas`, `entregas`, `notificaciones`, `sucursales`. |
| Routing responsibilities | Public routes, authenticated cliente routes, checkout routes, tracking routes, account routes, not-found/error/loading routes. |
| Authentication responsibilities | Guest-first flows, optional login/register, session refresh, logout, profile bootstrap. |
| Authorization responsibilities | Cliente-owned data, secure tracking tokens, reward eligibility, address ownership, checkout permissions. |

### 2.2 `apps/admin`

| Dimension | Definition |
| --- | --- |
| Purpose | Administracion, sucursales, marcas, franquicias, usuarios, roles, permisos, menu configuration, promociones, analytics, support review surfaces. |
| Ownership | Administration Product + Franchise Product + Platform Frontend + Security. |
| Personas | administrador_sucursal, administrador_organizacion, franquiciado, franquiciante, soporte, platform_operator, security_admin. |
| Dependencies | UI/design packages, frontend-auth, frontend-observability, frontend-analytics, domains/sucursales, productos, promociones, recompensas, pedidos, pagos, soporte, administracion, franquicias, analytics, audit-compliance. |
| Routing responsibilities | Protected admin shell, organization/sucursal scope routing, configuration routes, reporting routes, approval routes, audit-visible routes. |
| Authentication responsibilities | Strict authenticated session, refresh validation, support grant visibility, elevated action prompts. |
| Authorization responsibilities | Role/permission gates, scoped organization/branch/franchise access, support grant restrictions, break-glass awareness. |

### 2.3 `apps/operations`

| Dimension | Definition |
| --- | --- |
| Purpose | Cocina operations, entregas operations, branch command center, queue handling, operational alerts, realtime status. |
| Ownership | Operations Product + Frontend Platform + SRE + Security for privileged actions. |
| Personas | operador_cocina, operador_entrega, supervisor_sucursal, administrador_sucursal. |
| Dependencies | UI/design packages, frontend-auth, frontend-observability, domains/cocina, pedidos, entregas, sucursales, notificaciones, audit-compliance. |
| Routing responsibilities | Protected operations shell, cocina dashboard, entregas dashboard, branch dashboard, degraded mode routes, incident routes. |
| Authentication responsibilities | Always authenticated, session health monitoring, rapid logout/re-auth, kiosk/tablet compatibility if approved. |
| Authorization responsibilities | Branch-scoped operations, station/task permissions, override approvals, realtime channel authorization. |

### 2.4 Application-local structure

Each app follows the same internal skeleton:

```text
app/
  (route-groups)/
  api/
  global-error.tsx
  layout.tsx
  loading.tsx
  not-found.tsx
features/
components/
providers/
lib/
styles/
tests/
```

Rules:

- `app/` owns route composition only.
- `features/` owns app-specific feature orchestration.
- `components/` contains app-only composition components, not reusable design-system primitives.
- `providers/` composes app providers for auth, query cache, theme, feature flags, analytics, and observability.
- `lib/` contains app-local technical helpers only.
- Shared logic must be promoted to packages or domains.

## 3. Next.js App Router Architecture

### 3.1 Routing principles

- Route segments use Spanish business terms when they represent business concepts.
- Route groups may use English technical names only when they describe technical shell behavior, such as `(public)` or `(protected)`.
- Layouts define shell, auth, scope, and navigation boundaries.
- Pages compose features; they do not implement business logic.
- Loading, error, and not-found states are mandatory for each major route group.

### 3.2 `apps/web` route architecture

```text
app/
  (public)/
    page.tsx
    menu/
    productos/[productoId]/
    promociones/
    fidelizacion/
    sucursales/
    contacto/
  (checkout)/
    carrito/
    finalizacion-compra/
    pago/retorno/
  (tracking)/
    pedidos/[pedidoId]/seguimiento/
  (cuenta)/
    perfil/
    direcciones/
    pedidos/
    recompensas/
    configuracion/
  auth/
    login/
    registro/
    recuperar-acceso/
  layout.tsx
  loading.tsx
  not-found.tsx
  global-error.tsx
```

Why each group exists:

- `(public)` supports discovery and ordering without account friction.
- `(checkout)` isolates high-conversion, high-risk flows with sticky summaries and payment safety.
- `(tracking)` supports realtime order status and secure guest tracking tokens.
- `(cuenta)` contains authenticated cliente account management.
- `auth` contains authentication entry points and recovery.

### 3.3 `apps/admin` route architecture

```text
app/
  (protected)/
    dashboard/
    organizaciones/[organizacionId]/
    marcas/[marcaId]/
    franquicias/
    sucursales/[sucursalId]/
    productos/
    promociones/
    recompensas/
    pedidos/
    pagos/
    soporte/
    analytics/
    usuarios/
    roles/
    auditoria/
  auth/
    login/
    reautenticacion/
  layout.tsx
  loading.tsx
  not-found.tsx
  global-error.tsx
```

Why each group exists:

- `(protected)` enforces authenticated admin shell and scoped navigation.
- organization/marca/franchise routes preserve hierarchy context.
- sensitive routes such as pagos, roles, soporte, and auditoria require elevated authorization.
- `auth/reautenticacion` supports step-up authorization.

### 3.4 `apps/operations` route architecture

```text
app/
  (protected)/
    sucursales/[sucursalId]/
      cocina/
      entregas/
      pedidos/
      alertas/
      incidentes/
    centro-operaciones/
  auth/
    login/
    reautenticacion/
  degraded/
    realtime/
    offline/
  layout.tsx
  loading.tsx
  not-found.tsx
  global-error.tsx
```

Why each group exists:

- `(protected)` keeps operations behind branch-scoped auth.
- `sucursales/[sucursalId]` anchors realtime channels and RLS context.
- `degraded` provides safe states for realtime/offline fallback.
- reauth routes support high-risk operational overrides.

### 3.5 Layout responsibilities

| Layout | Responsibility |
| --- | --- |
| Root layout | Global metadata, theme shell, fonts, top-level providers. |
| Public layout | Customer navigation, brand shell, no forced auth. |
| Checkout layout | Minimal distraction, carrito summary, payment-safe recovery. |
| Tracking layout | Realtime state, last-sync indicator, support access. |
| Account layout | Authenticated cliente shell and account navigation. |
| Admin layout | Auth guard, scope selector, permission-aware navigation. |
| Operations layout | Branch guard, realtime status, operational alerts, tablet-safe shell. |

### 3.6 Error, loading, and not-found routes

- Loading routes use skeletons matching final layout.
- Error routes classify technical vs business failure.
- Not-found routes preserve navigation and recovery actions.
- Global errors never expose secrets, tokens, SQL, or internal identifiers.
- Payment and checkout error boundaries must preserve carrito state.

## 4. Feature Architecture

### 4.1 Feature folder contract

Each feature follows the same contract:

```text
features/<feature-name>/
  index.ts
  components/
  hooks/
  queries/
  mutations/
  services/
  schemas/
  state/
  utils/
  tests/
```

Rules:

- `index.ts` is the public API.
- Internal files cannot be imported from outside the feature.
- Feature hooks coordinate domain queries/mutations and UI state.
- Feature services are workflow services, not domain services.
- Feature schemas validate UI/form inputs and map to domain commands.

### 4.2 Customer feature catalog

| Feature | Responsibility | Owner | Public API | Forbidden dependencies |
| --- | --- | --- | --- | --- |
| `features/inicio` | Home personalization, best sellers, promotions, reorder entry. | Customer Product. | Page sections and query hooks for home modules. | Direct Supabase, checkout internals. |
| `features/menu` | Category browsing, search, filters, product listing. | Menu/Commerce Product. | Menu view model, category navigation, listing hooks. | Payment logic, operations dashboards. |
| `features/productos` | Product detail, modifiers, combo upgrades, gallery. | Menu/Commerce Product. | Product detail components, modifier orchestration. | Checkout payment, loyalty mutation internals. |
| `features/carrito` | Cart display, item editing, promo/reward preview. | Commerce Product. | Cart sheet/page, cart hooks, cart item components. | Direct payment creation, kitchen logic. |
| `features/checkout` | Finalizacion_compra, address/payment/review flow. | Commerce + Payments. | Checkout flow shell, step hooks, form adapters. | Menu browsing internals, admin-only services. |
| `features/pedidos` | Order history and reorder. | Customer Product. | Pedido list/detail/reorder entry. | Cocina mutations, support grant logic. |
| `features/seguimiento-pedido` | Realtime tracking, ETA, notifications, support escalation. | Customer + Operations. | Tracking timeline, subscription hooks, ETA cards. | Direct delivery assignment. |
| `features/recompensas` | Loyalty progress, rewards, redemption presentation. | Loyalty Product. | Reward cards, progress hooks, redemption selectors. | Payment capture, admin rule editing. |
| `features/perfil` | Cliente profile, settings, contact preferences. | Customer Account. | Profile forms and hooks. | Admin user management. |
| `features/direcciones` | Address management and coverage checks. | Customer Account + Delivery. | Address selector/form, coverage hooks. | Cocina operations. |
| `features/promociones` | Promotion surfaces and coupon entry. | Growth/Marketing. | Promotion cards, eligibility hooks. | Admin promotion configuration internals. |
| `features/notificaciones` | Customer notification preferences and in-app notices. | CRM/Platform. | Notification preference components and hooks. | Direct WhatsApp provider calls. |

### 4.3 Operations feature catalog

| Feature | Responsibility | Owner | Public API | Forbidden dependencies |
| --- | --- | --- | --- | --- |
| `features/cocina` | Ticket queues, station views, status advancement. | Operations Product. | Cocina dashboard, ticket components, queue hooks. | Customer checkout internals. |
| `features/entregas` | Delivery assignment, route queue, repartidor status. | Delivery Operations. | Delivery dashboard, assignment hooks. | Payment mutation internals. |
| `features/centro-operaciones` | Branch-wide operational health and alerts. | Operations Product. | Health panels, alert summary, pause controls. | Customer-only UI components. |
| `features/incidentes` | Incident display and resolution workflows. | Operations + Support. | Incident panels, escalation hooks. | Direct audit writes from UI. |

### 4.4 Admin feature catalog

| Feature | Responsibility | Owner | Public API | Forbidden dependencies |
| --- | --- | --- | --- | --- |
| `features/administracion` | Admin shell, settings, configuration workflows. | Admin Product. | Admin layout modules and config panels. | Customer cart state. |
| `features/sucursales` | Branch settings, horarios, delivery zones. | Branch Ops. | Branch forms, branch scope selector. | Cocina queue internals. |
| `features/franquicias` | Franchise hierarchy and reporting scopes. | Franchise Product. | Hierarchy views and scope components. | Direct tenant bypass logic. |
| `features/usuarios-roles` | Users, roles, permissions, access reviews. | Security + Admin. | Role matrix, user role forms. | Feature-level auth shortcuts. |
| `features/analytics` | Business metrics and operational metrics. | Analytics Product. | Dashboard cards, charts, filters. | Customer-only personalization. |
| `features/soporte` | Cases, temporary access, issue resolution. | Support Product. | Case panels and scoped support views. | Unscoped customer data access. |

### 4.5 Feature dependency rules

Allowed:

- feature imports domain public API;
- feature imports packages/ui;
- feature imports app providers through explicit context only when app-local;
- feature imports shared validation/errors when technical.

Forbidden:

- feature imports another feature internal path;
- feature stores domain state in module-level variables;
- feature creates duplicate domain query keys;
- feature bypasses design system components;
- feature calls Supabase directly;
- feature writes audit/event records directly from UI.

## 5. Domain Architecture

### 5.1 Domain folder contract

Each domain follows:

```text
domains/<dominio>/
  index.ts
  entities/
  contracts/
  services/
  queries/
  commands/
  events/
  mappers/
  errors/
  tests/
```

Domain public API exposes only stable contracts. Internal implementation stays private.

### 5.2 Domain catalog

| Domain | Entities | Contracts | Services | Queries | Commands | Events | Owner | Dependency rules |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `clientes` | Cliente, PerfilCliente, Direccion | ClienteDTO, PerfilClienteResponse | clienteService, perfilService | obtenerPerfil, listarDirecciones | actualizarPerfil, crearDireccion | cliente.actualizado | Customer Account | May depend on shared-kernel; cannot depend on pedidos internals. |
| `productos` | Producto, Categoria, Modificador, Combo | ProductoDTO, MenuResponse | menuService, productoService | listarMenu, obtenerProducto | none for customer app; admin commands separate | producto.actualizado | Menu/Commerce | May depend on sucursales for availability contracts only. |
| `carrito` | Carrito, ItemCarrito, ModificadorCarrito | CarritoDTO | carritoService | obtenerCarrito | agregarItem, actualizarItem, quitarItem | carrito.actualizado | Commerce | May depend on productos contracts; no pagos dependency. |
| `checkout` | SesionCheckout, ResumenCheckout | CheckoutDTO | checkoutService | obtenerResumenCheckout | iniciarCheckout, confirmarCheckout | checkout.iniciado | Commerce/Payments | May orchestrate carrito, pagos, direcciones via contracts. |
| `pedidos` | Pedido, ItemPedido, EstadoPedido | PedidoDTO, PedidoTrackingResponse | pedidoService | obtenerPedido, listarPedidos | repetirPedido, cancelarPedidoPermitido | pedido.creado, pedido.actualizado | Commerce/Ops | May consume pagos/entregas status contracts; no direct UI state. |
| `pagos` | Pago, IntentoPago, Reembolso | PagoDTO, PaymentStatusResponse | pagoService | obtenerPago | iniciarPago, reintentarPago | pago.aprobado, pago.fallido | Payments | Must enforce idempotency; no direct Mercado Pago UI code in components. |
| `promociones` | Promocion, Cupon | PromocionDTO | promocionService | listarPromociones, validarCupon | aplicarCupon | promocion.aplicada | Growth | May depend on carrito/productos contracts. |
| `recompensas` | CuentaFidelizacion, Recompensa | RecompensaDTO | recompensaService | obtenerProgreso, listarRecompensas | canjearRecompensa | recompensa.canjeada | Loyalty | May depend on clientes and pedidos contracts. |
| `entregas` | Entrega, Repartidor, EstadoEntrega | EntregaDTO | entregaService | obtenerEntrega, listarEntregas | asignarEntrega, reasignarEntrega | entrega.asignada, entrega.actualizada | Delivery Ops | May depend on pedidos and sucursales contracts. |
| `notificaciones` | Notificacion, PreferenciaNotificacion | NotificacionDTO | notificacionService | listarNotificaciones | actualizarPreferencias | notificacion.enviada | CRM/Platform | No direct WhatsApp/email provider access from UI. |
| `sucursales` | Sucursal, HorarioSucursal, ZonaEntrega | SucursalDTO | sucursalService | listarSucursales, validarCobertura | actualizarConfiguracion | sucursal.actualizada | Branch Ops | Shared by apps; must preserve tenant scope. |
| `cocina` | TicketCocina, EstacionCocina | TicketCocinaDTO | cocinaService | listarTickets | avanzarTicket, marcarIncidencia | ticket_cocina.actualizado | Operations | Depends on pedidos contracts; no customer app dependency. |
| `soporte` | CasoSoporte, InteraccionSoporte | CasoSoporteDTO | soporteService | listarCasos | crearCaso, resolverCaso | soporte.caso_creado | Support | Requires support grant context; no unscoped access. |
| `administracion` | Configuracion, Aprobacion | AdminDTO | administracionService | obtenerConfiguracion | actualizarConfiguracion | administracion.cambio_solicitado | Admin | Requires authorization contracts. |
| `analytics` | Metrica, Reporte | AnalyticsDTO | analyticsService | obtenerMetricas | none from dashboards unless export approved | analytics.evento_registrado | Analytics | Reads aggregated contracts; no OLTP mutation. |
| `franquicias` | Franquiciante, Franquiciado, Marca | FranquiciaDTO | franquiciaService | obtenerJerarquia | actualizarRelacion | franquicia.actualizada | Franchise Product | Must preserve cross-franchise restrictions. |

### 5.3 Domain dependency rules

- Stable dependencies point from orchestration domains to lower-level contracts, never to UI features.
- `checkout` may orchestrate `carrito`, `clientes`, `sucursales`, `pagos`, `promociones`, and `recompensas` through public contracts.
- `pedidos` may expose tracking contracts consumed by web and operations.
- `analytics` consumes event/metrics contracts and must not mutate commerce domains.
- `soporte` access requires support grant context and must never be a generic backdoor.

## 6. Component Architecture

### 6.1 Component hierarchy

```text
packages/ui/
  ui/
  commerce/
  operations/
  analytics/
  layout/
  feedback/
  forms/
  navigation/
```

### 6.2 Component family rules

| Family | Responsibility | Allowed dependencies | Forbidden dependencies | Reusability rules |
| --- | --- | --- | --- | --- |
| `ui/` | Primitive brand-wrapped shadcn/ui components. | design-tokens, shared accessibility helpers. | domains, features, Supabase, TanStack Query. | Reusable across every app. |
| `commerce/` | Product, carrito, checkout, tracking, reward UI components. | ui primitives, design tokens, domain type shapes. | domain services, app routing, direct data fetching. | Reusable across customer app and selected admin previews. |
| `operations/` | Cocina, entregas, support, admin operational components. | ui primitives, operational tokens, domain type shapes. | customer feature hooks, direct Supabase. | Reusable across operations and admin. |
| `analytics/` | Metrics, charts, filters, report cards. | ui primitives, chart adapters, analytics type shapes. | raw domain mutations. | Reusable across admin and future analytics app. |
| `layout/` | Shell, containers, grids, sticky bars. | design tokens, responsive utilities. | business services. | App shells may specialize through props/composition. |
| `feedback/` | Toasts, alerts, banners, empty/loading/error states. | ui primitives, error contracts. | domain mutations. | Must support customer and operations tone variants. |
| `forms/` | Inputs and form primitives. | ui primitives, validation adapters. | feature-specific schemas. | Reusable; feature forms compose them. |
| `navigation/` | Bottom nav, side nav, breadcrumbs, tabs, steppers. | ui primitives, route metadata. | auth service internals. | Route visibility is passed in, not fetched internally. |

### 6.3 Component ownership

- Design System owns primitive and foundational components.
- Commerce Product co-owns commerce components.
- Operations Product co-owns operations components.
- Analytics Product co-owns analytics components.
- Platform Frontend owns implementation quality and import boundaries.
- Accessibility owner approves component accessibility patterns.

### 6.4 Component API rules

- Component props use Spanish names when they represent business concepts: `pedido`, `producto`, `sucursal`, `entrega`.
- Component props use English names for technical configuration: `variant`, `size`, `disabled`, `loading`, `onClick`.
- Components must be controlled or uncontrolled by explicit design, not accidental state.
- Components expose states: default, loading, error, disabled, empty, degraded where relevant.

## 7. Design System Integration

### 7.1 Design token flow

1. Figma tokens define approved visual intent.
2. `packages/design-tokens` stores source token definitions.
3. Token build outputs Tailwind theme values and runtime CSS variables.
4. `packages/ui` consumes semantic/component tokens only.
5. Apps consume tokens through UI components and theme providers.
6. Visual regression verifies token changes.

### 7.2 shadcn/ui integration

- shadcn/ui primitives are wrapped in `packages/ui`.
- Apps never import raw shadcn/ui primitives directly.
- Wrapper components apply design tokens, accessibility conventions, and state patterns.
- Primitive updates require compatibility review.
- Business components compose wrappers; they do not fork wrappers.

### 7.3 Component wrapping strategy

- Primitive wrapper: Button, Input, Dialog, Sheet, Tabs, Toast.
- Product wrapper: ProductoCard, CarritoResumen, CheckoutStepper.
- Operations wrapper: TicketCocinaCard, EntregaCard, OperationalAlert.
- Analytics wrapper: MetricCard, TrendChart, FilterBar.

### 7.4 Branding strategy

- Brand expression is applied through tokens and assets, not duplicated components.
- Customer app uses dark-first customer theme by default.
- Operations/admin use light-first operational theme by default.
- Brand-specific overrides require accessibility and visual regression approval.

### 7.5 Multi-brand and white-label support

- Theme is selected by marca/organizacion context.
- No hardcoded brand color, logo, radius, or font in feature code.
- White-label overrides are isolated in brand token packages.
- Semantic status and operational safety tokens remain shared.

## 8. State Management Strategy

### 8.1 State categories

| State category | Owner | Storage location | Lifecycle | Invalidation |
| --- | --- | --- | --- | --- |
| Server state | TanStack Query + domain query layer. | Query cache. | Fetched, cached, stale, refetched. | Domain query keys, events, mutations, route changes. |
| Client state | Feature/app local hooks. | React state or scoped store when justified. | Screen/session scoped. | Component unmount, explicit reset. |
| Form state | Form library/adapters. | Feature form context. | Form lifecycle. | Submit, reset, schema change, route leave. |
| UI state | Component/feature. | Local state, URL params for shareable filters. | Local or route-scoped. | Navigation, explicit close/reset. |
| Session state | Auth provider. | Secure Supabase session handling and app context. | Login, refresh, revoke, logout. | Token refresh, permission version change, logout. |
| Realtime state | Realtime feature/domain adapters. | Subscription registry + query cache updates. | Channel connected/stale/degraded/reconnected. | Event messages, reconnect, fallback polling. |
| Cache state | Query cache and Next.js cache. | TanStack Query / RSC cache / route cache where safe. | TTL/stale rules. | Mutation, webhook event, auth scope change. |

### 8.2 State rules

- Global stores are last resort and require architecture approval.
- Carrito state may be optimistic but must reconcile with server truth.
- Checkout state must survive payment redirect and browser refresh.
- Permission state cannot rely solely on stale JWT claims.
- Realtime data updates query cache through domain adapters, not direct component mutation.
- URL state is allowed for filters, pagination, and shareable views.

## 9. Data Access Architecture

### 9.1 Supabase access strategy

Supabase access is isolated:

- app providers create environment-aware clients;
- domain services use approved repository/service adapters;
- UI components never instantiate Supabase clients;
- server and client Supabase usage are separated;
- service-role access is forbidden in frontend runtime;
- RLS remains the database source of truth.

### 9.2 Data flow

```text
Database / Edge Function
  -> domain repository/service adapter
  -> domain query or command
  -> TanStack Query hook or server loader
  -> feature view model
  -> component props
  -> UI render
```

### 9.3 Service layer

Domain services:

- map API responses to domain types;
- enforce domain error mapping;
- expose commands/queries;
- attach idempotency keys where required;
- do not know about React components.

### 9.4 Query layer

Query layer owns:

- query keys;
- cache TTL/stale policies;
- retry policy;
- error mapping;
- optimistic update rules;
- realtime cache patching rules.

### 9.5 Mutation layer

Mutation layer owns:

- command validation;
- idempotency;
- optimistic update when safe;
- rollback behavior;
- audit-sensitive metadata forwarding;
- cache invalidation.

### 9.6 Cache layer

- Query keys are defined per domain.
- Tenant/sucursal/user scope is part of cache key when relevant.
- Auth scope changes clear sensitive caches.
- Checkout/payment caches use conservative invalidation.
- Operations realtime caches are short-lived and freshness-aware.

## 10. Realtime Frontend Architecture

### 10.1 Realtime principles

- Realtime is domain-owned, not component-owned.
- Subscriptions are scoped by organizacion, sucursal, pedido, or support grant.
- Realtime updates patch query cache, not arbitrary local state.
- UI always shows connected, reconnecting, stale, or degraded state.
- Polling fallback is mandatory for critical customer and operations flows.

### 10.2 Cocina realtime

| Concern | Rule |
| --- | --- |
| Subscription scope | `sucursalId` + station/queue permissions. |
| Data | tickets_cocina status, age, priority, incidents. |
| Reconnect | Preserve visible queue and show stale indicator. |
| Fallback | Poll active queue with safe interval during degraded realtime. |
| Error recovery | Do not clear queue; mark updates stale and provide refresh. |

### 10.3 Entregas realtime

| Concern | Rule |
| --- | --- |
| Subscription scope | `sucursalId` + delivery role. |
| Data | entrega assignment, repartidor status, ETA risk, incidents. |
| Reconnect | Revalidate active deliveries after reconnect. |
| Fallback | Poll active assignments and delayed deliveries. |
| Error recovery | Prevent duplicate reassignment actions until server confirms. |

### 10.4 Tracking realtime

| Concern | Rule |
| --- | --- |
| Subscription scope | pedido secure token or authenticated ownership. |
| Data | pedido status, ETA, delivery status, notification status. |
| Reconnect | Show last updated timestamp. |
| Fallback | Poll tracking endpoint with exponential backoff. |
| Error recovery | Preserve timeline and show degraded reassurance. |

### 10.5 Notifications realtime

- In-app notifications subscribe by authenticated user and scope.
- WhatsApp/email provider status is surfaced as domain state, not provider internals.
- Notification preference changes invalidate notification cache.
- Duplicate notification display is prevented by event ID.

## 11. Form Architecture

### 11.1 Form principles

- Forms are feature-owned and schema-validated.
- Domain commands receive normalized data.
- Field labels use Spanish business terms.
- Errors are mapped to UX copy and domain error categories.
- Sensitive forms require step-up authorization when policy demands it.

### 11.2 Checkout forms

- Address/delivery mode form.
- Contact form for guest checkout.
- Payment selection form.
- Review/confirmation form.
- Promo/reward form.

Rules:

- Form state persists through checkout steps.
- Payment retry never clears carrito.
- Validation errors appear inline and summary-level.

### 11.3 Profile and address forms

- Perfil fields are separate from private security/session data.
- Direccion form supports coverage validation and ambiguity resolution.
- Phone/email changes may require verification flows.
- Saved address changes invalidate checkout address queries.

### 11.4 Admin forms

- Admin forms include audit reason where required.
- High-risk changes require preview and approval workflow.
- Role/permission forms require step-up authorization.
- Form submissions are command-based and idempotent where needed.

### 11.5 Operations forms

- Operations forms are short, fast, and reason-coded.
- Overrides require role, reason, scope, and expiration.
- Incident forms support partial save if connectivity degrades.
- Delay and stock forms must update customer-facing state only through domain commands.

## 12. Authentication Architecture

### 12.1 Authentication responsibilities

- `packages/frontend-auth` owns auth provider, session state, refresh orchestration, logout, and auth event handling.
- Apps own auth route UI and app-specific redirect rules.
- Domains never own Supabase session state.
- Route protection uses server and client checks where appropriate.

### 12.2 Login and register

- `apps/web` supports guest checkout; login/register is optional except for account-only actions.
- `apps/admin` and `apps/operations` require authenticated login.
- Registration creates minimum profile context; business access still comes from roles/memberships.

### 12.3 Session refresh and logout

- Session refresh must update app auth context and clear stale permission caches when role version changes.
- Logout clears TanStack Query cache, local sensitive state, and subscription registry.
- Expired sessions show recovery without losing carrito when safe.

### 12.4 Role and permission updates

- Permission changes trigger permission version invalidation.
- UI cannot trust JWT role claims for high-risk actions.
- Sensitive action checks query current authorization state.
- Revoked users must lose access without waiting for natural token expiry.

### 12.5 Support access and break-glass awareness

- Support grants are visible in UI as scoped, temporary access states.
- Support UI must show privacy masking and audit access notices.
- Break-glass access is not a normal admin mode; UI must show emergency state, expiry, incident reference, and postmortem requirements.

## 13. Authorization Architecture

### 13.1 Authorization layers

| Layer | Responsibility |
| --- | --- |
| Route protection | Prevent entry to unauthorized route groups. |
| Component protection | Hide or disable UI that user cannot use. |
| Action protection | Re-check permission immediately before sensitive mutation. |
| Feature protection | Gate entire workflows based on roles/scopes. |
| Data protection | RLS and backend contracts enforce final source of truth. |

### 13.2 Role resolution

Role resolution uses:

- authenticated user;
- organizacion membership;
- sucursal membership;
- franchise relationship;
- support grant;
- permission version;
- expiration and revocation state.

### 13.3 Permission resolution

- Permissions are capability-based, not only role-name-based.
- UI permissions must include scope: organizacion, sucursal, marca, franquicia, pedido, support case.
- Permission checks are centralized in frontend-auth/authorization utilities.
- Components receive `canPerform` results, not raw role logic.

### 13.4 Protected UI behavior

- Hidden when the action should not be discoverable.
- Disabled with explanation when user can request access.
- Step-up when user has permission but action is high-risk.
- Audit notice when support/break-glass context is active.

## 14. Error Handling Architecture

### 14.1 Error taxonomy

| Error type | Examples | UX behavior |
| --- | --- | --- |
| Network error | offline, timeout, DNS, failed fetch. | Preserve state, show retry, degraded mode when needed. |
| Validation error | invalid direccion, missing modifier, invalid phone. | Inline field error + summary for forms. |
| Business error | item unavailable, promo invalid, sucursal closed. | Explain cause and next best action. |
| Realtime error | disconnected channel, stale updates. | Show stale indicator and fallback polling. |
| Payment error | Mercado Pago failure, pending status, retry needed. | Preserve carrito/pedido intent, avoid duplicate-charge fear. |
| Authorization error | revoked role, missing permission, expired grant. | Redirect or disable with explanation; clear sensitive cache. |
| System error | unexpected exception. | Error boundary, safe message, trace ID, support path. |

### 14.2 Error boundaries

- Root global error catches catastrophic rendering failures.
- Route group errors isolate public, checkout, account, admin, operations failures.
- Feature-level boundaries protect complex widgets like analytics charts or realtime queues.
- Error boundaries report observability metadata.

### 14.3 Payment error rules

- Never show duplicate payment uncertainty without status context.
- Payment retry uses idempotency-aware messaging.
- Payment return route reconciles server state before showing success/failure.
- Checkout state remains recoverable.

## 15. Performance Architecture

### 15.1 SSR strategy

- Public menu and product pages use SSR/RSC where SEO and initial performance benefit.
- Personalized sections hydrate separately.
- Admin/operations dashboards prioritize authenticated dynamic rendering.
- Sensitive data is never cached publicly.

### 15.2 RSC strategy

- Server Components fetch safe, route-level data through server-safe domain loaders.
- Client Components own interactions, forms, realtime, and stateful UI.
- RSC boundaries should reduce bundle size without splitting business logic incorrectly.

### 15.3 Client Component strategy

Client Components are used for:

- carrito interactions;
- checkout forms;
- realtime tracking;
- cocina/entregas dashboards;
- filters/search;
- animations;
- account forms;
- admin forms.

### 15.4 Streaming and lazy loading

- Stream page shell and critical above-the-fold content.
- Lazy load below-fold carousels, analytics charts, heavy admin panels, and maps.
- Checkout and payment-critical components are not delayed by non-essential modules.

### 15.5 Image strategy

- Product images use optimized responsive formats.
- Hero images have strict performance budgets.
- Menu card images lazy-load below fold.
- Alt text is mandatory.
- Fallback images use brand-approved placeholders.

### 15.6 Bundle strategy

- Apps avoid importing admin/operations code into customer bundles.
- Feature modules are route-split.
- Charting and map libraries are lazy-loaded.
- Framer Motion is used selectively.
- Shared packages must expose tree-shakeable exports.

### 15.7 Caching strategy

- Static public content can use route caching when not tenant-sensitive.
- Menu availability must respect sucursal and freshness rules.
- Authenticated data uses user/scope-aware caching.
- Realtime updates invalidate or patch cache.

### 15.8 Target Lighthouse metrics

| Surface | Target |
| --- | --- |
| Customer public/menu | Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+. |
| Checkout | Accessibility 95+, no critical UX-blocking performance regressions. |
| Admin/operations | Core Web Vitals monitored; Lighthouse supplemented by app metrics. |

## 16. Accessibility Architecture

### 16.1 WCAG target

Minimum target is WCAG 2.2 AA for all released surfaces. Checkout, payment recovery, tracking, cocina, entregas, support grants, and role management require manual accessibility review.

### 16.2 Keyboard navigation

- All controls are keyboard reachable.
- Focus order follows task order.
- Operations dashboards define safe keyboard shortcuts only after approval.
- Data grids require documented keyboard behavior.

### 16.3 Focus management

- Route changes set focus to page heading or appropriate landmark.
- Modals/drawers trap and restore focus.
- Checkout errors focus first blocking issue.
- Sticky bars cannot obscure focused controls.

### 16.4 Screen reader support

- Product cards announce name, price, availability, and action.
- Modifier groups announce required/optional and selected count.
- Cart total updates use polite live regions.
- Realtime status changes announce meaningfully without spam.
- Operations alerts have text equivalents.

### 16.5 Motion reduction

- Reduced-motion preference disables non-essential animation.
- State changes remain visible through text/icon/color.
- Critical operations use stable updates, not animated reordering.

## 17. Testing Architecture

### 17.1 Test pyramid

| Test type | Owner | Scope | Coverage target |
| --- | --- | --- | --- |
| Unit | Feature/domain/component owners. | Pure utilities, mappers, reducers, domain adapters. | High for domain logic and critical utilities. |
| Integration | Feature owners. | Feature hooks, forms, query/mutation flows. | Critical workflows and state transitions. |
| Contract | Domain/API owners. | API contracts, domain DTOs, event payloads. | 100% for critical contracts. |
| E2E | QA + Product owners. | Customer ordering, checkout, tracking, operations, admin. | Core happy paths and critical failures. |
| Visual | Design System + Frontend. | Components, tokens, responsive variants. | Required for design-system components. |
| Accessibility | Accessibility owner + QA. | Automated + manual critical flows. | Zero critical violations before release. |
| Performance | Frontend Platform. | Lighthouse, Web Vitals, bundle size, dashboard load. | Release-gated for customer flows. |
| Security | Security + Frontend. | Authz gates, sensitive actions, token handling. | Required before production. |

### 17.2 Required E2E journeys

- First-time cliente orders as guest.
- Returning cliente repeats pedido.
- Checkout payment success and failure recovery.
- Tracking with realtime and degraded fallback.
- Cocina advances ticket safely.
- Entregas assigns/reassigns delivery.
- Admin updates sucursal setting with permission.
- Support accesses case with temporary grant.
- Revoked role loses access.

### 17.3 Testing ownership rules

- Feature owner writes feature tests.
- Domain owner writes domain contract tests.
- Design System writes component/visual/a11y tests.
- Platform owns dependency boundary tests.
- QA owns cross-app E2E orchestration.

## 18. Security Architecture

### 18.1 Frontend security model

- Frontend is not a trust boundary.
- RLS/backend authorization are final authority.
- UI protection improves UX but does not replace server/database controls.
- Sensitive data is minimized in browser state.

### 18.2 Session protection

- No service role keys in frontend.
- Session tokens are handled by approved Supabase auth mechanisms.
- Logout clears sensitive caches and subscriptions.
- Permission revocation invalidates UI access quickly.

### 18.3 Token handling

- JWT claims may be used for coarse display only.
- High-risk actions must re-check current permission state.
- Tokens are never logged.
- Error reports redact tokens and PII.

### 18.4 Sensitive and privileged actions

Sensitive actions include:

- refund/reembolso actions;
- role and permission changes;
- operational overrides;
- menu availability changes;
- support grant access;
- break-glass workflows;
- payment retry/reconciliation actions.

Rules:

- require explicit permission;
- require step-up when high-risk;
- show audit notice;
- include reason fields when required;
- use idempotency for mutation safety.

### 18.5 Audit integration

Frontend captures audit-relevant context for backend/domain commands:

- actor;
- scope;
- reason;
- feature route;
- correlation ID;
- support grant ID when applicable;
- break-glass incident ID when applicable.

Frontend never writes audit logs directly.

## 19. Observability Architecture

### 19.1 Frontend logs

Logs capture:

- route transitions;
- auth state changes;
- query/mutation errors;
- realtime connection state;
- payment recovery issues;
- operations action failures;
- feature flag exposure.

Logs redact PII, tokens, payment data, and sensitive support details.

### 19.2 Metrics

Frontend metrics:

- Web Vitals;
- route load time;
- checkout step completion;
- query latency;
- mutation latency;
- realtime reconnect count;
- error boundary triggers;
- bundle size;
- accessibility regression count.

### 19.3 Analytics

Analytics events track:

- menu views;
- product views;
- add to carrito;
- checkout start;
- payment selected;
- pedido confirmed;
- tracking opened;
- reward viewed/redeemed;
- support contacted;
- operations actions where approved.

Analytics must use canonical Spanish business event names where events represent business actions.

### 19.4 Traces

- Generate correlation IDs for critical flows.
- Propagate correlation ID from frontend command to backend and event/audit systems.
- Payment, checkout, and operations actions require traceability.

### 19.5 Error monitoring

- Error reports include route, feature, domain, app, release, correlation ID, and user scope category.
- Reports exclude secrets, tokens, and sensitive PII.
- Critical errors page teams by severity.

### 19.6 User journey tracking

Journey tracking focuses on:

- conversion funnel;
- checkout friction;
- payment recovery;
- tracking reassurance;
- loyalty retention;
- operations throughput;
- support access safety.

## 20. Implementation Governance

### 20.1 Folder naming rules

- Business feature/domain folders use kebab-case Spanish: `seguimiento-pedido`, `promociones`, `recompensas`.
- Technical folders use English: `components`, `hooks`, `providers`, `services`, `queries`, `mutations`, `tests`.
- Avoid mixed business language: never `order-pedidos` or `customer-clientes`.

### 20.2 File naming rules

- Components use PascalCase file names.
- Hooks use `use` prefix and camelCase technical naming with Spanish business concept when applicable.
- Domain services use Spanish business concept + `Service` technical suffix.
- Tests mirror file names.
- Route files follow Next.js conventions.

### 20.3 Component naming rules

Correct:

- `ProductoCard`.
- `CarritoResumen`.
- `PedidoTimeline`.
- `TicketCocinaCard`.
- `EntregaAssignmentPanel`.

Incorrect:

- `ProductCard` for business producto.
- `OrderTimeline` for pedido.
- `DeliveryEntregaCard` mixed language.

### 20.4 Feature naming rules

- Feature names represent user/business workflow in Spanish.
- Feature public API exports only approved components/hooks/types.
- Feature internals are private.

### 20.5 Domain naming rules

- Domains use plural Spanish names.
- Entities use singular Spanish names.
- Commands use Spanish verb + Spanish noun + technical suffix: `CrearPedidoCommand`.
- Queries use Spanish verb + noun + technical suffix: `ObtenerPedidoQuery`.

### 20.6 Review process

PR review must include:

- architecture boundary compliance;
- language policy compliance;
- design system compliance;
- accessibility review for UI changes;
- auth/authorization review for protected flows;
- performance impact review;
- observability coverage;
- testing coverage.

### 20.7 Forbidden patterns

- direct Supabase from components;
- raw shadcn imports in apps;
- raw token values in feature code;
- global state for server data;
- circular feature/domain imports;
- hidden permission checks inside UI components;
- duplicated query keys;
- unowned shared utilities;
- mixed Spanish/English business terms.

## 21. FRONTEND ANTI-PATTERNS

| # | Mistake | Risk | Consequence | Prevention |
| --- | --- | --- | --- | --- |
| 1 | Feature leakage | Feature internals imported elsewhere. | Coupling and broken refactors. | Enforce public API imports only. |
| 2 | Shared folder abuse | Shared becomes business dumping ground. | Unowned logic and hidden coupling. | Require owner and promotion rules. |
| 3 | Duplicated hooks | Same behavior implemented per app. | Divergent bugs. | Centralize domain/feature hooks. |
| 4 | Duplicated queries | Multiple query keys for same data. | Cache inconsistency. | Domain-owned query key registry. |
| 5 | Direct Supabase access from UI | UI bypasses domain/service rules. | Security and consistency risk. | Lint forbidden imports. |
| 6 | Business logic in components | Components become untestable. | Reuse blocked and bugs hidden. | Move logic to domains/features. |
| 7 | Overuse of global state | Local/server state becomes tangled. | Stale UI and hard debugging. | Use TanStack Query/local state. |
| 8 | Raw shadcn usage in apps | Visual inconsistency. | Design system fragmentation. | Wrap primitives in packages/ui. |
| 9 | Hardcoded colors | Brand inconsistency and a11y failures. | Multi-brand blocked. | Use tokens only. |
| 10 | Hardcoded spacing | Layout drift. | Visual inconsistency. | Use spacing tokens. |
| 11 | Mixed language business names | Domain confusion. | Naming drift and maintenance pain. | Enforce language policy. |
| 12 | Feature-to-feature internals | Circular dependencies. | Fragile builds. | Public API boundaries. |
| 13 | JWT-only authorization | Stale permissions. | Privilege escalation. | Re-check high-risk permissions. |
| 14 | Hiding auth errors as generic errors | Confusing UX. | Support load and security ambiguity. | Error taxonomy mapping. |
| 15 | Payment retry without idempotency context | Duplicate payment fear/risk. | Checkout abandonment. | Domain payment command rules. |
| 16 | Realtime state stored only locally | Cache divergence. | Stale tracking/queues. | Patch domain query cache. |
| 17 | No realtime fallback | Broken operations during disconnect. | Queue failure. | Polling fallback and degraded UI. |
| 18 | Large chart bundles in customer app | Slow ordering UX. | Conversion loss. | Lazy-load analytics code. |
| 19 | Admin code imported into web | Bundle bloat and exposure. | Performance/security concerns. | App-specific boundaries. |
| 20 | Missing loading states | Layout jump and uncertainty. | Poor perceived performance. | Skeleton state requirement. |
| 21 | Toast-only critical errors | Lost critical information. | Unsafe operations. | Persistent alerts for critical states. |
| 22 | Accessibility afterthought | Late rework and exclusion. | Release blockers. | Component-level a11y gates. |
| 23 | Unscoped support UI | Privacy breach. | Compliance incident. | Support grant context required. |
| 24 | Break-glass as normal admin mode | Insider risk. | Audit/compliance failure. | Emergency state and expiry UI. |
| 25 | Route components doing data orchestration | App Router complexity. | Hard testing and duplication. | Feature/domain hooks and loaders. |
| 26 | No correlation IDs | Incident debugging gaps. | Slow postmortems. | Observability propagation. |
| 27 | Component variant explosion | Design system decay. | Inconsistent UI. | Governance and variant limits. |
| 28 | URL state ignored for filters | Poor sharing/back behavior. | User frustration. | Use URL for shareable state. |
| 29 | Optimistic updates everywhere | False UI truth. | Payment/operations mistakes. | Allow only safe optimistic updates. |
| 30 | App-specific domain models | Drift between apps. | Inconsistent behavior. | Domain-types and contracts. |
| 31 | Unowned feature flags | Hidden production behavior. | Debugging and compliance issues. | Feature flag registry and owners. |
| 32 | Components fetching their own data | Reuse and test failure. | Coupled UI/data layer. | Pass data via feature/domain hooks. |
| 33 | Ignoring tenant scope in cache keys | Cross-tenant data leakage. | Security incident. | Include scope in query keys. |
| 34 | Decorative motion in operations | Operator distraction. | Slower queue handling. | Operations motion restrictions. |
| 35 | No visual regression for tokens | Silent design drift. | Broken themes. | Visual regression gates. |

## 22. Implementation Roadmap

### 22.1 Phase 1 — Frontend Foundation

Build order:

1. TypeScript project references and import boundaries.
2. `packages/design-tokens` token pipeline.
3. `packages/ui` primitive wrappers.
4. frontend config, env, lint, test, observability packages.
5. App provider skeletons.
6. Dependency graph CI checks.

Validation:

- no raw shadcn imports outside UI package;
- no direct Supabase from components;
- visual token smoke tests;
- accessibility baseline.

### 22.2 Phase 2 — Customer Platform

Build:

- `apps/web` shell;
- public routing;
- inicio/menu/productos foundations;
- carrito shell;
- customer analytics instrumentation.

### 22.3 Phase 3 — Authentication

Build:

- auth provider;
- login/register/recovery;
- session refresh;
- logout and cache clearing;
- route guards;
- permission version handling.

### 22.4 Phase 4 — Commerce

Build:

- productos domain queries;
- carrito commands;
- promociones and recompensas eligibility;
- menu search/filter;
- product modifiers and combo builder.

### 22.5 Phase 5 — Checkout

Build:

- finalizacion_compra flow;
- direccion validation;
- Mercado Pago integration UI adapters;
- payment return/retry UX;
- confirmation state.

### 22.6 Phase 6 — Tracking

Build:

- seguimiento_pedido route;
- realtime tracking subscription;
- fallback polling;
- notification preference display;
- support escalation entry.

### 22.7 Phase 7 — Operations

Build:

- `apps/operations` shell;
- sucursal scoped auth;
- cocina queues;
- entregas queues;
- branch dashboard;
- realtime degraded modes.

### 22.8 Phase 8 — Admin

Build:

- `apps/admin` shell;
- sucursal/marca/franquicia navigation;
- usuarios/roles/permisos;
- menu/promociones administration;
- audit-aware forms.

### 22.9 Phase 9 — Analytics

Build:

- metric components;
- filter bars;
- analytics dashboards;
- operational KPIs;
- export controls if approved.

### 22.10 Phase 10 — Production Hardening

Build/validate:

- full E2E suite;
- accessibility manual review;
- performance budgets;
- security/authz regression;
- visual regression;
- observability dashboards;
- incident runbooks for frontend failures.

## 23. Final deliverable checklist

The frontend architecture is implementation-ready only when the following are approved:

- frontend app boundaries;
- App Router structure;
- feature catalog;
- domain catalog;
- component hierarchy;
- design system integration;
- state architecture;
- data access architecture;
- realtime architecture;
- form architecture;
- authentication architecture;
- authorization architecture;
- error architecture;
- performance architecture;
- accessibility architecture;
- testing architecture;
- security architecture;
- observability architecture;
- governance rules;
- anti-pattern catalog;
- implementation roadmap.
