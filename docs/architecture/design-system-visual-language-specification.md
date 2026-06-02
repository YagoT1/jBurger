# J Burguer — Design System and Visual Language Specification

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Customer labels, operational labels, business statuses, domain concepts, and product terminology must use Spanish. Technical design-system, frontend, accessibility, token, Tailwind, shadcn/ui, and Figma terminology may remain in English.

> **Implementation status:** This document is the canonical design foundation for the complete J Burguer food-tech ecosystem. It defines visual language, design tokens, component families, responsive behavior, accessibility, Figma architecture, frontend integration, and design governance. It does not define application code, mockups, wireframes, or Figma screens.

## 0. Scope and product coverage

### 0.1 Ecosystem scope

The design system must support eight product surfaces as one coherent ecosystem:

1. Customer Ordering Platform.
2. Administration Platform.
3. Kitchen Operations Platform.
4. Delivery Operations Platform.
5. Loyalty Platform.
6. Analytics Platform.
7. Franchise Management Platform.
8. Support Platform.

### 0.2 System goals

The design system must:

- create a premium and conversion-focused customer ordering experience;
- keep cocina and entregas interfaces operationally dense, legible, and fast;
- support sucursal, franquiciado, franquiciante, marca, and organizacion management without visual fragmentation;
- preserve accessibility and performance across mobile, tablet, desktop, and dashboard contexts;
- provide a token architecture that can support future multi-brand and white-label implementations;
- integrate cleanly with Next.js, TailwindCSS, shadcn/ui, and Framer Motion without turning vendor primitives into business-specific architecture.

### 0.3 Reference handling

The provided reference inspiration is treated as market and brand-context input only. The design system must not copy its composition, imagery, asset treatment, layout, animation, copy, or visual components. The canonical direction is more premium, more scalable, more operational, more mobile-first, and more systematic.

## 1. Brand Visual Strategy

### 1.1 Visual personality

J Burguer must feel like a premium urban burger brand with digital-native discipline. The visual personality is:

- **Bold:** confident product imagery, decisive CTAs, high appetite impact.
- **Warm:** inviting food tones, approachable typography, human operational feedback.
- **Precise:** clean hierarchy, visible status, trustworthy checkout and tracking.
- **Energetic:** motion and contrast create appetite and momentum without chaos.
- **Operationally credible:** staff and franchise tools feel serious, reliable, and clear.

### 1.2 Emotional perception

After using the platform, clientes should describe it as:

- rapido;
- premium;
- facil;
- confiable;
- moderno;
- tentador;
- transparente;
- worth ordering from again.

Operaciones teams should describe it as:

- claro;
- accionable;
- ordenado;
- rapido bajo presion;
- safe for high-volume shifts.

### 1.3 Premium positioning

Premium positioning is achieved through restraint, not decoration:

- strong product photography over generic illustrations;
- rich but accessible contrast;
- typography with confident scale and disciplined line length;
- fewer competing CTAs;
- visible quality cues: ingredientes, preparation states, ETA confidence, payment trust;
- no cheap urgency patterns unless backed by real inventory or time constraints.

### 1.4 Visual differentiation

The platform differentiates through:

- a dark-first customer commerce experience that makes food imagery vivid;
- warm accent colors for appetite and conversion;
- operational surfaces that switch to calmer light/dense mode where speed and legibility matter;
- consistent status language and color coding across customer tracking and staff dashboards;
- modular brand tokens that can adapt to future marcas without rebuilding components.

### 1.5 Digital brand experience

The digital product must feel app-like:

- persistent carrito and tracking states;
- bottom navigation on mobile;
- fast transitions and stable loading;
- clear realtime freshness indicators;
- premium feedback for successful actions;
- operational dashboards designed as command centers, not admin afterthoughts.

## 2. Visual Language System

### 2.1 Visual philosophy

The visual language balances craving, clarity, and control:

1. **Craving:** product imagery and food color create desire.
2. **Clarity:** typography, spacing, and status components make decisions simple.
3. **Control:** dashboards, checkout, and tracking expose state, ownership, and next action.

### 2.2 Layout philosophy

- Customer pages use cinematic top sections and focused conversion modules.
- Menu and carrito surfaces use compact repeatable cards optimized for scanning.
- Checkout uses progressive disclosure and sticky summaries.
- Operations dashboards use dense information layouts with strong status grouping.
- Analytics uses structured grids, consistent data cards, and comparison patterns.

### 2.3 Spacing philosophy

- Customer commerce uses generous spacing around appetite-driving content.
- Operational dashboards use tighter spacing with consistent row density.
- Touch targets remain generous on mobile even when information density increases.
- Spacing tokens must be systematic; one-off spacing is forbidden.

### 2.4 Interaction philosophy

- Interactions must reduce uncertainty.
- Every press state confirms action immediately.
- Destructive actions use guardrails proportional to risk.
- Realtime changes must show freshness and avoid surprise reordering of critical queues.
- No animation may delay checkout, payment recovery, cocina status updates, or delivery assignment.

### 2.5 Motion philosophy

Motion communicates state and relationship:

- page transitions explain navigation direction;
- add-to-carrito motion confirms item movement;
- checkout transitions reassure progress;
- tracking transitions show state advancement;
- dashboard transitions preserve queue context;
- reduced-motion users receive equivalent non-motion feedback.

### 2.6 Visual principles

| Principle | Meaning | Design rule |
| --- | --- | --- |
| Appetite before decoration | Food is the hero. | Use imagery and hierarchy before ornamental graphics. |
| Premium through restraint | The interface feels elevated by discipline. | Avoid clutter, excessive gradients, and noisy shadows. |
| State is visible | Users always know what changed. | Status, loading, success, error, stale, and degraded states are mandatory. |
| Mobile is the baseline | Small screens drive component behavior. | Components are designed mobile-first, then expanded. |
| Operations are high-stakes | Staff UX prioritizes speed and accuracy. | Operational components favor legibility and safe actions. |
| Accessibility is brand quality | Inclusive design is part of premium quality. | WCAG 2.2 AA is minimum, not a later audit. |

## 3. Color System

### 3.1 Canonical mode decision

The canonical customer mode is **dark-first premium commerce**. Dark mode maximizes food photography impact, appetite contrast, and late-night ordering comfort.

The canonical operations mode is **light-first operational clarity**. Light mode improves dashboard readability, dense tables, long shifts, printing/export contexts, and back-office analysis.

Both modes must exist from the beginning. Neither mode is an afterthought.

### 3.2 Brand colors

| Token family | Role | Suggested color direction | Usage |
| --- | --- | --- | --- |
| primary | Brand depth | Charcoal / near-black | App shell, hero backgrounds, premium surfaces. |
| secondary | Appetite warmth | Flame red / burger red | Primary CTAs, active states, conversion highlights. |
| accent | Premium richness | Cheddar gold / warm amber | Rewards, combo value, promotional highlights. |
| highlight | Freshness | Pickle green | Positive food/product badges, not generic success. |
| cream | Warm neutral | Toasted cream | Light surfaces, cards, readable backgrounds. |

Color values must be finalized through contrast testing and photography calibration before implementation. Hex values are tokens, not brand strategy; token roles are mandatory.

### 3.3 Neutral scale

Neutral scale requirements:

- 0: pure light surface.
- 50-100: elevated light cards.
- 200-300: borders, separators, subtle disabled surfaces.
- 400-500: secondary text and inactive icons.
- 600-700: primary text on light surfaces and secondary dark surfaces.
- 800-900: dark cards, app shell, overlays.
- 950: deepest premium background.

Rules:

- Text color must use semantic text tokens, not raw neutral tokens.
- Borders must be visible in both light and dark modes.
- Disabled components must remain readable and distinguishable.

### 3.4 Semantic status colors

| Status | Required meaning | Usage |
| --- | --- | --- |
| success | Completed, available, verified. | pago approved, pedido completed, reward applied. |
| warning | Requires attention but not failure. | high demand, ETA risk, low stock. |
| error | Failure, blocking issue, destructive state. | payment failed, unavailable item, validation error. |
| info | Neutral guidance or system update. | address hint, tracking update, operational note. |

Rules:

- Status colors require label and icon; color alone is forbidden.
- Semantic status must not conflict with brand colors.
- Warning must be distinguishable from accent/rewards.

### 3.5 Operational colors

| Domain | Color role | Usage constraints |
| --- | --- | --- |
| Cocina | Heat/orange operational accent. | tickets_cocina, station status, prep urgency. |
| Entregas | Route/blue operational accent. | delivery assignment, repartidor tracking, route states. |
| Administracion | Neutral violet/slate accent. | configuration, approvals, role management. |
| Analytics | Data cyan/indigo accent. | charts, insight cards, metric comparison. |
| Soporte | Magenta/rose support accent. | cases, escalations, temporary support grants. |
| Franquicias | Deep gold/brown accent. | franchise hierarchy, reporting rights, brand ownership. |

Operational accents must never override semantic status. A delayed entrega uses warning/error status even if the delivery domain accent is blue.

### 3.6 Accessibility and contrast rules

- Body text minimum contrast: 4.5:1.
- Large text minimum contrast: 3:1.
- Icons conveying meaning minimum contrast: 3:1.
- Focus rings minimum contrast: 3:1 against adjacent colors.
- Critical operational status must target stronger contrast than minimum AA.
- Color pairs must be tested over real food photography and dark overlays.

### 3.7 Dark mode strategy

Dark mode requirements:

- primary customer ordering surfaces use dark-first tokens;
- product imagery must not sit on pure black without elevation or tonal separation;
- overlays use controlled opacity with readable text;
- cart and checkout totals must remain high contrast;
- skeleton loading must be visible but not noisy;
- late-night use must avoid eye-strain from overly saturated surfaces.

### 3.8 Light mode strategy

Light mode requirements:

- operations, administration, analytics, support, and franchise management default to light mode;
- dense tables and grids use zebra/section separation only when it improves scanning;
- status chips remain high contrast on light surfaces;
- printable/exportable surfaces use light-mode tokens.

## 4. Typography System

### 4.1 Font strategy

| Font role | Requirement | Usage |
| --- | --- | --- |
| Primary font | Modern, readable, strong Spanish diacritic support, strong numerals. | UI, body, navigation, forms, dashboards. |
| Secondary display font | Bold appetite/editorial personality, readable at large sizes. | Hero headlines, campaign modules, premium brand moments. |
| Monospace font | Clear tabular numerals and code/data legibility. | IDs, timestamps, operational codes, debugging, metrics. |

Font selection must be validated for:

- Spanish accents and punctuation;
- currency and numbers;
- mobile rendering;
- dashboard density;
- loading performance;
- licensing for commercial and franchise use.

### 4.2 Desktop hierarchy

| Style | Intended size range | Usage |
| --- | --- | --- |
| H1 | 48-72 | Hero and campaign landing headlines. |
| H2 | 36-48 | Section headers and major product pages. |
| H3 | 28-36 | Menu sections, dashboard panels. |
| H4 | 22-28 | Card groups, modal titles. |
| H5 | 18-22 | Subsections, operational headers. |
| Body | 16-18 | Primary reading text. |
| Caption | 12-14 | Supporting metadata. |
| Label | 12-14 | Form labels, chips, status labels. |
| Button | 14-16 | CTAs and actions. |
| Metric | 32-56 | Dashboard metrics and revenue summaries. |
| Operational data | 13-16 | Kitchen/delivery rows and ticket details. |

### 4.3 Tablet hierarchy

Tablet scales reduce large display type while preserving dashboard density:

- H1: 40-56.
- H2: 32-40.
- H3: 24-32.
- H4: 20-24.
- H5: 17-20.
- Body: 16.
- Caption/Label: 12-14.
- Metric: 28-44.

### 4.4 Mobile hierarchy

Mobile typography prioritizes clarity and thumb-driven decisions:

- H1: 32-44.
- H2: 26-32.
- H3: 22-26.
- H4: 18-22.
- H5: 16-18.
- Body: 15-16.
- Caption: 12-13.
- Label: 12-14.
- Button: 15-16.
- Price/total: 18-24.

### 4.5 Typography rules

- Use tabular numerals for prices, ETA, queue times, and dashboard metrics.
- Product names may use display weight; product descriptions use primary font.
- Operational dashboards avoid decorative display font.
- Line length for body text should stay under 75 characters on desktop and under 42 characters on mobile.
- Button labels must remain short and action-oriented in Spanish.

## 5. Spacing System

### 5.1 Scale strategy

The system uses a 4px base scale and an 8px layout rhythm.

- 4px increments support fine internal spacing.
- 8px increments support component spacing and layout consistency.
- 16px, 24px, 32px, 48px, 64px, and 96px define major layout rhythm.

### 5.2 4px scale

| Token step | Use |
| --- | --- |
| 4 | Icon/text gap, compact internal offset. |
| 8 | Small component padding, chip gaps. |
| 12 | Button internal gap, compact cards. |
| 16 | Default card padding, form gaps. |
| 20 | Mobile section spacing where 24 is too large. |
| 24 | Standard section/component separation. |
| 32 | Major group spacing. |
| 40 | Dense dashboard panel separation. |
| 48 | Page section separation. |
| 64 | Hero/major section spacing. |
| 96 | Editorial/customer landing spacing. |

### 5.3 Layout spacing

- Customer mobile pages use 16px side margins.
- Customer desktop pages use 24-40px side margins depending viewport.
- Max content width for commerce content must prevent stretched product cards.
- Checkout width is intentionally constrained to reduce cognitive load.
- Operations dashboards may use full-width layouts but must preserve panel gutters.

### 5.4 Section spacing

- Customer marketing sections: 64-96px vertical spacing on desktop, 40-64px on mobile.
- Menu sections: 32-48px desktop, 24-32px mobile.
- Checkout sections: 24-32px, with sticky summary separation.
- Operations panels: 16-24px to maximize usable data.

### 5.5 Dashboard spacing

- Dense rows: 8-12px vertical padding.
- Standard rows: 12-16px vertical padding.
- Panel padding: 16-24px.
- Grid gutters: 16-24px.
- Critical alert spacing: never below 12px internal padding.

### 5.6 Mobile spacing rules

- Touch targets minimum 44px height.
- Sticky bottom actions require safe-area padding.
- Bottom navigation and checkout CTAs must not overlap content.
- Form fields need enough spacing to reduce input errors.

## 6. Grid System

### 6.1 Breakpoint model

| Breakpoint | Range | Purpose |
| --- | --- | --- |
| xs | 0-359 | Small mobile support. |
| sm | 360-479 | Standard mobile. |
| md | 480-767 | Large mobile / small tablet. |
| lg | 768-1023 | Tablet. |
| xl | 1024-1279 | Small desktop. |
| 2xl | 1280-1535 | Desktop. |
| 3xl | 1536+ | Large dashboard / analytics. |

### 6.2 Desktop grids

- Customer desktop: 12-column grid, max-width controlled by content type.
- Menu desktop: adaptive product grid with card minimum width.
- Checkout desktop: two-column flow with sticky order summary.
- Admin desktop: 12-column shell with sidebar and content region.

### 6.3 Tablet grids

- Customer tablet: 8-column grid.
- Menu tablet: 2-3 product columns depending density.
- Checkout tablet: single flow with collapsible summary.
- Operations tablet: split panels only where touch use remains safe.

### 6.4 Mobile grids

- Customer mobile: 4-column conceptual grid, implemented as single-column content.
- Product cards use full-width or two-column only when imagery and text remain readable.
- Bottom navigation and sticky CTAs are part of grid planning.
- Horizontal scrolling chips are allowed only for categories and quick filters.

### 6.5 Dashboard grids

- Administration and analytics: 12-column responsive grid with resizable panel templates.
- Metrics row: 2-4 cards depending viewport.
- Tables occupy full content region and must support pinned columns when needed.

### 6.6 Kitchen grids

- Cocina uses station-based columns on large screens.
- On tablet/mobile, station queues collapse into tabs or grouped accordions.
- Ticket cards must preserve order, age, status, item complexity, and allergen warnings.

### 6.7 Delivery grids

- Delivery dashboard supports queue/map split view on large screens.
- Mobile delivery operations prioritize list-first route tasks.
- Map is supportive context, not the only control surface.

## 7. Elevation System

### 7.1 Surface hierarchy

| Level | Role | Usage |
| --- | --- | --- |
| surface/base | Page background | Main app background. |
| surface/raised | Cards and panels | Product cards, dashboard cards. |
| surface/elevated | Sticky components | Bottom bars, headers, floating summary. |
| surface/overlay | Drawers and sheets | Carrito sheet, filters, mobile nav. |
| surface/modal | Blocking decisions | Confirmations, checkout errors, support grants. |
| surface/critical | High-risk action surfaces | Break-glass, payment failure, operational override. |

### 7.2 Shadows

Shadows must be subtle and functional:

- low: separates cards from background;
- medium: sticky headers, bottom bars, drawers;
- high: modals and focused overlays;
- operational: reduced shadow, more border-based separation for long shifts.

### 7.3 Depth system rules

- Dark mode elevation uses tonal contrast plus controlled shadow.
- Light dashboards use borders and background layering more than heavy shadows.
- Multiple stacked overlays are discouraged; each overlay must have a clear escape path.
- Floating components must not hide totals, CTAs, status labels, or ticket timers.

### 7.4 Component elevation

| Component | Elevation expectation |
| --- | --- |
| Product card | Raised on default, subtle hover lift on desktop. |
| Carrito sheet | Overlay with sticky total and safe-area spacing. |
| Checkout summary | Elevated/sticky but not modal unless reviewing. |
| Modal | Highest normal layer with focus trap. |
| Drawer | Overlay layer with visible drag/close affordance. |
| Toast | Above content but below modal. |
| Critical alert | Persistent inline surface, not only toast. |

## 8. Iconography System

### 8.1 Icon philosophy

Icons must be functional, recognizable, and consistent. They support scanning but do not replace Spanish labels for critical actions.

### 8.2 Sizes

| Size | Usage |
| --- | --- |
| 12 | Dense table metadata, secondary indicators. |
| 16 | Inline labels, chips, compact buttons. |
| 20 | Default UI icons. |
| 24 | Navigation and primary actions. |
| 32 | Empty states, feature highlights. |
| 48+ | Marketing or onboarding illustrations only. |

### 8.3 Usage rules

- Critical actions require icon + text.
- Navigation items require text labels on mobile.
- Icon stroke weight must match typography scale.
- Food icons may be more expressive but cannot reduce clarity.
- Operational icons must be conservative and highly recognizable.

### 8.4 Operational icons

Required operational icon categories:

- cocina station;
- timer/aging;
- allergen warning;
- stock issue;
- payment issue;
- delivery assignment;
- route issue;
- support case;
- approval required;
- audit/secure action.

### 8.5 Food icons

Food icons are secondary to photography. Use them for:

- category chips;
- allergen/dietary indicators;
- empty states;
- loyalty achievements;
- quick filters.

### 8.6 Dashboard icons

Dashboard icons must support metric scanning:

- revenue/pagos;
- pedidos;
- ETA;
- conversion;
- retention;
- incidents;
- support volume;
- branch performance.

## 9. Motion System

### 9.1 Timing and easing

| Motion type | Duration | Rule |
| --- | --- | --- |
| Micro feedback | 80-160ms | Immediate response to tap/press. |
| Component transition | 160-240ms | Drawers, cards, sheet changes. |
| Page transition | 200-320ms | Must not block content loading. |
| Success moment | 300-600ms | Used sparingly for carrito/rewards. |
| Operational status | 100-200ms | Fast and non-distracting. |

Easing must feel premium: quick start, soft landing, no bounce for critical workflows.

### 9.2 Page transitions

- Customer pages may use subtle vertical or fade transitions.
- Checkout transitions use forward/back directional clarity.
- Operations dashboards avoid full-page animation during active shifts.
- Analytics transitions must preserve chart comprehension.

### 9.3 Microinteractions

Required motion states:

- button press;
- add to carrito;
- quantity increment/decrement;
- promo applied;
- reward unlocked;
- checkout step completed;
- tracking status advanced;
- operational ticket advanced.

### 9.4 Loading states

- Skeletons before spinners for layout content.
- Spinners only for short inline actions.
- Payment loading uses reassurance copy and duplicate-charge protection messaging.
- Dashboard loading must never blank existing queue data unless explicitly refreshing.

### 9.5 Checkout transitions

- Checkout step changes must preserve summary context.
- Payment redirect/return states must feel controlled.
- Errors animate into place near the cause.
- Retry transitions must not imply a new pedido unless explicitly created.

### 9.6 Tracking transitions

- Status advancement can animate along timeline.
- ETA changes should be calm and explanatory.
- Degraded realtime state uses stable indicator, not flashing alerts.

### 9.7 Operational transitions

- Cocina ticket movement must avoid losing operator focus.
- Reordering queues should be controlled and explainable.
- Critical alerts persist until resolved or acknowledged with reason.
- Animation must respect high-volume stress; no decorative loops.

### 9.8 Performance requirements

- Motion must run at 60fps target on supported devices.
- Avoid layout-triggering animations on large lists.
- Framer Motion usage must be limited to meaningful transitions.
- Reduced motion mode must remove non-essential motion.

## 10. Component System

### 10.1 Component family requirements

Every component family must define:

- purpose;
- variants;
- states;
- accessibility behavior;
- responsive behavior;
- token dependencies;
- ownership;
- analytics implications where relevant;
- examples of correct and incorrect usage.

### 10.2 Buttons

Button variants:

- primary;
- secondary;
- tertiary;
- ghost;
- destructive;
- success;
- operational;
- icon button;
- split action;
- loading button.

Rules:

- Primary button is reserved for the dominant action.
- Destructive actions require risk-appropriate confirmation or undo.
- Loading buttons must preserve width to avoid layout shift.
- Button copy uses Spanish action verbs.

### 10.3 Inputs

Input families:

- text;
- email;
- telefono;
- direccion;
- numeric;
- currency;
- quantity;
- search;
- select;
- textarea;
- date/time;
- OTP/security code when needed.

States:

- default;
- focused;
- filled;
- valid;
- invalid;
- disabled;
- loading;
- readonly;
- success;
- warning.

### 10.4 Cards

Card families:

- producto card;
- promocion card;
- recompensa card;
- pedido card;
- metric card;
- ticket_cocina card;
- entrega card;
- support case card;
- configuration card;
- franchise summary card.

### 10.5 Badges and tags

Badges communicate state or classification:

- nuevo;
- mas vendido;
- limitado;
- recompensa;
- picante;
- vegetariano;
- agotado;
- demorado;
- requiere aprobacion;
- alto riesgo.

Tags are user/system applied labels and must not look like status badges when not stateful.

### 10.6 Navigation

Navigation components:

- mobile bottom nav;
- desktop top nav;
- admin sidebar;
- breadcrumb;
- tabs;
- stepper;
- command palette for admin/operations if approved later.

Navigation must indicate active state, unread/active counters, and permission-filtered visibility.

### 10.7 Tabs

Tabs are used for sibling views only:

- categorias menu;
- station views in cocina;
- delivery queue states;
- analytics report sections;
- support case segments.

Tabs must not hide critical errors.

### 10.8 Drawers and modals

Drawers:

- carrito;
- filters;
- mobile navigation;
- operational details;
- side panels.

Modals:

- destructive confirmations;
- payment blocking errors;
- operational override approval;
- support access request;
- break-glass confirmation.

Modals require focus trap, escape behavior, and screen reader labeling.

### 10.9 Tables and data grids

Tables support moderate data. Data grids support high-density operations.

Required features:

- sortable columns;
- filters;
- sticky headers;
- row selection when needed;
- bulk action safety;
- empty/loading/error states;
- pagination or virtualization strategy;
- export rules for analytics/admin.

### 10.10 Charts and metrics

Charts must be accessible and decision-oriented:

- line charts for trends;
- bar charts for comparison;
- stacked bars for composition only when readable;
- sparklines for compact trends;
- KPI cards with current value, comparison, and confidence/source.

Charts require text summaries and cannot rely on color alone.

### 10.11 Toasts, alerts, and notifications

- Toasts: short non-critical feedback.
- Inline alerts: persistent contextual issues.
- Banners: system-wide or page-wide state.
- Critical alerts: blocking high-risk actions.
- Notification cards: customer/order updates and support messages.

### 10.12 Empty, loading, and skeleton states

Every screen/component must define:

- empty state with action;
- first-use state;
- loading state;
- partial loading state;
- error state;
- degraded/offline state.

### 10.13 Search and filters

Search components support:

- global menu search;
- admin search;
- support case search;
- analytics filters;
- operational queue search.

Filters must be visible, removable, and summarized.

### 10.14 Carrito, checkout, and tracking components

Required families:

- carrito summary;
- carrito item;
- modifier summary;
- promo input;
- recompensa selector;
- checkout stepper;
- direccion selector;
- payment method block;
- order confirmation;
- tracking timeline;
- ETA card;
- support escalation card.

## 11. Customer Experience Components

### 11.1 Product Cards

Product cards must support:

- image;
- name;
- short description;
- price or starting price;
- availability;
- badges;
- quick add/configure action;
- combo eligibility;
- reward/promo indicator;
- loading and unavailable states.

### 11.2 Category Navigation

Category navigation supports:

- sticky mobile chips;
- desktop category rail or tabs;
- icon + label option;
- active category state;
- horizontal scroll indicators;
- unavailable category handling.

### 11.3 Product Gallery

Gallery components support:

- hero image;
- secondary images;
- thumbnails;
- loading placeholders;
- alt text;
- optional zoom;
- safe performance budgets.

### 11.4 Combo Builder

Combo builder supports:

- base product;
- side selection;
- drink selection;
- upgrade pricing;
- savings explanation;
- required/optional modifiers;
- validation state;
- edit after add to carrito.

### 11.5 Recommendation Components

Recommendation components must be contextual:

- completa tu pedido;
- populares con este producto;
- cerca de recompensa;
- promo aplicable;
- favoritos/recientes.

They must respect availability, allergens, sucursal, and carrito state.

### 11.6 Rewards Components

Reward components:

- progress ring/bar;
- recompensa card;
- tier badge;
- milestone card;
- redemption selector;
- expiration notice;
- applied reward chip.

### 11.7 Promotions Components

Promotion components:

- promocion card;
- coupon input;
- applied discount row;
- eligibility explanation;
- conflict resolver;
- expiration indicator.

### 11.8 Checkout Components

Checkout components:

- step header;
- address/delivery mode selector;
- pickup sucursal selector;
- contact info block;
- payment method block;
- final total summary;
- error recovery panel;
- confirmation module.

## 12. Operations Components

### 12.1 Kitchen component library

Cocina components:

- ticket_cocina card;
- station column;
- queue timer;
- priority badge;
- modifier/allergen panel;
- item checklist;
- prep status control;
- stock issue action;
- delay reason selector;
- channel pause control.

Design rules:

- high contrast status;
- large touch targets;
- timer visibility;
- minimal decorative motion;
- no hidden critical modifier data.

### 12.2 Delivery component library

Entregas components:

- entrega card;
- repartidor status chip;
- assignment panel;
- route summary;
- proof capture status;
- ETA risk badge;
- reassignment control;
- customer contact guardrail;
- incident panel.

### 12.3 Administration component library

Administracion components:

- configuration form;
- approval workflow card;
- audit trail preview;
- role/permission matrix;
- menu availability editor;
- horario editor;
- branch settings panel;
- promotion rule builder.

### 12.4 Analytics component library

Analytics components:

- metric card;
- comparison card;
- trend chart;
- cohort table;
- funnel visualization;
- branch comparison grid;
- filter bar;
- insight annotation;
- export control.

### 12.5 Support component library

Soporte components:

- case card;
- customer privacy mask;
- temporary access grant panel;
- interaction timeline;
- refund review panel;
- escalation badge;
- audit access notice;
- resolution checklist.

### 12.6 Franchise management component library

Franquicias components:

- hierarchy tree;
- marca card;
- franquiciante summary;
- franquiciado summary;
- sucursal portfolio table;
- reporting scope selector;
- operational rights panel;
- cross-franchise restriction notice.

## 13. Responsive System

### 13.1 Breakpoints

The design system uses the breakpoint model defined in the UX blueprint and frontend architecture:

- xs: small mobile;
- sm: standard mobile;
- md: large mobile/small tablet;
- lg: tablet;
- xl: small desktop;
- 2xl: desktop;
- 3xl: large dashboard.

### 13.2 Behavior rules

- Mobile is single-column first.
- Tablet may introduce two-column layouts only when decision clarity improves.
- Desktop expands density but does not change task sequence.
- Operations dashboards adapt by collapsing panels, not hiding critical data.
- Sticky actions must account for safe areas.

### 13.3 Mobile adaptations

- Bottom navigation is primary.
- Carrito uses bottom sheet/full-screen transition.
- Filters use drawer or sheet.
- Product gallery prioritizes first image and CTA.
- Tables convert to cards when column density becomes unusable.

### 13.4 Tablet adaptations

- Useful for cocina and entregas operations.
- Larger touch targets remain mandatory.
- Split views are allowed for ticket detail + queue.
- Checkout stays mostly single-column unless summary remains readable.

### 13.5 Desktop adaptations

- Customer desktop supports richer grids and editorial modules.
- Admin/analytics desktop supports sidebars and dense data grids.
- Operations desktop supports multi-column station/queue dashboards.

## 14. Accessibility System

### 14.1 WCAG target

Minimum target: WCAG 2.2 AA across all customer and operational surfaces. Critical paths must receive manual accessibility review:

- menu browsing;
- product customization;
- carrito;
- checkout;
- payment recovery;
- seguimiento_pedido;
- cocina ticket operation;
- delivery assignment;
- support access.

### 14.2 Keyboard navigation

- All interactive elements are keyboard reachable.
- Focus order matches visual/task order.
- Data grids define keyboard behavior explicitly.
- Destructive controls are not triggered by accidental keypress.
- Shortcuts require discoverability and opt-out for operations.

### 14.3 Screen reader strategy

- Product cards announce name, price, availability, and action.
- Modifier groups announce required status and selection count.
- Carrito total updates use polite live regions.
- Payment errors use assertive but non-repetitive announcements.
- Operational status changes require concise announcements when relevant.

### 14.4 Focus strategy

- Visible focus ring is mandatory.
- Focus tokens adapt to light/dark surfaces.
- Modals/drawers trap and restore focus.
- Validation errors move focus to the first blocking issue.
- Focus must never land behind sticky bars or overlays.

### 14.5 Motion reduction strategy

- Respect reduced-motion preferences.
- Replace motion feedback with color/text/icon state changes.
- Remove non-essential parallax, bounces, and celebratory animations.
- Keep operational status updates stable.

### 14.6 Contrast requirements

- Minimum AA contrast for text and interactive content.
- Critical statuses should exceed AA where possible.
- Charts include labels, legends, patterns, or direct annotations.
- Food imagery overlays must be tested with real image sets.

## 15. Design Token Architecture

### 15.1 Token hierarchy

Token layers:

1. **Global tokens:** raw primitives such as color scales, spacing, radius, font sizes, shadows, durations.
2. **Semantic tokens:** meaning-based roles such as background, foreground, primary, danger, success, warning, surface, border.
3. **Component tokens:** component-specific mapping such as button primary background, product card radius, checkout summary shadow.
4. **Operational tokens:** domain-specific tokens for cocina, entregas, administracion, analytics, soporte, franquicias.
5. **Brand tokens:** overrides for marca or white-label expression.

### 15.2 Global tokens

Global token categories:

- color palette;
- typography family;
- font size;
- font weight;
- line height;
- letter spacing;
- spacing;
- radius;
- border width;
- shadow;
- opacity;
- z-index;
- motion duration;
- easing;
- breakpoint.

### 15.3 Semantic tokens

Semantic tokens include:

- surface/background;
- surface/card;
- surface/elevated;
- text/primary;
- text/secondary;
- text/inverse;
- border/default;
- border/strong;
- action/primary;
- action/secondary;
- status/success;
- status/warning;
- status/error;
- status/info;
- focus/ring.

### 15.4 Component tokens

Component token examples:

- button/primary/background;
- button/primary/foreground;
- product-card/background;
- product-card/image-radius;
- cart-summary/elevation;
- checkout-step/active-color;
- tracking-timeline/current-color;
- ticket-cocina/urgent-border;
- metric-card/trend-positive.

### 15.5 Operational tokens

Operational tokens isolate domain accents:

- cocina/accent;
- cocina/timer-warning;
- entregas/accent;
- entregas/route-active;
- soporte/access-sensitive;
- admin/approval-required;
- analytics/trend-positive;
- franquicias/hierarchy-active.

### 15.6 Multi-brand strategy

Future marcas must override brand tokens, not semantic or component behavior. A new marca may define:

- primary brand color;
- appetite accent;
- display font;
- logo asset tokens;
- campaign image style;
- border radius personality;
- illustration style.

Semantic status colors, accessibility thresholds, operational status rules, and critical action patterns remain shared.

### 15.7 White-label strategy

White-label support requires:

- brand package boundaries;
- tenant-aware theme selection;
- fallback default theme;
- approval process for accessibility;
- screenshot/visual regression coverage per brand;
- no hardcoded brand colors in components.

## 16. Figma Architecture

### 16.1 File structure

Figma files:

1. Foundations.
2. Tokens.
3. Core Components.
4. Customer Commerce Components.
5. Operations Components.
6. Admin Analytics Support Components.
7. Patterns and Flows.
8. Brand Themes.
9. Deprecated Archive.

### 16.2 Pages

Each component library file contains pages:

- Cover;
- Usage Guidelines;
- Tokens;
- Components;
- Variants;
- States;
- Accessibility Notes;
- Responsive Behavior;
- Changelog;
- Deprecated.

### 16.3 Libraries

Libraries:

- Foundation library: tokens, grids, typography, effects.
- Core UI library: buttons, inputs, navigation, overlays.
- Commerce library: product, carrito, checkout, tracking, loyalty.
- Operations library: cocina, entregas, support, admin, analytics, franchise.
- Brand library: logos, imagery guidance, campaign-specific assets.

### 16.4 Token organization

Tokens must be grouped by:

- global primitives;
- semantic roles;
- mode: dark/light;
- platform: customer/operations;
- brand overrides;
- component mappings.

### 16.5 Component organization

Component sets must include:

- default variant;
- size variants;
- mode variants;
- state variants;
- responsive notes;
- content examples in Spanish;
- accessibility annotations;
- linked implementation owner.

### 16.6 Variants

Variants must be constrained. Variant explosion is forbidden.

Required variant axes:

- size;
- intent;
- state;
- density;
- mode;
- domain when operational.

### 16.7 Documentation structure

Every component page must include:

- when to use;
- when not to use;
- anatomy;
- behavior;
- accessibility;
- responsive behavior;
- content rules;
- implementation notes;
- owner;
- changelog.

## 17. Frontend Integration Strategy

### 17.1 Tailwind integration strategy

Tailwind must consume design tokens through a centralized token pipeline. Tailwind utilities may express layout and composition, but raw values that bypass tokens are forbidden for production components.

Rules:

- no hardcoded business colors in application components;
- semantic token classes preferred over raw palette usage;
- spacing uses approved scale;
- typography uses approved type scale;
- dark/light mode uses semantic theme tokens;
- operational density variants are tokenized.

### 17.2 shadcn/ui integration strategy

shadcn/ui provides accessible primitive foundations, not final brand components.

Rules:

- primitives are wrapped in owned design-system components;
- business-specific behavior lives outside primitive wrappers;
- component API must use canonical Spanish business names where business concepts appear;
- visual tokens override default primitive styling;
- upstream changes are reviewed before adoption.

### 17.3 Component ownership

Ownership model:

- Design System team owns foundations and core components.
- Customer Product team co-owns commerce components.
- Operations Product team co-owns cocina and entregas components.
- Platform/Frontend team owns implementation quality and package boundaries.
- Accessibility owner approves critical component patterns.
- Brand owner approves visual identity tokens.

### 17.4 Design token consumption

Tokens flow:

1. Figma tokens define approved design intent.
2. Token source of truth is exported into repository package.
3. Frontend theme consumes generated token artifacts.
4. Tailwind and components reference semantic/component tokens.
5. Visual regression validates token changes.

### 17.5 Integration quality gates

No component is production-ready until it has:

- Figma documentation;
- token mapping;
- accessibility behavior;
- responsive behavior;
- dark/light mode behavior;
- loading/error/empty states where relevant;
- Storybook or equivalent documentation when implementation starts;
- visual regression coverage when implementation starts.

## 18. Design Governance

### 18.1 Approval workflows

Approval required for:

- new foundation token;
- color palette changes;
- typography changes;
- component API changes;
- new component family;
- operational status visual changes;
- checkout/payment component changes;
- accessibility exceptions;
- brand overrides;
- deprecations.

### 18.2 Component lifecycle

Lifecycle states:

1. Proposed.
2. Designed.
3. Accessibility reviewed.
4. Implementation planned.
5. Implemented.
6. Documented.
7. Adopted.
8. Monitored.
9. Deprecated.
10. Removed.

### 18.3 Deprecation rules

- Deprecated components remain documented with replacement path.
- Breaking visual changes require migration plan.
- Deprecated components cannot be used in new screens.
- Removal requires usage audit and approval.

### 18.4 Versioning

Versioning levels:

- patch: documentation or non-breaking token correction;
- minor: new component/variant/token;
- major: breaking token, component, or visual language change.

Major changes require design, frontend, accessibility, and product approval.

### 18.5 Review process

Design review must verify:

- language policy compliance;
- accessibility compliance;
- token usage;
- responsive behavior;
- operational safety;
- conversion impact;
- visual consistency;
- implementation feasibility.

### 18.6 Contribution rules

- Teams may propose components but cannot fork the design system.
- Local component patterns must be promoted or deleted after validation.
- One-off visual styles require explicit exception approval.
- All new components must support required states before release.

## 19. Success Criteria

### 19.1 Customer Experience success

| Metric | Target direction |
| --- | --- |
| menu_to_cart_rate | Increase. |
| cart_to_checkout_rate | Increase. |
| checkout_completion_rate | Increase. |
| average_order_value | Increase without harming conversion. |
| repeat_order_rate_30d | Increase. |
| mobile_core_web_vitals pass rate | Maintain high pass rate. |
| customer support contacts per pedido | Decrease. |

### 19.2 Operations Experience success

| Metric | Target direction |
| --- | --- |
| kitchen_ticket_cycle_time | Decrease or stabilize under surge. |
| delivery_assignment_time | Decrease. |
| operational error rate | Decrease. |
| delayed pedido visibility | Increase detection before SLA breach. |
| support escalation resolution time | Decrease. |
| operator training time | Decrease. |

### 19.3 Accessibility success

- WCAG 2.2 AA coverage for all released components.
- Zero critical accessibility violations in checkout and operations flows.
- Keyboard coverage for all interactive components.
- Screen reader tested patterns for carrito, checkout, tracking, and dashboards.
- Reduced-motion support validated.

### 19.4 Performance success

- Design components do not introduce avoidable layout shift.
- Motion remains performant on target mobile devices.
- Image-heavy commerce surfaces use skeleton and lazy-loading rules.
- Dashboard components support virtualization/pagination when data grows.
- Token and theme architecture does not bloat runtime unnecessarily.

### 19.5 Consistency success

- No hardcoded colors or spacing in production components.
- No duplicate component families without governance approval.
- Spanish business labels used consistently.
- Shared status colors and labels across customer and operations experiences.
- Visual regression catches unintended token/component changes.

## 20. Final deliverable checklist

The design system is not ready for implementation until the following are approved:

- brand visual strategy;
- visual principles;
- color system for dark and light mode;
- typography scale;
- spacing and grid systems;
- elevation system;
- iconography standards;
- motion system;
- core component families;
- customer component families;
- operations component families;
- responsive rules;
- accessibility rules;
- token architecture;
- Figma architecture;
- frontend integration strategy;
- governance model;
- success criteria.
