# J Burguer — Hardened Frontend, UX, and Design System Architecture

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Historical English business terms in this document are deprecated in favor of the canonical Spanish glossary.

> **UX/UI production blueprint:** Customer-facing and operational experience decisions must also follow `docs/architecture/ux-ui-production-blueprint.md` before visual design or frontend implementation begins.

> **Design system specification:** Visual language, tokens, components, Figma libraries, and frontend design-system integration must follow `docs/architecture/design-system-visual-language-specification.md`.

> **Frontend implementation blueprint:** Application structure, App Router routing, feature/domain/component boundaries, state, data access, auth, testing, security, observability, governance, and roadmap must follow `docs/architecture/frontend-implementation-blueprint.md`.

## 0. Experience Architecture Scope

This document defines the production frontend, UX, design system, realtime UI, dashboard, mobile, accessibility, performance, observability, and governance architecture for J Burguer.

The experience layer must operate as a premium mobile food-commerce product and as a realtime operational interface suite for kitchen, delivery, branch management, support, and analytics. It must be app-like, conversion-focused, accessible, resilient to network degradation, and scalable for multi-branch, multi-tenant, multi-brand expansion.

The frontend must survive:

- Low-end mobile devices.
- Unreliable mobile networks.
- Realtime reconnect storms.
- Large menu catalogs.
- Peak checkout traffic.
- Staff dashboard concurrency.
- Kitchen stress conditions.
- Branch incidents and degraded modes.
- Payment uncertainty.
- Multi-role navigation and authorization changes.

---

## 1. UX Architecture Philosophy

### 1.1 Experience Objective

The UX architecture must turn complex food-tech operations into simple, trustworthy, fast user journeys. Customers should feel appetite, confidence, and momentum. Staff should feel control, clarity, and reduced stress.

### 1.2 Principles

1. **Mobile commerce first**: the default interaction model optimizes for one-handed ordering.
2. **Operational clarity over decoration**: realtime operational interfaces prioritize state recognition and next action.
3. **Trust through transparency**: price, fee, ETA, availability, payment, and order status changes are explicit.
4. **Resilient UI state**: every screen has loading, empty, error, stale, degraded, and recovery states.
5. **Realtime as enhancement**: UI uses realtime for speed but always supports canonical refetch and polling fallback.
6. **Progressive disclosure**: advanced configuration and operational complexity are revealed only when needed.
7. **Accessible by default**: keyboard, screen reader, reduced motion, touch, and contrast requirements are core design constraints.
8. **Consistent interaction grammar**: customer, staff, and admin surfaces share components while preserving role-specific workflows.
9. **Performance is UX**: rendering strategy, hydration, images, fonts, and animation are designed to protect speed.
10. **Design system governance**: new UI patterns must fit tokens, variants, accessibility rules, and domain ownership.

---

## 2. Design System Philosophy

### 2.1 Design System Objective

The design system must provide a scalable, premium, food-tech UI language that supports customer appetite, conversion, realtime state, dense operational dashboards, and future multi-brand theming.

### 2.2 System Attributes

- Premium and appetizing.
- App-like and responsive.
- Operationally legible.
- Token-driven.
- Accessible.
- Motion-governed.
- Theming-ready.
- Componentized for shadcn/ui and TailwindCSS.

### 2.3 Design System Boundaries

The design system owns tokens, primitives, component variants, interaction rules, accessibility constraints, and visual grammar. Product features own domain composition and workflow logic.

---

## 3. Frontend Architecture Philosophy

### 3.1 Architecture Objective

Frontend architecture must balance Next.js server rendering, client-side interactivity, realtime synchronization, domain modularity, and performance. It must avoid fragile coupling between UI components, realtime streams, and backend data structures.

### 3.2 Principles

- Use server components for SEO, menu landing, static content, and initial data where appropriate.
- Use client components for cart, checkout, realtime tracking, staff dashboards, and interactive forms.
- Keep domain features isolated.
- Keep shared UI primitives domain-agnostic.
- Treat realtime data as a synchronized state layer, not the only source of truth.
- Use explicit server/client boundaries for security and performance.
- Keep payment, service role, and privileged data out of client bundles.

---

## 4. Information Architecture

### 4.1 Customer IA

- Home.
- Menu.
- Product detail.
- Cart.
- Checkout.
- Order tracking.
- Loyalty.
- Reorder/order history.
- Account.
- Help.

### 4.2 Operational IA

- Kitchen dashboard.
- Station view.
- Branch operations.
- Delivery dispatch.
- Pickup queue.
- Incidents.
- Availability controls.
- Staff settings.

### 4.3 Admin IA

- Organization dashboard.
- Branches.
- Menu management.
- Orders.
- Promotions.
- Loyalty.
- Customers/support.
- Analytics.
- Notifications.
- Settings.

---

## 5. Navigation System Architecture

### 5.1 Navigation Layers

- Public/customer navigation.
- Authenticated customer account navigation.
- Staff operational navigation.
- Admin/management navigation.
- Support navigation.

### 5.2 Navigation Rules

- Navigation must reflect role and tenant scope.
- Hidden navigation is not authorization.
- Mobile customer navigation uses bottom-first patterns.
- Operational navigation prioritizes current queue, branch state, and alerts.
- Admin navigation groups by domain and permission.

---

## 6. Customer Navigation Strategy

### 6.1 Customer Navigation Goals

Customer navigation must make ordering and tracking reachable within one tap from key states.

### 6.2 Mobile Customer Navigation

- Bottom navigation for Menu, Cart, Orders/Track, Loyalty, Account.
- Sticky cart CTA after first cart item.
- Persistent branch/status pill where relevant.
- Minimal top navigation on product and checkout screens.

### 6.3 Contextual Navigation

- Post-order navigation emphasizes tracking and reorder.
- Closed branch navigation emphasizes hours, scheduling, or pickup alternatives.
- Loyalty navigation surfaces rewards without blocking ordering.

---

## 7. Operational Navigation Strategy

### 7.1 Operational Navigation Goals

Operational navigation must keep staff inside high-priority workflows with minimal switching.

### 7.2 Operational Navigation Patterns

- Branch context always visible.
- Queue tabs by status/station.
- Alert rail or banner for exceptions.
- Fast switch between kitchen, delivery, pickup, and branch controls for authorized users.
- Large touch targets for tablet/kitchen displays.

---

## 8. Multi-Role UX Separation

### 8.1 Role Separation

Customer, staff, manager, support, and admin experiences must use separate route groups, layouts, navigation, and permission-aware data boundaries.

### 8.2 Visual Separation

Operational surfaces should look clearly different from customer commerce surfaces to prevent role confusion, while still using shared tokens and components.

### 8.3 Context Switching

If a user has multiple roles, active context must be explicit. Switching from customer to staff/admin mode should be deliberate and audited where required.

---

## 9. Mobile-First Strategy

### 9.1 Mobile Requirements

- One-handed browsing.
- Thumb-zone CTAs.
- Bottom sheets for product customization.
- Sticky cart and checkout actions.
- Keyboard-safe forms.
- Tap targets at least 44px.
- Minimal typing.
- Fast reorder paths.

### 9.2 Mobile Constraints

- Avoid dense desktop tables on customer mobile.
- Avoid hover-only interactions.
- Avoid modal stacks.
- Avoid long forms without saved/default data.
- Avoid layout shifts near sticky CTAs.

---

## 10. App-Like Interaction Philosophy

### 10.1 App-Like Goals

The product should feel like a high-quality food ordering app: fast, touch-first, stateful, animated with restraint, and resilient to interruptions.

### 10.2 Interaction Grammar

- Bottom sheets for temporary mobile tasks.
- Drawers for cart and operational side panels.
- Persistent sticky CTAs.
- Subtle haptic-like visual feedback.
- Smooth route/sheet transitions.
- Clear offline/reconnect indicators.

---

## 11. Conversion-Focused UX Rules

### 11.1 Conversion Rules

- Primary order CTA appears above the fold.
- Product cards show image, name, price, popular badge, and add affordance.
- Combo upgrade is presented before cart, not hidden at checkout.
- Fees and ETA appear before final payment.
- Guest checkout is supported.
- Payment retry preserves state.
- Reorder is prominent for returning customers.

### 11.2 Anti-Conversion Patterns

Avoid surprise fees, late availability failures, forced account creation, unclear modifiers, unresponsive CTAs, and excessive checkout steps.

---

## 12. Cognitive Load Reduction Strategy

### 12.1 Reduction Techniques

- Use clear category grouping.
- Highlight popular/default choices.
- Progressive modifier groups.
- Inline price deltas.
- Step-level checkout summaries.
- Role-specific dashboards.
- Visual status mapping.

### 12.2 Staff Cognitive Load

Operational UX should reduce scanning time with consistent status colors, timers, station grouping, exception highlighting, and one-tap actions.

---

## 13. Visual Hierarchy Rules

### 13.1 Customer Hierarchy

1. Product image/appetite.
2. Product name and core description.
3. Price and value indicator.
4. Availability/ETA.
5. Primary CTA.
6. Secondary details.

### 13.2 Operational Hierarchy

1. Exception or SLA risk.
2. Order/ticket identifier.
3. Status and timer.
4. Next action.
5. Item details.
6. Secondary metadata.

---

## 14. Interaction Feedback Principles

### 14.1 Feedback Requirements

Every user action must produce immediate feedback:

- Pressed/loading states.
- Success confirmation.
- Validation message.
- Pending server confirmation.
- Error and recovery path.

### 14.2 Critical Actions

Payment, refunds, order cancellation, branch pause, staff overrides, and delivery reassignment require explicit confirmation, loading state, canonical completion state, and audit-visible result.

---

## 15. Motion Design Philosophy

### 15.1 Motion Purpose

Motion communicates hierarchy, continuity, state changes, and feedback. It must never hide information, delay checkout, or distract kitchen staff.

### 15.2 Motion Personality

Customer motion can be warm, premium, and appetite-enhancing. Operational motion must be minimal, fast, and functional.

---

## 16. Animation Governance Rules

### 16.1 Rules

- Respect `prefers-reduced-motion`.
- Keep commerce micro-interactions under 280ms.
- Avoid blocking checkout transitions.
- Avoid decorative animations in kitchen dashboards.
- Animate state changes, not critical content disappearance.
- Use transform/opacity over layout-affecting animation.

### 16.2 Motion Tokens

Motion tokens should define duration, easing, entrance, exit, attention, and reduced-motion variants.

---

## 17. Realtime UX Philosophy

### 17.1 Realtime UX Objective

Realtime UX must increase confidence without creating false certainty. Users should understand whether data is live, syncing, stale, or degraded.

### 17.2 Rules

- Show live/sync status on operational dashboards.
- Customer order tracking should feel alive but stable.
- Realtime events update state only when authorized and sequence-safe.
- Missing events trigger canonical refetch.
- Polling fallback is visually communicated only when relevant.

---

## 18. Offline & Reconnect UX

### 18.1 Customer Reconnect UX

- Preserve local browsing state.
- Refetch cart/order state on reconnect.
- Show changed prices/availability before checkout.
- Resume order tracking after canonical sync.

### 18.2 Staff Reconnect UX

- Show offline/stale banner.
- Disable unsafe actions while unsynced.
- Reconcile pending actions after reconnect.
- Highlight conflicts requiring staff decision.

---

## 19. Loading State Strategy

### 19.1 Loading Types

- Skeletons for menu and dashboard cards.
- Inline spinners for buttons.
- Full-page loading only for initial protected route verification.
- Shimmer avoided on kitchen displays if distracting.

### 19.2 Loading Rules

Loading states must preserve layout dimensions to prevent shifts. Critical CTAs show disabled/pending state with text label.

---

## 20. Empty State Strategy

### 20.1 Customer Empty States

- Empty cart: suggest popular items and categories.
- No order history: promote first order.
- No loyalty rewards: show earning path.
- No delivery coverage: offer pickup/nearby branch.

### 20.2 Operational Empty States

- Empty kitchen queue: show branch status and last sync.
- Empty delivery queue: show driver capacity and readiness.
- Empty incident list: show healthy state.

---

## 21. Error State Strategy

### 21.1 Error Classes

- Validation error.
- Network error.
- Authorization error.
- Payment error.
- Realtime sync error.
- Operational conflict.
- Unexpected system error.

### 21.2 Error UX Rules

Errors must explain what happened, what the user can do next, and whether state was saved. Do not expose technical internals, stack traces, or sensitive provider details.

---

## 22. Degraded Mode UX

### 22.1 Degraded States

- Realtime degraded.
- Payment pending/uncertain.
- Branch overloaded.
- Delivery unavailable.
- Menu partially unavailable.
- Dashboard stale.

### 22.2 UX Rules

Degraded mode must be visible, honest, and actionable. Staff dashboards should show safe actions and blocked actions.

---

## 23. Notification UX Strategy

### 23.1 Notification Types

- Transactional status updates.
- Operational alerts.
- Loyalty/reward messages.
- Marketing/promotional messages.
- Support messages.

### 23.2 Notification Rules

- Transactional messages are prioritized.
- Operational alerts are persistent until acknowledged when critical.
- Marketing notifications respect consent.
- Notification surfaces should avoid overload.

---

## 24. Toast & Alert System

### 24.1 Toast Usage

Use toasts for transient, non-blocking feedback: item added, cart updated, reward reserved, sync restored.

### 24.2 Alert Usage

Use alerts/banners for persistent or high-impact states: payment pending, branch closed, realtime degraded, kitchen overload, failed delivery.

### 24.3 Severity Levels

- Info.
- Success.
- Warning.
- Error.
- Critical operational.

---

## 25. Accessibility Architecture

### 25.1 Standard

Target WCAG 2.2 AA for customer surfaces and operational/admin surfaces where feasible, with additional staff environment considerations.

### 25.2 Requirements

- Semantic HTML.
- Keyboard navigation.
- Focus management.
- Screen reader labels.
- Visible focus states.
- Sufficient contrast.
- Reduced motion.
- Touch target compliance.
- Non-color-only status indicators.

---

## 26. Responsive Strategy

### 26.1 Strategy

Design mobile-first, then progressively enhance tablet and desktop. Operational dashboards should support tablet/kitchen display layouts as first-class targets.

### 26.2 Layout Modes

- Mobile customer.
- Tablet customer.
- Desktop customer.
- Kitchen display/tablet.
- Manager desktop.
- Support/admin desktop.

---

## 27. Breakpoint System

### 27.1 Breakpoints

Recommended semantic breakpoints:

- `xs`: compact mobile.
- `sm`: standard mobile.
- `md`: large mobile/tablet.
- `lg`: tablet/desktop.
- `xl`: desktop dashboard.
- `2xl`: operations wall display/large desktop.

### 27.2 Breakpoint Rules

Breakpoints should map to content needs, not arbitrary device names. Critical commerce actions remain reachable across all sizes.

---

## 28. Grid System

### 28.1 Customer Grid

- Single-column mobile.
- Two-column product grid on larger mobile/tablet where comfortable.
- Multi-column desktop with sticky cart summary.

### 28.2 Operational Grid

- Queue columns by status/station on tablet/desktop.
- Dense mode for operations only.
- Large display mode for kitchen screens.

---

## 29. Typography System

### 29.1 Typography Roles

- Display: brand/appetite moments.
- Heading: page and section hierarchy.
- Body: descriptions and forms.
- Label: metadata and controls.
- Mono/tabular: timers, order IDs, operational counters.

### 29.2 Typography Rules

Operational timers and order numbers should use tabular numerals. Customer product descriptions should be readable and concise.

---

## 30. Spacing System

### 30.1 Spacing Scale

Use tokenized spacing scale from compact operational density to premium customer surfaces.

### 30.2 Rules

- Customer surfaces use generous product-card spacing.
- Checkout uses compact but readable spacing.
- Operational surfaces use dense spacing only with strong hierarchy.
- Sticky bottom actions reserve safe-area space.

---

## 31. Color System

### 31.1 Color Token Families

- Brand.
- Surface.
- Text.
- Border.
- Muted.
- Success.
- Warning.
- Danger.
- Info.
- Operational status.
- Promotion/loyalty.

### 31.2 Color Rules

Color must not be the only status indicator. Operational status colors must be consistent across kitchen, delivery, branch, and admin dashboards.

---

## 32. Elevation & Shadow System

### 32.1 Elevation Use

- Low elevation for product cards.
- Medium elevation for sticky cart/checkout actions.
- High elevation for modal/drawer overlays.
- Operational surfaces use elevation sparingly to avoid visual noise.

### 32.2 Shadow Rules

Shadows should support hierarchy, not decoration. High contrast modes should not rely on shadows alone.

---

## 33. Border & Radius System

### 33.1 Radius Tokens

- Small: inputs, badges.
- Medium: cards, list items.
- Large: sheets, featured cards.
- Full: pills and status chips.

### 33.2 Border Rules

Borders should clarify grouping and state. Error/warning borders require accessible text/icon pairing.

---

## 34. Iconography System

### 34.1 Icon Rules

- Icons support text, not replace it for critical actions.
- Operational icons must be instantly recognizable.
- Use consistent stroke/weight.
- Avoid decorative icon overload.

### 34.2 Required Icon Domains

- Commerce.
- Fulfillment.
- Kitchen station.
- Delivery.
- Loyalty.
- Alerts.
- Branch status.
- Payment.

---

## 35. Design Token Strategy

### 35.1 Token Types

- Color tokens.
- Typography tokens.
- Spacing tokens.
- Radius tokens.
- Elevation tokens.
- Motion tokens.
- Breakpoint tokens.
- Z-index tokens.
- Status tokens.
- Brand tokens.

### 35.2 Token Governance

Tokens are versioned, documented, and mapped to TailwindCSS theme configuration. Multi-brand theming should override semantic tokens, not component internals.

---

## 36. Component Architecture

### 36.1 Component Layers

- Primitives: button, input, dialog, sheet.
- Foundation components: badge, card, status chip, price, timer.
- Commerce components: product card, cart line, modifier group, checkout summary.
- Operational components: order ticket, queue column, station task, alert banner.
- Page compositions: menu, checkout, kitchen dashboard, admin analytics.

### 36.2 Component Rules

Components should be typed, accessible, documented, variant-driven, and free of hidden tenant/security assumptions.

---

## 37. Atomic Design Strategy

### 37.1 Layers

- Atoms: tokens and primitives.
- Molecules: reusable UI groups.
- Organisms: domain sections.
- Templates: layout shells.
- Pages: route-level compositions.

### 37.2 Practical Rule

Atomic design is a governance tool, not a rigid file taxonomy. Domain ownership remains clear.

---

## 38. Shared Component Governance

### 38.1 Governance Rules

- Shared components must be generic across domains.
- Domain-specific logic stays in feature modules.
- New variants require design review.
- Accessibility review required for interactive shared components.
- Breaking API changes require migration plan.

---

## 39. Form System Architecture

### 39.1 Form Requirements

- Accessible labels.
- Inline validation.
- Server validation mapping.
- Error summary for long forms.
- Mobile keyboard optimization.
- Auto-complete where safe.
- Loading and retry states.

### 39.2 Form Domains

- Checkout contact.
- Address.
- Profile.
- Admin CRUD.
- Staff incident/correction.
- Support workflows.

---

## 40. Input Validation UX

### 40.1 Validation Rules

- Validate inline after user interaction.
- Do not block typing with aggressive errors.
- Show server validation failures near fields.
- Preserve entered data after failures.
- Highlight required action clearly.

### 40.2 Sensitive Flows

Payment, refunds, role changes, and branch pause controls require clear confirmation and server-authoritative validation.

---

## 41. Realtime Validation UX

### 41.1 Realtime Validation Surfaces

- Cart availability.
- Promo eligibility.
- Loyalty reward reservation.
- Delivery zone/fee.
- Branch capacity.
- Checkout price lock.

### 41.2 UX Rules

When realtime validation changes state, show what changed and what action is required. Do not silently remove items or discounts during checkout.

---

## 42. CTA Architecture

### 42.1 CTA Hierarchy

- Primary: order, add to cart, checkout, pay, accept order.
- Secondary: customize, save, reorder, contact support.
- Tertiary: learn more, details, dismiss.
- Destructive: cancel, refund, pause branch.

### 42.2 CTA Rules

Primary CTA is visually dominant and located in thumb reach on mobile. Destructive CTAs require confirmation and are never visually confused with primary purchase actions.

---

## 43. Card System

### 43.1 Card Types

- Product card.
- Combo card.
- Cart line card.
- Order tracking card.
- Kitchen ticket card.
- Delivery task card.
- Analytics metric card.

### 43.2 Card Rules

Cards expose summary first and details progressively. Operational cards emphasize status, timer, and next action.

---

## 44. Modal & Drawer System

### 44.1 Usage

- Modals for focused decisions and confirmations.
- Drawers for cart, filters, admin side details.
- Avoid stacked modals.
- Use route-backed modals for recoverable deep links where appropriate.

### 44.2 Accessibility

Focus trap, keyboard close, labelled titles, described content, and return focus are mandatory.

---

## 45. Bottom Sheet System

### 45.1 Usage

Bottom sheets are primary mobile interaction surfaces for product detail, modifiers, cart preview, address selection, and quick filters.

### 45.2 Rules

- Support safe-area insets.
- Provide clear drag/close affordance.
- Avoid nesting sheets deeply.
- Keep primary action sticky inside sheet.

---

## 46. Mobile Gesture Strategy

### 46.1 Allowed Gestures

- Swipe category carousel.
- Drag bottom sheet.
- Pull to refresh order tracking or staff queues where appropriate.
- Swipe tabs in dashboards only if discoverable.

### 46.2 Gesture Rules

Gestures must have visible alternatives. Critical actions cannot require gestures only.

---

## 47. Scroll Behavior Strategy

### 47.1 Customer Scroll

- Category tabs can become sticky.
- Product detail preserves scroll position when returning to menu.
- Checkout avoids scroll traps.
- Sticky CTAs do not cover content.

### 47.2 Operational Scroll

- Queue columns preserve scroll during realtime updates.
- New critical orders can alert without jumping unexpectedly.
- Staff can pin or filter high-risk items.

---

## 48. Mobile Sticky Actions

### 48.1 Sticky Actions

- Add to cart.
- View cart.
- Checkout.
- Pay.
- Track order.
- Staff status actions.

### 48.2 Rules

Sticky actions account for safe area, keyboard, reduced viewport, and disabled/pending states.

---

## 49. Progressive Disclosure Strategy

### 49.1 Customer Disclosure

Show essential product and price first; reveal ingredients, nutrition/allergens, customization details, and policies as needed.

### 49.2 Operational Disclosure

Show next action and risk first; reveal details, audit history, and correction actions behind deliberate expansion.

---

## 50. Search UX Architecture

### 50.1 Search Surfaces

- Menu search.
- Order history search.
- Admin product/customer/order search.
- Support lookup.

### 50.2 Rules

Search is scoped by tenant and role. Customer search optimizes for menu items; operational/admin search requires permission and audit where sensitive.

---

## 51. Menu Browsing UX

### 51.1 Menu Requirements

- Category tabs.
- Featured/popular section.
- Product badges.
- Fast add/customize.
- Availability indicators.
- Branch context.
- Search/filter.

### 51.2 Performance Rules

Use optimized images, progressive loading, virtualization where needed, and avoid heavy client hydration for static menu sections.

---

## 52. Product Detail UX

### 52.1 Product Detail Requirements

- Large appetizing image.
- Name and concise description.
- Price and combo upgrade.
- Required modifiers.
- Optional add-ons.
- Quantity.
- Item note where appropriate.
- Sticky add CTA.

### 52.2 Product Detail Rules

Required decisions are explicit. Price changes are visible immediately. Unavailable options are disabled with reason where helpful.

---

## 53. Modifier Selection UX

### 53.1 Modifier UX

- Group modifiers by required/optional.
- Show min/max rules.
- Show price deltas.
- Use defaults where appropriate.
- Prevent invalid over-selection.
- Summarize completed groups.

### 53.2 Error Handling

Missing required modifiers should be highlighted before add-to-cart with focus/scroll to required group.

---

## 54. Combo Builder UX

### 54.1 Combo UX

- Show combo value clearly.
- Break combo into steps or grouped sections.
- Show selected components summary.
- Allow component edit without restarting.
- Show savings/upgrade price transparently.

### 54.2 Combo Rules

Combo builder must validate component availability and modifier requirements in branch context.

---

## 55. Cart UX Architecture

### 55.1 Cart Requirements

- Persistent cart access.
- Editable line items.
- Modifier summaries.
- Promo and loyalty entry points.
- Delivery/pickup summary.
- Price breakdown.
- Upsell shelf.
- Validation warnings.

### 55.2 Cart Rules

Cart can show preview pricing, but checkout explains final validation. Stale cart changes are surfaced clearly.

---

## 56. Checkout UX Architecture

### 56.1 Checkout Principles

- Short, guided, mobile-first.
- Guest-friendly.
- Transparent fees and ETA.
- Inline validation.
- Retry-safe.
- Payment uncertainty-aware.

### 56.2 Checkout Flow

1. Fulfillment and branch/address.
2. Contact/customer identity.
3. Review items, promo, loyalty, fees.
4. Payment.
5. Confirmation/tracking.

---

## 57. Address Selection UX

### 57.1 Address UX

- Saved addresses first for authenticated users.
- Minimal guest address entry.
- Geocoding confirmation for ambiguity.
- Delivery zone feedback before payment.
- Clear pickup alternative if unavailable.

### 57.2 Address Rules

Address changes invalidate delivery fee, ETA, branch selection, and checkout pricing snapshot.

---

## 58. Delivery ETA UX

### 58.1 ETA Display

- Show estimated window, not false precision.
- Indicate confidence when relevant.
- Explain delays when ETA changes materially.
- Separate prep time and delivery time for staff/admin views.

### 58.2 ETA Rules

ETA changes should not be noisy. Customer-facing ETA changes only when meaningful or action-impacting.

---

## 59. Order Tracking UX

### 59.1 Tracking Requirements

- Current status.
- Timeline.
- ETA.
- Order summary.
- Branch/support contact.
- Delivery/pickup details.
- Payment status when relevant.
- Realtime connection state if degraded.

### 59.2 Tracking Rules

Tracking uses canonical fetch on load and realtime updates afterward. Reconnect triggers timeline resync.

---

## 60. Loyalty UX Architecture

### 60.1 Loyalty Requirements

- Points balance.
- Reward availability.
- Tier progress.
- Earn/redeem explanation.
- Reward reservation status.
- Order-linked earning history.

### 60.2 Loyalty Rules

Do not promise points before policy conditions are met. Pending points and reversed points must be understandable.

---

## 61. Promotion UX Rules

### 61.1 Promotion Display

Promotions must show eligibility, expiration, branch/fulfillment constraints, and discount result clearly.

### 61.2 Promotion Safety UX

If a promotion is removed or expires, explain why and show revised total before payment.

---

## 62. Coupon UX Strategy

### 62.1 Coupon UX

- Simple input.
- Apply button with loading state.
- Success message with discount amount.
- Generic failure for invalid/brute-force-sensitive cases.
- Conflict message for stacking rules.

### 62.2 Coupon Rules

Coupon validation is server-side and rate-limited. UI must not reveal sensitive eligibility internals.

---

## 63. Reorder UX Strategy

### 63.1 Reorder UX

- Surface recent/favorite orders.
- Show changed prices/availability.
- Allow substitutions.
- Add to cart rather than duplicate order.
- Preserve personalization where valid.

### 63.2 Reorder Rules

Historical order snapshots are suggestions. Current menu and pricing are authoritative.

---

## 64. Guest User UX

### 64.1 Guest UX Requirements

- Browse and cart without account.
- Checkout with minimal contact fields.
- Order tracking with secure token.
- Optional account creation after purchase.

### 64.2 Guest Boundaries

Guests cannot redeem loyalty until authenticated. Guest tracking does not expose account-level history.

---

## 65. Auth & Session UX

### 65.1 Auth UX

- Avoid forced login before intent.
- Offer login for saved addresses/rewards.
- Provide clear session expired recovery.
- Preserve cart through auth transitions.

### 65.2 Staff Auth UX

Staff session expiration must be obvious and safe. Operational actions require active authorized session.

---

## 66. Profile & Account UX

### 66.1 Account Areas

- Profile.
- Addresses.
- Orders.
- Loyalty.
- Favorites.
- Notifications/consent.
- Help/support.

### 66.2 Account Rules

Account UX should prioritize reorder, address management, and loyalty clarity over generic profile complexity.

---

## 67. Notification Center UX

### 67.1 Notification Center

Notification center groups transactional, loyalty, support, and promotional messages with read/unread and channel consent controls.

### 67.2 Rules

Critical order updates remain visible in order tracking even if notification center is unread.

---

## 68. Operational Dashboard UX

### 68.1 Dashboard Requirements

- Branch selector/scope.
- Live health status.
- Active queues.
- SLA risk.
- Channel status.
- Incidents.
- Staff presence.
- Realtime connection state.

### 68.2 Dashboard Rules

Operational dashboards optimize for action, not reporting detail. Analytics lives in admin dashboards.

---

## 69. Kitchen Dashboard UX

### 69.1 Kitchen UX Requirements

- Large order cards.
- Timers.
- Station grouping.
- Modifier clarity.
- Next action buttons.
- Exception highlighting.
- Minimal typing.
- Touch-first controls.

### 69.2 Kitchen Rules

Dashboard updates must not jump cards unpredictably during staff interaction. Critical new orders alert without destroying context.

---

## 70. Delivery Dashboard UX

### 70.1 Delivery UX Requirements

- Awaiting dispatch queue.
- Assigned queue.
- Out-for-delivery queue.
- Driver status.
- ETA risk.
- Reassignment actions.
- Failure escalation.

### 70.2 Delivery Rules

Driver assignment and reassignment require clear state confirmation and customer ETA update visibility.

---

## 71. Branch Manager Dashboard UX

### 71.1 Manager UX Requirements

- Channel pause/resume.
- Capacity multiplier.
- Incident mode.
- Staff/shift overview.
- Active queue health.
- Delivery capacity.
- Item availability.
- Override audit trail.

### 71.2 Manager Rules

High-impact controls require reason and confirmation. Expiring overrides should be visible.

---

## 72. Support Operator UX

### 72.1 Support UX Requirements

- Scoped search.
- Order timeline.
- Customer communication history.
- Redacted PII by default.
- Issue escalation.
- Refund/correction request workflow.

### 72.2 Support Rules

Support tooling is purpose-bound and audited. UI must make privacy boundaries visible.

---

## 73. Analytics Dashboard UX

### 73.1 Analytics UX

- Funnel metrics.
- Branch performance.
- Menu performance.
- Operational SLA.
- Campaign performance.
- Loyalty metrics.

### 73.2 Analytics Rules

Dashboards show data freshness, filters, and definitions. Analytics lag should be visible.

---

## 74. Operational Alert UX

### 74.1 Alert Types

- Queue saturation.
- SLA breach.
- Realtime degraded.
- Delivery failure.
- Branch incident.
- Payment/order pipeline issue.

### 74.2 Alert Rules

Critical alerts are persistent, acknowledged, and escalated. Warning alerts are visible but non-blocking.

---

## 75. Realtime Queue Visualization

### 75.1 Visualization Requirements

- Queue columns by status/station.
- Timer and SLA risk indicators.
- Priority labels.
- Exception state.
- Last sync timestamp.

### 75.2 Rules

Realtime updates must preserve staff context. Avoid animations that reorder large queue lists without clear cause.

---

## 76. Peak-Hour UX Adaptation

### 76.1 Customer Adaptation

- Longer ETA windows.
- Scheduled slot suggestions.
- Delivery-to-pickup alternatives.
- Branch switch options.
- Clear capacity messaging.

### 76.2 Staff Adaptation

- Rush mode density.
- Exception-first dashboard.
- Reduced animation.
- Larger alert surfaces.
- Fast pause/throttle controls.

---

## 77. Stress-Optimized Staff UX

### 77.1 Stress Rules

- Reduce choices under high load.
- Highlight next action.
- Keep destructive actions separate.
- Support glove/touch usage.
- Avoid small typography.
- Maintain visible connection state.

### 77.2 Recovery UX

Conflict or failed staff action must show clear retry, refresh, or escalation path.

---

## 78. Multi-Branch UX Scaling

### 78.1 Scaling Requirements

- Branch selector.
- Branch health overview.
- Branch-scoped dashboards.
- Cross-branch aggregate views.
- Branch-specific alerts.

### 78.2 Rules

Branch context must be visually persistent to prevent staff/admin actions in the wrong branch.

---

## 79. Multi-Brand UX Compatibility

### 79.1 Compatibility Requirements

- Brand token overrides.
- Brand-specific media.
- Brand-specific menu templates.
- Shared operational components.
- Brand-aware customer routing.

### 79.2 Rules

Components use semantic tokens so brand changes do not require rewriting component internals.

---

## 80. Frontend Folder Structure

### 80.1 Recommended Structure

```text
app/
components/
features/
lib/
server/
styles/
types/
```

### 80.2 Feature Modules

Feature modules should include domain components, hooks, schemas, client state, server actions, and tests where applicable.

---

## 81. Routing Architecture

### 81.1 Route Groups

- `(public)`.
- `(shop)`.
- `(checkout)`.
- `(account)`.
- `(track)`.
- `(staff)`.
- `(admin)`.
- `(support)`.

### 81.2 Routing Rules

Routes are role-aware and tenant-aware. Protected layouts enforce auth and context before rendering sensitive UI.

---

## 82. Layout Architecture

### 82.1 Layout Types

- Customer app shell.
- Checkout shell.
- Tracking shell.
- Staff operations shell.
- Admin management shell.
- Support shell.

### 82.2 Layout Rules

Layouts own navigation, branch context, safe areas, global alerts, and error boundaries for their domain.

---

## 83. Shared Layout Strategy

### 83.1 Shared Layout Components

- Header.
- Bottom nav.
- Sidebar.
- Branch context bar.
- Connection status.
- Global alert region.
- Toast viewport.

### 83.2 Rules

Shared layout components are configurable by role but must not leak unauthorized navigation or data.

---

## 84. Frontend State Management Strategy

### 84.1 State Types

- Server cache state.
- URL state.
- Form state.
- Local UI state.
- Realtime synchronized state.
- Cart state.
- Auth/session state.

### 84.2 State Rules

Canonical business state comes from server. Local state handles interaction and pending UI. Realtime state merges into canonical cache through controlled synchronizers.

---

## 85. Realtime State Synchronization

### 85.1 Synchronization Rules

- Fetch canonical state first.
- Subscribe second.
- Track sequence/version.
- Detect gaps.
- Refetch on reconnect.
- Apply events through domain reducers.
- Show stale indicators when unsynced.

### 85.2 Surfaces

- Cart.
- Order tracking.
- Kitchen dashboard.
- Delivery dashboard.
- Branch dashboard.
- Notifications.

---

## 86. API Client Architecture

### 86.1 API Client Rules

- Typed request/response contracts.
- Domain-specific clients.
- Auth-aware fetch wrappers.
- Correlation IDs.
- Retry only safe/idempotent requests.
- Central error mapping.

### 86.2 Security Rules

Do not expose service role, payment secrets, privileged provider payloads, or unauthorized tenant IDs in client code.

---

## 87. Data Fetching Strategy

### 87.1 Fetching Patterns

- Server fetch for SEO/static menu content.
- Client fetch for interactive cart/checkout and dashboards.
- Streaming/Suspense for route sections.
- Revalidation after mutations.
- Polling fallback for realtime surfaces.

### 87.2 Fetching Rules

Data fetches are scoped by role, tenant, branch, and resource ownership. Avoid overfetching sensitive data.

---

## 88. Cache Strategy

### 88.1 Cache Domains

- Menu content.
- Product media.
- Branch status.
- Cart.
- Checkout validation.
- Order tracking.
- Dashboard projections.

### 88.2 Cache Rules

Menu can be cached with invalidation. Cart/checkout/order state must revalidate on mutation, reconnect, and critical realtime events.

---

## 89. Optimistic UI Rules

### 89.1 Allowed Optimism

- Add/remove cart item before checkout.
- Quantity edits with rollback.
- UI filters/tabs.
- Non-critical preferences.

### 89.2 Disallowed Optimism

- Payment approval.
- Order acceptance.
- Kitchen ready.
- Refund completion.
- Loyalty points awarded.
- Branch pause/resume.

---

## 90. Frontend Event Handling

### 90.1 Event Types

- UX analytics events.
- Commerce intent events.
- Realtime domain events.
- UI state events.
- Error events.

### 90.2 Rules

Frontend events should not become backend facts without server validation. Analytics events use safe identifiers and avoid unnecessary PII.

---

## 91. Error Boundary Strategy

### 91.1 Boundary Placement

- Root app boundary.
- Customer shell boundary.
- Checkout boundary.
- Order tracking boundary.
- Staff dashboard boundary.
- Admin/support boundary.
- Component-level boundaries for risky widgets.

### 91.2 Recovery UX

Error boundaries provide retry, refresh, support link, and preserved context where possible.

---

## 92. Frontend Security Boundaries

### 92.1 Security Rules

- Client UI is not authorization.
- Routes and data fetches enforce auth server-side.
- Sensitive components do not receive unnecessary data.
- Tenant and branch context are validated server-side.
- Admin/staff bundles avoid leaking unrelated customer details.

### 92.2 XSS/Injection UX

User-generated notes and names are escaped. Rich text is avoided or sanitized. File previews are constrained.

---

## 93. Frontend Observability

### 93.1 Signals

- Web vitals.
- Route transition latency.
- Hydration errors.
- Client exceptions.
- Realtime reconnect rate.
- Dashboard stale duration.
- Checkout step latency.
- Payment redirect/pending duration.

### 93.2 Rules

Observability data is correlated with session/order/branch where safe and redacted for PII.

---

## 94. UX Analytics Instrumentation

### 94.1 UX Events

- Product viewed.
- Modifier completed.
- Add to cart.
- Cart opened.
- Checkout step completed.
- Error encountered.
- Reconnect occurred.
- Alert acknowledged.

### 94.2 Rules

Events should capture context needed for product improvement without exposing sensitive data.

---

## 95. CRO Instrumentation

### 95.1 CRO Metrics

- Hero CTA click-through.
- Product detail open rate.
- Add-to-cart rate.
- Combo upgrade rate.
- Cart-to-checkout rate.
- Checkout completion.
- Payment retry recovery.
- Reorder conversion.

### 95.2 Experiment Rules

Experiments must preserve financial correctness, accessibility, and operational safety.

---

## 96. Frontend Performance Strategy

### 96.1 Performance Goals

- Fast LCP on customer entry pages.
- Low INP for menu/cart interactions.
- Stable CLS with sticky CTAs.
- Efficient dashboard rendering under realtime updates.

### 96.2 Strategy

- Server render initial content.
- Split bundles by route group.
- Lazy-load heavy dashboard widgets.
- Optimize images.
- Use virtualization for large queues/lists.
- Avoid unnecessary client hydration.

---

## 97. Lighthouse Optimization Strategy

### 97.1 Optimization Areas

- Image sizing and formats.
- Font loading.
- Critical CSS.
- Server rendering.
- Script budgets.
- Accessibility checks.
- Metadata and SEO.

### 97.2 Rules

Customer marketing/menu pages target high Lighthouse scores. Operational dashboards prioritize functional performance and accessibility over SEO.

---

## 98. Mobile Performance Optimization

### 98.1 Mobile Optimizations

- Minimize JavaScript on menu landing.
- Preload key product imagery carefully.
- Use responsive images.
- Avoid heavy animations.
- Defer non-critical analytics.
- Cache menu data appropriately.
- Keep cart interactions lightweight.

### 98.2 Low-End Device Rules

Test on throttled CPU/network. Avoid expensive filters, layout thrashing, and huge DOM lists.

---

## 99. Frontend QA Strategy

### 99.1 QA Categories

- Responsive layout tests.
- Accessibility tests.
- Realtime reconnect tests.
- Checkout flow tests.
- Payment recovery UX tests.
- Cart multi-tab tests.
- Staff dashboard tests.
- Keyboard navigation tests.
- Reduced motion tests.
- Cross-browser tests.
- Low-end mobile performance tests.

### 99.2 Critical Tests

- Customer can complete mobile guest checkout.
- Cart survives login and reconnect.
- Payment failure returns retry path.
- Order tracking resyncs after missed events.
- Kitchen dashboard does not leak branch data.
- Staff action conflict shows recovery path.
- Reduced motion disables nonessential animation.

---

## 100. Design System Governance Checklist

### 100.1 Tokens

- [ ] Semantic color tokens defined.
- [ ] Typography scale defined.
- [ ] Spacing/radius/elevation tokens defined.
- [ ] Motion tokens and reduced-motion variants defined.
- [ ] Responsive tokens defined.
- [ ] Multi-brand token override strategy defined.

### 100.2 Components

- [ ] Shared primitives documented.
- [ ] Commerce components documented.
- [ ] Operational components documented.
- [ ] Accessibility requirements documented per component.
- [ ] Variants and usage rules defined.
- [ ] Deprecated patterns documented.

### 100.3 Frontend Architecture

- [ ] Route groups established.
- [ ] Layout boundaries established.
- [ ] Server/client boundaries documented.
- [ ] Realtime synchronization patterns implemented.
- [ ] Error boundaries and Suspense boundaries defined.
- [ ] API client contracts typed.

### 100.4 UX Quality Gates

- [ ] Mobile checkout usability tested.
- [ ] Kitchen dashboard stress tested.
- [ ] Realtime reconnect UX tested.
- [ ] Accessibility audit passed.
- [ ] Performance budgets defined and monitored.
- [ ] CRO instrumentation implemented.

This checklist is a launch gate. Production frontend release should be blocked if mobile checkout, realtime resync UX, accessibility, branch-scoped operational dashboards, payment recovery UX, or performance budgets are incomplete.
