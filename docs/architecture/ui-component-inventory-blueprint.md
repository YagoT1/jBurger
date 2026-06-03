# J Burguer — Definitive UI Component Inventory Blueprint

> **Language policy:** Business language is Spanish and technical language remains English, aligned with the approved architecture corpus.

> **Implementation status:** This document is the canonical component implementation scope for the approved fullstack food-tech platform. It defines required UI components, ownership, lifecycle, reuse rules, dependencies, screen coverage, accessibility coverage, and implementation waves. It does **not** generate React components, Tailwind, shadcn implementation, code, wireframes, or visual mockups.

## 0. Component scope assertion

All approved screens and navigation flows from the Screen Inventory and Navigation Graph are treated as fixed scope. The purpose of this blueprint is to prevent late invention, duplicate components, inconsistent interaction patterns, and ungoverned one-off UI across Customer, Administration, Kitchen, Delivery, Support, Franchise, and Analytics platforms.

### 0.1 Component acceptance rule

A component is accepted only if it has a clear owner, taxonomy category, purpose, allowed states, accessibility contract, dependency boundary, reuse rule, and screen coverage. Any later UI need must map to a component in this document or trigger a formal component change request.

## 1. Component governance

| Governance area | Canonical rule |
| --- | --- |
| Component ownership | Foundation, layout, navigation, feedback, and accessibility components are owned by Design System + Frontend Platform. Commerce, checkout, tracking, rewards, kitchen, delivery, admin, support, franchise, and analytics components are co-owned by the relevant domain owner and Frontend Platform. |
| Component lifecycle | Proposed → Reviewed → Approved → Implemented → Documented → Adopted → Monitored → Deprecated/Retired. No component may skip review or documentation. |
| Versioning strategy | Foundation and shared component APIs use semantic versioning. Feature components use additive minor versions until stable; breaking changes require migration notes and consumer inventory. |
| Deprecation strategy | Deprecated components must declare replacement, migration deadline, affected screens, risk, and removal wave. Deprecated components remain visually stable but receive no new variants. |
| Review process | Component proposals are reviewed for duplication, accessibility, permissions, state coverage, mobile behavior, domain boundaries, and dependency compliance. |
| Approval workflow | Domain owner approves business behavior; Design System approves interaction/visual token usage; Accessibility approves WCAG behavior; Frontend Platform approves API/dependencies; QA approves state/test matrix. |
| Naming conventions | Component names use PascalCase, descriptive nouns, and domain prefixes only when business-specific, e.g. `KitchenTicketCard`, not generic `Card2`. Spanish business labels are content, not component names. |
| Documentation requirement | Every component must document purpose, inputs/outputs when applicable, variants, states, accessibility requirements, dependencies, reuse rules, and examples by screen family. |
| Test expectation | Foundation/shared components require interaction, accessibility, keyboard, responsive, state, and visual-regression coverage. Domain components require journey/state/permission coverage. |
| Forbidden component patterns | One-off screen-only primitives, duplicated tables/cards/forms, direct Supabase access, business logic in presentational primitives, hardcoded colors, hardcoded role checks in UI primitives, unlabelled icon-only actions, modal stacks, inaccessible custom controls, provider-specific UI leaking into generic components. |

## 2. Component classification taxonomy

| Category | Purpose | Owner | Example components |
| --- | --- | --- | --- |
| Foundation Components | Atomic controls and primitives. | Design System | Button, Input, Badge, Tabs, Skeleton. |
| Layout Components | Page structure and responsive composition. | Design System/Frontend Platform | PageLayout, Grid, Sidebar, Modal. |
| Navigation Components | Movement, scope, search, and shortcut surfaces. | Design System/Frontend Platform | BottomNavigation, SideNavigation, ScopeSwitcher. |
| Commerce Components | Product discovery and configuration. | Commerce Domain | ProductCard, ModifierSelector, ComboBuilder. |
| Cart Components | Cart review, totals, discounts, and upsells. | Cart/Commerce Domain | CartItem, CartSummary, CouponInput. |
| Checkout Components | Fulfillment, payment, validation, receipt. | Checkout/Payments Domain | CheckoutStepper, PaymentStatus. |
| Tracking Components | Order progress and realtime customer feedback. | Orders/Delivery Domain | OrderTimeline, EtaIndicator, DelayAlert. |
| Rewards Components | Loyalty earning, redemption, tier progress. | Loyalty Domain | PointsBalance, RewardCard. |
| Operations Components | Shared operational surfaces for fast decisions. | Operations Domain | SLA timers, incident panels, mode controls. |
| Kitchen Components | Cocina queue and ticket execution. | Kitchen Domain | KitchenQueueBoard, KitchenTicketCard. |
| Delivery Components | Dispatch, assignment, route, proof, incidents. | Delivery Domain | DeliveryQueueBoard, DeliveryMap. |
| Admin Components | CRUD, governance, reports, logs, settings. | Admin/Platform Domain | DataTable, EntityEditor, AuditViewer. |
| Support Components | Cases, escalations, access, security support. | Support/Security Domain | CaseTimeline, BreakGlassPanel. |
| Analytics Components | Metrics, charts, filters, exports, saved views. | Analytics Domain | MetricCard, FunnelChart, ExportPanel. |
| Accessibility Components | Reusable accessibility behavior helpers. | Accessibility/Design System | SkipLink, LiveRegion, ErrorSummary. |
| Feedback Components | System states and user feedback. | Design System/Platform | Toast, Alert, EmptyState, OfflineState. |

## 3. Foundation components

| Component | Purpose | Variants | States | Accessibility requirements | Reuse rules |
| --- | --- | --- | --- | --- | --- |
| Button | Trigger primary, secondary, destructive, or text actions. | primary, secondary, tertiary, destructive, ghost, link, icon-leading, icon-trailing, full-width. | default, hover, focus-visible, active, disabled, loading, success. | Native button semantics, visible focus, disabled conveyed, loading announced when long-running. | Use for all command actions; never use clickable divs. |
| IconButton | Compact icon-only command. | primary, secondary, ghost, destructive, toggle. | default, hover, focus-visible, active, disabled, loading, selected. | Required accessible name, minimum touch target, tooltip optional not sole label. | Use only where space-constrained or repeated dense actions. |
| Input | Single-line text entry. | text, email, phone, password, search, numeric, currency. | empty, filled, focus, disabled, readonly, invalid, loading. | Label required, error association, autocomplete where useful. | Use for all short-form text input. |
| Textarea | Multi-line text entry. | default, resizable, fixed, counter. | empty, filled, focus, disabled, readonly, invalid. | Label, described-by, character count announced when relevant. | Use for notes, support responses, incident descriptions. |
| Select | Single or multi-select controlled choices. | single, multi, searchable, async. | placeholder, selected, focus, disabled, invalid, loading, empty. | Keyboard navigation, announced options, clear label. | Use for finite option sets; not for navigation tabs. |
| Checkbox | Independent boolean or multi-select item. | default, card, table-row. | unchecked, checked, indeterminate, disabled, invalid. | Native checked state, group label for sets. | Use for consent, filters, batch selection. |
| Radio | Mutually exclusive selection. | default, card, segmented. | unchecked, checked, disabled, invalid. | Radio group label and arrow-key support. | Use for fulfillment/payment choices where only one is valid. |
| Switch | Immediate on/off preference or setting. | default, with label, compact. | on, off, focus, disabled, loading. | Role switch, state announced, label required. | Use for persistent toggles; not for destructive operational modes. |
| Tooltip | Supplemental non-critical explanation. | text, rich, keyboard. | closed, open, delayed, disabled. | Trigger focusable; content not required to complete task. | Never hide required instructions only in tooltip. |
| Popover | Lightweight contextual content/actions. | menu, info, picker. | closed, open, loading, empty. | Focus management and escape close. | Use for small contextual panels; use Modal for blocking tasks. |
| Badge | Status or category label. | neutral, success, warning, danger, info, brand, outline. | static, updating. | Text not color-only; status changes announced when critical. | Use for statuses, roles, tags, availability. |
| Chip | Removable filter or compact attribute. | filter, removable, selectable, readonly. | selected, unselected, disabled. | Clear remove label; keyboard removable. | Use in filters/search, not as CTA replacement. |
| Avatar | Person/branch identity representation. | image, initials, icon, status. | loaded, fallback, offline/active. | Alt handling: decorative when name adjacent; labelled otherwise. | Use for users/drivers/support agents. |
| Divider | Visual separation. | horizontal, vertical, inset. | static. | Hidden from screen reader unless semantically needed. | Use only to clarify grouping, not as layout crutch. |
| Accordion | Progressive disclosure. | single, multiple, bordered, compact. | open, closed, disabled. | Button headings, `aria-expanded`, keyboard support. | Use for checkout sections, FAQ, settings; avoid hiding primary CTA. |
| Tabs | Peer content switching. | line, pill, contained, scrollable. | active, inactive, disabled, loading. | Tablist semantics and arrow-key support. | Use for same-level content; not for sequential steps. |
| Skeleton | Loading placeholder. | text, card, table, chart, avatar. | loading, replaced. | `aria-busy` on region; avoid endless skeleton. | Use during predictable loading states. |
| Spinner | Indeterminate short loading indicator. | inline, button, page. | active, hidden. | Label for non-decorative usage. | Use only when layout is unknown or within controls. |
| Progress | Determinate or step progress. | linear, circular, step. | 0-100, indeterminate, complete, error. | Role progressbar, value announced. | Use for checkout steps, reward progress, long jobs. |
| DateRangePicker | Select analytics/report date ranges. | preset, custom, compare. | selected, invalid, disabled, loading. | Keyboard calendar support and text fallback. | Use for analytics/admin filters only. |
| Pagination | Navigate paged data. | numeric, cursor, load-more. | first, previous, next, disabled, loading. | Landmarks/labels for page movement. | Use for large lists/tables; avoid infinite scroll in admin/support. |
| CommandMenu | Keyboard-driven command/search surface. | global, scoped, operational. | open, loading, empty, results. | Full keyboard support, visible focus, escape close. | Use for admin/support shortcuts and power-user navigation. |

## 4. Layout components

| Component | Purpose | Allowed usage | Forbidden usage |
| --- | --- | --- | --- |
| PageLayout | Owns page-level regions, landmarks, and responsive shell. | Every screen root. | Nesting PageLayout inside PageLayout. |
| SectionLayout | Groups related content with heading and actions. | Dashboard sections, forms, account areas. | Unlabelled groups or replacing semantic forms. |
| Container | Controls readable width and padding. | Customer/content pages. | Admin data tables that need full width. |
| Grid | Responsive two-dimensional placement. | Product grids, dashboard cards, analytics panels. | Linear forms where Stack is clearer. |
| Stack | One-dimensional spacing. | Forms, detail panels, mobile layouts. | Complex dashboard grids. |
| Sidebar | Persistent navigation or context rail. | Admin, support, franchise, analytics desktop shells. | Mobile customer primary navigation. |
| Header | Page or app header. | Brand, title, scope, primary utility actions. | Duplicating Topbar on same hierarchy. |
| Footer | Low-priority links/legal. | Customer public pages. | Operational critical actions. |
| Topbar | App-level utility strip. | Admin/ops/support scope, search, profile. | Content section title replacement. |
| BottomBar | Mobile persistent action/nav region. | Customer nav, sticky checkout/tracking actions. | Dense admin data controls. |
| Drawer | Off-canvas navigation/context. | Mobile side navigation, filters, account menu. | Blocking confirmations or nested drawers. |
| Sheet | Task-focused temporary panel. | Modifiers, filters, address edit, map detail. | Critical approval workflows requiring audit. |
| Modal | Blocking decision/workflow. | Destructive confirmation, access request, payment recovery. | Stacked or long scrolling CRUD forms. |
| SplitPane | Master-detail workspace. | Support cases, delivery map/detail, admin tables. | Mobile-first customer checkout. |
| StickyActionBar | Persistent primary action. | Product add, cart checkout, payment, ops ticket actions. | Multiple competing primary CTAs. |
| ResponsiveTableShell | Adapts tables to mobile cards and desktop grids. | Admin/support/analytics data. | Product browsing. |

## 5. Navigation components

| Component | Purpose | Usage | Permissions |
| --- | --- | --- | --- |
| BottomNavigation | Mobile customer primary navigation. | Home/Menu/Carrito/Seguimiento/Perfil. | Hide authenticated-only destinations or route to login/recovery. |
| SideNavigation | Desktop role-based app navigation. | Admin/support/franchise/analytics shells. | Items filtered by role, tenant, sucursal, permission. |
| Breadcrumb | Task context and backtracking. | Admin entities, product/category, support/access, analytics drilldowns. | Visible if hierarchy is meaningful; no permission leaks. |
| GlobalSearch | Cross-entity search. | Admin/support; customer product search variant via ProductSearch. | Results filtered by permission and scope. |
| NavigationTabs | Peer-section switching. | Account, analytics dashboards, ops queues. | Tabs hidden/disabled by permission. |
| NavigationMenu | Grouped navigation menu. | Desktop customer/admin expanded menus. | Permission-filtered. |
| QuickActions | Fast task entry. | Create product, assign delivery, start ticket, support case, report. | Action-level permissions required. |
| ContextActions | Actions for selected entity/context. | Order, case, ticket, delivery, report. | Per-action permissions and state rules. |
| ScopeSwitcher | Tenant/organization/franchise scope selector. | Admin/franchise/analytics. | Only authorized scopes visible. |
| BranchSwitcher | Sucursal selector. | Customer, admin, ops dashboards. | Customer sees public branches; staff sees assigned branches. |
| CurrentOrderShortcut | Fast access to active tracking. | Customer Home/Menu/Carrito. | Own order token/account only. |
| CommandNavigation | Keyboard/power-user navigation. | Admin/support/platform operations. | Permission-filtered commands and audit for sensitive commands. |

## 6. Commerce components

| Component | Inputs | Outputs | States | Dependencies |
| --- | --- | --- | --- | --- |
| ProductCard | product, price, availability, badges, image. | open product, add quick item, favorite. | loading, available, sold-out, unavailable branch, favorite, error. | productos, disponibilidad, favoritos optional. |
| FeaturedProductCard | product, campaign context, hero image. | open product, add. | loading, promoted, expired promo, unavailable. | productos, promociones. |
| ProductGallery | images, alt text, selected media. | media selected. | loading, image error, empty. | asset storage/CDN. |
| ProductBadge | badge type, label. | none. | static, updating. | product metadata/promotions. |
| CategoryCard | category, image/icon, count. | open category. | loading, empty, active. | categorias. |
| CategoryScroller | categories, active category. | select category. | loading, overflow, empty. | categorias. |
| ModifierSelector | modifier groups, constraints, selections. | valid selection, validation errors. | incomplete, valid, invalid, disabled, price updating. | productos, pricing. |
| PriceDisplay | base price, modifiers, discounts, fees context. | none. | loading, changed, discounted, unavailable. | pricing. |
| AvailabilityIndicator | product/branch availability and freshness. | none. | available, low stock, sold out, stale, branch closed. | disponibilidad, sucursales, realtime optional. |
| PromotionBanner | promo, eligibility, expiry. | apply/view terms. | active, ineligible, expired, loading. | promociones, carrito optional. |
| RecommendationCarousel | products/reasons/context. | open/add product. | loading, empty, personalized, fallback. | recommendations, productos. |
| ComboBuilder | bundle rules, selected items. | configured combo. | incomplete, valid, invalid, price updating. | productos, pricing, promociones. |
| FavoriteToggle | product id, favorite state. | toggled favorite. | on, off, loading, unauthenticated, error. | favoritos, auth. |
| ProductSearch | query, filters, results. | selected result/query. | empty query, loading, results, no results, offline. | search, productos. |

## 7. Cart components

| Component | Purpose | States | Dependencies |
| --- | --- | --- | --- |
| CartItem | Displays and edits cart line item. | valid, quantity updating, unavailable, price changed, modifier invalid. | carrito, productos, pricing. |
| CartSummary | Shows subtotal, discounts, fees, total, ETA. | loading, valid, stale, recalculating, error. | carrito, pricing, sucursales. |
| CartDrawer | Lightweight cart preview from discovery. | closed, open, empty, populated, stale. | carrito. |
| CartBadge | Displays current item count/value. | zero, count, updating, stale. | carrito. |
| CartUpsell | Suggests add-ons or combos. | loading, suggestions, empty, dismissed. | recommendations, productos, carrito. |
| CouponInput | Applies/removes coupon. | empty, validating, applied, invalid, expired, limit reached. | cupones, promociones, pricing. |
| FeeBreakdown | Explains delivery/service/tax fees. | collapsed, expanded, loading, changed. | pricing, sucursales. |
| TipSelector | Optional delivery tip if business enables it. | none, selected, custom, disabled. | checkout config, pricing. |
| OrderSummary | Final order summary reused in checkout/payment/detail. | loading, valid, stale, paid, refunded, cancelled. | pedidos/carrito, pricing, pagos. |

## 8. Checkout components

| Component | Purpose | States | Dependencies | Validation requirements |
| --- | --- | --- | --- | --- |
| CheckoutStepper | Communicates checkout progress. | current, complete, error, disabled. | checkout flow state. | Steps must not imply forced account creation. |
| AddressSelector | Selects saved or guest address. | no addresses, selected, out-of-zone, loading. | direcciones, sucursales. | Required for delivery; pickup bypass allowed. |
| AddressEditor | Creates/edits delivery address. | empty, valid, invalid, geocoding, out-of-zone. | direcciones, geocoding/maps. | Required fields, map fallback, coverage validation. |
| CoverageChecker | Validates delivery coverage and branch match. | checking, covered, not covered, provider error. | sucursales, geocoding. | Must offer pickup/branch recovery. |
| PaymentMethodSelector | Selects Mercado Pago/other configured methods. | available, selected, unavailable, loading. | pagos, provider health. | Must block submit when no valid method. |
| OrderReview | Confirms items, address, contact, totals. | valid, stale, price changed, unavailable. | carrito, pricing, checkout. | Requires explicit acceptance of critical price changes. |
| CheckoutSummary | Compact total and submit context. | loading, valid, invalid, submitting. | checkout, pricing, pagos. | Submit disabled until all required validations pass. |
| PaymentStatus | Shows pending/approved/rejected payment state. | pending, approved, rejected, expired, provider unavailable, polling. | pagos, pedidos, Mercado Pago. | Prevent duplicate payment; explain retry. |
| ReceiptPreview | Shows receipt before/after payment. | draft, paid, refunded, error. | pedidos, pagos. | Payment identifiers must be masked as needed. |
| GuestContactForm | Captures guest name/phone/email/consent. | empty, valid, invalid, verifying. | checkout, auth optional. | Contact required for tracking/recovery. |
| ConsentPanel | Captures privacy/communication consent. | unchecked, checked, required missing. | consent policy. | Required consent must be explicit and labelled. |

## 9. Tracking components

| Component | Realtime requirements | Fallback requirements |
| --- | --- | --- |
| OrderTimeline | Subscribe to order status changes and resync after reconnect. | Show last known status, polling, timestamp. |
| OrderStatusBadge | Reflect canonical order state within 5 seconds. | Stale badge when realtime unavailable. |
| EtaIndicator | Recalculate ETA on kitchen/delivery updates. | Show delayed/data freshness message. |
| DeliveryMapCard | Track delivery position where allowed. | Collapse to address/status list if maps fail. |
| RealtimeStatus | Monitor subscription health. | Manual retry and polling fallback. |
| TrackingEvent | Render individual timeline event. | Mark delayed/unconfirmed events. |
| TrackingSummary | Summarize status, ETA, fulfillment, support CTA. | Last updated timestamp and recovery CTA. |
| DelayAlert | Trigger when SLA changes. | Explain cause, revised ETA, support link. |
| NotificationChannelStatus | Shows WhatsApp/email/app delivery status. | Alternate channel suggestion and retry state. |

## 10. Loyalty components

| Component | Purpose | States | Dependencies |
| --- | --- | --- | --- |
| PointsBalance | Shows current loyalty points. | loading, current, delayed, zero, error. | recompensas, cliente. |
| RewardCard | Displays individual reward. | available, locked, redeemed, expired, ineligible. | recompensas, promociones. |
| RewardCatalog | Lists rewards. | loading, populated, empty, filtered. | recompensas. |
| TierBadge | Shows loyalty tier. | current, next, loading. | recompensas. |
| MilestoneCard | Shows progress toward milestone. | in progress, achieved, expired. | recompensas. |
| RewardRedemption | Applies reward to checkout/cart. | eligible, applying, applied, failed, removed. | recompensas, checkout, pricing. |
| RewardProgress | Visual progress to next reward/tier. | zero, partial, complete, delayed. | recompensas. |

## 11. Kitchen components

| Component | Realtime requirements | Permissions | Actions |
| --- | --- | --- | --- |
| KitchenQueueBoard | Live ticket creation/update; stale banner after disconnect. | `pedido:read:sucursal`, `pedido:update:ops`. | start, filter, open ticket. |
| KitchenTicketCard | Live SLA/status changes. | `pedido:update:ops`. | start, ready, open detail. |
| KitchenTicketDetail | Live timeline and item status sync. | `pedido:read:sucursal`, `pedido:update:ops`. | mark item/order, print, incident. |
| KitchenPriorityBadge | Update when priority changes. | `pedido:update:ops`. | prioritize/deprioritize where allowed. |
| KitchenSLATimer | Tick locally, reconcile with server. | `pedido:read:sucursal`. | expose delay warning. |
| KitchenStationFilter | Filter queue by station. | `pedido:read:sucursal`. | select station, clear. |
| KitchenIncidentPanel | Incident updates live. | `ops:incident`. | create, assign, close, link ticket. |
| KitchenPauseControl | Publish mode changes immediately. | `sucursal:manage`. | activate, schedule resume, cancel. |
| KitchenSaturationControl | Live capacity/ETA/menu impact. | `sucursal:manage`, `ops:incident`. | activate, adjust, end mode. |

## 12. Delivery components

| Component | Realtime requirements | Permissions | Dependencies |
| --- | --- | --- | --- |
| DeliveryQueueBoard | Ready orders and assignment locks live. | `pedido:update:ops`. | entregas, pedidos. |
| DeliveryAssignmentCard | Driver/order availability live. | `pedido:update:ops`. | entregas, usuarios. |
| DeliveryDetail | Status and proof updates live. | `pedido:update:ops`. | entregas, pedidos, maps. |
| DeliveryMap | Marker/location updates live; stale markers indicated. | `pedido:read:sucursal`. | maps/geocoding, entregas. |
| DeliveryStatusTimeline | Delivery status event updates. | `pedido:read:sucursal`. | entregas. |
| DriverIndicator | Driver availability/status. | `pedido:read:sucursal`. | usuarios, entregas. |
| EtaEditor | Revised ETA pushes to tracking. | `pedido:update:ops`. | entregas, notificaciones. |
| DeliveryIncidentPanel | Incident creation/update live. | `ops:incident`. | incidents, soporte. |
| ReassignmentPanel | Assignment lock/conflict handling. | `pedido:update:ops`, `sucursal:manage`. | entregas, usuarios, audit. |
| ProofCapture | Upload proof and retry on failure. | `pedido:update:ops`. | storage, entregas. |

## 13. Admin components

| Component | Permissions | Dependencies | Reuse rules |
| --- | --- | --- | --- |
| DashboardMetric | `analytics:view`. | analytics. | Use for single KPI with trend/status. |
| DashboardGrid | `analytics:view`. | analytics. | Use for dashboard composition, not arbitrary layout. |
| DataTable | entity-specific permission. | query/pagination/sorting. | Canonical table for admin/support/analytics lists. |
| FilterBar | screen permission. | URL params/query state. | Reuse for all filterable lists and dashboards. |
| EntityEditor | entity manage permission. | form schema/domain services. | Wrap product/category/customer/user/settings editors. |
| RoleEditor | `role:manage`. | roles, permissions. | Only for role bundles. |
| PermissionEditor | `permission:manage`. | permissions, policy simulator. | Security-admin only. |
| PromotionBuilder | `promo:manage`. | promociones, productos, sucursales. | Canonical campaign rule builder. |
| CouponBuilder | `promo:manage`. | cupones, promociones. | Canonical coupon workflow. |
| AuditViewer | `audit:view`. | audit logs. | Reuse in admin/security/support with scope filters. |
| LogViewer | `platform:operate`. | observability/logs. | Platform operations only. |
| SettingsEditor | scoped `sucursal:manage`/`platform:operate`. | configuration, feature flags. | Use with impact preview and rollback. |
| ReportBuilder | `analytics:view`. | analytics/reporting. | Use for scheduled/ad-hoc reports. |
| PolicySimulator | `permission:manage`. | authorization policies. | Required before permission changes. |

## 14. Support components

| Component | Permissions | Audit requirements |
| --- | --- | --- |
| CaseList | `support:case`. | assignment/filter/view events where required. |
| CaseTimeline | `support:case`. | comments, status changes, linked entities logged. |
| CaseDetail | `support:case`. | every sensitive context view logged. |
| AccessRequestModal | `support:temporary_access`. | request reason, scope, approver, expiry logged. |
| BreakGlassPanel | `security:break_glass`. | emergency reason, incident link, approval, usage, review logged. |
| UserActivityViewer | `support:case`, `audit:view` for sensitive events. | searches, reveals, exports logged. |
| AuditTrailViewer | `audit:view`. | search and export logged. |
| EscalationPanel | `support:case`. | escalation owner, SLA, status logged. |
| IncidentPanel | `ops:incident`. | severity, owner, linked cases/orders logged. |
| PiiRevealGate | support/security permission by scope. | reveal reason, field, actor, duration logged. |
| WatermarkedAccessShell | temporary/break-glass sessions. | session start/end, actions, scope logged. |

## 15. Analytics components

| Component | Inputs | Outputs | Permissions |
| --- | --- | --- | --- |
| MetricCard | metric value, comparison, status. | drilldown, tooltip. | `analytics:view`. |
| TrendChart | time series, comparison range. | selected point/range. | `analytics:view`. |
| FunnelChart | funnel steps/counts/rates. | selected step. | `analytics:view`. |
| CohortChart | cohort matrix/retention values. | selected cohort. | `analytics:view`. |
| Heatmap | dimension matrix/intensity. | selected cell. | `analytics:view`. |
| KpiGrid | metric card collection. | selected KPI. | `analytics:view`. |
| FilterPanel | dimensions, saved filters. | filter state. | dashboard permission. |
| ExportPanel | export formats/status. | export request/download. | `analytics:export` or `audit:view` for compliance export. |
| SavedViewManager | view config, owner/scope. | save/update/delete view. | `analytics:view`; sharing may require admin. |
| DataFreshnessBanner | freshness timestamp/status. | refresh/retry. | dashboard permission. |
| ChartDrilldownPanel | selected metric context. | related dashboard/entity. | dashboard permission plus target permission. |

## 16. Accessibility components

| Component | Purpose | Required usage |
| --- | --- | --- |
| SkipLink | Bypass repeated navigation to main content. | Every app shell. |
| LiveRegion | Announce realtime/status changes. | Tracking, cocina, entregas, payment, feedback. |
| FocusTrap | Contain focus in modal/sheet where blocking. | Modal, critical Sheet, access workflows. |
| ScreenReaderText | Provide non-visible labels/instructions. | Icon-only actions, status context, chart summaries. |
| KeyboardShortcutHelper | Documents safe keyboard shortcuts. | Ops/admin/support power-user screens. |
| ErrorSummary | Summarizes validation errors and links to fields. | Checkout, forms, admin editors, support access. |
| FocusRestorer | Returns focus to origin after dialogs/sheets. | All overlays. |
| ReducedMotionGuard | Provides static alternatives to animation. | Tracking, charts, transitions. |

## 17. Feedback components

| Component | Purpose | Required states/behavior |
| --- | --- | --- |
| Toast | Temporary non-blocking feedback. | success, error, warning, info; not for critical persistent failures. |
| Alert | Inline contextual message. | info, warning, danger, success; labelled and dismissible where safe. |
| Banner | Persistent page/global state message. | outage, realtime disconnected, maintenance, branch closed, saturation. |
| EmptyState | Explains no data and next best action. | title, explanation, primary recovery, secondary link. |
| ErrorState | Recoverable error view. | error code/reference, retry, safe exit, support. |
| OfflineState | Connectivity fallback. | cached content notice, last updated, retry. |
| MaintenanceState | Maintenance mode communication. | impacted scope, expected recovery, status/support link. |
| SuccessState | Completed task confirmation. | summary, next action, receipt/reference where relevant. |
| RetryPanel | Retry and diagnostic action cluster. | retry, back, support/log reference. |
| ForbiddenState | Permission-denied state. | required permission, request access/switch scope. |
| DataDelayedState | Analytics/realtime delay state. | freshness timestamp, retry, continue-read-only. |

## 18. Screen-to-component matrix

### 18.1 Customer screens

| Screen | Required components | Optional components | Operational components | Accessibility components |
| --- | --- | --- | --- | --- |
| C01 Home | PageLayout, Header, BranchSwitcher, ProductCard, FeaturedProductCard, PromotionBanner, RecommendationCarousel, BottomNavigation, CartBadge | CurrentOrderShortcut, RewardProgress | AvailabilityIndicator | SkipLink, LiveRegion |
| C02 Menu | PageLayout, CategoryScroller, ProductCard, ProductSearch, FilterBar, CartBadge, BottomNavigation | RecommendationCarousel, PromotionBanner | AvailabilityIndicator | SkipLink, ErrorSummary |
| C03 Categoria | PageLayout, Breadcrumb, CategoryCard, ProductCard, CategoryScroller, CartBadge | ProductSearch | AvailabilityIndicator | SkipLink |
| C04 Producto | PageLayout, ProductGallery, ModifierSelector, PriceDisplay, FavoriteToggle, StickyActionBar | ProductBadge, RecommendationCarousel | AvailabilityIndicator | ErrorSummary, FocusRestorer |
| C05 Busqueda | PageLayout, ProductSearch, ProductCard, EmptyState | CategoryCard, PromotionBanner | AvailabilityIndicator | LiveRegion |
| C06 Promociones | PageLayout, PromotionBanner, CouponInput, EmptyState | ProductCard | AvailabilityIndicator | ErrorSummary |
| C07 Carrito | PageLayout, CartItem, CartSummary, CouponInput, FeeBreakdown, OrderSummary, StickyActionBar | CartUpsell, TipSelector | AvailabilityIndicator | ErrorSummary, LiveRegion |
| C08 Checkout Invitado | PageLayout, CheckoutStepper, GuestContactForm, AddressEditor, CoverageChecker, PaymentMethodSelector, OrderReview, CheckoutSummary, ConsentPanel | ReceiptPreview | RealtimeStatus | ErrorSummary, FocusTrap |
| C09 Checkout Autenticado | PageLayout, CheckoutStepper, AddressSelector, CoverageChecker, PaymentMethodSelector, OrderReview, CheckoutSummary, RewardRedemption | ReceiptPreview | RealtimeStatus | ErrorSummary, FocusTrap |
| C10 Pago Pendiente | PageLayout, PaymentStatus, OrderSummary, RetryPanel, Banner | NotificationChannelStatus | RealtimeStatus | LiveRegion |
| C11 Pago Aprobado | PageLayout, SuccessState, OrderSummary, ReceiptPreview, CurrentOrderShortcut | GuestContactForm for account creation | NotificationChannelStatus | LiveRegion |
| C12 Pago Rechazado | PageLayout, PaymentStatus, RetryPanel, Alert, OrderSummary | Support link action | RealtimeStatus | ErrorSummary, LiveRegion |
| C13 Seguimiento Pedido | PageLayout, OrderTimeline, OrderStatusBadge, EtaIndicator, TrackingSummary, RealtimeStatus, DelayAlert | DeliveryMapCard, NotificationChannelStatus | RealtimeStatus | LiveRegion, ScreenReaderText |
| C14 Historial Pedidos | PageLayout, DataTable/ResponsiveTableShell, OrderSummary, EmptyState | FilterBar | none | SkipLink |
| C15 Detalle Pedido | PageLayout, OrderSummary, ReceiptPreview, OrderTimeline, ContextActions | RetryPanel | RealtimeStatus | ErrorSummary |
| C16 Recompensas | PageLayout, PointsBalance, RewardCatalog, TierBadge, RewardProgress | MilestoneCard | none | LiveRegion |
| C17 Perfil | PageLayout, EntityEditor, Input, ConsentPanel | Alert | none | ErrorSummary |
| C18 Direcciones | PageLayout, AddressSelector, AddressEditor, CoverageChecker | DeliveryMapCard | none | ErrorSummary, FocusRestorer |
| C19 Notificaciones | PageLayout, DataTable/ResponsiveTableShell, NotificationChannelStatus, EmptyState | FilterBar | none | LiveRegion |
| C20 Configuracion | PageLayout, NavigationTabs, EntityEditor, Switch, ConsentPanel | Alert | none | ErrorSummary |
| C21 Favoritos | PageLayout, ProductCard, FavoriteToggle, EmptyState | RecommendationCarousel | AvailabilityIndicator | SkipLink |
| C22 Recompra | PageLayout, OrderSummary, CartItem, AvailabilityIndicator, PriceDisplay | RecommendationCarousel | RealtimeStatus | ErrorSummary |
| C23 Crear Cuenta Invitado | PageLayout, GuestContactForm, ConsentPanel, SuccessState | RewardProgress | none | ErrorSummary |
| C24 Recuperar Cuenta Invitado | PageLayout, Input, CheckoutStepper, RetryPanel | Case entry link | none | ErrorSummary, LiveRegion |
| C25 Customer Empty State Hub | EmptyState, Button, PageLayout | ProductCard recommendations | none | ScreenReaderText |
| C26 Customer Error State Hub | ErrorState, RetryPanel, PageLayout | Support link | RealtimeStatus | ErrorSummary, LiveRegion |
| C27 Customer Offline State Hub | OfflineState, RetryPanel, PageLayout | cached ProductCard/CartSummary | RealtimeStatus | LiveRegion |

### 18.2 Operations, admin, support, franchise, and analytics screens

| Screens | Required components | Optional components | Operational components | Accessibility components |
| --- | --- | --- | --- | --- |
| K01-K11 Cocina | PageLayout, Topbar, SideNavigation, KitchenQueueBoard, KitchenTicketCard, KitchenTicketDetail, KitchenSLATimer, KitchenStationFilter, KitchenIncidentPanel, KitchenPauseControl, KitchenSaturationControl, Banner | CommandNavigation, DataTable | RealtimeStatus, DataDelayedState | SkipLink, LiveRegion, KeyboardShortcutHelper |
| D01-D09 Entregas | PageLayout, Topbar, SideNavigation, DeliveryQueueBoard, DeliveryAssignmentCard, DeliveryDetail, DeliveryMap, DeliveryStatusTimeline, DriverIndicator, EtaEditor, DeliveryIncidentPanel, ReassignmentPanel, ProofCapture | CommandNavigation, DataTable | RealtimeStatus, DataDelayedState | SkipLink, LiveRegion, KeyboardShortcutHelper |
| A01-A17 Admin | PageLayout, Topbar, SideNavigation, ScopeSwitcher, BranchSwitcher, DashboardMetric, DashboardGrid, DataTable, FilterBar, EntityEditor, RoleEditor, PermissionEditor, PromotionBuilder, CouponBuilder, AuditViewer, LogViewer, SettingsEditor, ReportBuilder | CommandMenu, PolicySimulator | Banner, DataDelayedState | SkipLink, ErrorSummary, FocusTrap |
| S01-S09 Support | PageLayout, Topbar, SideNavigation, CaseList, CaseTimeline, CaseDetail, AccessRequestModal, BreakGlassPanel, UserActivityViewer, AuditTrailViewer, EscalationPanel, IncidentPanel, PiiRevealGate, WatermarkedAccessShell | CommandNavigation | RealtimeStatus, ForbiddenState | SkipLink, FocusTrap, LiveRegion, ScreenReaderText |
| F01-F08 Franchise | PageLayout, Topbar, SideNavigation, ScopeSwitcher, DashboardMetric, KpiGrid, TrendChart, DataTable, FilterPanel, ExportPanel, PromotionBuilder, SettingsEditor | SavedViewManager | DataFreshnessBanner | SkipLink, ScreenReaderText |
| N01-N12 Analytics | PageLayout, Topbar, SideNavigation, MetricCard, TrendChart, FunnelChart, CohortChart, Heatmap, KpiGrid, FilterPanel, ExportPanel, SavedViewManager, DataFreshnessBanner, ChartDrilldownPanel | ReportBuilder | DataDelayedState | SkipLink, ScreenReaderText, LiveRegion |


### 18.3 Detailed non-customer screen coverage

| Screen | Required components | Optional components | Operational components | Accessibility components |
| --- | --- | --- | --- | --- |
| K01 Dashboard Cocina | PageLayout, Topbar, SideNavigation, DashboardMetric, KitchenQueueBoard, KitchenSLATimer, KitchenPauseControl, KitchenSaturationControl | CommandNavigation | RealtimeStatus, Banner | SkipLink, LiveRegion |
| K02 Cola General | PageLayout, KitchenQueueBoard, KitchenStationFilter, KitchenTicketCard | KitchenPriorityBadge | RealtimeStatus | KeyboardShortcutHelper, LiveRegion |
| K03 Ticket Cocina | PageLayout, KitchenTicketCard, KitchenSLATimer, StickyActionBar | KitchenPriorityBadge | RealtimeStatus | KeyboardShortcutHelper, LiveRegion |
| K04 Detalle Ticket | PageLayout, KitchenTicketDetail, KitchenIncidentPanel, KitchenSLATimer | KitchenPriorityBadge | RealtimeStatus | ErrorSummary, LiveRegion |
| K05 Pedidos Prioritarios | PageLayout, KitchenQueueBoard, KitchenPriorityBadge, KitchenSLATimer | FilterBar | RealtimeStatus | KeyboardShortcutHelper |
| K06 Pedidos Retrasados | PageLayout, KitchenQueueBoard, KitchenSLATimer, KitchenIncidentPanel, DelayAlert | EtaEditor | RealtimeStatus, DataDelayedState | LiveRegion |
| K07 Pedidos Completados | PageLayout, DataTable, FilterBar, KitchenTicketDetail | ExportPanel | DataDelayedState | SkipLink |
| K08 Incidentes Cocina | PageLayout, KitchenIncidentPanel, DataTable, FilterBar | IncidentPanel | RealtimeStatus | ErrorSummary, LiveRegion |
| K09 Configuracion Cocina | PageLayout, SettingsEditor, EntityEditor, Alert | LogViewer link | Banner | ErrorSummary |
| K10 Modo Pausa | PageLayout, KitchenPauseControl, Modal, Alert | SettingsEditor | Banner | FocusTrap, LiveRegion |
| K11 Modo Saturacion | PageLayout, KitchenSaturationControl, KitchenSLATimer, Alert | SettingsEditor | Banner, RealtimeStatus | FocusTrap, LiveRegion |
| D01 Dashboard Entregas | PageLayout, Topbar, SideNavigation, DashboardMetric, DeliveryQueueBoard, DeliveryMap, DriverIndicator | CommandNavigation | RealtimeStatus, Banner | SkipLink, LiveRegion |
| D02 Cola Entregas | PageLayout, DeliveryQueueBoard, DeliveryAssignmentCard, DriverIndicator | FilterBar | RealtimeStatus | KeyboardShortcutHelper, LiveRegion |
| D03 Detalle Entrega | PageLayout, DeliveryDetail, DeliveryStatusTimeline, ProofCapture, ContextActions | DeliveryMapCard | RealtimeStatus | ErrorSummary, LiveRegion |
| D04 Mapa Entrega | PageLayout, DeliveryMap, DeliveryDetail, DriverIndicator | DeliveryQueueBoard | RealtimeStatus, OfflineState | ScreenReaderText |
| D05 Incidencias | PageLayout, DeliveryIncidentPanel, DataTable, FilterBar | IncidentPanel | RealtimeStatus | ErrorSummary, LiveRegion |
| D06 Retrasos | PageLayout, DataTable, EtaEditor, DelayAlert, DeliveryIncidentPanel | ReassignmentPanel | RealtimeStatus, DataDelayedState | LiveRegion |
| D07 Reasignaciones | PageLayout, ReassignmentPanel, DeliveryAssignmentCard, AuditViewer | Modal | RealtimeStatus | FocusTrap, ErrorSummary |
| D08 Historial Entregas | PageLayout, DataTable, FilterBar, DeliveryStatusTimeline, ProofCapture | ExportPanel | DataDelayedState | SkipLink |
| D09 Configuracion Operativa | PageLayout, SettingsEditor, DeliveryMap, CoverageChecker | Alert | Banner | ErrorSummary |
| A01 Dashboard | PageLayout, Topbar, SideNavigation, ScopeSwitcher, DashboardGrid, DashboardMetric | QuickActions | DataFreshnessBanner | SkipLink |
| A02 Productos | PageLayout, DataTable, FilterBar, EntityEditor, AvailabilityIndicator | ProductGallery | Alert | ErrorSummary |
| A03 Categorias | PageLayout, DataTable, EntityEditor, CategoryCard | Modal | Alert | ErrorSummary |
| A04 Promociones | PageLayout, DataTable, PromotionBuilder, FilterBar | ExportPanel | Alert | ErrorSummary |
| A05 Cupones | PageLayout, DataTable, CouponBuilder, FilterBar | ExportPanel | Alert | ErrorSummary |
| A06 Clientes | PageLayout, DataTable, FilterBar, EntityEditor | UserActivityViewer | PiiRevealGate | SkipLink |
| A07 Pedidos | PageLayout, DataTable, FilterBar, OrderSummary, ContextActions, AuditViewer | PaymentStatus | RealtimeStatus | ErrorSummary, LiveRegion |
| A08 Sucursales | PageLayout, DataTable, EntityEditor, BranchSwitcher, SettingsEditor | CoverageChecker | Banner | ErrorSummary |
| A09 Usuarios | PageLayout, DataTable, EntityEditor, RoleEditor | AuditViewer | ForbiddenState | ErrorSummary |
| A10 Roles | PageLayout, DataTable, RoleEditor, PermissionEditor | PolicySimulator | ForbiddenState | ErrorSummary |
| A11 Permisos | PageLayout, PermissionEditor, PolicySimulator, AuditViewer | RoleEditor | ForbiddenState | ErrorSummary |
| A12 Configuraciones | PageLayout, SettingsEditor, ScopeSwitcher, Alert | AuditViewer | MaintenanceState | ErrorSummary |
| A13 Notificaciones | PageLayout, DataTable, EntityEditor, NotificationChannelStatus | Alert | DataDelayedState | ErrorSummary, LiveRegion |
| A14 Auditoria | PageLayout, AuditViewer, FilterBar, ExportPanel | TrendChart | ForbiddenState | SkipLink, ScreenReaderText |
| A15 Logs | PageLayout, LogViewer, FilterBar, IncidentPanel | ExportPanel | DataDelayedState | SkipLink, LiveRegion |
| A16 Analytics | PageLayout, DashboardGrid, KpiGrid, SavedViewManager | ExportPanel | DataFreshnessBanner | SkipLink |
| A17 Reportes | PageLayout, ReportBuilder, DataTable, ExportPanel | SavedViewManager | DataDelayedState | ErrorSummary |
| S01 Dashboard Soporte | PageLayout, Topbar, SideNavigation, DashboardMetric, CaseList, EscalationPanel | IncidentPanel | RealtimeStatus | SkipLink, LiveRegion |
| S02 Casos | PageLayout, CaseList, FilterBar, CaseDetail | QuickActions | RealtimeStatus | KeyboardShortcutHelper |
| S03 Detalle Caso | PageLayout, CaseDetail, CaseTimeline, PiiRevealGate, ContextActions | AccessRequestModal, EscalationPanel | RealtimeStatus | ErrorSummary, LiveRegion |
| S04 Acceso Temporal | PageLayout, AccessRequestModal, AuditTrailViewer, WatermarkedAccessShell | PiiRevealGate | ForbiddenState | FocusTrap, ScreenReaderText |
| S05 Break Glass Requests | PageLayout, BreakGlassPanel, AuditTrailViewer, Modal | IncidentPanel | ForbiddenState | FocusTrap, LiveRegion |
| S06 Incidentes | PageLayout, IncidentPanel, DataTable, EscalationPanel | LogViewer link | RealtimeStatus | ErrorSummary, LiveRegion |
| S07 Auditoria Accesos | PageLayout, AuditTrailViewer, FilterBar, ExportPanel | AuditViewer | ForbiddenState | SkipLink, ScreenReaderText |
| S08 Escalaciones | PageLayout, EscalationPanel, CaseList, CaseTimeline | IncidentPanel | RealtimeStatus | LiveRegion |
| S09 Actividad Usuario | PageLayout, UserActivityViewer, PiiRevealGate, AuditTrailViewer | AccessRequestModal | ForbiddenState | ScreenReaderText |
| F01 Dashboard Franquiciante | PageLayout, Topbar, SideNavigation, ScopeSwitcher, KpiGrid, TrendChart | ExportPanel | DataFreshnessBanner | SkipLink |
| F02 Dashboard Franquiciado | PageLayout, ScopeSwitcher, KpiGrid, TrendChart, DashboardMetric | SavedViewManager | DataFreshnessBanner | SkipLink |
| F03 Comparativa Sucursales | PageLayout, DataTable, FilterPanel, TrendChart, ExportPanel | Heatmap | DataFreshnessBanner | ScreenReaderText |
| F04 Ranking Sucursales | PageLayout, DataTable, FilterPanel, MetricCard | ExportPanel | DataFreshnessBanner | SkipLink |
| F05 Performance | PageLayout, KpiGrid, TrendChart, ChartDrilldownPanel | ExportPanel | DataFreshnessBanner | ScreenReaderText |
| F06 Promociones Compartidas | PageLayout, PromotionBuilder, DataTable, FilterBar | ExportPanel | Alert | ErrorSummary |
| F07 Configuracion Marca | PageLayout, SettingsEditor, EntityEditor, Alert | AuditViewer | Banner | ErrorSummary |
| F08 Analytics Franquicia | PageLayout, KpiGrid, FilterPanel, SavedViewManager, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | SkipLink |
| N01 Ventas | PageLayout, MetricCard, TrendChart, KpiGrid, FilterPanel, ExportPanel | SavedViewManager | DataFreshnessBanner | ScreenReaderText |
| N02 Conversion | PageLayout, FunnelChart, TrendChart, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText |
| N03 Checkout | PageLayout, FunnelChart, MetricCard, TrendChart, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText |
| N04 Carrito | PageLayout, TrendChart, Heatmap, MetricCard, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText |
| N05 Clientes | PageLayout, CohortChart, MetricCard, TrendChart, FilterPanel, ExportPanel | SavedViewManager | DataFreshnessBanner | ScreenReaderText |
| N06 Promociones | PageLayout, MetricCard, TrendChart, DataTable, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText |
| N07 Recompensas | PageLayout, MetricCard, TrendChart, CohortChart, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText |
| N08 Sucursales | PageLayout, KpiGrid, DataTable, TrendChart, FilterPanel, ExportPanel | Heatmap | DataFreshnessBanner | ScreenReaderText |
| N09 Cocina | PageLayout, KpiGrid, TrendChart, Heatmap, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText, LiveRegion |
| N10 Entregas | PageLayout, KpiGrid, TrendChart, Heatmap, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText, LiveRegion |
| N11 Incidentes | PageLayout, MetricCard, TrendChart, DataTable, FilterPanel, ExportPanel | ChartDrilldownPanel | DataFreshnessBanner | ScreenReaderText |
| N12 Auditoria | PageLayout, MetricCard, TrendChart, AuditViewer, FilterPanel, ExportPanel | AuditTrailViewer | ForbiddenState, DataFreshnessBanner | ScreenReaderText |

## 19. Component dependency matrix

### 19.1 Dependency boundaries by component family

| Family | Allowed dependencies | Forbidden dependencies | Shared dependencies | Domain dependencies |
| --- | --- | --- | --- | --- |
| Foundation | design tokens, icons, accessibility helpers. | Supabase, domain services, auth, analytics business events. | ui primitives, token package. | none. |
| Layout | design tokens, responsive utilities, accessibility landmarks. | domain services, payment providers, realtime subscriptions. | ui primitives, shell context. | none except scope labels passed as props. |
| Navigation | auth/session scope read model, permission-filtered nav config. | direct database queries, hardcoded role checks in primitives. | router, permission adapter, icons. | route metadata only. |
| Commerce | product read models, pricing display models, cart commands via props/callbacks. | direct Supabase/provider calls, checkout payment logic. | foundation/layout/feedback. | productos, promociones, carrito through typed contracts. |
| Cart | cart read model, pricing, promotions. | payment provider direct calls, kitchen/delivery services. | foundation/feedback. | carrito, pricing, promociones. |
| Checkout | checkout state, address, coverage, payment status adapters. | product catalog mutation, support case mutation except links. | foundation/layout/feedback/accessibility. | checkout, pagos, direcciones, sucursales. |
| Tracking | order tracking read model, realtime status adapter, maps adapter. | cart mutation, admin-only order mutation. | feedback/accessibility. | pedidos, cocina, entregas, notificaciones. |
| Rewards | rewards read model, redemption command callback. | direct checkout mutation except redemption contract. | foundation/feedback. | recompensas, checkout pricing. |
| Kitchen | kitchen queue/ticket contracts, realtime adapter, incident callbacks. | customer PII beyond approved notes, payment details. | operations feedback, accessibility. | cocina, pedidos, incidents. |
| Delivery | delivery contracts, maps adapter, assignment locks, incident callbacks. | payment secrets, unrelated customer profile data. | operations feedback, accessibility. | entregas, pedidos, incidents, maps. |
| Admin | entity contracts, table/query state, audit adapters. | customer payment secrets, support temporary access internals. | DataTable, FilterBar, forms. | products, users, roles, permissions, audit, reports. |
| Support | case/access/audit contracts, PII reveal gate. | unapproved data reveal, direct permission bypass. | audit viewer, feedback. | soporte, security, audit, pedidos. |
| Analytics | aggregated metrics, filter dimensions, export jobs. | raw PII without explicit export permission, operational mutation. | charts, filters, export panel. | analytics warehouse, audit for compliance. |
| Accessibility | browser accessibility APIs and focus utilities. | domain services, visual-only dependencies. | tokens as needed. | none. |
| Feedback | state metadata, retry callbacks, support links. | domain mutation except provided retry callback. | foundation/accessibility. | none directly; context via props. |

### 19.2 Component-specific dependency notes

| Components | Required boundary note |
| --- | --- |
| Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Tooltip, Popover, Badge, Chip, Avatar, Divider, Accordion, Tabs, Skeleton, Spinner, Progress, DateRangePicker, Pagination, CommandMenu | Must remain domain-agnostic foundation primitives. |
| PageLayout, SectionLayout, Container, Grid, Stack, Sidebar, Header, Footer, Topbar, BottomBar, Drawer, Sheet, Modal, SplitPane, StickyActionBar, ResponsiveTableShell | Must compose regions only; no business data fetching. |
| BottomNavigation, SideNavigation, Breadcrumb, GlobalSearch, NavigationTabs, NavigationMenu, QuickActions, ContextActions, ScopeSwitcher, BranchSwitcher, CurrentOrderShortcut, CommandNavigation | May consume permission-filtered route config; must not define authorization policy itself. |
| ProductCard, FeaturedProductCard, ProductGallery, ProductBadge, CategoryCard, CategoryScroller, ModifierSelector, PriceDisplay, AvailabilityIndicator, PromotionBanner, RecommendationCarousel, ComboBuilder, FavoriteToggle, ProductSearch | May depend on commerce typed models; mutation side effects must be passed through callbacks/services outside presentation. |
| CartItem, CartSummary, CartDrawer, CartBadge, CartUpsell, CouponInput, FeeBreakdown, TipSelector, OrderSummary | May depend on cart/pricing read models; must not create payment preferences. |
| CheckoutStepper, AddressSelector, AddressEditor, CoverageChecker, PaymentMethodSelector, OrderReview, CheckoutSummary, PaymentStatus, ReceiptPreview, GuestContactForm, ConsentPanel | May depend on checkout/payment adapters; must preserve idempotency and validation boundaries. |
| OrderTimeline, OrderStatusBadge, EtaIndicator, DeliveryMapCard, RealtimeStatus, TrackingEvent, TrackingSummary, DelayAlert, NotificationChannelStatus | Must support realtime stale fallback and avoid exposing unauthorized delivery/operator data. |
| PointsBalance, RewardCard, RewardCatalog, TierBadge, MilestoneCard, RewardRedemption, RewardProgress | Must treat delayed points and redemption failure as first-class states. |
| KitchenQueueBoard, KitchenTicketCard, KitchenTicketDetail, KitchenPriorityBadge, KitchenSLATimer, KitchenStationFilter, KitchenIncidentPanel, KitchenPauseControl, KitchenSaturationControl | Must require ops permissions and realtime reconnect behavior. |
| DeliveryQueueBoard, DeliveryAssignmentCard, DeliveryDetail, DeliveryMap, DeliveryStatusTimeline, DriverIndicator, EtaEditor, DeliveryIncidentPanel, ReassignmentPanel, ProofCapture | Must handle assignment conflicts, map fallback, and proof upload retry. |
| DashboardMetric, DashboardGrid, DataTable, FilterBar, EntityEditor, RoleEditor, PermissionEditor, PromotionBuilder, CouponBuilder, AuditViewer, LogViewer, SettingsEditor, ReportBuilder, PolicySimulator | Must enforce permission-aware actions and audit-sensitive mutations. |
| CaseList, CaseTimeline, CaseDetail, AccessRequestModal, BreakGlassPanel, UserActivityViewer, AuditTrailViewer, EscalationPanel, IncidentPanel, PiiRevealGate, WatermarkedAccessShell | Must audit sensitive views/actions and require approval gates where specified. |
| MetricCard, TrendChart, FunnelChart, CohortChart, Heatmap, KpiGrid, FilterPanel, ExportPanel, SavedViewManager, DataFreshnessBanner, ChartDrilldownPanel | Must use aggregate models by default and gate exports. |
| SkipLink, LiveRegion, FocusTrap, ScreenReaderText, KeyboardShortcutHelper, ErrorSummary, FocusRestorer, ReducedMotionGuard | Must be reusable helpers with no business domain dependency. |
| Toast, Alert, Banner, EmptyState, ErrorState, OfflineState, MaintenanceState, SuccessState, RetryPanel, ForbiddenState, DataDelayedState | Must accept contextual copy/actions and never hardcode business workflows. |

## 20. Component reuse audit

| Risk | Potential duplicates/overlap | Canonical strategy |
| --- | --- | --- |
| Card proliferation | ProductCard, FeaturedProductCard, RewardCard, KitchenTicketCard, DeliveryAssignmentCard, MetricCard. | Use shared Card foundation styling internally but keep domain components separate because inputs/actions differ. |
| Table duplication | Admin tables, support lists, analytics tables, order history. | DataTable + ResponsiveTableShell is canonical; domain columns/actions are configuration. |
| Status duplication | Badge, OrderStatusBadge, KitchenPriorityBadge, AvailabilityIndicator, RealtimeStatus. | Badge remains primitive; domain status components own mapping and semantics. |
| Incident panels | KitchenIncidentPanel, DeliveryIncidentPanel, Support IncidentPanel. | Share incident primitives, keep domain wrappers for permissions/context. |
| Map components | DeliveryMap, DeliveryMapCard, AddressEditor map pin. | Shared maps adapter; domain components own task behavior. |
| Export controls | ReportBuilder, ExportPanel, AuditViewer export. | ExportPanel is canonical UI; audit/report wrappers enforce permissions. |
| Access/audit views | AuditViewer, AuditTrailViewer, UserActivityViewer. | AuditViewer for general logs; AuditTrailViewer for support/security access context. |
| Empty/error/offline states | Customer hubs and global Feedback components. | Feedback components are canonical; screen hubs configure copy/actions. |
| Filter controls | FilterBar, FilterPanel, ProductSearch filters. | FilterBar for lists/admin; FilterPanel for analytics; product filters remain commerce search-specific. |
| Mode controls | KitchenPauseControl, KitchenSaturationControl, branch service mode settings. | Ops mode controls require confirmation/impact preview; admin settings only configure defaults. |

### 20.1 Canonical component strategy

1. Build foundation primitives once in the Design System package.
2. Build layout/navigation/feedback/accessibility as platform shared components.
3. Build domain components as thin, reusable UI orchestrators over typed domain contracts.
4. Prevent domain components from fetching directly; screens/features provide data and commands.
5. Prefer composition over variants when business behavior changes.
6. Use permission-aware wrappers for actions, not hidden authorization logic inside primitives.
7. Maintain a component registry with owners, status, dependencies, and adopting screens.

## 21. Design system coverage audit

| Coverage dimension | Result | Evidence | Required component added if missing |
| --- | --- | --- | --- |
| Every screen covered | Passed | Screen-to-component matrix maps all C01-C27 and grouped K/D/A/S/F/N screens to required, optional, operational, and accessibility components. | None remaining. |
| Every journey covered | Passed | Commerce, cart, checkout, tracking, loyalty, operations, support, admin, franchise, analytics components align to approved journeys. | Added GuestContactForm, ConsentPanel, ProofCapture, PolicySimulator. |
| Every state covered | Passed | Feedback components cover toast, alert, banner, empty, error, offline, maintenance, success, retry, forbidden, delayed data. | Added ForbiddenState and DataDelayedState. |
| Every permission scope covered | Passed | Navigation, admin, support, kitchen, delivery, analytics components define permission gates. | Added PiiRevealGate and WatermarkedAccessShell. |
| Every operational scenario covered | Passed | Kitchen and delivery components include realtime, pause, saturation, incidents, delay, reassignment, proof capture. | Added RealtimeStatus and ProofCapture. |
| Accessibility coverage | Passed | SkipLink, LiveRegion, FocusTrap, ScreenReaderText, KeyboardShortcutHelper, ErrorSummary, FocusRestorer, ReducedMotionGuard cover navigation and state needs. | Added FocusRestorer and ReducedMotionGuard. |
| Reuse and duplication control | Passed | Reuse audit defines canonical table, status, incident, map, export, filter, feedback, and mode strategies. | None remaining. |
| Implementation readiness | Passed | Each component family has ownership, dependency boundaries, state expectations, and screen adoption. | This document is canonical component scope. |

## 22. Implementation roadmap

| Wave | Scope | Components | Exit criteria |
| --- | --- | --- | --- |
| Wave 1 — Foundation Components | Atomic primitives, accessibility helpers, feedback states, layout base. | Foundation, Layout, Accessibility, Feedback. | Primitives documented, accessible, responsive, tested, and token-compliant. |
| Wave 2 — Commerce Components | Product discovery and configuration. | ProductCard, ProductGallery, CategoryScroller, ModifierSelector, PriceDisplay, AvailabilityIndicator, PromotionBanner, RecommendationCarousel, ComboBuilder, FavoriteToggle, ProductSearch. | Customer browsing screens can be assembled without new components. |
| Wave 3 — Checkout Components | Cart, checkout, address, payment, receipt. | Cart components, CheckoutStepper, AddressSelector/Editor, CoverageChecker, PaymentMethodSelector, OrderReview, CheckoutSummary, PaymentStatus, ReceiptPreview, GuestContactForm, ConsentPanel. | Guest/auth checkout and payment recovery can be assembled. |
| Wave 4 — Tracking Components | Order status and customer post-order trust. | OrderTimeline, OrderStatusBadge, EtaIndicator, DeliveryMapCard, RealtimeStatus, TrackingEvent, TrackingSummary, DelayAlert, NotificationChannelStatus. | Tracking works with realtime, stale, offline, and delay states. |
| Wave 5 — Operations Components | Cocina and entregas. | Kitchen components, Delivery components, shared operational feedback. | Queues, tickets, dispatch, incidents, pause/saturation, reassignment are covered. |
| Wave 6 — Admin Components | Management, governance, settings, logs, reports. | DashboardMetric, DashboardGrid, DataTable, FilterBar, EntityEditor, RoleEditor, PermissionEditor, PromotionBuilder, CouponBuilder, AuditViewer, LogViewer, SettingsEditor, ReportBuilder, PolicySimulator. | Admin screens can be built with permission-aware reusable components. |
| Wave 7 — Support Components | Cases, access, security support, incidents. | CaseList, CaseTimeline, CaseDetail, AccessRequestModal, BreakGlassPanel, UserActivityViewer, AuditTrailViewer, EscalationPanel, IncidentPanel, PiiRevealGate, WatermarkedAccessShell. | Support workflows are auditable and permission-safe. |
| Wave 8 — Analytics Components | Dashboards, charts, filters, exports. | MetricCard, TrendChart, FunnelChart, CohortChart, Heatmap, KpiGrid, FilterPanel, ExportPanel, SavedViewManager, DataFreshnessBanner, ChartDrilldownPanel. | Analytics dashboards and exports are reusable and gated. |
| Wave 9 — Hardening | Cross-platform QA, performance, accessibility, duplication removal. | All components. | Component registry complete, no duplicate implementations, all states tested, accessibility acceptance passed. |

## 23. Final deliverable checklist

| Deliverable | Status | Location |
| --- | --- | --- |
| Component Taxonomy | Complete | Sections 2-17. |
| Component Inventory | Complete | Sections 3-17. |
| Screen-to-Component Matrix | Complete | Section 18. |
| Dependency Matrix | Complete | Section 19. |
| Accessibility Coverage | Complete | Sections 16 and 21. |
| Design System Coverage Audit | Complete | Section 21. |
| Reuse Audit | Complete | Section 20. |
| Implementation Roadmap | Complete | Section 22. |

