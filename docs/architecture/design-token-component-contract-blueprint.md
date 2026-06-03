# J Burguer — Definitive Design Token Architecture and Component Contract Blueprint

> **Language policy:** Business language is Spanish and technical language remains English, aligned with the approved architecture corpus.

> **Implementation status:** This is the canonical implementation contract layer for the approved design system and component ecosystem. It defines token governance, token architecture, token families, component contract structure, family-level component contracts, accessibility, telemetry, audit, state coverage, and implementation governance. It does **not** generate code, Tailwind configuration, CSS, React components, or Figma screens.

## 0. Contract scope assertion

The approved Component Inventory & UI Build Blueprint is final. This document must not introduce new components except through explicit governance exception language. It defines how approved components must consume tokens, expose contracts, preserve accessibility, emit telemetry, enforce audit obligations, and remain visually and behaviorally consistent across Customer, Administration, Kitchen, Delivery, Support, Franchise, and Analytics platforms.

### 0.1 Non-negotiable contract rules

| Rule | Contract requirement |
| --- | --- |
| No visual drift | Components consume semantic/component tokens only; raw color, spacing, typography, shadow, z-index, or motion values are forbidden in product code. |
| No accessibility drift | Every component contract includes keyboard, focus, screen reader, reduced motion, contrast, and error recovery obligations. |
| No responsive drift | Responsive behavior is governed by breakpoint, container, spacing, typography, touch target, and navigation tokens. |
| No duplicate contracts | A new UI need must map to an approved component contract or trigger governance exception review. |
| No permission leakage | Component contracts define permissions and forbidden dependencies but do not replace authorization policy. |
| No provider leakage | Provider-specific states, such as Mercado Pago, maps, WhatsApp, email, or Supabase, must enter components through typed adapters and semantic states. |

## 1. Design token governance

| Governance area | Canonical rule |
| --- | --- |
| Token ownership | Global and semantic tokens are owned by Design System + Brand. Component tokens are co-owned by Design System and Frontend Platform. Operational/analytics/support tokens are co-owned by their domain owners and Accessibility. Multi-brand/white-label tokens are owned by Brand Governance and Franchise Platform. |
| Token lifecycle | Proposed → Accessibility reviewed → Brand reviewed → Platform reviewed → Approved → Published → Adopted → Monitored → Deprecated → Retired. |
| Token versioning | Token packages use semantic versioning. Additive tokens are minor changes; value changes that alter contrast, layout, or interaction are major unless proven non-breaking. Deprecated aliases require migration windows. |
| Token approval workflow | Token proposal must include purpose, category, expected consumers, fallback, contrast evidence for color tokens, responsive impact for size/spacing tokens, and migration plan if replacing an existing token. |
| Token deprecation workflow | Deprecation requires replacement token, affected component list, affected screen list, sunset version, codemod/search guidance, and QA sign-off after migration. |
| Token review requirements | Review must validate semantic fit, no duplicate token, accessibility, dark/light behavior, multi-brand safety, responsive behavior, and operational readability. |
| Token documentation requirements | Every token documents name, type, purpose, level, value source, light/dark behavior, allowed consumers, fallback, owner, status, and examples. |
| Forbidden token patterns | Raw hex/rgb/hsl in components, arbitrary spacing, component-specific hardcoded colors, role-specific colors outside semantic tokens, token names tied to one campaign, dark-mode-only token without light fallback, inaccessible contrast pairs, shadow tokens used as borders, z-index magic numbers, motion duration literals, white-label overrides that bypass semantic tokens. |

## 2. Token architecture

### 2.1 Token hierarchy

| Token layer | Purpose | Examples | Consumers |
| --- | --- | --- | --- |
| Global Tokens | Primitive design values independent of meaning. | `color.red.600`, `space.4`, `font.size.16`, `radius.md`. | Token build pipeline only; not product components directly. |
| Semantic Tokens | Product meaning mapped to global values. | `color.background.default`, `color.text.primary`, `space.form.gap`. | Most shared and domain components. |
| Component Tokens | Component-specific semantic mappings. | `button.primary.bg`, `card.padding`, `table.row.height`. | Specific component implementations only. |
| Operational Tokens | High-legibility operations states. | `ops.kitchen.priority.bg`, `ops.delay.critical.text`. | Kitchen, delivery, support, incident components. |
| Analytics Tokens | Chart and data visualization palettes. | `chart.series.1`, `chart.positive`, `chart.warning`. | Analytics components only. |
| Brand Tokens | Brand identity mappings. | `brand.primary`, `brand.accent`, `brand.logo.safeArea`. | Customer and brand surfaces through semantic aliases. |
| Multi-Brand Tokens | Organization/franchise theming layer. | `brand.current.primary`, `brand.current.surface`. | Franchise and white-label shells. |
| White Label Tokens | Tenant-specific approved overrides. | `tenant.brand.primary`, `tenant.radius.profile`. | Scoped runtime theme provider after governance approval. |

### 2.2 Inheritance, overrides, and fallback

| Topic | Rule |
| --- | --- |
| Inheritance | Global tokens feed semantic tokens; semantic tokens feed component tokens; domain tokens may alias semantic tokens but cannot bypass them unless an operational/analytics contrast requirement is approved. |
| Override order | Global defaults → brand defaults → organization/franchise theme → tenant white-label override → component state token. Component state tokens win only within the owning component. |
| Fallback strategy | Missing tenant token falls back to multi-brand token, then brand token, then semantic token, then global token. Missing critical accessibility token blocks release. |
| Dark/light mode | Mode-specific semantic tokens must exist for all interactive, text, surface, border, focus, and status families. Component tokens inherit mode behavior. |
| Operational override | Kitchen/delivery/support critical states may override brand expression for legibility, SLA urgency, and safety. |
| Analytics override | Chart tokens prioritize distinguishability, color-blind safety, and print/export clarity over brand saturation. |

## 3. Color tokens

| Family | Token intent | Light mode behavior | Dark mode behavior | Contrast requirement |
| --- | --- | --- | --- | --- |
| background | App/page background. | Neutral warm base with brand-compatible customer surfaces. | Dark neutral base with preserved content hierarchy. | Text on background ≥ WCAG AA; large dashboards target AAA where feasible. |
| surface | Cards, panels, sheets, tables. | Layered neutrals with subtle contrast. | Elevated dark surfaces separated by border/elevation. | Surface/text pairs ≥ 4.5:1. |
| elevation | Visual depth overlays. | Soft shadow/tint tokens. | Shadow plus subtle light border/tint. | Must not be sole boundary indicator. |
| border | Separators, outlines, dividers. | Low/medium/high emphasis. | Higher luminance contrast than light mode. | Interactive borders distinguishable from disabled. |
| text | Primary, secondary, muted, inverse, disabled. | Primary high contrast; muted still readable. | Primary not pure white unless required. | Body text ≥ 4.5:1; disabled can be lower but still identifiable. |
| icon | Icons aligned to text/status. | Inherits text/status semantics. | Inherits dark status semantics. | Icon-only controls require label and focus token. |
| interactive | Action colors and states. | Brand primary with hover/active/disabled. | Adjusted saturation/luminance for contrast. | Button text/icon ≥ 4.5:1; focus visible ≥ 3:1 against adjacent. |
| focus | Focus ring and focus background. | Highly visible brand/utility ring. | High-luminance ring with offset. | Focus indicator ≥ 3:1 and not color-only. |
| success | Completed/positive states. | Green semantic palette. | Green adjusted for dark contrast. | Status text/background ≥ 4.5:1. |
| warning | Attention/recoverable risk. | Amber/orange semantic palette. | Amber adjusted to avoid low contrast. | Must include icon/text, not color-only. |
| error | Error/destructive/failure states. | Red semantic palette. | Red adjusted for dark mode readability. | Error text/background ≥ 4.5:1. |
| info | Informational/neutral guidance. | Blue/cyan semantic palette. | Blue adjusted for dark contrast. | Same as status tokens. |
| kitchen | Cocina operational states. | Priority, delayed, ready, paused, saturated. | High-contrast equivalents. | Operational displays target ≥ 7:1 for critical labels. |
| delivery | Dispatch/route states. | Assigned, en camino, delayed, failed. | High-contrast equivalents. | Map/list labels readable in glare. |
| admin | Governance/management emphasis. | Neutral with risk highlights. | Neutral dark with risk highlights. | Data/action clarity ≥ AA. |
| analytics | Chart series and deltas. | Color-blind-safe categorical/sequential/diverging palettes. | Dark-safe chart palettes. | Charts must not rely on color alone; patterns/labels required. |
| support | Case severity/access/security states. | Severity and PII/access warnings. | High-contrast warnings. | Sensitive warnings target ≥ 7:1 where possible. |

## 4. Typography tokens

| Token family | Contract |
| --- | --- |
| Font families | `font.family.brand` for expressive customer headings, `font.family.sans` for UI, `font.family.mono` for logs/audit IDs. Fallback stacks must preserve legibility and metrics. |
| Font sizes | Scale from compact labels through display headings using semantic aliases: caption, body, body-lg, title, heading, display, dashboard-kpi, operations-ticket. |
| Font weights | Regular, medium, semibold, bold. Operational critical values may use semibold/bold; avoid weight-only status meaning. |
| Line heights | Compact for badges/tables, normal for body, relaxed for long-form support/admin content, tight for headings only. |
| Letter spacing | Slight tightening for display, normal for body, optional wide for compact uppercase labels; never reduce readability in operations. |
| Heading scale | Customer headings may be more expressive; admin/support/ops headings prioritize information density. |
| Body scale | Body defaults must support mobile reading, forms, tables, and support notes. Minimum body text avoids sub-14px equivalents. |
| Dashboard scale | KPI values require large numeric tokens with stable tabular alignment. |
| Operational scale | Ticket/order numbers, timers, and status must be readable at distance/tablet environments. |
| Responsive typography | Scale changes by breakpoint/container, not arbitrary component overrides. Line length targets readable measure on desktop. |

## 5. Spacing tokens

| Token family | Contract |
| --- | --- |
| Spacing scale | Use a predictable 4px-derived scale with semantic aliases for xs, sm, md, lg, xl, 2xl, 3xl. |
| Layout spacing | Page gutters, shell padding, and content max widths are tokenized by breakpoint. |
| Section spacing | Section top/bottom gaps vary by customer, admin, ops, and analytics density modes. |
| Card spacing | Card padding tokens include compact, default, comfortable, operational. |
| Form spacing | Field gap, group gap, helper/error spacing, and action row spacing are semantic tokens. |
| Dashboard spacing | KPI grid gap, chart panel gap, filter spacing, and table/chart separation are tokenized. |
| Mobile spacing | Mobile gutters, sticky action clearance, bottom navigation safe area, sheet padding, and keyboard offset are tokenized. |
| Operational spacing | Kitchen/delivery queue density tokens support compact, default, and high-visibility modes. |

## 6. Elevation tokens

| Elevation family | Contract |
| --- | --- |
| Surface levels | `surface.0` page, `surface.1` card, `surface.2` raised panel, `surface.3` overlay panel, `surface.inverse` for high contrast. |
| Shadow levels | `shadow.none`, `shadow.sm`, `shadow.md`, `shadow.lg`, `shadow.xl`; use semantic component tokens instead of raw shadow choice. |
| Modal levels | Modal overlay and content sit above drawer/sheet and below emergency system overlay. |
| Drawer levels | Drawer uses elevated overlay with focus trap when modal-like; navigation drawer may be non-modal desktop. |
| Overlay levels | Tooltip/popover/sheet/modal/toast/emergency layers use a documented stacking order. |
| z-index strategy | Use named z-index tokens only: base, sticky, dropdown, popover, sheet, drawer, modal, toast, emergency. Magic numbers are forbidden. |

## 7. Motion tokens

| Motion area | Contract |
| --- | --- |
| Duration tokens | instant, fast, base, slow, slower. Operational critical updates use instant/fast and never block task completion. |
| Easing tokens | standard, emphasized, decelerate, accelerate, linear for timers/progress. |
| Transition categories | micro feedback, overlay entry/exit, page transition, realtime update, chart update. |
| Page transitions | Customer may use restrained transitions; admin/ops/support should minimize animation. |
| Microinteractions | Button press, add-to-cart, favorite, reward progress, status update must be short and non-blocking. |
| Realtime updates | Highlight changed queue rows/tickets briefly; do not reorder without preserving focus/context. |
| Reduced motion behavior | Motion tokens resolve to near-instant opacity/state changes; parallax, auto-scroll, and nonessential movement disabled. |

## 8. Responsive tokens

| Responsive area | Contract |
| --- | --- |
| Breakpoints | Define mobile, large mobile, tablet, laptop, desktop, wide. Components respond to containers when possible and viewport only for shell/navigation. |
| Container widths | Customer reading/product containers, admin full-width workspaces, support split panes, analytics dashboards, and ops boards have separate max-width tokens. |
| Grid behavior | Product grids, dashboard grids, chart grids, and queue boards use tokenized min/max columns and gaps. |
| Touch targets | Interactive touch target minimum is 44×44 CSS px; operational critical actions should be larger where space permits. |
| Responsive spacing | Gutters and component gaps scale by breakpoint and density mode. |
| Responsive typography | Typography tokens may step up on tablet/desktop and remain legible on kitchen/delivery tablets. |
| Responsive navigation | Customer uses BottomNavigation on mobile; admin/support/franchise/analytics use drawer/sidebar; operations use tablet-first boards with compact fallbacks. |

## 9. Component contract model

Every approved component contract must use this structure:

| Contract field | Required definition |
| --- | --- |
| Purpose | Business/UI reason the component exists. |
| Owner | Design System, Frontend Platform, or domain co-owner. |
| Category | Component taxonomy category from the Component Inventory. |
| Inputs | Typed data/config expected by the component. |
| Outputs | Events/callbacks emitted by the component. |
| Variants | Approved visual/behavioral variants. |
| Slots | Replaceable content regions, if any. |
| States | default, loading, success, error, empty, offline, forbidden, disabled, stale, maintenance where applicable. |
| Permissions | Required permission gates for actions or sensitive displays. |
| Accessibility Contract | Keyboard, focus, label, announcement, contrast, reduced motion obligations. |
| Responsive Contract | Mobile/tablet/desktop behavior and density rules. |
| Dependencies | Allowed token, shared, domain, provider-adapter, and telemetry dependencies. |
| Forbidden Dependencies | Raw data providers, unauthorized services, raw tokens, hidden role logic. |
| Telemetry Requirements | View, interaction, conversion, error, or operational events. |
| Audit Requirements | Security/compliance logging, approvals, review workflows if applicable. |

## 10. Foundation component contracts

| Component | Contract |
| --- | --- |
| Button | Purpose: trigger actions. Owner: Design System. Category: Foundation. Inputs: label, variant, size, disabled/loading state, action type. Outputs: activate. Variants: primary, secondary, tertiary, destructive, ghost, link. Slots: leading/trailing icon. States: all except empty/offline unless parent controls. Permissions: parent-gated. Accessibility: native semantics, visible focus, loading label. Responsive: min touch target. Dependencies: semantic interactive tokens. Forbidden: navigation without link semantics, raw colors. Telemetry: parent action. Audit: parent action. |
| Input | Purpose: single-line text entry. Owner: Design System. Inputs: value, label, helper, error, autocomplete. Outputs: change, blur, submit intent. Variants: text, email, phone, password, search, numeric. Slots: prefix/suffix. States: default/loading/error/disabled. Permissions: parent. Accessibility: label and error association. Responsive: full-width mobile. Dependencies: form tokens. Forbidden: hidden unlabeled input. Telemetry: validation errors by parent. Audit: none. |
| Textarea | Purpose: multi-line entry. Owner: Design System. Inputs: value, label, max length. Outputs: change/blur. Variants: fixed/resizable/counter. Slots: helper/error. States: default/error/disabled. Permissions: parent. Accessibility: described-by and counter announcement. Responsive: grows vertically. Dependencies: form tokens. Forbidden: autosize that traps scroll. Telemetry: parent validation. Audit: support/admin parent if sensitive. |
| Select | Purpose: choose finite options. Owner: Design System. Inputs: options, selected, label, loading. Outputs: select/clear. Variants: single, multi, searchable, async. Slots: option rendering. States: loading/empty/error/disabled. Permissions: options filtered upstream. Accessibility: keyboard listbox/combobox behavior. Responsive: sheet on mobile when long. Dependencies: popover/sheet tokens. Forbidden: permission-hidden options leaking. Telemetry: filter/action parent. Audit: parent. |
| Checkbox | Purpose: independent boolean or batch selection. Owner: Design System. Inputs: checked, label, indeterminate. Outputs: toggle. Variants: default, card, table-row. Slots: helper. States: default/error/disabled. Permissions: parent. Accessibility: native checked/indeterminate semantics. Responsive: 44px target. Dependencies: form tokens. Forbidden: required consent without explicit label. Telemetry: parent. Audit: consent parent if needed. |
| Radio | Purpose: mutually exclusive selection. Owner: Design System. Inputs: group, selected, options. Outputs: select. Variants: default, card, segmented. Slots: option helper. States: default/error/disabled. Permissions: parent. Accessibility: group label, arrow navigation. Responsive: stacked mobile. Dependencies: form tokens. Forbidden: multi-select behavior. Telemetry: parent. Audit: none. |
| Switch | Purpose: persistent preference toggle. Owner: Design System. Inputs: on/off, label. Outputs: toggle. Variants: default, compact. Slots: helper. States: loading/disabled/error. Permissions: parent. Accessibility: role switch with state. Responsive: touch target. Dependencies: interactive tokens. Forbidden: destructive ops modes without confirmation. Telemetry: preference/settings change. Audit: admin settings parent. |
| Tabs | Purpose: switch peer panels. Owner: Design System. Inputs: tabs, active tab. Outputs: tab change. Variants: line, pill, contained, scrollable. Slots: tab panel. States: loading/disabled. Permissions: tabs filtered upstream. Accessibility: tablist semantics. Responsive: scrollable or dropdown when overflow. Dependencies: navigation tokens. Forbidden: sequential checkout steps. Telemetry: tab view. Audit: none. |
| Accordion | Purpose: progressive disclosure. Owner: Design System. Inputs: items, expanded state. Outputs: expand/collapse. Variants: single, multiple, compact. Slots: header/body. States: default/disabled. Permissions: content upstream. Accessibility: button headings and aria-expanded. Responsive: mobile-friendly. Dependencies: layout tokens. Forbidden: hiding required errors/primary CTA. Telemetry: optional disclosure. Audit: none. |
| Badge | Purpose: compact status/label. Owner: Design System. Inputs: label, tone. Outputs: none. Variants: neutral, success, warning, danger, info, brand. Slots: icon. States: static/updating. Permissions: parent. Accessibility: text not color-only. Responsive: wraps/truncates safely. Dependencies: status tokens. Forbidden: status conveyed by color only. Telemetry: none. Audit: none. |
| Tooltip | Purpose: supplemental explanation. Owner: Design System. Inputs: trigger, content. Outputs: open/close. Variants: text/rich. Slots: content. States: open/closed/disabled. Permissions: no sensitive hidden content. Accessibility: focus/hover, escape close. Responsive: use Popover/Sheet for touch-rich content. Dependencies: overlay tokens. Forbidden: required instructions only in tooltip. Telemetry: none. Audit: none. |
| Popover | Purpose: lightweight contextual panel. Owner: Design System. Inputs: trigger, placement. Outputs: open/close/select. Variants: menu/info/picker. Slots: content. States: open/loading/empty. Permissions: actions filtered upstream. Accessibility: focus management. Responsive: may become Sheet. Dependencies: overlay tokens. Forbidden: blocking workflows. Telemetry: action parent. Audit: parent. |
| Modal | Purpose: blocking workflow/decision. Owner: Design System/Layout. Inputs: open, title, description, actions. Outputs: confirm/cancel/close. Variants: default, destructive, approval. Slots: body/footer. States: loading/error/disabled. Permissions: parent-gated. Accessibility: focus trap, escape, labelled dialog. Responsive: full-screen mobile for long tasks. Dependencies: overlay/elevation tokens. Forbidden: modal stacks. Telemetry: modal view/action. Audit: approval/destructive parent. |
| Drawer | Purpose: off-canvas navigation/context. Owner: Design System/Layout. Inputs: open, side, content. Outputs: close/select. Variants: navigation, contextual. Slots: header/body/footer. States: default/loading. Permissions: nav filtered upstream. Accessibility: focus trap when modal. Responsive: replaces sidebar on mobile. Dependencies: overlay tokens. Forbidden: critical confirmations. Telemetry: nav open/select. Audit: none. |
| Skeleton | Purpose: loading placeholder. Owner: Design System. Inputs: shape/count. Outputs: none. Variants: text/card/table/chart. Slots: none. States: loading only. Permissions: none. Accessibility: aria-busy parent. Responsive: mirrors layout. Dependencies: surface tokens. Forbidden: indefinite loading without timeout. Telemetry: none. Audit: none. |
| Spinner | Purpose: indeterminate progress. Owner: Design System. Inputs: label/size. Outputs: none. Variants: inline/button/page. Slots: none. States: active. Permissions: none. Accessibility: label when meaningful. Responsive: inline safe. Dependencies: motion tokens. Forbidden: replacing known skeleton layout. Telemetry: none. Audit: none. |
| Progress | Purpose: determinate/step progress. Owner: Design System. Inputs: value, max, label. Outputs: none. Variants: linear/circular/step. Slots: label. States: active/complete/error. Permissions: none. Accessibility: progressbar semantics. Responsive: compact mobile. Dependencies: motion/status tokens. Forbidden: fake progress for irreversible tasks. Telemetry: parent. Audit: none. |

## 11. Commerce component contracts

| Component | Contract |
| --- | --- |
| ProductCard | Purpose: product discovery/add entry. Owner: Commerce. Inputs: product, price, availability, badges. Outputs: open, quick add, favorite. Variants: grid/list/compact. Slots: media/badge/action. States: loading, available, sold-out, stale, error. Permissions: public view; favorite requires cliente. Accessibility: full product name/price/status. Responsive: grid/card adapts. Dependencies: product/pricing read models. Forbidden: checkout/payment logic. Telemetry: product_view/add_intent. Audit: none. |
| FeaturedProductCard | Purpose: campaign/product emphasis. Owner: Commerce/Marketing. Inputs: product, campaign. Outputs: open/add. Variants: hero/rail. Slots: promo badge. States: loading, active, expired, unavailable. Permissions: public. Accessibility: no image-only name. Responsive: rail mobile, larger desktop. Dependencies: products/promos. Forbidden: hardcoded campaign colors. Telemetry: featured_product_view. Audit: none. |
| ModifierSelector | Purpose: valid product customization. Owner: Commerce. Inputs: groups, constraints, selections. Outputs: selection, validation. Variants: required/optional/multi. Slots: option helper. States: incomplete, valid, invalid, disabled, price-updating. Permissions: public. Accessibility: group labels/errors. Responsive: sheet/mobile. Dependencies: product/pricing contracts. Forbidden: hidden price changes. Telemetry: modifier_select/error. Audit: none. |
| ComboBuilder | Purpose: bundle configuration. Owner: Commerce. Inputs: bundle rules, selected items. Outputs: configured combo/errors. Variants: fixed/flexible. Slots: item picker. States: incomplete/valid/invalid/unavailable. Permissions: public. Accessibility: progress and required steps announced. Responsive: stepper mobile. Dependencies: products/pricing/promos. Forbidden: nonrecoverable invalid combo. Telemetry: combo_start/complete. Audit: none. |
| RecommendationCarousel | Purpose: contextual upsell/discovery. Owner: Commerce. Inputs: products, reason, context. Outputs: open/add/dismiss. Variants: horizontal/grid fallback. Slots: card. States: loading/empty/personalized/fallback. Permissions: public with personalized data gated. Accessibility: carousel controls labelled. Responsive: horizontal mobile. Dependencies: recommendations/products. Forbidden: auto-advancing required content. Telemetry: recommendation_view/click. Audit: none. |
| FavoriteToggle | Purpose: save/remove favorite. Owner: Commerce/Customer. Inputs: product id, favorite state. Outputs: toggle/login-needed. Variants: icon/text. Slots: none. States: on/off/loading/error/unauthenticated. Permissions: cliente:self. Accessibility: pressed state and label. Responsive: touch target. Dependencies: favorites contract. Forbidden: silent failure. Telemetry: favorite_add/remove. Audit: none. |
| ProductSearch | Purpose: product/category/promo search. Owner: Commerce. Inputs: query, filters, results. Outputs: query change, select result, clear. Variants: inline/global. Slots: result row. States: empty/loading/results/no-results/offline. Permissions: public; history scoped. Accessibility: combobox/search semantics. Responsive: full-screen mobile optional. Dependencies: search/products. Forbidden: leaking private order results. Telemetry: search_query/result_click. Audit: none. |
| AvailabilityIndicator | Purpose: display availability/freshness. Owner: Commerce/Operations. Inputs: availability, branch, freshness. Outputs: none. Variants: inline/badge/banner. Slots: explanation. States: available/low/sold-out/closed/stale. Permissions: public. Accessibility: text plus icon, not color-only. Responsive: compact label mobile. Dependencies: availability read model. Forbidden: stale data without stale indicator. Telemetry: unavailable_view. Audit: none. |

## 12. Checkout component contracts

| Component | Contract |
| --- | --- |
| CheckoutStepper | Purpose: checkout orientation. Owner: Checkout. Inputs: steps/current/errors. Outputs: step select where allowed. Variants: compact/full. Slots: step label. States: current/complete/error/disabled. Permissions: public/cliente. Accessibility: ordered progress. Responsive: compact mobile. Dependencies: checkout state. Forbidden: implying forced account. Telemetry: checkout_step_view. Audit: none. |
| AddressSelector | Purpose: choose saved/guest address. Owner: Checkout/Customer. Inputs: addresses, selected, coverage. Outputs: select/add/edit. Variants: list/card. Slots: address actions. States: empty/loading/selected/out-of-zone/error. Permissions: cliente:self for saved. Accessibility: radio/list semantics. Responsive: sheet mobile. Dependencies: addresses/coverage. Forbidden: exposing other users' addresses. Telemetry: address_select. Audit: none. |
| AddressEditor | Purpose: edit delivery address. Owner: Checkout/Customer. Inputs: address fields, map/geocode. Outputs: save/validate/cancel. Variants: guest/account. Slots: map/manual fields. States: empty/valid/invalid/geocoding/out-of-zone. Permissions: public guest or cliente:self. Accessibility: field labels/error summary. Responsive: stacked mobile. Dependencies: geocoding adapter. Forbidden: map-only entry. Telemetry: address_validation_error. Audit: profile address change if account. |
| CoverageChecker | Purpose: validate delivery coverage. Owner: Checkout/Operations. Inputs: address, branch, service mode. Outputs: covered/not-covered/retry. Variants: inline/banner. Slots: recovery CTA. States: checking/covered/not-covered/provider-error. Permissions: public. Accessibility: result announced. Responsive: inline in checkout. Dependencies: branch/geocoding. Forbidden: blocking pickup recovery. Telemetry: coverage_check. Audit: none. |
| PaymentMethodSelector | Purpose: choose payment method. Owner: Checkout/Payments. Inputs: methods, provider health, selected. Outputs: select. Variants: list/card. Slots: provider status. States: loading/available/unavailable/selected/error. Permissions: pedido:create. Accessibility: radio semantics. Responsive: stacked mobile. Dependencies: payment adapter health. Forbidden: provider secrets. Telemetry: payment_method_select. Audit: none. |
| OrderReview | Purpose: final pre-payment review. Owner: Checkout. Inputs: cart, totals, address, contact. Outputs: edit/accept changes. Variants: compact/full. Slots: sections. States: valid/stale/price-changed/unavailable/error. Permissions: pedido:create. Accessibility: changed values announced. Responsive: accordion mobile. Dependencies: cart/pricing. Forbidden: hidden fees. Telemetry: order_review_view/change_accept. Audit: none. |
| CheckoutSummary | Purpose: total and submit context. Owner: Checkout. Inputs: totals, validation status, submit state. Outputs: submit. Variants: sticky/sidebar. Slots: trust/help. States: loading/valid/invalid/submitting/error. Permissions: pedido:create. Accessibility: disabled reason exposed. Responsive: sticky bottom mobile. Dependencies: checkout/pricing. Forbidden: duplicate submit. Telemetry: checkout_submit. Audit: none. |
| PaymentStatus | Purpose: pending/approved/rejected recovery. Owner: Payments. Inputs: payment/order status, provider reason. Outputs: retry/track/support. Variants: pending/success/error. Slots: support/retry. States: pending/approved/rejected/expired/polling/provider-unavailable. Permissions: order token/self. Accessibility: live region. Responsive: focused full-page. Dependencies: payments/orders adapter. Forbidden: duplicate payment ambiguity. Telemetry: payment_status_view/retry. Audit: payment admin actions only. |
| ReceiptPreview | Purpose: receipt visibility. Owner: Orders/Payments. Inputs: order/payment summary. Outputs: download/share. Variants: draft/paid/refunded. Slots: legal. States: loading/paid/refunded/error. Permissions: order token/self/admin scoped. Accessibility: structured receipt. Responsive: collapsible mobile. Dependencies: orders/payments. Forbidden: unmasked sensitive payment identifiers. Telemetry: receipt_view/download. Audit: admin receipt access if scoped. |
| GuestContactForm | Purpose: guest contact and recovery. Owner: Checkout/Identity. Inputs: name, phone, email, verification optional. Outputs: change/verify. Variants: checkout/account recovery. Slots: consent/help. States: empty/valid/invalid/verifying/error. Permissions: public. Accessibility: autocomplete/error summary. Responsive: stacked mobile. Dependencies: auth/OTP adapter optional. Forbidden: forced account creation. Telemetry: guest_contact_validated. Audit: none. |
| ConsentPanel | Purpose: privacy/communication consent. Owner: Legal/Customer. Inputs: consent items, required flags. Outputs: consent change. Variants: checkout/account/settings. Slots: policy links. States: unchecked/checked/required-missing/disabled. Permissions: public/cliente. Accessibility: explicit labels. Responsive: compact mobile. Dependencies: consent policy. Forbidden: prechecked required consent unless legally approved. Telemetry: consent_change. Audit: consent changes logged. |

## 13. Tracking component contracts

| Component | Contract |
| --- | --- |
| OrderTimeline | Purpose: order progress. Owner: Orders. Inputs: events/status. Outputs: event select. Variants: compact/full. Slots: event detail. States: loading/success/error/empty/offline/stale. Permissions: order token/self. Accessibility: ordered list and live updates. Responsive: vertical mobile. Dependencies: order tracking/realtime. Forbidden: exposing internal-only states. Telemetry: tracking_view/event_expand. Audit: none. |
| OrderStatusBadge | Purpose: compact order state. Owner: Orders. Inputs: status, freshness. Outputs: none. Variants: badge/banner. Slots: icon. States: success/error/stale/delayed. Permissions: order token/self/scoped. Accessibility: text status. Responsive: wraps safely. Dependencies: orders. Forbidden: color-only state. Telemetry: none. Audit: none. |
| EtaIndicator | Purpose: ETA clarity. Owner: Orders/Delivery. Inputs: ETA range, confidence, delay reason. Outputs: expand reason. Variants: compact/detail. Slots: reason. States: loading/current/delayed/stale/error. Permissions: order token/self/scoped. Accessibility: time text announced. Responsive: prominent mobile. Dependencies: ETA service. Forbidden: false precision. Telemetry: eta_view/delay_expand. Audit: none. |
| RealtimeStatus | Purpose: subscription health. Owner: Platform. Inputs: connection state, last update. Outputs: retry. Variants: inline/banner. Slots: diagnostic. States: connected/disconnected/reconnecting/stale/offline. Permissions: screen scoped. Accessibility: polite/urgent announcements by severity. Responsive: banner mobile. Dependencies: realtime adapter. Forbidden: silent realtime loss in ops. Telemetry: realtime_disconnect/reconnect. Audit: platform incident if elevated. |
| DelayAlert | Purpose: delay communication. Owner: Operations/Orders. Inputs: delay type, revised ETA, reason. Outputs: acknowledge/support. Variants: customer/ops. Slots: CTA. States: warning/error/resolved/stale. Permissions: order token/self/ops scoped. Accessibility: alert role for urgent. Responsive: inline/banner. Dependencies: orders/notifications. Forbidden: unexplained delay. Telemetry: delay_alert_view/action. Audit: ops ETA changes parent. |
| TrackingSummary | Purpose: status/ETA/support summary. Owner: Orders. Inputs: order, fulfillment, ETA, support eligibility. Outputs: support/detail/reorder. Variants: customer/support. Slots: CTA. States: loading/success/error/stale/offline. Permissions: order token/self. Accessibility: region summary. Responsive: sticky/compact mobile. Dependencies: orders/support. Forbidden: hidden support path. Telemetry: tracking_summary_action. Audit: support case parent. |

## 14. Operations component contracts

| Component | Contract |
| --- | --- |
| KitchenQueueBoard | Purpose: live cocina queue. Owner: Kitchen. Inputs: tickets, stations, filters. Outputs: open/start/filter. Variants: board/list. Slots: ticket. States: loading/empty/error/offline/stale/maintenance. Permissions: pedido:read:sucursal, pedido:update:ops. Accessibility: keyboard board navigation/live region. Responsive: tablet board, mobile tabs. Dependencies: kitchen realtime. Forbidden: payment/customer PII. Telemetry: kitchen_queue_view/start. Audit: status mutations. |
| KitchenTicketCard | Purpose: actionable prep ticket. Owner: Kitchen. Inputs: ticket, SLA, priority. Outputs: start/ready/detail. Variants: compact/expanded/priority. Slots: actions. States: default/loading/error/stale/disabled. Permissions: pedido:update:ops. Accessibility: ticket status announced. Responsive: large tap targets. Dependencies: kitchen ticket model. Forbidden: ambiguous primary action. Telemetry: ticket_action. Audit: ticket state changes. |
| KitchenTicketDetail | Purpose: full prep context. Owner: Kitchen. Inputs: ticket, modifiers, notes, timeline. Outputs: mark item/order, print, incident. Variants: detail/print. Slots: incident/actions. States: loading/error/stale/forbidden. Permissions: pedido:read:sucursal, pedido:update:ops. Accessibility: structured item list. Responsive: split/tablet. Dependencies: orders/kitchen. Forbidden: unapproved customer PII. Telemetry: ticket_detail_view. Audit: status/print/incident. |
| KitchenSLATimer | Purpose: prep SLA awareness. Owner: Kitchen/Ops. Inputs: start/due/status. Outputs: threshold event. Variants: normal/warning/critical. Slots: none. States: running/paused/delayed/stale. Permissions: read scoped. Accessibility: no excessive announcements; critical only. Responsive: high visibility. Dependencies: time/SLA config. Forbidden: client-only authoritative SLA. Telemetry: sla_threshold. Audit: none. |
| KitchenIncidentPanel | Purpose: manage kitchen incident. Owner: Ops/Support. Inputs: incident/order links. Outputs: create/update/close. Variants: inline/panel. Slots: forms/timeline. States: empty/loading/error/forbidden/stale. Permissions: ops:incident. Accessibility: error summary. Responsive: sheet on tablet. Dependencies: incidents/audit. Forbidden: closing without reason. Telemetry: incident_action. Audit: all incident mutations. |
| KitchenPauseControl | Purpose: pause intake/station. Owner: Ops. Inputs: scope, reason, duration, impact. Outputs: activate/resume/cancel. Variants: branch/station. Slots: impact preview. States: active/inactive/loading/error/forbidden/maintenance. Permissions: sucursal:manage. Accessibility: confirmation modal. Responsive: prominent but protected. Dependencies: branch availability. Forbidden: one-click destructive pause. Telemetry: pause_action. Audit: required. |
| KitchenSaturationControl | Purpose: overload capacity control. Owner: Ops. Inputs: capacity, ETA, menu impact. Outputs: activate/adjust/end. Variants: branch/station. Slots: preview. States: inactive/active/loading/error/stale. Permissions: sucursal:manage, ops:incident. Accessibility: impact text. Responsive: control panel. Dependencies: ops config/realtime. Forbidden: hidden customer impact. Telemetry: saturation_action. Audit: required. |
| DeliveryQueueBoard | Purpose: dispatch queue. Owner: Delivery. Inputs: ready orders, drivers, filters. Outputs: assign/open/filter. Variants: board/list. Slots: assignment card. States: loading/empty/error/offline/stale. Permissions: pedido:update:ops. Accessibility: keyboard queue. Responsive: list mobile/tablet board. Dependencies: delivery realtime. Forbidden: unowned assignment ambiguity. Telemetry: delivery_queue_view/assign. Audit: assignment. |
| DeliveryAssignmentCard | Purpose: driver/order assignment. Owner: Delivery. Inputs: order, driver, capacity. Outputs: assign/unassign. Variants: suggested/manual. Slots: reason. States: available/locked/conflict/loading/error. Permissions: pedido:update:ops. Accessibility: conflict announced. Responsive: touch target. Dependencies: assignment locks. Forbidden: overwrite conflict silently. Telemetry: assignment_action. Audit: required. |
| DeliveryDetail | Purpose: delivery execution detail. Owner: Delivery. Inputs: delivery, address, contact, status. Outputs: status update/contact/incident/proof. Variants: operator/supervisor. Slots: proof/map. States: loading/error/stale/forbidden/offline. Permissions: pedido:update:ops. Accessibility: status stepper. Responsive: detail-first mobile. Dependencies: delivery/orders/maps. Forbidden: exposing contact beyond role. Telemetry: delivery_status_action. Audit: status/contact/proof. |
| DeliveryMap | Purpose: spatial delivery view. Owner: Delivery. Inputs: markers, route, zones. Outputs: marker select/route action. Variants: full/card. Slots: fallback list. States: loading/error/offline/stale. Permissions: pedido:read:sucursal. Accessibility: list fallback required. Responsive: map collapses on mobile. Dependencies: maps adapter. Forbidden: map-only workflow. Telemetry: map_view/marker_select. Audit: none. |
| DeliveryIncidentPanel | Purpose: delivery issue recovery. Owner: Delivery/Ops. Inputs: incident, delivery, reason. Outputs: create/update/escalate/close. Variants: inline/panel. Slots: playbook. States: empty/loading/error/forbidden/stale. Permissions: ops:incident. Accessibility: structured form. Responsive: sheet/panel. Dependencies: incidents/support. Forbidden: missing reason/owner. Telemetry: delivery_incident_action. Audit: required. |
| ReassignmentPanel | Purpose: reassign delivery. Owner: Delivery/Ops. Inputs: delivery, drivers, reason. Outputs: reassign/cancel. Variants: modal/panel. Slots: conflict warning. States: loading/conflict/success/error/forbidden. Permissions: pedido:update:ops, sucursal:manage. Accessibility: confirmation and focus trap. Responsive: modal mobile. Dependencies: assignment locks/audit. Forbidden: reassignment without reason. Telemetry: reassignment_action. Audit: required. |
| ProofCapture | Purpose: delivery proof capture/upload. Owner: Delivery. Inputs: proof type, media/file. Outputs: capture/upload/retry. Variants: photo/signature/text. Slots: preview. States: empty/capturing/uploading/success/error/offline. Permissions: pedido:update:ops. Accessibility: non-camera fallback. Responsive: mobile-first. Dependencies: storage/delivery. Forbidden: blocking completion without retry/fallback policy. Telemetry: proof_upload_status. Audit: delivery proof event. |

## 15. Admin component contracts

| Component | Contract |
| --- | --- |
| DataTable | Purpose: canonical data list. Owner: Frontend Platform/Admin. Inputs: columns, rows, sorting, pagination, selection. Outputs: sort/filter/select/action. Variants: standard/dense/responsive. Slots: toolbar/row actions/empty. States: loading/empty/error/forbidden/stale. Permissions: screen/action scoped. Accessibility: table semantics and keyboard nav. Responsive: card shell mobile. Dependencies: query state. Forbidden: custom duplicated tables. Telemetry: table_view/action. Audit: row actions by parent. |
| EntityEditor | Purpose: canonical CRUD form shell. Owner: Admin/Platform. Inputs: schema, entity, mode. Outputs: save/cancel/delete/validate. Variants: create/edit/read-only. Slots: fields/actions. States: loading/error/disabled/forbidden/success. Permissions: entity manage. Accessibility: error summary. Responsive: single column mobile. Dependencies: form/domain contracts. Forbidden: direct data provider calls. Telemetry: entity_save/error. Audit: mutations. |
| RoleEditor | Purpose: manage role bundles. Owner: Security/Admin. Inputs: role, permissions, assignments. Outputs: save/clone/delete. Variants: edit/review. Slots: permission picker. States: loading/error/forbidden/stale. Permissions: role:manage. Accessibility: grouped permissions. Responsive: searchable lists. Dependencies: roles/permissions. Forbidden: self-lockout without warning. Telemetry: role_edit. Audit: required. |
| PermissionEditor | Purpose: policy/permission editing. Owner: Security. Inputs: policies, permissions. Outputs: save/simulate. Variants: edit/review. Slots: simulator. States: loading/error/forbidden/maintenance. Permissions: permission:manage. Accessibility: structured groups. Responsive: desktop-preferred. Dependencies: auth policy. Forbidden: save without simulation for high-risk. Telemetry: permission_edit. Audit: required. |
| PromotionBuilder | Purpose: campaign rule creation. Owner: Marketing/Admin. Inputs: campaign rules, products, branches. Outputs: validate/save/publish/pause. Variants: create/edit/clone. Slots: eligibility preview. States: draft/valid/invalid/published/paused/error. Permissions: promo:manage. Accessibility: step errors. Responsive: stepper mobile. Dependencies: promociones/productos. Forbidden: hidden eligibility rules. Telemetry: promotion_build/publish. Audit: campaign mutations. |
| CouponBuilder | Purpose: coupon creation/control. Owner: Marketing/Admin. Inputs: code, limits, eligibility. Outputs: generate/save/disable. Variants: single/bulk. Slots: limits. States: draft/valid/invalid/active/disabled/error. Permissions: promo:manage. Accessibility: code readable/copy labelled. Responsive: forms stacked. Dependencies: cupones/promos. Forbidden: unlimited coupon without explicit confirmation. Telemetry: coupon_action. Audit: coupon mutations. |
| AuditViewer | Purpose: inspect audit events. Owner: Security/Platform. Inputs: filters, events, scope. Outputs: search/export/open. Variants: admin/support/security. Slots: event detail. States: loading/empty/error/forbidden/stale. Permissions: audit:view. Accessibility: table/list semantics. Responsive: card list mobile. Dependencies: audit store. Forbidden: unaudited export. Telemetry: audit_search/view. Audit: search/export logged. |
| SettingsEditor | Purpose: scoped configuration management. Owner: Admin/Platform. Inputs: settings, scope, impact. Outputs: save/rollback/test. Variants: org/branch/platform. Slots: impact preview. States: loading/error/forbidden/success/maintenance. Permissions: scope-specific. Accessibility: grouped fields/errors. Responsive: sections. Dependencies: config/feature flags. Forbidden: high-impact save without preview. Telemetry: settings_change. Audit: required. |
| PolicySimulator | Purpose: preview authorization impact. Owner: Security. Inputs: actor, role, permission, resource. Outputs: simulation result. Variants: inline/full. Slots: explanation. States: idle/loading/result/error/forbidden. Permissions: permission:manage. Accessibility: result announced. Responsive: desktop-preferred. Dependencies: auth policy engine. Forbidden: policy save bypass. Telemetry: policy_simulation. Audit: simulation for high-risk changes. |

## 16. Support component contracts

| Component | Contract |
| --- | --- |
| CaseList | Purpose: support queue. Owner: Support. Inputs: cases, filters, SLA. Outputs: open/assign/filter. Variants: queue/escalated. Slots: row actions. States: loading/empty/error/stale/forbidden. Permissions: support:case. Accessibility: keyboard list/table. Responsive: list mobile. Dependencies: cases. Forbidden: PII overexposure in list. Telemetry: case_queue_view/open. Audit: assignment. |
| CaseTimeline | Purpose: case history. Owner: Support. Inputs: events, comments. Outputs: add comment/filter. Variants: internal/customer-visible. Slots: composer. States: loading/empty/error/stale. Permissions: support:case. Accessibility: chronological list. Responsive: vertical. Dependencies: cases/audit. Forbidden: unlabelled private notes. Telemetry: case_timeline_view/comment. Audit: comments/status. |
| CaseDetail | Purpose: resolve case with context. Owner: Support. Inputs: case, customer/order context, permissions. Outputs: reply/resolve/escalate/request access. Variants: standard/escalated. Slots: context/actions. States: loading/error/forbidden/stale. Permissions: support:case. Accessibility: headings/regions. Responsive: split desktop, stacked mobile. Dependencies: cases/orders. Forbidden: unapproved PII reveal. Telemetry: case_action. Audit: sensitive views/actions. |
| AccessRequestModal | Purpose: request temporary access. Owner: Support/Security. Inputs: scope, reason, duration. Outputs: submit/cancel. Variants: standard/elevated. Slots: policy text. States: draft/submitting/approved/denied/error. Permissions: support:temporary_access. Accessibility: focus trap/errors. Responsive: modal/fullscreen mobile. Dependencies: approvals/audit. Forbidden: missing reason/scope. Telemetry: access_request_submit. Audit: required. |
| BreakGlassPanel | Purpose: emergency access workflow. Owner: Security. Inputs: incident, scope, justification. Outputs: approve/deny/revoke. Variants: request/review. Slots: risk summary. States: pending/approved/denied/expired/error. Permissions: security:break_glass. Accessibility: high-risk warnings. Responsive: desktop-preferred. Dependencies: security/audit/incidents. Forbidden: no incident link. Telemetry: break_glass_action. Audit: immutable required. |
| UserActivityViewer | Purpose: inspect activity timeline. Owner: Support/Security. Inputs: user, events, filters. Outputs: filter/reveal/export. Variants: masked/revealed. Slots: reveal gate. States: loading/empty/error/forbidden/stale. Permissions: support:case, audit:view for sensitive. Accessibility: timeline semantics. Responsive: list. Dependencies: audit/activity. Forbidden: raw PII without gate. Telemetry: activity_view. Audit: query/reveal/export. |
| AuditTrailViewer | Purpose: access audit review. Owner: Security. Inputs: access events, filters. Outputs: inspect/export. Variants: support/security. Slots: detail. States: loading/empty/error/forbidden. Permissions: audit:view. Accessibility: table/list. Responsive: card list. Dependencies: audit. Forbidden: unaudited export. Telemetry: audit_trail_view. Audit: search/export. |
| PiiRevealGate | Purpose: controlled sensitive data reveal. Owner: Security/Support. Inputs: field, reason, permission, duration. Outputs: reveal/cancel. Variants: inline/modal. Slots: policy. States: masked/requested/revealed/expired/denied. Permissions: scoped sensitive permission. Accessibility: clear warning/focus. Responsive: inline/mobile modal. Dependencies: audit/security. Forbidden: reveal without reason. Telemetry: pii_reveal_request. Audit: required. |
| WatermarkedAccessShell | Purpose: mark temporary/elevated session. Owner: Security. Inputs: actor, scope, expiry, reason. Outputs: revoke/extend request. Variants: temporary/break-glass. Slots: session content. States: active/expiring/expired/revoked. Permissions: approved access. Accessibility: persistent session status. Responsive: sticky banner. Dependencies: auth/audit. Forbidden: hiding elevated state. Telemetry: elevated_session_view. Audit: all actions within shell. |

## 17. Analytics component contracts

| Component | Contract |
| --- | --- |
| MetricCard | Purpose: KPI display. Owner: Analytics. Inputs: metric, comparison, status. Outputs: drilldown. Variants: standard/compact/critical. Slots: tooltip/action. States: loading/empty/error/stale. Permissions: analytics:view. Accessibility: text summary. Responsive: grid adaptive. Dependencies: metrics. Forbidden: color-only delta. Telemetry: metric_view/drilldown. Audit: none. |
| TrendChart | Purpose: time-series analysis. Owner: Analytics. Inputs: series, axes, range. Outputs: point/range select. Variants: line/bar/area. Slots: legend/summary. States: loading/empty/error/stale. Permissions: analytics:view. Accessibility: table/summary alternative. Responsive: resizes with min height. Dependencies: analytics data. Forbidden: inaccessible chart-only info. Telemetry: chart_interaction. Audit: none. |
| FunnelChart | Purpose: conversion funnel. Owner: Analytics/Product. Inputs: steps, counts, rates. Outputs: step select. Variants: vertical/horizontal. Slots: explanations. States: loading/empty/error/stale. Permissions: analytics:view. Accessibility: ordered values in text. Responsive: stacked mobile. Dependencies: event analytics. Forbidden: unlabeled rates. Telemetry: funnel_step_select. Audit: none. |
| CohortChart | Purpose: retention/cohort analysis. Owner: Analytics. Inputs: cohorts, periods, values. Outputs: cell select. Variants: heat/table. Slots: legend. States: loading/empty/error/stale. Permissions: analytics:view. Accessibility: table alternative. Responsive: horizontal scroll with labels. Dependencies: analytics. Forbidden: color-only value. Telemetry: cohort_select. Audit: export parent. |
| Heatmap | Purpose: matrix/intensity analysis. Owner: Analytics. Inputs: dimensions, values. Outputs: cell select. Variants: matrix/calendar. Slots: legend. States: loading/empty/error/stale. Permissions: analytics:view. Accessibility: data table fallback. Responsive: scroll/pinch-safe. Dependencies: analytics. Forbidden: color-only meaning. Telemetry: heatmap_cell_select. Audit: none. |
| KpiGrid | Purpose: KPI layout. Owner: Analytics/Platform. Inputs: metric cards, layout config. Outputs: card select/reorder if allowed. Variants: dashboard/compact. Slots: cards. States: loading/empty/error/stale. Permissions: analytics:view. Accessibility: landmark/heading. Responsive: tokenized grid. Dependencies: MetricCard. Forbidden: arbitrary grid gaps. Telemetry: dashboard_view. Audit: none. |
| FilterPanel | Purpose: analytics filters. Owner: Analytics. Inputs: dimensions, values, current filters. Outputs: apply/reset/save. Variants: inline/drawer. Slots: advanced. States: loading/empty/error/disabled. Permissions: dashboard view. Accessibility: grouped controls. Responsive: drawer mobile. Dependencies: URL/query state. Forbidden: hidden active filters. Telemetry: filter_apply. Audit: compliance filters if sensitive. |
| ExportPanel | Purpose: gated exports. Owner: Analytics/Platform. Inputs: formats, scope, permissions. Outputs: request/download/cancel. Variants: simple/scheduled/compliance. Slots: justification. States: idle/requesting/ready/error/forbidden. Permissions: analytics:export or audit:view. Accessibility: status announced. Responsive: modal/sheet. Dependencies: export jobs. Forbidden: raw export without permission/justification. Telemetry: export_request/download. Audit: required for sensitive/compliance. |
| SavedViewManager | Purpose: save/share dashboard states. Owner: Analytics. Inputs: view config, owner, scope. Outputs: save/update/delete/share. Variants: personal/shared. Slots: name/permissions. States: loading/empty/error/forbidden. Permissions: analytics:view; share may require admin. Accessibility: form labels. Responsive: sheet. Dependencies: saved views. Forbidden: sharing restricted filters to unauthorized users. Telemetry: saved_view_action. Audit: shared view changes. |
| DataFreshnessBanner | Purpose: freshness/stale data status. Owner: Analytics/Platform. Inputs: last updated, delay reason. Outputs: refresh/details. Variants: info/warning/error. Slots: action. States: fresh/stale/delayed/error. Permissions: dashboard view. Accessibility: status/live region. Responsive: banner. Dependencies: warehouse health. Forbidden: silent delayed analytics. Telemetry: data_freshness_view/refresh. Audit: none. |
| ChartDrilldownPanel | Purpose: explain selected data point and related paths. Owner: Analytics. Inputs: selection, related dashboards/entities. Outputs: navigate/export. Variants: side panel/popover. Slots: details/actions. States: loading/empty/error/forbidden. Permissions: source and target permissions. Accessibility: focus managed. Responsive: sheet mobile. Dependencies: analytics/navigation. Forbidden: leaking restricted drilldowns. Telemetry: drilldown_open/navigate. Audit: if target is audit/compliance. |

## 18. Accessibility contracts

| Accessibility area | Contract |
| --- | --- |
| Keyboard behavior | All interactive components are keyboard reachable in logical order. Composite components define arrow-key, home/end, escape, enter/space, and typeahead behavior where appropriate. Destructive operational shortcuts require confirmation. |
| Focus behavior | Focus indicators use focus tokens, never browser-default removal. Overlays trap focus when blocking and restore focus to the trigger. Realtime updates must not steal focus. |
| Screen reader behavior | Components expose names, roles, values, descriptions, errors, and status changes. Charts and maps require textual/table alternatives. Icon-only actions require accessible names. |
| Reduced motion behavior | Motion tokens collapse to nonessential motion-free transitions. Realtime changes use text/status updates instead of movement where reduced motion is enabled. |
| Color dependency restrictions | No component may rely on color alone. Status components require text/icon/pattern. Contrast requirements from color tokens are mandatory. |
| Live region requirements | Payment, tracking, realtime, queue critical updates, upload status, validation summaries, and delayed data messages use polite or assertive live regions according to severity. |
| Error recovery | Forms and workflows provide ErrorSummary, field-level errors, retry path, and safe exit. Error copy identifies recovery without exposing sensitive internals. |
| Touch and pointer | Minimum touch targets apply. Drag/drop workflows must have keyboard alternatives. |

## 19. Telemetry contracts

| Event family | Definition | Required component obligations |
| --- | --- | --- |
| Interaction events | User actions such as click, select, expand, filter, toggle. | Foundation emits only through parent; domain components name events by business action. |
| View events | Screen/component exposure. | Product, tracking, dashboard, support, and analytics components emit meaningful view events. |
| Error events | Validation, provider, realtime, upload, permission, or component failures. | Components emit normalized error codes, not sensitive data. |
| Conversion events | Product view, add-to-cart, cart view, checkout start, payment result, reorder. | Commerce/cart/checkout/tracking components must support funnel metrics. |
| Checkout events | Address validation, coverage check, payment method select, submit, payment status. | Checkout components must emit idempotency-safe events. |
| Tracking events | Tracking view, ETA display, delay alert, support click, realtime disconnect. | Tracking components must include order scope without leaking PII. |
| Operations events | Ticket start/ready, ETA update, pause, saturation, assignment, proof upload. | Kitchen/delivery components must emit action, actor scope, result, latency where useful. |
| Support events | Case open/action, PII reveal request, access request, escalation. | Support components must align telemetry with audit but keep analytics non-sensitive. |
| Analytics events | Dashboard view, filter apply, chart drilldown, export request, saved view. | Analytics components must emit dashboard/filter metadata with permission-safe values. |

### 19.1 Telemetry obligations by component family

| Component family | Obligations |
| --- | --- |
| Foundation/Layout | No business telemetry by default; expose hooks for parent events. |
| Navigation | destination selected, shortcut used, scope switched, forbidden destination attempted. |
| Commerce/Cart | product impressions, add intent, cart changes, coupon validation, upsell interaction. |
| Checkout | step view, validation errors, coverage result, payment method, submit, payment status. |
| Tracking | status view, ETA/delay view, realtime loss/recovery, support deflection. |
| Kitchen/Delivery | queue views, operational actions, SLA thresholds, incidents, mode changes, assignment/proof outcomes. |
| Admin/Support | CRUD actions, access workflows, case actions, errors, permission denials. |
| Analytics | dashboard views, filters, drilldowns, exports, freshness issues. |

## 20. Audit contracts

| Audit topic | Components/interactions | Approval/review requirement |
| --- | --- | --- |
| Audit event generators | EntityEditor, RoleEditor, PermissionEditor, PromotionBuilder, CouponBuilder, AuditViewer, SettingsEditor, PolicySimulator, CaseDetail, AccessRequestModal, BreakGlassPanel, UserActivityViewer, AuditTrailViewer, PiiRevealGate, WatermarkedAccessShell, Kitchen/Delivery state mutation components, ExportPanel for sensitive exports. | Audit must record actor, scope, resource, action, before/after where applicable, reason, result, timestamp. |
| Approval-required interactions | Temporary access, break glass, high-risk permission changes, role changes with elevated scopes, high-impact settings, refunds by policy threshold, branch pause/saturation if policy requires, sensitive exports. | Approval workflow must be visible, logged, and reviewable. |
| Review-required workflows | Break glass post-review, permission policy changes, failed access attempts, audit exports, operational incidents, support escalations. | Review owner and deadline required. |
| Sensitive reveal interactions | PII reveal, user activity reveal, payment/order sensitive context, elevated support session. | Purpose limitation and expiry required. |
| Operational mutations | Kitchen ticket status, delivery assignment/status, ETA update, incidents, pause/saturation. | Reason required for exceptions, reassignment, incident close, and mode changes. |

## 21. Component state matrix

| Component family | default | loading | success | error | empty | offline | forbidden | disabled | stale | maintenance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Foundation | interactive/readable | Spinner/Skeleton where relevant | action feedback | field/control error | not applicable except Select | parent controlled | parent controlled | native disabled | parent badge | parent controlled |
| Layout | rendered shell | skeleton regions | content visible | page ErrorState | EmptyState region | OfflineState region | ForbiddenState region | actions disabled | DataDelayedState | MaintenanceState |
| Navigation | visible allowed items | nav placeholders | destination active | nav error fallback | no items message | cached nav, risky actions disabled | hidden/locked item | disabled item | scope stale badge | maintenance link only |
| Commerce | product browsable | skeleton cards | added/opened | product error | no products | cached/stale availability | account-only actions locked | sold-out/unavailable | stale availability | branch closed/maintenance |
| Cart/Checkout | editable/submittable | recalculating/submitting | accepted/paid | validation/provider error | empty cart/no address | submit disabled/cart preserved | login/access required | invalid submit disabled | price/availability stale | checkout blocked |
| Tracking | current status | loading timeline | delivered/complete | tracking error | no events | stale last known | token/access denied | actions unavailable | realtime/data stale | status page/support |
| Rewards | balance/catalog shown | loading | redeemed/progress | redemption error | no rewards | view cached only | login required | ineligible reward | points delayed | disabled campaign |
| Kitchen | live queue | queue skeleton | action applied | conflict/error | no tickets | polling/blocked unsafe | permission denied | unavailable action | realtime stale | pause/maintenance |
| Delivery | live dispatch | loading | status applied | assignment/proof error | no deliveries | map/list fallback | permission denied | locked action | stale markers | delivery paused |
| Admin | data/editable | table/form loading | save success | validation/server error | no records | read-only cached | forbidden | no permission/action invalid | data delayed | maintenance/settings locked |
| Support | cases/context | loading | case resolved/action done | access/case error | no cases | sensitive actions blocked | forbidden | action disabled | case data stale | support degraded |
| Analytics | charts/filters | chart skeletons | export ready/view saved | query/export error | no data | cached dashboards | forbidden/export denied | disabled export | freshness banner | dashboard unavailable |
| Feedback | contextual message | retry pending | success message | error message | empty guidance | offline guidance | access guidance | unavailable CTA | stale guidance | maintenance message |

## 22. Design token coverage audit

| Coverage dimension | Result | Evidence | Gap handling |
| --- | --- | --- | --- |
| Every component covered | Passed | Foundation, commerce, checkout, tracking, operations, admin, support, analytics, accessibility, feedback contracts are defined. | Any omitted final-inventory component inherits family contract and requires contract addendum before implementation. |
| Every screen covered | Passed | Token and contract families map to all screen families from the approved screen/component inventory. | No new screen component required. |
| Every journey covered | Passed | Conversion, checkout, tracking, kitchen, delivery, support, admin, franchise, and analytics journeys have telemetry/state/audit contracts. | No missing journey contract found. |
| Every state covered | Passed | State matrix covers default, loading, success, error, empty, offline, forbidden, disabled, stale, maintenance. | No missing state token family. |
| Every accessibility scenario covered | Passed | Keyboard, focus, screen reader, reduced motion, color restrictions, live regions, error recovery, touch/pointer are specified. | QA must verify per component. |
| Color coverage | Passed | Core, status, domain, operations, analytics, support, light/dark, and contrast rules are defined. | Token values must be validated during implementation. |
| Responsive coverage | Passed | Breakpoints, containers, grids, touch targets, spacing, typography, and navigation behavior are tokenized. | Component QA must test each density/breakpoint. |
| Audit/telemetry coverage | Passed | Component families define telemetry obligations and audit-required interactions. | Sensitive events require Security review. |

## 23. Implementation governance

| Governance process | Contract |
| --- | --- |
| Review process | Every component/token implementation PR must include contract reference, token usage proof, state coverage, accessibility evidence, responsive evidence, dependency compliance, telemetry/audit mapping, and affected screens. |
| Approval process | Design System approves tokens/visual contract, Frontend Platform approves API/dependencies, Accessibility approves interaction/accessibility, domain owner approves behavior, Security approves audit/permission contracts, QA approves state matrix evidence. |
| Migration process | Migration plans list old token/component, replacement, affected screens, rollout order, testing plan, telemetry comparison, rollback path. |
| Breaking change process | Breaking component/token changes require major version, consumer inventory, migration guide, approval board sign-off, compatibility window, and release notes. |
| Component retirement process | Retire only after all consumers migrate, telemetry confirms no usage, docs mark removed, and QA verifies no orphan screens. |
| Token retirement process | Retire only after aliases are removed, affected components pass visual/accessibility regression, and white-label overrides are migrated. |
| Governance exception | A new component or token outside this blueprint requires written exception: problem, why existing contracts fail, proposed owner, accessibility/telemetry/audit impact, migration impact, and approval from Design System, Frontend Platform, Product, Accessibility, and QA. |

## 24. Final deliverable checklist

| Deliverable | Status | Location |
| --- | --- | --- |
| Token Governance | Complete | Section 1. |
| Token Architecture | Complete | Section 2. |
| Color Tokens | Complete | Section 3. |
| Typography Tokens | Complete | Section 4. |
| Spacing Tokens | Complete | Section 5. |
| Elevation Tokens | Complete | Section 6. |
| Motion Tokens | Complete | Section 7. |
| Responsive Tokens | Complete | Section 8. |
| Component Contract Framework | Complete | Section 9. |
| Foundation Contracts | Complete | Section 10. |
| Commerce Contracts | Complete | Section 11. |
| Checkout Contracts | Complete | Section 12. |
| Tracking Contracts | Complete | Section 13. |
| Operations Contracts | Complete | Section 14. |
| Admin Contracts | Complete | Section 15. |
| Support Contracts | Complete | Section 16. |
| Analytics Contracts | Complete | Section 17. |
| Accessibility Contracts | Complete | Section 18. |
| Telemetry Contracts | Complete | Section 19. |
| Audit Contracts | Complete | Section 20. |
| State Matrix | Complete | Section 21. |
| Coverage Audit | Complete | Section 22. |
| Governance Rules | Complete | Section 23. |

