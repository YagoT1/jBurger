# J Burguer — Definitive Screen Inventory and Wireframe Blueprint

> **Language policy:** Business language is Spanish and technical language remains English, aligned with `docs/architecture/language-standard-business-spanish-technical-english.md`.

> **Implementation status:** This is the official UI scope before implementation. It is a textual screen inventory, workflow coverage, state matrix, permission matrix, dependency matrix, component matrix, degradation plan, and wireframe blueprint. It does **not** define visual mockups, Figma files, or application code.

## 0. Coverage assertion

This document covers the complete product surface for the fullstack food-tech platform: Customer Ordering, Administration, Kitchen Operations, Delivery Operations, Loyalty, Analytics, Franchise Management, and Support. Every screen listed below must implement loading, success, error, empty, offline, unauthorized, forbidden, realtime disconnected, data delayed, and maintenance states unless the screen is explicitly static and unauthenticated.

### 0.1 Canonical roles

| Role | Scope | Primary surfaces |
| --- | --- | --- |
| `cliente` | Customer identity or guest session where allowed. | Customer ordering, rewards, order tracking, support entry. |
| `operador_cocina` | Assigned sucursal kitchen operations. | Cocina queue, ticket execution, incidents. |
| `operador_entrega` | Assigned sucursal delivery operations. | Delivery queue, route, delivery incidents. |
| `supervisor_sucursal` | Day-to-day operational supervision for one or more sucursales. | Cocina, entregas, pedidos, incidents, branch analytics. |
| `administrador_sucursal` | Branch administration. | Products availability, schedules, users, reports for assigned sucursales. |
| `administrador_organizacion` | Organization administration across sucursales. | Admin, analytics, franchise, configurations. |
| `soporte` | Customer and operational support with constrained access. | Support cases, temporary access, customer activity. |
| `platform_operator` | Platform operations and reliability. | Logs, incidents, degraded modes, maintenance, observability. |
| `security_admin` | Security governance. | Roles, permissions, audit, break-glass approval. |

### 0.2 Permission vocabulary

| Permission | Meaning |
| --- | --- |
| `public:view` | Available without authentication. |
| `cliente:self` | Access only own profile, orders, rewards, addresses, notifications, favorites. |
| `pedido:create` | Create cart, checkout, and payment intent. |
| `pedido:read:self` | Read own order and tracking information. |
| `pedido:read:sucursal` | Read orders for assigned sucursal. |
| `pedido:update:ops` | Advance operational pedido state. |
| `producto:manage` | Manage products, categories, availability, modifiers. |
| `promo:manage` | Manage promotions and coupons. |
| `cliente:manage` | View and support customer records within policy. |
| `sucursal:manage` | Manage branch settings, hours, service modes. |
| `usuario:manage` | Manage users. |
| `role:manage` | Manage roles and role assignments. |
| `permission:manage` | Manage permission definitions and policies. |
| `support:case` | Create, view, assign, and resolve support cases. |
| `support:temporary_access` | Request or use time-bounded support access. |
| `security:break_glass` | Approve and audit emergency access. |
| `analytics:view` | View analytics dashboards. |
| `analytics:export` | Export analytics data. |
| `audit:view` | View audit logs. |
| `ops:incident` | Create, update, and close operational incidents. |
| `franchise:view` | View franchise-level information. |
| `franchise:manage` | Manage franchise brand settings and shared campaigns. |
| `platform:operate` | Operate degraded modes, maintenance, logs, and health views. |

## 1. Screen coverage audit and canonical screen registry

### 1.1 Customer platform registry

| ID | Screen name | Purpose | User type | Business goal | Primary action | Secondary action | Dependencies | Required permissions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | Home | Present brand, sucursal context, featured menu, offers, and fastest path to order. | Guest/cliente | Start purchase. | Ver menu / pedir ahora. | Select sucursal, view promotions. | productos, sucursales, promociones, analytics. | `public:view` |
| C02 | Menu | Browse available products by sucursal and service mode. | Guest/cliente | Product discovery and cart creation. | Add product. | Filter, sort, favorite. | productos, categorias, disponibilidad, carrito. | `public:view` |
| C03 | Categoria | Show products within one category. | Guest/cliente | Focused category conversion. | Add product. | Change category, filter. | productos, categorias. | `public:view` |
| C04 | Producto | Show product detail, modifiers, allergens, nutrition if available, and price. | Guest/cliente | Product decision and configuration. | Add configured item. | Favorite, share, view similar. | productos, modificadores, disponibilidad, carrito. | `public:view` |
| C05 | Busqueda | Search products, categories, promotions, and previous orders. | Guest/cliente | Reduce discovery friction. | Select result. | Clear query, filter. | search index, productos, promociones, pedidos self. | `public:view`; `cliente:self` for history results |
| C06 | Promociones | Display eligible promotions and campaign rules. | Guest/cliente | Increase conversion and AOV. | Apply promotion. | View terms. | promociones, cupones, carrito. | `public:view` |
| C07 | Carrito | Review items, modifiers, totals, fees, promotions, and fulfillment method. | Guest/cliente | Prepare checkout. | Continuar checkout. | Edit items, apply coupon. | carrito, promociones, sucursales, checkout. | `pedido:create` |
| C08 | Checkout Invitado | Capture contact, delivery/pickup, consent, and payment for guest. | Guest | Complete purchase without account. | Pagar pedido. | Login/create account. | carrito, pagos, direcciones guest, Mercado Pago. | `pedido:create` |
| C09 | Checkout Autenticado | Confirm saved data, delivery, rewards, and payment for authenticated cliente. | cliente | Faster repeat purchase. | Pagar pedido. | Edit address, redeem reward. | carrito, cliente, direcciones, recompensas, pagos. | `cliente:self`, `pedido:create` |
| C10 | Pago Pendiente | Explain pending payment and hold order safely. | Guest/cliente | Prevent duplicate payments. | Volver a Mercado Pago / esperar. | Contact support. | pagos, pedidos, realtime. | `pedido:read:self` or guest token |
| C11 | Pago Aprobado | Confirm paid order and route to tracking. | Guest/cliente | Trust after payment. | Ver seguimiento. | Create account, share. | pagos, pedidos, notificaciones. | `pedido:read:self` or guest token |
| C12 | Pago Rechazado | Explain failed payment and recovery. | Guest/cliente | Recover checkout. | Reintentar pago. | Choose another method, contact support. | pagos, checkout, Mercado Pago. | `pedido:create` |
| C13 | Seguimiento Pedido | Realtime order status from accepted to delivered/picked up. | Guest/cliente | Reduce anxiety and support contacts. | Track status / view ETA. | Contact support, cancel if eligible. | pedidos, cocina, entregas, realtime, WhatsApp/email. | `pedido:read:self` or guest tracking token |
| C14 | Historial Pedidos | List previous orders for authenticated cliente. | cliente | Repeat and retention. | Recomprar. | Filter, view detail. | pedidos, cliente. | `cliente:self`, `pedido:read:self` |
| C15 | Detalle Pedido | Show full order, payment, delivery, refund, and support status. | Guest/cliente | Transparency and post-order actions. | Recomprar / solicitar ayuda. | Download receipt. | pedidos, pagos, soporte. | `pedido:read:self` or guest token |
| C16 | Recompensas | Show loyalty balance, tiers, rewards, and redemption rules. | cliente | Increase repeat purchase. | Canjear recompensa. | View history. | recompensas, promociones, cliente. | `cliente:self` |
| C17 | Perfil | Manage personal data and account status. | cliente | Keep customer identity accurate. | Guardar cambios. | Delete account request. | cliente, auth. | `cliente:self` |
| C18 | Direcciones | Manage delivery addresses and coverage validation. | cliente | Faster checkout. | Add/edit address. | Set default, delete. | direcciones, geocoding, sucursales. | `cliente:self` |
| C19 | Notificaciones | Manage notification inbox and preferences. | cliente | Keep customer informed. | Mark as read. | Configure channels. | notificaciones, email, WhatsApp. | `cliente:self` |
| C20 | Configuracion | Configure privacy, language, accessibility, session, and communication. | cliente | Self-service control. | Save preferences. | Logout. | cliente, auth, consent. | `cliente:self` |
| C21 | Favoritos | Saved products and combos. | cliente | Accelerate repeat purchase. | Add favorite to cart. | Remove favorite. | favoritos, productos, carrito. | `cliente:self` |
| C22 | Recompra | One-tap reorder flow with availability substitutions. | cliente/guest token | Repeat purchase. | Recomprar pedido. | Edit unavailable items. | pedidos, productos, disponibilidad, carrito. | `cliente:self` or guest tracking token |
| C23 | Crear Cuenta Invitado | Convert guest after checkout or tracking. | Guest | Identity creation and retention. | Crear cuenta. | Continue as guest. | auth, pedidos guest linking. | `public:view` |
| C24 | Recuperar Cuenta Invitado | Recover guest order or create/login using email/phone verification. | Guest | Recover access and reduce support. | Verify code. | Resend code. | auth, OTP, pedidos guest. | `public:view` |
| C25 | Customer Empty State Hub | Reusable empty screens for menu, cart, orders, rewards, favorites, notifications. | Guest/cliente | Provide next best action. | Go to recommended action. | Learn why empty. | owning feature. | Inherits owning screen permission |
| C26 | Customer Error State Hub | Reusable recoverable errors for customer workflows. | Guest/cliente | Prevent abandonment. | Retry. | Contact support. | observability, support. | Inherits owning screen permission |
| C27 | Customer Offline State Hub | Offline-first fallback for browsing cached menu, cart recovery, and order status stale view. | Guest/cliente | Keep trust under connectivity loss. | Retry connection. | View cached content. | service worker/cache, realtime. | Inherits owning screen permission |

### 1.2 Kitchen platform registry

| ID | Screen name | Purpose | User type | Business goal | Primary action | Secondary action | Dependencies | Required permissions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| K01 | Dashboard Cocina | Operational overview of active orders, SLA, station load, incidents. | cocina/supervisor | Maintain preparation flow. | Open queue. | Toggle modes, view incidents. | pedidos, cocina, realtime, analytics. | `pedido:read:sucursal`, `pedido:update:ops` |
| K02 | Cola General | Realtime kitchen queue by station and priority. | cocina/supervisor | Prepare orders on time. | Start next ticket. | Filter station/status. | pedidos, tickets, realtime. | `pedido:read:sucursal`, `pedido:update:ops` |
| K03 | Ticket Cocina | Compact station ticket for execution. | cocina | Execute item-level preparation. | Mark item ready. | Flag issue. | tickets, modifiers, realtime. | `pedido:update:ops` |
| K04 | Detalle Ticket | Full order context, modifiers, notes, allergies, timers. | cocina/supervisor | Avoid preparation errors. | Advance ticket state. | Print, incident. | pedidos, productos, cocina. | `pedido:read:sucursal`, `pedido:update:ops` |
| K05 | Pedidos Prioritarios | Expedite VIP, delayed, paid high-priority, or manually escalated orders. | supervisor/cocina | Protect SLA and customer experience. | Prioritize ticket. | Rebalance station. | pedidos, incidents, realtime. | `pedido:update:ops` |
| K06 | Pedidos Retrasados | Show overdue orders with escalation actions. | supervisor/cocina | Recover delays. | Escalate/update ETA. | Notify customer/support. | pedidos, notificaciones, soporte. | `pedido:update:ops`, `ops:incident` |
| K07 | Pedidos Completados | Completed kitchen tickets and handoff audit. | cocina/supervisor | Traceability. | View detail. | Reopen with approval. | pedidos, audit. | `pedido:read:sucursal` |
| K08 | Incidentes Cocina | Create and manage kitchen incidents. | cocina/supervisor | Operational resilience. | Create incident. | Attach orders, close. | incidents, pedidos, audit. | `ops:incident` |
| K09 | Configuracion Cocina | Station, printer, sound, SLA, and display settings. | supervisor/admin sucursal | Fit local operation. | Save settings. | Test devices. | sucursales, devices. | `sucursal:manage` |
| K10 | Modo Pausa | Pause intake or station temporarily with customer-facing impact. | supervisor/admin sucursal | Prevent overload. | Activate pause. | Schedule resume. | sucursales, availability, notifications. | `sucursal:manage`, `platform:operate` for global |
| K11 | Modo Saturacion | Controlled overload mode with extended ETA and limited menu. | supervisor/admin sucursal | Continue sales safely. | Activate saturation. | Adjust ETA/capacity. | pedidos, productos, availability, realtime. | `sucursal:manage`, `ops:incident` |

### 1.3 Delivery platform registry

| ID | Screen name | Purpose | User type | Business goal | Primary action | Secondary action | Dependencies | Required permissions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | Dashboard Entregas | Overview of dispatch queue, active routes, SLA, delays, incidents. | entrega/supervisor | Deliver on time. | Open queue. | View map/incidents. | entregas, pedidos, realtime, maps. | `pedido:read:sucursal`, `pedido:update:ops` |
| D02 | Cola Entregas | Dispatch queue ready for pickup and assignment. | entrega/supervisor | Assign and dispatch efficiently. | Assign delivery. | Batch route/filter. | entregas, pedidos, realtime. | `pedido:update:ops` |
| D03 | Detalle Entrega | Customer, address, contact, status, proof, and incident details. | entrega/supervisor | Complete delivery safely. | Advance status. | Contact customer, incident. | entregas, pedidos, maps, WhatsApp. | `pedido:update:ops` |
| D04 | Mapa Entrega | Map of active deliveries, route, geofence, and ETA. | entrega/supervisor | Route visibility. | Navigate/optimize route. | Recenter/filter. | maps, geocoding, entregas. | `pedido:read:sucursal` |
| D05 | Incidencias | Delivery incident queue and resolution. | entrega/supervisor | Recover failed delivery. | Create/update incident. | Escalate support. | incidents, soporte, pedidos. | `ops:incident` |
| D06 | Retrasos | Delayed delivery list with ETA correction. | entrega/supervisor | Manage customer expectation. | Update ETA. | Notify customer. | entregas, notificaciones. | `pedido:update:ops` |
| D07 | Reasignaciones | Reassign delivery operator/order. | supervisor | Balance delivery capacity. | Reassign. | Add reason. | entregas, usuarios, audit. | `pedido:update:ops`, `sucursal:manage` |
| D08 | Historial Entregas | Completed delivery history and proof. | entrega/supervisor/admin | Traceability. | View detail. | Export if allowed. | entregas, audit. | `pedido:read:sucursal`; `analytics:export` for export |
| D09 | Configuracion Operativa | Zones, ETA rules, delivery capacity, handoff settings. | supervisor/admin sucursal | Match delivery operation to demand. | Save settings. | Test zone. | sucursales, maps, entregas. | `sucursal:manage` |

### 1.4 Administration platform registry

| ID | Screen name | Purpose | User type | Business goal | Primary action | Secondary action | Dependencies | Required permissions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | Dashboard | Organization/sucursal operations summary. | admin/supervisor | Control business health. | Investigate KPI. | Export/report. | analytics, pedidos, incidents. | `analytics:view` |
| A02 | Productos | Manage product catalog. | admin | Keep sellable menu accurate. | Create/edit product. | Toggle availability. | productos, categorias, modifiers. | `producto:manage` |
| A03 | Categorias | Manage category taxonomy and ordering. | admin | Improve menu navigation. | Create/edit category. | Reorder. | categorias, productos. | `producto:manage` |
| A04 | Promociones | Manage promotional campaigns. | marketing/admin | Drive demand. | Create promotion. | Pause/analyze. | promociones, productos, sucursales. | `promo:manage` |
| A05 | Cupones | Manage coupon codes, eligibility, limits. | marketing/admin | Controlled discounting. | Create coupon. | Disable/export. | cupones, promociones, analytics. | `promo:manage` |
| A06 | Clientes | Search and manage customer records within policy. | admin/support | Customer insight and issue resolution. | View customer. | Segment/export. | clientes, pedidos, consent. | `cliente:manage` |
| A07 | Pedidos | Operational and administrative order management. | admin/supervisor | Resolve order issues. | View/update order. | Refund/cancel if allowed. | pedidos, pagos, cocina, entregas. | `pedido:read:sucursal`, `pedido:update:ops` |
| A08 | Sucursales | Manage branches, schedules, service modes. | org admin | Scale operations. | Create/edit sucursal. | Pause/open/close. | sucursales, usuarios, mapas. | `sucursal:manage` |
| A09 | Usuarios | Manage staff users and assignments. | admin/security | Workforce governance. | Invite/edit user. | Disable session. | auth, usuarios, roles. | `usuario:manage` |
| A10 | Roles | Define role bundles. | security/admin | Least privilege. | Create/edit role. | Review assignments. | roles, permissions, audit. | `role:manage` |
| A11 | Permisos | Review permission definitions and policies. | security admin | Authorization governance. | Update policy. | Simulate access. | permissions, audit. | `permission:manage` |
| A12 | Configuraciones | Organization-level settings. | org admin/platform | Configure platform behavior. | Save configuration. | Preview impact. | config, feature flags. | `sucursal:manage` or `platform:operate` by scope |
| A13 | Notificaciones | Manage notification templates and campaigns. | admin/marketing | Consistent communication. | Edit template/campaign. | Send test. | notificaciones, email, WhatsApp. | `promo:manage` or `platform:operate` |
| A14 | Auditoria | Audit activity browser. | security/admin | Compliance traceability. | Search audit event. | Export. | audit logs. | `audit:view` |
| A15 | Logs | Technical and operational logs. | platform operator | Diagnose failures. | Filter logs. | Create incident. | observability, services. | `platform:operate` |
| A16 | Analytics | Embedded analytics landing. | admin | Data-driven decisions. | Open dashboard. | Export. | analytics warehouse. | `analytics:view` |
| A17 | Reportes | Scheduled and ad-hoc reports. | admin | Operational reporting. | Generate report. | Schedule/export. | analytics, email. | `analytics:view`, `analytics:export` |

### 1.5 Support, franchise, and analytics registries

| ID | Screen name | Platform | Purpose | User type | Business goal | Primary action | Secondary action | Dependencies | Required permissions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | Dashboard Soporte | Support | Caseload, SLA, escalations, incidents, access alerts. | soporte/supervisor | Resolve issues quickly. | Open priority case. | View escalations. | support cases, audit, incidents. | `support:case` |
| S02 | Casos | Support | Case queue. | soporte | Manage customer/support work. | Assign/open case. | Filter/escalate. | cases, clientes, pedidos. | `support:case` |
| S03 | Detalle Caso | Support | Full case timeline, customer/order context, actions. | soporte | Resolve safely. | Add response/resolution. | Request access/escalate. | cases, clientes, pedidos, audit. | `support:case` |
| S04 | Acceso Temporal | Support | Time-bounded access request and use. | soporte/security | Controlled support access. | Request/grant access. | Revoke/view scope. | auth, audit, approvals. | `support:temporary_access`, `security:break_glass` for approval |
| S05 | Break Glass Requests | Support | Emergency access approvals. | security/platform | Handle urgent incidents safely. | Approve/deny. | Require notes. | security, audit. | `security:break_glass` |
| S06 | Incidentes | Support | Support-facing incident management. | soporte/platform | Coordinate incident resolution. | Create/update incident. | Link cases. | incidents, logs, status. | `ops:incident` |
| S07 | Auditoria Accesos | Support | Access audit trail. | security/admin | Compliance. | Review event. | Export. | audit, auth. | `audit:view` |
| S08 | Escalaciones | Support | Escalated cases and operational handoffs. | soporte/supervisor | Reduce unresolved issues. | Assign escalation. | Notify owner. | cases, incidents, users. | `support:case` |
| S09 | Actividad Usuario | Support | Customer/staff activity timeline under policy. | soporte/security | Diagnose issues without overexposure. | Inspect timeline. | Request temporary access. | audit, clientes, pedidos. | `support:case`, `audit:view` as needed |
| F01 | Dashboard Franquiciante | Franchise | Portfolio-wide franchise health. | franchisor/org admin | Govern brand network. | Open comparison. | Export insights. | analytics, sucursales, franchise. | `franchise:view`, `analytics:view` |
| F02 | Dashboard Franquiciado | Franchise | Assigned franchisee branch health. | franchisee/admin sucursal | Improve local performance. | Open performance. | View tasks. | analytics, sucursales. | `franchise:view` scoped |
| F03 | Comparativa Sucursales | Franchise | Compare branch KPIs. | franchisor/org admin | Identify gaps. | Compare selected branches. | Export. | analytics. | `franchise:view`, `analytics:view` |
| F04 | Ranking Sucursales | Franchise | Rank branches by operational and commercial KPIs. | franchisor/franchisee | Motivate improvement. | View ranking. | Filter period. | analytics. | `franchise:view` |
| F05 | Performance | Franchise | Deep branch performance diagnostics. | franchisor/franchisee | Improve operations. | Open KPI driver. | Create action. | analytics, incidents. | `franchise:view`, `analytics:view` |
| F06 | Promociones Compartidas | Franchise | Shared brand campaigns and local opt-in. | franchisor/franchisee | Campaign consistency. | Publish/opt in. | Pause/measure. | promociones, sucursales. | `franchise:manage`, `promo:manage` |
| F07 | Configuracion Marca | Franchise | Brand, policies, templates, operating standards. | franchisor/org admin | Brand governance. | Save standard. | Preview impact. | config, notifications. | `franchise:manage` |
| F08 | Analytics Franquicia | Franchise | Franchise analytics hub. | franchisor/franchisee | Portfolio insight. | Open analytics. | Export. | analytics warehouse. | `franchise:view`, `analytics:view` |
| N01 | Ventas | Analytics | Sales metrics dashboard. | admin/franchise | Revenue visibility. | Filter/analyze. | Export. | analytics warehouse. | `analytics:view` |
| N02 | Conversion | Analytics | Funnel conversion dashboard. | admin/marketing | Improve conversion. | Analyze funnel. | Export. | events, analytics. | `analytics:view` |
| N03 | Checkout | Analytics | Checkout drop-off and payment analytics. | admin/product | Improve payment conversion. | Inspect drop-off. | Export. | checkout events, pagos. | `analytics:view` |
| N04 | Carrito | Analytics | Cart composition and abandonment analytics. | admin/product | Increase AOV. | Analyze abandonment. | Export. | carrito events. | `analytics:view` |
| N05 | Clientes | Analytics | Customer cohorts, retention, LTV. | admin/marketing | Retention. | Segment. | Export. | clientes, pedidos. | `analytics:view`, `analytics:export` for raw export |
| N06 | Promociones | Analytics | Promotion performance. | admin/marketing | Discount efficiency. | Compare campaign. | Export. | promociones, pedidos. | `analytics:view` |
| N07 | Recompensas | Analytics | Loyalty performance. | admin/marketing | Loyalty ROI. | Analyze redemption. | Export. | recompensas, pedidos. | `analytics:view` |
| N08 | Sucursales | Analytics | Branch operational/commercial metrics. | admin/franchise | Branch management. | Compare branches. | Export. | sucursales, pedidos. | `analytics:view` |
| N09 | Cocina | Analytics | Kitchen throughput, SLA, incidents. | ops/admin | Improve preparation. | Analyze station. | Export. | cocina, pedidos. | `analytics:view` |
| N10 | Entregas | Analytics | Delivery performance and route metrics. | ops/admin | Improve delivery. | Analyze delay. | Export. | entregas, maps. | `analytics:view` |
| N11 | Incidentes | Analytics | Incident trends and impact. | ops/support | Reduce incidents. | Analyze root cause. | Export. | incidents, support. | `analytics:view` |
| N12 | Auditoria | Analytics | Governance and access analytics. | security/admin | Compliance. | Analyze audit trend. | Export. | audit logs. | `audit:view`, `analytics:view` |

## 2. Customer platform screen inventory

| Screen | Purpose | Components | Actions | Required data | States |
| --- | --- | --- | --- | --- | --- |
| Home | Start appetite-to-order journey. | Header, HeroPedido, SucursalSelector, FeaturedProducts, PromoStrip, ReorderCard, RewardsTeaser, BottomNav, CartFAB. | pedir ahora, select sucursal, open promo, reorder. | sucursales, availability, featured productos, promociones, cart count. | all universal states; empty hides product rails and shows branch/contact action. |
| Menu | Browse sellable catalog. | CategoryTabs, ProductGrid/List, Filters, AvailabilityBadge, CartFAB, SearchEntry. | add item, filter, sort, open product. | categorias, productos, prices, stock, modifiers summary. | loading skeleton grid; empty category; offline cached menu; delayed availability banner. |
| Categoria | Focus category. | CategoryHeader, ProductGrid, SortSheet, PromoContext. | add item, navigate category. | category, products, availability. | same as Menu plus invalid category error. |
| Producto | Configure item. | ProductGallery, ModifierGroups, QuantityStepper, Nutrition/AllergenPanel, PriceSummary, StickyAddButton. | add configured item, favorite, share. | product detail, modifiers, constraints, price calculation. | modifier validation error; sold-out state; offline view-only. |
| Busqueda | Find products and prior orders. | SearchInput, Suggestions, ResultList, EmptySearch, RecentSearches. | search, select, clear, filter. | index results, recents, product availability, authenticated order snippets. | no results empty; slow search delayed indicator. |
| Promociones | Show offers. | PromoCards, CouponInput, EligibilityExplainer, TermsDrawer. | apply, copy code, view terms. | active promos, eligibility, expiration, branch scope. | no active promos empty; invalid coupon error. |
| Carrito | Review and adjust order. | CartItems, ModifierSummary, CouponBox, TotalsBreakdown, FulfillmentSelector, ETABox, StickyCheckout. | edit qty, remove item, apply coupon, checkout. | cart, product current availability, fees, taxes, discounts, branch ETA. | empty cart; product unavailable recovery; offline cart preserved. |
| Checkout Invitado | Complete guest order. | ContactForm, DeliveryPickupForm, ConsentCheckboxes, PaymentMethod, OrderSummary, MercadoPagoButton. | pay, edit cart, login/create. | guest contact, address, cart, totals, payment preference. | validation errors; payment unavailable; address out of coverage; offline blocks pay. |
| Checkout Autenticado | Complete authenticated order faster. | SavedAddressSelector, RewardRedeemer, PaymentMethod, OrderSummary, ContactReview. | pay, redeem, edit address. | user profile, addresses, rewards, cart, totals. | missing profile/address state; reward ineligible state. |
| Pago Pendiente | Protect pending payment. | PaymentStatusCard, Timer, RetryPaymentCTA, SupportCTA, OrderHoldSummary. | return to payment, refresh status. | payment status, order hold, expiration. | realtime disconnected switches to polling; expired hold error. |
| Pago Aprobado | Confirmation. | SuccessCard, OrderSummary, TrackingCTA, AccountCreationPrompt, NotificationOptIn. | track, create account, share. | payment confirmation, order id, notification channels. | approved but notification failure warning. |
| Pago Rechazado | Payment recovery. | RejectionReason, RetryCTA, PaymentMethodSelector, CartPreservedNotice. | retry, change method, support. | payment failure code, cart/order draft. | hard decline, soft decline, provider unavailable. |
| Seguimiento Pedido | Realtime tracking. | StatusTimeline, ETA, MapOrPickupPanel, KitchenProgress, DeliveryProgress, SupportCTA. | track, contact support, cancel when eligible. | order, statuses, ETA, delivery location, incident flags. | realtime disconnected, data delayed, offline stale, delivered success. |
| Historial Pedidos | Repeat purchase. | OrderList, Filters, ReorderCTA, EmptyHistory. | reorder, view detail. | customer orders, pagination. | empty history; partial data delayed. |
| Detalle Pedido | Post-order truth. | OrderHeader, Items, PaymentReceipt, DeliveryProof, RefundPanel, SupportLink. | reorder, refund/support, download receipt. | order, payment, delivery, support case. | not found/expired guest token; refund pending. |
| Recompensas | Loyalty. | PointsBalance, TierProgress, RewardCards, RedemptionHistory. | redeem, view rules. | points, tiers, rewards, history. | no rewards empty; points delayed. |
| Perfil | Customer data. | ProfileForm, PhoneEmailVerification, DangerZone. | save, verify, delete request. | profile, verification status, consent. | validation/security reauth. |
| Direcciones | Address book. | AddressList, AddressForm, MapPin, CoverageValidator. | add, edit, delete, set default. | addresses, coverage zones, geocoding. | out-of-zone, map unavailable. |
| Notificaciones | Inbox/preferences. | NotificationList, ChannelPreferences, TemplatePreview. | mark read, opt in/out. | notifications, channel consent. | empty inbox; WhatsApp/email unavailable warning. |
| Configuracion | Preferences. | PreferencesForm, AccessibilityControls, PrivacyControls, SessionList. | save, logout, revoke session. | preferences, privacy settings, sessions. | reauth required. |
| Favoritos | Saved products. | FavoriteGrid, AvailabilityBadge, AddToCartCTA. | add to cart, remove. | favorites, product availability. | empty favorites; unavailable favorites. |
| Recompra | Reorder. | PriorOrderSummary, AvailabilityDiff, SubstitutionList, AddAllCTA. | reorder, substitute, edit cart. | original order, current products/prices, availability. | unavailable items; price changed warning. |
| Crear Cuenta Invitado | Guest conversion. | SignupForm, OrderLinkNotice, BenefitList. | create account, continue guest. | guest order token, email/phone. | duplicate account recovery. |
| Recuperar Cuenta Invitado | Guest/order recovery. | IdentifierForm, OTPForm, LinkedOrdersList. | request code, verify, link order. | email/phone, OTP, guest orders. | invalid/expired OTP; resend throttled. |
| Empty/Error/Offline Hubs | Reusable customer state screens. | StateIllustrationSlot, Message, RecoveryCTA, SupportCTA. | retry, go home/menu/support. | feature context, error code, cached content. | state-specific by definition. |

## 3. Guest checkout coverage

| Flow step | Happy path | Error path | Recovery path | Screens |
| --- | --- | --- | --- | --- |
| Guest discovery | Guest lands on Home, selects sucursal, browses Menu/Categoria/Producto. | Sucursal closed, product sold out, realtime delayed. | Select another sucursal, view cached menu, choose substitute. | C01-C04, C25-C27 |
| Guest cart | Adds configured products, applies eligible promo. | Modifier invalid, coupon invalid, price changed. | Inline correction, remove coupon, accept updated price. | C04, C06, C07 |
| Guest checkout | Enters name, phone/email, delivery/pickup, consent, payment. | Address outside coverage, missing contact, payment provider unavailable. | Change fulfillment, fix contact, retry later or save cart. | C08, C12, C27 |
| Guest payment | Mercado Pago approves. | Pending, rejected, duplicate callback, provider timeout. | Pending screen with polling, rejected retry, idempotent status refresh. | C10-C12 |
| Guest tracking | Guest tracking token opens Seguimiento Pedido. | Token expired/not found, realtime disconnected. | Verify email/phone, fallback polling, contact support. | C13, C15, C24 |
| Guest reorder | Guest uses order link to reorder. | Items unavailable, price changed. | Substitute, edit cart, login/create account to save. | C22, C23 |
| Guest account creation | After payment/tracking, guest creates account and links order. | Existing account, OTP failed. | Account recovery, resend OTP, support link. | C23, C24 |
| Guest account recovery | Guest identifies email/phone and verifies OTP. | Rate limited, expired code, no matching order. | Cooldown, resend, manual support case. | C24, S02/S03 via support |

## 4. Kitchen platform screen inventory

| Screen | Purpose | Components | Realtime requirements | Actions | Permissions |
| --- | --- | --- | --- | --- | --- |
| Dashboard Cocina | Summarize active prep health. | SLAKpis, StationLoad, ActiveOrders, DelayBanner, ModeControls. | Live counts within 5s; stale badge after 15s; polling fallback. | open queue, pause/saturate, view incident. | `pedido:read:sucursal`, `pedido:update:ops` |
| Cola General | Work queue. | QueueColumns, TicketCards, StationFilter, PriorityBadges, SoundAlerts. | New/updated tickets pushed immediately; reconnect resync. | start ticket, mark ready, filter. | `pedido:update:ops` |
| Ticket Cocina | Execution card. | ItemChecklist, ModifierBadges, Timer, IncidentButton. | Item status sync; optimistic update with rollback. | mark item/order ready, flag issue. | `pedido:update:ops` |
| Detalle Ticket | Full prep context. | CustomerNotes, AllergenWarnings, ItemDetails, Timeline, PrintButton. | Timeline updates live. | advance, print, incident. | `pedido:read:sucursal`, `pedido:update:ops` |
| Pedidos Prioritarios | Expedite view. | PriorityList, ReasonBadges, SLACountdown. | Priority changes live. | prioritize, de-prioritize, rebalance. | `pedido:update:ops` |
| Pedidos Retrasados | Delay recovery. | DelayList, ETAEditor, NotifyCustomerAction, EscalationPanel. | Delay list updates live; delayed data banner. | update ETA, escalate, notify. | `pedido:update:ops`, `ops:incident` |
| Pedidos Completados | Audit/handoff. | CompletedList, HandoffStatus, SearchFilters. | Near-realtime append; historical pagination. | view, reopen with approval. | `pedido:read:sucursal` |
| Incidentes Cocina | Incident management. | IncidentList, IncidentForm, LinkedOrders, RootCauseTags. | Incident changes live. | create, assign, close. | `ops:incident` |
| Configuracion Cocina | Local ops setup. | StationConfig, PrinterTest, SoundSettings, SLASettings. | No live dependency except device test. | save, test, reset. | `sucursal:manage` |
| Modo Pausa | Intake pause. | PauseReasonForm, ResumeScheduler, ImpactPreview. | Publish mode change immediately. | activate, schedule resume, cancel. | `sucursal:manage` |
| Modo Saturacion | Overload control. | CapacitySlider, ETAPreview, LimitedMenuToggle, CustomerImpactPreview. | Publish capacity and ETA live. | activate, adjust, end mode. | `sucursal:manage`, `ops:incident` |

## 5. Delivery platform screen inventory

| Screen | Purpose | Components | Realtime requirements | Permissions | Actions |
| --- | --- | --- | --- | --- | --- |
| Dashboard Entregas | Dispatch health. | DispatchKPIs, ActiveMapPreview, DelayList, CapacityMode. | Active deliveries and ETA live; stale map marker. | `pedido:read:sucursal` | open queue/map, view delay. |
| Cola Entregas | Assign ready orders. | ReadyQueue, DriverList, BatchSuggestions, SLAClock. | Ready orders push; assignment conflict lock. | `pedido:update:ops` | assign, batch, hold. |
| Detalle Entrega | Execute delivery. | AddressCard, ContactActions, StatusStepper, ProofCapture, IncidentCTA. | Status, customer contact, ETA live. | `pedido:update:ops` | pickup, en camino, delivered, failed, incident. |
| Mapa Entrega | Spatial operations. | Map, RoutePanel, DriverMarkers, OrderPins, ZoneOverlay. | Marker updates; fallback list if maps fail. | `pedido:read:sucursal` | navigate, optimize, filter. |
| Incidencias | Manage delivery incidents. | IncidentQueue, ResolutionPlaybooks, LinkedCasePanel. | Incident updates live. | `ops:incident` | create, assign, escalate, close. |
| Retrasos | Delay recovery. | DelayedDeliveries, ETAEditor, NotificationPreview. | Delay detection live. | `pedido:update:ops` | update ETA, notify, escalate. |
| Reasignaciones | Rebalance work. | AssignmentBoard, ReasonModal, AuditNotice. | Assignment locks live. | `pedido:update:ops`, `sucursal:manage` | reassign, unassign. |
| Historial Entregas | Traceability. | DeliveryHistory, ProofViewer, Filters. | Historical; delayed data marker. | `pedido:read:sucursal` | view, export if allowed. |
| Configuracion Operativa | Branch delivery settings. | ZoneEditor, CapacityRules, ETARules, HandoffSettings. | Settings publish live to checkout/tracking. | `sucursal:manage` | save, test zone, preview. |

## 6. Administration platform screen inventory

| Screen | Purpose | Permissions | Components | Actions | Dependencies |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Executive/ops overview. | `analytics:view` | KPIGrid, Alerts, RecentOrders, IncidentSummary. | drill down, export. | analytics, orders, incidents. |
| Productos | Catalog management. | `producto:manage` | ProductTable, ProductForm, ModifierEditor, AvailabilityToggle. | create, edit, archive, toggle. | products, categories, storage. |
| Categorias | Category management. | `producto:manage` | CategoryTree, SortableList, CategoryForm. | create, reorder, hide. | categories, products. |
| Promociones | Campaigns. | `promo:manage` | CampaignTable, RuleBuilder, EligibilityPreview. | create, pause, duplicate. | promos, coupons, analytics. |
| Cupones | Coupon controls. | `promo:manage` | CouponTable, CodeGenerator, LimitControls. | create, disable, export. | coupons, orders. |
| Clientes | Customer management. | `cliente:manage` | CustomerSearch, ProfileSummary, OrderTimeline, ConsentBadges. | view, segment, support link. | customers, orders, audit. |
| Pedidos | Order administration. | `pedido:read:sucursal`, `pedido:update:ops` | OrderTable, StatusFilters, PaymentPanel, RefundActions. | view, cancel, refund, update. | orders, payments, kitchen, delivery. |
| Sucursales | Branch management. | `sucursal:manage` | BranchTable, HoursEditor, ServiceModeControls, ZoneSummary. | create, edit, pause, close. | branches, maps, users. |
| Usuarios | User management. | `usuario:manage` | UserTable, InviteForm, AssignmentEditor, SessionControls. | invite, assign, disable. | auth, roles. |
| Roles | Role governance. | `role:manage` | RoleTable, PermissionPicker, AssignmentSummary. | create, edit, clone. | roles, permissions. |
| Permisos | Policy governance. | `permission:manage` | PermissionCatalog, PolicySimulator, RiskWarnings. | update, simulate, approve. | permissions, audit. |
| Configuraciones | Platform/org settings. | scoped `sucursal:manage`/`platform:operate` | SettingsSections, FeatureFlagControls, ImpactPreview. | save, rollback. | config, feature flags. |
| Notificaciones | Templates/campaigns. | `promo:manage`/`platform:operate` | TemplateEditor, ChannelStatus, TestSend. | edit, send test, pause. | notifications, email, WhatsApp. |
| Auditoria | Audit review. | `audit:view` | AuditSearch, EventTimeline, ExportControls. | search, inspect, export. | audit logs. |
| Logs | Logs and health. | `platform:operate` | LogViewer, ServiceHealth, TraceLink, IncidentCTA. | filter, inspect, create incident. | observability. |
| Analytics | Analytics navigation. | `analytics:view` | DashboardDirectory, SavedViews, Alerts. | open dashboard, save view. | analytics warehouse. |
| Reportes | Reports. | `analytics:view`, `analytics:export` | ReportBuilder, ScheduleManager, ExportHistory. | generate, schedule, download. | analytics, email. |

## 7. Support platform screen inventory

| Screen | Purpose | Permissions | Security controls | Audit requirements |
| --- | --- | --- | --- | --- |
| Dashboard Soporte | Prioritize cases, escalations, SLA, incidents, and access anomalies. | `support:case` | Row-level case scope, PII minimization, session timeout. | Dashboard filters and case opens logged. |
| Casos | Work queue for support cases. | `support:case` | Scoped assignment, sensitive tags hidden until need-to-know. | Assignment, status, filter export attempts logged. |
| Detalle Caso | Resolve case with order/customer context. | `support:case` | Mask PII by default, reveal requires reason, no payment secrets. | Every reveal/action/comment/status change logged. |
| Acceso Temporal | Request/use temporary customer/admin context. | `support:temporary_access` | Time limit, least scope, approval for sensitive scopes, watermark. | Request, approval, use, revoke, expiry logged. |
| Break Glass Requests | Emergency access governance. | `security:break_glass` | Dual control for high-risk scopes, mandatory incident link, automatic expiry. | Full immutable trail and post-review requirement. |
| Incidentes | Support incident coordination. | `ops:incident` | Owner assignment, severity controls, public/private notes. | Severity changes, linked cases, resolution logged. |
| Auditoria Accesos | Review access activity. | `audit:view` | Security-only filters, export justification, tamper-evident logs. | Search/export/review actions logged. |
| Escalaciones | Manage escalated cases. | `support:case` | SLA rules, owner required, cross-team visibility by scope. | Escalation create/assign/resolve logged. |
| Actividad Usuario | Inspect user/customer activity timeline. | `support:case` plus `audit:view` for sensitive events | PII masking, purpose limitation, temporary access prompt. | Query, reveal, linked case, export attempts logged. |

## 8. Franchise platform screen inventory

| Screen | Purpose | Permissions | Components | Actions |
| --- | --- | --- | --- | --- |
| Dashboard Franquiciante | Network-wide health for franchisor. | `franchise:view`, `analytics:view` | PortfolioKPIs, BranchMap, RankingPreview, Alerts. | compare, drill down, export. |
| Dashboard Franquiciado | Scoped health for franchisee. | `franchise:view` scoped | BranchKPIs, Tasks, PromoOpportunities, SLAStatus. | open task, view performance. |
| Comparativa Sucursales | Side-by-side branch comparison. | `franchise:view`, `analytics:view` | ComparisonTable, KPISelectors, VarianceHighlights. | select branches, export. |
| Ranking Sucursales | Rank branches. | `franchise:view` | RankingList, Badges, Filters. | filter, open branch. |
| Performance | Diagnose performance drivers. | `franchise:view`, `analytics:view` | DriverTree, TrendCharts, IncidentCorrelation. | inspect driver, create action. |
| Promociones Compartidas | Shared campaigns. | `franchise:manage`, `promo:manage` | CampaignLibrary, OptInControls, ComplianceBadges. | publish, opt in/out, pause. |
| Configuracion Marca | Brand standards and shared policies. | `franchise:manage` | BrandSettings, PolicyEditor, TemplateManager. | save, preview, publish. |
| Analytics Franquicia | Franchise analytics hub. | `franchise:view`, `analytics:view` | DashboardTabs, SavedViews, ExportControls. | analyze, save, export. |

## 9. Analytics platform screens

| Screen | Metrics | Filters | Exports | Permissions |
| --- | --- | --- | --- | --- |
| Ventas | GMV, net sales, AOV, order count, tax/fees, refund rate. | date, sucursal, channel, fulfillment, promotion, franchise. | CSV, XLSX, scheduled PDF. | `analytics:view`; `analytics:export` for exports. |
| Conversion | sessions, menu views, product views, add-to-cart, checkout start, paid order. | date, device, source, sucursal, cohort. | funnel CSV, chart image, scheduled report. | `analytics:view`. |
| Checkout | step drop-off, validation errors, payment approval/rejection/pending, provider latency. | date, payment method, device, sucursal, guest/auth. | CSV, incident-linked report. | `analytics:view`. |
| Carrito | cart value, abandonment, coupon usage, unavailable item rate, upsell acceptance. | date, device, category, promotion, sucursal. | CSV, cohort export. | `analytics:view`. |
| Clientes | new/returning, retention, LTV, frequency, churn risk, consent status. | date, cohort, sucursal, franchise, segment. | aggregated CSV; raw customer export requires elevated approval. | `analytics:view`, `analytics:export`. |
| Promociones | redemptions, incremental sales, margin impact, eligibility failures. | campaign, coupon, date, sucursal, channel. | campaign report. | `analytics:view`. |
| Recompensas | points issued/redeemed, breakage, tier movement, redemption conversion. | date, tier, reward, sucursal, cohort. | loyalty report. | `analytics:view`. |
| Sucursales | branch sales, capacity, SLA, open hours compliance, stock-outs. | date, branch, region, franchise, service mode. | branch scorecard. | `analytics:view`. |
| Cocina | prep time, queue length, station throughput, delayed tickets, incident rate. | date, station, branch, shift, product category. | operations CSV/PDF. | `analytics:view`. |
| Entregas | dispatch time, delivery time, ETA accuracy, failed delivery, reassignment rate. | date, branch, zone, operator, weather tag if available. | delivery report. | `analytics:view`. |
| Incidentes | count, severity, type, time to resolution, impacted orders/revenue. | date, severity, branch, platform, owner. | incident report. | `analytics:view`. |
| Auditoria | access events, denied attempts, break-glass use, temporary access duration, policy changes. | date, actor, role, permission, resource, risk. | compliance export with justification. | `audit:view`, `analytics:view`. |

## 10. State matrix

### 10.1 Universal state contract applied to every screen

| State | UI behavior | Recovery strategy | User feedback |
| --- | --- | --- | --- |
| Loading | Skeletons preserve layout; destructive actions disabled; primary CTA shows progress. | Query retry with exponential backoff; cached data used where safe. | “Cargando…” with domain-specific label. |
| Success | Primary content visible; CTA enabled based on permissions and data validity. | None; background refresh may update stale sections. | Confirmation toast for completed actions. |
| Error | Error panel inside content area; no blank screens. | Retry, go back, contact support, or safe fallback route. | Human-readable cause plus incident/reference code when available. |
| Empty | Purposeful empty state with next best action. | Seed recommendations, create first item, adjust filters. | Explains why no data exists and what to do next. |
| Offline | Cached content shown if safe; mutation CTAs disabled or queued only for allowed low-risk actions. | Reconnect watcher, manual retry, polling after reconnect. | Offline banner with last updated time. |
| Unauthorized | Login/verification prompt. | Redirect after authentication, preserve intended action/cart. | “Inicia sesión para continuar” or guest token verification. |
| Forbidden | Access denied page or inline locked controls. | Request access, switch scope, contact admin. | Shows required permission without exposing sensitive data. |
| Realtime Disconnected | Stale badge and fallback polling; operational screens show audible/visual warning. | Reconnect subscription, resync snapshot, conflict check. | “Datos en tiempo real desconectados; usando actualización periódica.” |
| Data Delayed | Content remains visible with delay indicator. | Refresh, expand diagnostics for ops/admin, continue read-only if unsafe. | Last successful update timestamp. |
| Maintenance Mode | Read-only or branded maintenance page by surface. | Respect maintenance window, offer support/status link. | Clear expected impact and retry guidance. |

### 10.2 State ownership by screen family

| Screen family | Screens | Special empty states | Special failure states | Offline/realtime rule |
| --- | --- | --- | --- | --- |
| Customer discovery | C01-C06 | No products, no promos, no search results. | Sucursal closed, out-of-coverage, sold out. | Cached menu allowed; availability marked stale. |
| Customer transaction | C07-C12 | Empty cart, missing address, no payment method. | Payment rejected/pending/provider unavailable, price changed. | Payment and checkout submit disabled offline; cart preserved. |
| Customer post-order | C13-C24 | No orders, no rewards, no favorites, no notifications. | Expired token, order not found, support unavailable. | Tracking shows last known status and polling fallback. |
| Kitchen operations | K01-K11 | No active tickets, no incidents, no completed tickets. | Update conflict, printer/device failure, station unavailable. | Realtime loss is critical; polling fallback plus supervisor alert. |
| Delivery operations | D01-D09 | No ready deliveries, no incidents, no history. | Map unavailable, assignment conflict, proof upload failed. | Map falls back to list; status updates require sync confirmation. |
| Admin management | A01-A17 | No records, no reports, no logs for filters. | Permission denied, validation conflict, export failed. | Mostly read-only cached; mutations disabled offline. |
| Support/security | S01-S09 | No cases/escalations/access requests. | PII reveal denied, approval expired, break-glass blocked. | Offline blocked for sensitive access; audit must be online. |
| Franchise | F01-F08 | No branches/campaigns/comparable data. | Scope mismatch, analytics delayed. | Cached aggregate data with stale timestamp. |
| Analytics | N01-N12 | No data for filters. | Warehouse delayed, export failed. | Cached dashboards allowed; exports disabled offline. |

## 11. Degradation scenarios

| Scenario | User experience | Operations experience | Fallback behavior |
| --- | --- | --- | --- |
| Realtime unavailable | Customer sees last known order status and polling banner. | Cocina/entregas see critical disconnected banner, polling queues, conflict checks. | Poll REST snapshots; disable unsafe rapid state transitions if conflict risk. |
| Supabase unavailable | Public cached menu may remain; checkout/account actions blocked with apology. | Ops screens switch to outage mode and show last snapshot; mutations blocked unless local queue explicitly approved. | Status page, incident creation via platform fallback, preserve carts locally. |
| Mercado Pago unavailable | Checkout shows payment unavailable and preserves cart. | Admin sees payment provider incident and failed conversion impact. | Retry later, alternate payment if configured, no duplicate order creation. |
| WhatsApp unavailable | App/inbox remains source of truth; customer sees channel warning. | Notification screen shows channel degraded; support uses email/app notes. | Email/app notifications; retry queue. |
| Email unavailable | Customer sees email delay warning but order tracking still works. | Support/admin channel health degraded. | WhatsApp/app notifications; queued email retry. |
| Slow API | Skeletons convert to delayed state after threshold; primary actions show progress. | Ops dashboards show data delayed and service latency. | Timeout with retry; cached read models; prevent duplicate submits by idempotency keys. |
| Partial outage | Affected modules show scoped outage, unaffected modules remain usable. | Incident banner with impacted services and links. | Feature flags disable affected flows; maintain core ordering if safe. |
| High traffic | Customer sees queue/ETA transparency; checkout remains protected from duplicate submit. | Ops dashboards show saturation recommendations. | CDN/cache menu, rate limits, queue admission, scale alerts. |
| Kitchen overload | Customer sees longer ETA or limited menu before checkout. | Modo Saturacion/Pausa enabled with station-level load. | Extend ETA, reduce availability, pause branch if required. |
| Delivery overload | Customer sees longer delivery ETA or pickup suggestion. | Delivery capacity dashboard recommends reassignment/batching. | Adjust zones/ETA, disable delivery temporarily, promote pickup. |

## 12. Permission matrix

| Screen group / screens | Role | Permission | Allowed actions |
| --- | --- | --- | --- |
| C01-C06 | Guest/cliente | `public:view` | browse menu, search, view promotions, configure products. |
| C07-C12 | Guest/cliente | `pedido:create` | manage cart, checkout, retry payment, view payment status with token/session. |
| C13, C15, C22 | Guest/cliente | `pedido:read:self` or guest token | track, view detail, reorder own order. |
| C14, C16-C21 | cliente | `cliente:self`, `pedido:read:self` as applicable | manage profile, addresses, rewards, notifications, favorites, history. |
| C23-C24 | Guest | `public:view` | create account, recover account/order via verification. |
| K01-K07 | operador_cocina | `pedido:read:sucursal`, `pedido:update:ops` | view and advance assigned kitchen tickets. |
| K08 | operador_cocina/supervisor_sucursal | `ops:incident` | create/update kitchen incidents. |
| K09-K11 | supervisor_sucursal/administrador_sucursal | `sucursal:manage` | configure kitchen, pause, activate saturation. |
| D01-D06, D08 | operador_entrega/supervisor_sucursal | `pedido:read:sucursal`, `pedido:update:ops` | view, assign, advance delivery, manage delays/incidents. |
| D07-D09 | supervisor_sucursal/administrador_sucursal | `sucursal:manage`, `pedido:update:ops` | reassign deliveries and configure delivery operations. |
| A01, A16, A17, N01-N11 | administrador_sucursal/administrador_organizacion | `analytics:view`, optional `analytics:export` | view dashboards, generate/export reports by scope. |
| A02-A05, A13 | administrador_sucursal/administrador_organizacion | `producto:manage` / `promo:manage` | manage catalog, categories, campaigns, coupons, notifications. |
| A06-A08 | supervisor_sucursal/administrador_sucursal/administrador_organizacion | `cliente:manage`, `pedido:read:sucursal`, `sucursal:manage` | manage customers, orders, and branches by scope. |
| A09-A12 | administrador_organizacion/security_admin/platform_operator | `usuario:manage`, `role:manage`, `permission:manage`, `platform:operate` | manage users, roles, permissions, settings. |
| A14, N12, S07 | security_admin/platform_operator | `audit:view` | inspect and export audit data with justification. |
| A15 | platform_operator | `platform:operate` | inspect logs, health, create incidents. |
| S01-S03, S08-S09 | soporte | `support:case` | work cases, escalate, inspect permitted activity. |
| S04 | soporte/security_admin | `support:temporary_access` | request, approve if authorized, use, revoke temporary access. |
| S05 | security_admin/platform_operator | `security:break_glass` | approve/deny emergency access and post-review. |
| S06 | soporte/platform_operator | `ops:incident` | manage support/platform incidents. |
| F01-F08 | administrador_organizacion/franchise roles | `franchise:view`, `franchise:manage` as applicable | view franchise data, manage brand settings/shared promos. |

## 13. Screen dependency matrix

| Screen group | Feature | Domain | Services | Queries | Events | Realtime dependencies | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C01-C06 | discovery | productos/promociones/sucursales | catalog, availability, search, analytics | product list/detail, categories, promos, branch availability | `producto_visto`, `busqueda_realizada`, `promo_vista` | availability updates, promo changes | CDN/images, geocoding optional |
| C07-C12 | checkout | carrito/checkout/pagos/promociones | cart, pricing, coupon, payment preference, order draft | cart summary, totals, payment status | `carrito_actualizado`, `checkout_iniciado`, `pago_estado_cambiado` | cart/order/payment status | Mercado Pago |
| C13-C24 | post_order_identity | pedidos/recompensas/clientes/notificaciones | order tracking, loyalty, profile, address, notification, auth | order detail/history, rewards, profile | `pedido_estado_cambiado`, `recompensa_canjeada`, `cuenta_creada` | order/courier/kitchen status, notification delivery | WhatsApp, email, maps, OTP |
| K01-K11 | kitchen_ops | cocina/pedidos/incidentes/sucursales | kitchen queue, ticket command, incident, mode control | active tickets, station load, incidents, completed tickets | `ticket_iniciado`, `ticket_listo`, `modo_cocina_cambiado`, `incidente_creado` | ticket queue and station updates | printers/devices optional |
| D01-D09 | delivery_ops | entregas/pedidos/incidentes/sucursales | dispatch, route, assignment, incident, zone config | ready queue, active deliveries, routes, delays | `entrega_asignada`, `entrega_estado_cambiado`, `retraso_entrega_detectado` | delivery status, assignment locks, map markers | maps/geocoding, WhatsApp |
| A01-A17 | admin | productos/promos/clientes/pedidos/sucursales/usuarios/audit | CRUD services, reporting, observability, notification admin | entity lists/details, admin KPIs, logs | `admin_config_changed`, `usuario_invitado`, `producto_actualizado` | order and incident admin updates | email/WhatsApp, storage |
| S01-S09 | support | soporte/audit/security/incidentes/clientes | case, access approval, audit, incident, customer activity | case queue/detail, access log, activity timeline | `caso_creado`, `acceso_temporal_otorgado`, `break_glass_aprobado` | case assignment and incident updates | email/WhatsApp optional |
| F01-F08 | franchise | franchise/sucursales/promociones/analytics | franchise analytics, brand config, campaign sharing | branch comparison, ranking, brand settings | `promo_compartida_publicada`, `estandar_marca_actualizado` | campaign opt-in/status | analytics warehouse |
| N01-N12 | analytics | analytics/audit | metrics, export, saved views | dashboard metrics, filter dimensions, export status | `dashboard_visto`, `export_solicitado` | export job status and delayed data warnings | warehouse, email for scheduled reports |

## 14. Screen-to-component matrix

| Screen group | Components used | Design system components | Feature components | Operational components | Reusable components | Missing components to build |
| --- | --- | --- | --- | --- | --- | --- |
| C01-C06 | discovery layouts, product cards, filters, promo cards. | Button, Card, Tabs, Badge, Sheet, Skeleton, Dialog, Toast. | ProductGrid, ModifierSelector, PromoCard, SucursalSelector. | AvailabilityBadge. | EmptyState, ErrorState, OfflineBanner. | SearchSuggestions, EligibilityExplainer. |
| C07-C12 | cart, checkout forms, payment status. | Form, Input, Select, Checkbox, RadioGroup, Alert, Progress. | CartItems, TotalsBreakdown, GuestCheckoutForm, PaymentStatusCard. | none. | StickyCTA, RecoveryCTA. | MercadoPagoStatusAdapter, PriceChangeResolver. |
| C13-C24 | tracking, identity, loyalty, profile. | Timeline, Card, Form, Badge, Accordion, Table/List. | OrderTimeline, RewardCard, AddressForm, FavoriteGrid. | ETAIndicator. | VerificationCodeInput, ConsentPanel. | GuestOrderLinker, StaleTrackingBanner. |
| K01-K11 | kitchen dashboards and queues. | DataTable, Card, Badge, Alert, Dialog, Toggle, Command. | TicketCard, StationFilter, SLAKpis. | QueueBoard, ModeControls, IncidentPanel, SoundAlert. | ConfirmAction, AuditNotice. | PrinterTestPanel, SaturationCapacityControl. |
| D01-D09 | dispatch and map operations. | DataTable, Card, Badge, Dialog, Tabs. | DeliveryDetail, AssignmentBoard. | DispatchQueue, RouteMap, DriverMarker, ZoneEditor. | StatusStepper, ProofViewer. | MapFallbackList, AssignmentConflictResolver. |
| A01-A17 | admin CRUD, reports, logs. | DataTable, Form, Dialog, Dropdown, Tabs, Tooltip, Pagination. | ProductForm, CampaignRuleBuilder, UserInviteForm, ReportBuilder. | ServiceHealth, IncidentCTA. | AuditNotice, ExportControls. | PermissionPolicySimulator, FeatureFlagImpactPreview. |
| S01-S09 | support case/security views. | DataTable, Timeline, Alert, Dialog, Badge, Textarea. | CaseQueue, CaseTimeline, AccessRequestForm. | IncidentLinkPanel. | PiiRevealGate, ApprovalStepper. | BreakGlassReviewPanel, WatermarkedAccessShell. |
| F01-F08 | franchise dashboards/settings. | Card, Table, Tabs, ChartContainer, Form. | BranchComparison, RankingList, BrandSettings. | ComplianceBadge. | ExportControls, SavedViews. | CampaignOptInMatrix, BrandPolicyPreview. |
| N01-N12 | analytics dashboards. | ChartContainer, Table, Tabs, DateRangePicker, Select, Button. | MetricCard, FunnelChart, CohortTable, ExportJobList. | DataFreshnessBanner. | FilterBar, SavedViews. | AuditRiskTrendChart, IncidentImpactExplorer. |

## 15. Critical user journeys matrix

| Journey | Screens involved | States involved | Permissions involved | Dependencies involved |
| --- | --- | --- | --- | --- |
| First Purchase | C01-C08, C10-C13, C23 optional | loading, success, validation error, payment pending/rejected, offline. | `public:view`, `pedido:create`, guest token. | catalog, cart, checkout, Mercado Pago, order tracking. |
| Repeat Purchase | C01, C14, C15, C21, C22, C09-C13 | empty history/favorites, unavailable items, price changed. | `cliente:self`, `pedido:create`, `pedido:read:self`. | order history, availability, rewards, payment. |
| Guest Purchase | C01-C08, C10-C13, C15, C23-C24 | guest validation, pending/rejected, expired token. | `public:view`, `pedido:create`, guest tracking token. | guest contact, payment, OTP optional. |
| Payment Failure | C07-C08/C09, C12, S02/S03 optional | payment rejected/provider unavailable, retry success. | `pedido:create`, `support:case` if escalated. | Mercado Pago, cart preservation, support. |
| Order Cancellation | C13/C15, A07, S03 | cancellation eligible/ineligible, refund pending. | `pedido:read:self`, admin `pedido:update:ops`. | orders, payments/refunds, audit. |
| Kitchen Delay | C13, K06, K08, A07, S06 | delayed data, realtime disconnected, incident. | kitchen `pedido:update:ops`, `ops:incident`. | kitchen queue, ETA notification, support. |
| Delivery Delay | C13, D06, D05, S06 | delayed delivery, map unavailable. | delivery `pedido:update:ops`, `ops:incident`. | delivery, maps, notifications. |
| Refund Request | C15, S02/S03, A07 | request submitted, pending approval, payment provider error. | `cliente:self`, `support:case`, admin order permissions. | payments, orders, audit. |
| Promotion Redemption | C06, C07, C08/C09, A04/A05, N06 | ineligible, expired, limit reached. | `public:view`, `pedido:create`, `promo:manage`. | promotions, coupons, pricing. |
| Reward Redemption | C16, C09, N07 | no points, reward ineligible, points delayed. | `cliente:self`, `pedido:create`. | loyalty, checkout pricing. |
| Support Request | C13/C15, S01-S03, S08 | case empty, escalated, access needed. | customer token/self, `support:case`. | cases, orders, notifications. |
| Temporary Access Request | S03-S05, S07, S09 | approval pending/denied/expired. | `support:temporary_access`, `security:break_glass`. | auth, audit, approvals. |
| Incident Management | K08/D05/S06/A15/N11 | incident created, linked, resolved, delayed analytics. | `ops:incident`, `platform:operate`. | incidents, logs, support, analytics. |
| Branch Administration | A01-A03, A07-A13, D09, K09-K11, N08-N10 | forbidden, validation conflict, maintenance. | `sucursal:manage`, `producto:manage`, `analytics:view`. | branches, catalog, ops settings. |
| Franchise Administration | F01-F08, A04, N01-N12 | scope mismatch, no comparable data. | `franchise:view`, `franchise:manage`, `analytics:view`. | franchise config, analytics, promotions. |

## 16. Wireframe blueprint

### 16.1 Customer wireframes

| Screens | Layout structure | Header | Navigation | Primary content | Secondary content | Actions | Sticky elements | Mobile adaptation | Desktop adaptation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C01 Home | Hero + rails + trust sections. | Brand, sucursal, account/cart. | Bottom nav mobile; top nav desktop. | HeroPedido, featured products, quick reorder. | Promo strip, rewards teaser. | pedir ahora, select branch. | CartFAB, bottom nav. | Single-column rails, thumb CTAs. | Multi-column hero/rails. |
| C02-C06 Discovery | Filter/search header + product/promo content. | Search, category, branch. | Category tabs and breadcrumbs. | Product grid/list or promo cards. | Filters, terms drawers. | add/apply/select. | CartFAB, filter bar. | Bottom sheets for filters/modifiers. | Left filters, grid. |
| C07 Cart | Cart list + totals. | Back, title, branch. | Checkout step indicator. | Items and modifiers. | Coupon, ETA, fees. | checkout, edit, remove. | Sticky checkout total. | Full-width item cards. | Two-column cart/summary. |
| C08-C09 Checkout | Step form + order summary. | Secure checkout header. | Stepper. | Contact/address/payment forms. | Summary, trust, consent. | pay, edit. | Sticky pay CTA. | Accordion sections. | Form left, summary right. |
| C10-C12 Payment status | Centered status card + recovery. | Minimal secure header. | None except back where safe. | Payment state, order hold. | Support/help. | retry, track, contact. | Primary recovery CTA. | Full-screen focus. | Centered card. |
| C13-C15 Order tracking/detail | Status timeline + order detail. | Order id, help. | Tabs detail/status/support. | Timeline/map/proof/items. | Receipt/support/refund. | support, reorder, cancel if eligible. | Status/CTA bar. | Vertical timeline. | Timeline plus detail side panel. |
| C16-C24 Account/loyalty | Account shell. | Account header. | Account menu/bottom nav. | Forms/lists/cards. | Help, privacy, benefits. | save, verify, redeem. | Save CTA where needed. | Stacked forms. | Sidebar account nav. |
| C25-C27 State hubs | State card. | Contextual or none. | Return links. | Message and recovery. | Support/reference. | retry/go/contact. | Recovery CTA. | Full-screen state. | Centered state panel. |

### 16.2 Operational, admin, support, franchise, and analytics wireframes

| Screens | Layout structure | Header | Navigation | Primary content | Secondary content | Actions | Sticky elements | Mobile adaptation | Desktop adaptation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| K01-K11 Cocina | Operations shell with status banner and queue workspace. | Branch, shift, realtime status, mode. | Side nav or top tabs by station. | Queue/tickets/SLA/mode forms. | Incidents, filters, device status. | start/ready/escalate/pause. | Realtime banner, action bar. | Tablet-first columns collapse to tabs. | Multi-column station boards. |
| D01-D09 Entregas | Dispatch shell with queue + map/detail. | Branch, realtime, capacity. | Dispatch tabs. | Queue, map, detail, assignment board. | Incidents, delays, history. | assign/update/reassign. | Realtime/map status banner. | Queue-first, map as sheet. | Split queue-map-detail. |
| A01-A17 Admin | Admin shell with sidebar and data workspace. | Organization/sucursal scope, user, alerts. | Persistent sidebar. | Tables/forms/dashboards. | Filters, audit, previews. | create/save/export/delete where allowed. | Unsaved changes bar. | Sidebar becomes drawer; cards before tables. | Full data table with side panels. |
| S01-S09 Support | Secure support shell with case context. | SLA, access mode, audit watermark. | Case/support/security tabs. | Case queue/detail/access workflows. | Customer/order context, audit panel. | reply/resolve/request access/escalate. | PII/access warning bar. | Case list/detail switcher. | Three-pane queue-detail-context. |
| F01-F08 Franchise | Franchise shell with portfolio scope. | Franchise scope, date range, export. | Dashboard tabs. | KPIs, comparisons, rankings, settings. | Alerts, standards, tasks. | compare/export/publish. | Scope/date filter bar. | KPI cards stacked. | Dashboard grid. |
| N01-N12 Analytics | Analytics shell with filters and dashboards. | Dashboard title, freshness, export. | Analytics tabs/sidebar. | Metric cards, charts, tables. | Definitions, saved views. | filter/save/export. | Filter bar, freshness banner. | Charts stacked, exports in menu. | Multi-chart responsive grid. |

## 17. Operational coverage report

| Area | Covered screens | Coverage proof |
| --- | --- | --- |
| Kitchen intake and execution | K01-K04 | Dashboard, queue, compact ticket, and detailed ticket cover daily prep from new paid order to ready handoff. |
| Kitchen exceptions | K05-K08, K10-K11 | Priority, delayed, incident, pause, and saturation modes cover overload and recovery. |
| Kitchen configuration | K09 | Stations, devices, SLA, and local settings are scoped before implementation. |
| Delivery dispatch and route | D01-D04 | Dashboard, queue, detail, and map cover assignment through live delivery. |
| Delivery exceptions | D05-D07 | Incidents, delays, and reassignment workflows cover failure and recovery. |
| Delivery configuration/history | D08-D09 | Traceability and local delivery settings are included. |
| Admin operations | A01-A17 | Catalog, orders, branches, users, roles, permissions, configs, notifications, audit, logs, analytics, and reports are covered. |

## 18. Support coverage report

| Scenario | Covered screens | Security/audit proof |
| --- | --- | --- |
| Customer asks about order | S01-S03, C13-C15 | Case access is scoped; order context is visible with masked sensitive data and audit trail. |
| Refund/cancellation support | S03, A07 | Support can coordinate; admin action remains permission-bound and audited. |
| Temporary support access | S04, S07, S09 | Time-bounded scope, approval, use, revoke, and review are explicitly covered. |
| Emergency access | S05, S07 | Break-glass requires security permission, incident link, expiry, and post-review. |
| Incident escalation | S06, S08, A15, N11 | Support, platform logs, and analytics incident impact are linked. |

## 19. Franchise coverage report

| Franchise need | Covered screens | Proof |
| --- | --- | --- |
| Franchisor oversight | F01, F03-F05, F08 | Network dashboard, comparisons, ranking, performance, and analytics hub are included. |
| Franchisee operations | F02, F05 | Scoped local dashboard and performance diagnostics are included. |
| Shared commercial campaigns | F06, A04-A05, N06 | Shared promotions, coupon controls, and promotion analytics are included. |
| Brand governance | F07 | Brand settings, standards, templates, and policy publication are included. |
| Branch benchmarking | F03-F04, N08 | Comparative and ranking workflows are covered. |

## 20. Coverage validation audit

| Audit dimension | Result | Evidence | Added/remediated scope |
| --- | --- | --- | --- |
| Missing screens | Passed | Registries include 27 customer, 11 kitchen, 9 delivery, 17 admin, 9 support, 8 franchise, and 12 analytics screens. | Added guest account creation/recovery and reusable customer state hubs beyond initial list. |
| Missing workflows | Passed | Critical journeys matrix covers first purchase, repeat purchase, guest purchase, payment failure, cancellation, delays, refunds, redemption, support, access, incidents, branch, and franchise administration. | Added guest reorder and order recovery paths. |
| Missing operational scenarios | Passed | Degradation scenarios cover realtime, Supabase, Mercado Pago, WhatsApp, email, slow API, partial outage, high traffic, kitchen overload, and delivery overload. | Added explicit fallback behavior per scenario. |
| Missing dashboards | Passed | Customer, cocina, entregas, admin, support, franchise, and analytics dashboard surfaces are registered. | Analytics hub split into 12 specialized dashboards. |
| Missing permission scopes | Passed | Canonical roles, permission vocabulary, and screen-group permission matrix cover every screen registry entry. | Added security, platform, franchise, and temporary access permissions. |
| Missing empty states | Passed | Universal state contract plus state ownership matrix defines empty states by screen family and customer state hubs. | Added C25 Customer Empty State Hub. |
| Missing failure states | Passed | Universal state matrix and degradation scenarios cover error, offline, realtime disconnected, data delayed, maintenance, unauthorized, forbidden. | Added C26/C27 error/offline hubs and operational stale data behavior. |
| Missing support scenarios | Passed | Support coverage report includes cases, escalations, temporary access, break-glass, access audit, user activity. | Added audit requirements per support screen. |
| Missing franchise scenarios | Passed | Franchise report includes franchisor, franchisee, ranking, comparison, shared promotions, brand config, analytics. | No gaps remain. |
| Implementation readiness | Passed | Each screen has purpose, actors, business goal, actions, dependencies, permissions, states, components, and textual wireframe guidance. | This document is now the official UI scope baseline. |
