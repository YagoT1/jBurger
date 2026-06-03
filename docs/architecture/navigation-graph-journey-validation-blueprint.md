# J Burguer — Definitive Navigation Graph and Journey Validation Blueprint

> **Language policy:** Business language is Spanish and technical language remains English, aligned with the approved architecture corpus.

> **Implementation status:** This is a pre-implementation navigation and journey validation blueprint. It validates reachability, discoverability, conversion efficiency, operational efficiency, support safety, mobile navigation, accessibility navigation, and recovery paths. It does **not** create visual designs, wireframes, mockups, or implementation details.

## 0. Navigation validation assertion

All screens from `screen-inventory-wireframe-blueprint.md` are treated as existing approved scope. This document proves that every role can reach required destinations, complete required business goals, recover from failures, and exit safely without critical dead ends, navigation traps, conversion bottlenecks, operational bottlenecks, or support bottlenecks.

### 0.1 Navigation principles

| Principle | Validation rule |
| --- | --- |
| Destination clarity | Every screen must expose one obvious primary destination and at least one safe recovery destination. |
| Role-scoped reachability | Navigation must reveal destinations only when the current role, tenant, sucursal, and permission scope allow them. |
| Conversion preservation | Customer navigation must preserve carrito, selected sucursal, checkout progress, payment status, and tracking context. |
| Operational speed | Cocina and entregas navigation must prioritize queue, ticket, assignment, incident, and degraded-mode shortcuts over exploration. |
| Support safety | Support navigation must require case context, purpose limitation, auditability, and approval where sensitive access is involved. |
| Mobile-first reach | Customer primary actions must remain within thumb-reachable bottom or sticky regions on mobile. |
| No dead-end states | Error, empty, forbidden, offline, realtime disconnected, and maintenance states must expose recovery or safe-exit navigation. |

### 0.2 Canonical navigation destinations

| Destination type | Meaning |
| --- | --- |
| Primary destination | The next screen most users should reach to complete the business goal. |
| Secondary destination | A common alternate path that supports evaluation, correction, or related work. |
| Shortcut destination | A speed path exposed from global, contextual, or emergency navigation. |
| Restricted destination | A destination hidden or locked unless permission/scope is valid. |
| Recovery destination | A destination used after error, empty, offline, forbidden, timeout, failed payment, delay, incident, or degraded service. |

## 1. Global navigation model

| Platform | Primary navigation | Secondary navigation | Contextual navigation | Shortcut navigation | Emergency navigation |
| --- | --- | --- | --- | --- | --- |
| Customer | Home, Menu, Carrito, Seguimiento, Perfil/Recompensas when authenticated. | Categoria, Producto, Busqueda, Promociones, Historial, Favoritos, Direcciones, Notificaciones, Configuracion. | Product recommendations, modifier edit, coupon eligibility, order support, reorder, address coverage, reward redemption. | CartFAB, sticky checkout/pay CTA, quick reorder, track current order, account creation from guest success. | Payment recovery, support case, offline cached menu, rejected payment retry, guest recovery, order tracking token verification. |
| Admin | Dashboard, Productos, Pedidos, Sucursales, Clientes, Promociones, Analytics, Usuarios, Auditoria. | Categorias, Cupones, Roles, Permisos, Configuraciones, Notificaciones, Logs, Reportes. | Entity detail side panels, scoped branch switcher, audit trail links, analytics drilldowns. | Create product, create promotion, search order/customer, generate report, open incident/log. | Maintenance mode, logs, audit, incident creation, permission/access review. |
| Kitchen | Dashboard Cocina, Cola General, Pedidos Retrasados, Incidentes Cocina, Configuracion Cocina. | Ticket Cocina, Detalle Ticket, Pedidos Prioritarios, Pedidos Completados. | Ticket status actions, station filters, SLA countdown, item-level modifiers, incident links. | Start next ticket, mark ready, escalate delay, activate pause/saturation. | Modo Pausa, Modo Saturacion, Incidentes Cocina, realtime reconnect, supervisor escalation. |
| Delivery | Dashboard Entregas, Cola Entregas, Mapa Entrega, Incidencias, Retrasos. | Detalle Entrega, Reasignaciones, Historial Entregas, Configuracion Operativa. | Delivery status stepper, route panel, driver assignment, proof capture, incident link. | Assign next delivery, update ETA, contact customer, reassign, navigate route. | Failed delivery, delay escalation, map fallback list, operational pause/zone adjustment. |
| Support | Dashboard Soporte, Casos, Escalaciones, Incidentes, Auditoria Accesos. | Detalle Caso, Acceso Temporal, Break Glass Requests, Actividad Usuario. | Case timeline, customer/order context, PII reveal gate, access request prompt, incident linking. | Open priority case, request temporary access, escalate case, create incident. | Break glass, revoke access, incident escalation, audit review, fallback contact channel. |
| Franchise | Dashboard Franquiciante/Franquiciado, Comparativa Sucursales, Ranking Sucursales, Performance. | Promociones Compartidas, Configuracion Marca, Analytics Franquicia. | Branch drilldown, KPI driver drilldown, campaign opt-in, standards review. | Compare branches, open ranking, publish shared promotion, export franchise report. | Pause shared campaign, notify franchisees, review impacted branches, incident analytics. |
| Analytics | Analytics landing, Ventas, Conversion, Checkout, Carrito, Clientes, Promociones, Recompensas, Sucursales, Cocina, Entregas, Incidentes, Auditoria. | Saved views, reports, exports, metric definitions. | Dashboard drilldowns, filter chips, cohort links, operational correlation links. | Export, save view, open related dashboard, schedule report. | Data delayed fallback, export retry, compliance audit view, incident impact view. |

## 2. Complete navigation graph

### 2.1 Customer navigation graph

| Screen | Inbound screens | Outbound screens | Primary destination | Secondary destination | Shortcut destinations | Restricted destinations | Recovery destinations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C01 Home | external, C13, C15, C20, C25-C27 | C02, C05, C06, C14, C16, C18 | C02 Menu | C06 Promociones | C07 Carrito, C13 current order | C16-C21 if unauthenticated | C25-C27, support entry |
| C02 Menu | C01, C03, C05, C06, C07, C22 | C03, C04, C05, C07 | C04 Producto | C03 Categoria | C07 Carrito | C21 favorite action if unauthenticated | C25 no products, C27 offline |
| C03 Categoria | C02, C05, C01 | C02, C04, C05, C07 | C04 Producto | C02 Menu | C07 Carrito | C21 favorite action if unauthenticated | C25 empty category, C26 invalid category |
| C04 Producto | C02, C03, C05, C21, C22 | C07, C02, C03, C21 | C07 Carrito after add | C02 Menu | C07 Carrito | C21 favorite save if unauthenticated | C26 validation/sold-out, C27 offline view-only |
| C05 Busqueda | C01, C02, C03, C06 | C04, C03, C06, C14 | C04 Producto | C06 Promociones | C07 Carrito | C14 order results if unauthenticated | C25 no results, C27 offline |
| C06 Promociones | C01, C02, C05, C07 | C07, C02, C04 | C07 Carrito | C02 Menu | C07 Carrito | personalized promos if unauthenticated | C25 no promos, C26 invalid coupon |
| C07 Carrito | C02-C06, C08-C12, C22 | C08, C09, C04, C06 | C08/C09 Checkout | C04 edit product | C13 current order | C09 if unauthenticated | C25 empty cart, C26 price/unavailable, C27 offline |
| C08 Checkout Invitado | C07, C12, C23 | C10, C11, C12, C23 | C10/C11 payment status | C23 Crear Cuenta | C07 Carrito | C09 authenticated checkout | C12 payment rejected, C26 validation, C27 offline |
| C09 Checkout Autenticado | C07, C12, C16, C18 | C10, C11, C12, C18, C16 | C10/C11 payment status | C18 Direcciones | C07 Carrito | none beyond account scope | C12 payment rejected, C26 validation |
| C10 Pago Pendiente | C08, C09, Mercado Pago return | C11, C12, C13, S02 entry | C13 Seguimiento when confirmed | C12 retry if expired/rejected | support entry | order detail without valid token | C12, C24 recover token |
| C11 Pago Aprobado | C08, C09, payment callback | C13, C23, C15 | C13 Seguimiento | C23 Crear Cuenta Invitado | C15 Detalle Pedido | account-only history | C24 if token lost |
| C12 Pago Rechazado | C08, C09, C10 | C08, C09, C07, S02 entry | retry Checkout | C07 Carrito | support entry | none | C26 payment help, C27 if offline |
| C13 Seguimiento Pedido | C10, C11, C15, notifications, guest link | C15, S02 entry, C24, C22 | C15 Detalle Pedido | support entry | current order shortcut | protected detail without token | C24 recover, C27 stale offline |
| C14 Historial Pedidos | C01, C20, C15, C22 | C15, C22, C02 | C15 Detalle Pedido | C22 Recompra | C07 Carrito | all if unauthenticated | C25 no history |
| C15 Detalle Pedido | C13, C14, C11, S03 link | C22, S02 entry, C13, C24 | C22 Recompra | support/refund entry | C13 tracking | other customers' orders | C24 guest recover, C26 not found |
| C16 Recompensas | C01, C09, C20 | C09, C02, C14 | C09 Checkout with reward | C02 Menu | reward redeem shortcut | unauthenticated users | C25 no rewards, C26 points delayed |
| C17 Perfil | C20, account nav | C20, C18, C19 | C20 Configuracion | C18 Direcciones | logout | guest users | C26 validation/reauth |
| C18 Direcciones | C09, C17, C20 | C09, C17, C02 | C09 Checkout if in flow | C17 Perfil | add address | guest saved address book | C26 out of coverage, map unavailable |
| C19 Notificaciones | C20, notification click | C13, C15, C20 | relevant notification destination | C20 Configuracion | current order | guest inbox | C25 empty inbox, channel recovery |
| C20 Configuracion | C01, C17-C19, C16, C21 | C17, C18, C19, C16, C21 | C17 Perfil | C19 Notificaciones | logout | guest-only | C26 reauth |
| C21 Favoritos | C20, C02, C04 | C04, C07, C02 | C04 Producto | C07 Carrito | add favorite to cart | unauthenticated | C25 no favorites |
| C22 Recompra | C14, C15, C11 | C07, C04, C02 | C07 Carrito | C04 substitute | checkout shortcut | non-owned orders | C26 unavailable/price changed |
| C23 Crear Cuenta Invitado | C08, C11, C13, C15 | C20, C24, C13 | C20 Configuracion/account | C13 tracking | C14 history after link | already-authenticated flow | C24 duplicate/recover |
| C24 Recuperar Cuenta Invitado | C10, C13, C15, C23, support link | C13, C15, C23 | recovered tracking/detail | C23 create account | resend verification | protected account data before verification | C26 OTP error, support entry |
| C25 Customer Empty State Hub | any customer empty state | C01, C02, C06, C14, C16, C21 | owning screen next best action | C01 Home | C07 if cart exists | permission-scoped destinations | C26 if retry fails |
| C26 Customer Error State Hub | any customer error | retry owning screen, C01, support entry | retry owning screen | support entry | C24 for auth/token | protected destinations | C27 if connectivity issue |
| C27 Customer Offline State Hub | any offline customer screen | cached C01-C07, retry, C13 stale | retry/reconnect | cached menu/cart | none | payment submit/PII changes | C26 if reconnect fails |

### 2.2 Kitchen, delivery, admin, support, franchise, and analytics navigation graph

| Screen | Inbound screens | Outbound screens | Primary destination | Secondary destination | Shortcut destinations | Restricted destinations | Recovery destinations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| K01 Dashboard Cocina | login, A01, K02-K11 | K02, K05, K06, K08, K10, K11 | K02 Cola General | K06 Retrasados | K10/K11 modes | K09 for non-supervisors | realtime recovery, K08 incident |
| K02 Cola General | K01, K03-K06 | K03, K04, K05, K06, K08 | K03 Ticket Cocina | K04 Detalle Ticket | next ticket | K09-K11 non-supervisors | K01 resync, K08 incident |
| K03 Ticket Cocina | K02, K04, K05 | K02, K04, K08, K06 | K02 next ticket | K04 detail | mark ready | supervisor-only reopen | K08 incident, K06 delay |
| K04 Detalle Ticket | K02, K03, K05-K07 | K03, K02, K08, K07 | K03 execution | K08 incident | print/escalate | reopen completed | K02 resync |
| K05 Pedidos Prioritarios | K01, K02, K06 | K04, K02, K08 | K04 priority ticket | K02 queue | prioritize | unauthorized priority changes | K08 incident |
| K06 Pedidos Retrasados | K01, K02, K05, alerts | K04, K08, S06, K11 | K04 delayed ticket | K08 incident | ETA update | customer PII | K11 saturation, S06 incident |
| K07 Pedidos Completados | K01, K04 | K04, K02 | K04 detail | K02 queue | search completed | reopen without approval | audit/reopen request |
| K08 Incidentes Cocina | K01-K06, S06 | K04, K06, S06, K01 | linked ticket/detail | S06 support incident | create incident | close without permission | K10/K11 modes |
| K09 Configuracion Cocina | K01, A08 | K01, K10, K11 | K01 dashboard | K10 pause | test device | non-supervisors | A15 logs if device failure |
| K10 Modo Pausa | K01, K09, K08 | K01, K09, A08 | K01 dashboard after change | K09 config | resume schedule | non-supervisors | K08 incident |
| K11 Modo Saturacion | K01, K06, K09 | K01, K02, K09 | K01 dashboard | K02 monitor | adjust capacity | non-supervisors | K08 incident |
| D01 Dashboard Entregas | login, A01, D02-D09 | D02, D04, D05, D06 | D02 Cola Entregas | D04 map | D06 delays | D09 non-supervisors | D05 incident, map fallback |
| D02 Cola Entregas | D01, D03, D06, K07 | D03, D04, D07 | D03 Detalle Entrega | D04 map | assign next | D07 non-supervisors | D05 incident |
| D03 Detalle Entrega | D02, D04-D08 | D04, D05, D06, D08 | next status | D04 map | contact/navigate | customer PII by role | D05 failed delivery |
| D04 Mapa Entrega | D01-D03, D06 | D03, D02, D07 | D03 selected delivery | D02 queue | route optimize | D07 non-supervisors | list fallback |
| D05 Incidencias | D01, D03, D06, S06 | D03, D06, S06, D02 | linked delivery | S06 support incident | create incident | close without permission | D07 reassignment |
| D06 Retrasos | D01, D03, D05 | D03, D05, D07, S06 | D03 delayed delivery | D05 incident | ETA notify | customer contact by role | D07 reassignment |
| D07 Reasignaciones | D02, D04-D06 | D03, D02, D01 | D03 assigned delivery | D02 queue | reassign | non-supervisors | D05 incident |
| D08 Historial Entregas | D01, D03 | D03, D01 | D03 detail | D01 dashboard | export if allowed | export restricted | audit/search retry |
| D09 Configuracion Operativa | D01, A08 | D01, D04 | D01 dashboard | D04 zone preview | test zone | non-supervisors | A15 logs/support |
| A01 Dashboard | login, A16, N01-N12 | A02, A07, A08, A16, A17 | relevant KPI drilldown | A15 incidents/logs | global search | restricted admin modules | A15 logs, S06 incident |
| A02 Productos | A01, C product issue, A03 | A03, A07, N04 | product edit | A03 categories | create product | unauthorized catalog manage | audit/rollback |
| A03 Categorias | A02, A01 | A02 | A02 product list | A01 dashboard | reorder | unauthorized manage | rollback |
| A04 Promociones | A01, F06, N06 | A05, N06, C06 | campaign detail | A05 coupon | create promo | unauthorized promo manage | pause/rollback |
| A05 Cupones | A04, N06 | A04, N06 | coupon detail | A04 promo | create coupon | unauthorized promo manage | disable coupon |
| A06 Clientes | A01, S03, N05 | A07, S03, N05 | customer detail | order timeline | search customer | PII restricted | support case |
| A07 Pedidos | A01, A06, C15, S03, K/D ops | C13, S03, A14, N03 | order detail | support case | refund/cancel if allowed | unauthorized refund/cancel | audit/support |
| A08 Sucursales | A01, F dashboards | K09, D09, A09, N08 | branch detail | ops config | pause/open branch | cross-scope branch | audit/rollback |
| A09 Usuarios | A01, A08, A10 | A10, A14 | user detail | role assignment | invite user | unauthorized manage | disable/revoke |
| A10 Roles | A09, A11 | A11, A14 | role detail | permission review | clone role | unauthorized role manage | rollback/audit |
| A11 Permisos | A10, A14 | A10, A14, S05 | policy detail | simulator | access review | unauthorized permission manage | audit/security review |
| A12 Configuraciones | A01, A15 | A01, A14 | setting section | impact preview | rollback | platform settings restricted | maintenance/logs |
| A13 Notificaciones | A01, A04 | A04, C19, A15 | template/campaign | channel health | test send | channel config restricted | fallback channel |
| A14 Auditoria | A07, A09-A12, S07, N12 | S07, N12, A15 | audit event detail | export | access review | export restricted | security escalation |
| A15 Logs | A01, A12, K09, D09, S06 | S06, A14 | service log detail | incident | create incident | platform-only logs | status/incident |
| A16 Analytics | A01, N01-N12 | N01-N12, A17 | dashboard selection | saved view | export | restricted analytics | data delayed |
| A17 Reportes | A01, A16, N dashboards | N01-N12, A13 | generated report | schedule | export | export restricted | retry/email fallback |
| S01 Dashboard Soporte | login, A01, incidents | S02, S08, S06, S07 | S02 cases | S08 escalations | priority case | security screens | S06 incident |
| S02 Casos | S01, C support entry, S03 | S03, S08, S06 | S03 case detail | S08 escalation | assign case | unauthorized case scope | S06 incident |
| S03 Detalle Caso | S02, A06, A07, C15 | S04, S08, S09, A07 | resolve case | request access | escalation | PII reveal restricted | S04 access request |
| S04 Acceso Temporal | S03, S05, S09 | S03, S07, S05 | approved access context | S07 audit | revoke access | unapproved scopes | S05 break glass |
| S05 Break Glass Requests | S04, S06, A11 | S04, S07, S06 | approve/deny request | audit review | emergency access | non-security roles | incident escalation |
| S06 Incidentes | S01, S05, K08, D05, A15 | S08, A15, N11 | incident detail | linked cases | create incident | close restricted | platform escalation |
| S07 Auditoria Accesos | S04, S05, A14 | A14, S05 | access event detail | export | review access | export restricted | security escalation |
| S08 Escalaciones | S01-S03, S06 | S03, S06 | escalation detail | incident link | assign owner | scope-restricted teams | S06 incident |
| S09 Actividad Usuario | S03, S04, A06 | S03, S04, S07 | timeline inspection | access request | reveal with reason | PII restricted | S04 temporary access |
| F01 Dashboard Franquiciante | login, A01, F03-F08 | F03, F04, F05, F08 | F03 comparison | F04 ranking | export | franchise scope | N11 incident analytics |
| F02 Dashboard Franquiciado | login, F05, F06 | F05, F06, N08 | F05 performance | F06 promotions | tasks | other franchise data | support/admin contact |
| F03 Comparativa Sucursales | F01, F04, F08 | F05, F04, N08 | F05 performance | F04 ranking | export | out-of-scope branch | no comparable data |
| F04 Ranking Sucursales | F01, F03, F08 | F05, F03 | F05 branch performance | F03 compare | filter/export | hidden branch scope | no ranking data |
| F05 Performance | F01-F04, F08 | N01, N08, N09, N10, F06 | KPI drilldown | action/campaign | export | restricted branch | N11 incident view |
| F06 Promociones Compartidas | F01, F02, F05, A04 | A04, N06, F07 | campaign publish/opt-in | performance | pause | promo manage restricted | rollback/pause |
| F07 Configuracion Marca | F01, F06 | F01, F06, A13 | publish standard | preview templates | notify branches | franchisor-only | rollback |
| F08 Analytics Franquicia | F01, F03-F05 | N01-N12, F03, F05 | analytics dashboard | comparison | export | analytics export restricted | data delayed |
| N01 Ventas | A16, A01, F08 | N02, N05, N08, A17 | sales analysis | branch drilldown | export | export restricted | data delayed |
| N02 Conversion | A16, N01 | N03, N04, A17 | funnel analysis | product/cart drilldown | export | none beyond analytics | data delayed |
| N03 Checkout | A16, N02, A07 | N04, A07, A17 | checkout drop-off | payment issue orders | export | order detail restricted | provider incident |
| N04 Carrito | A16, N02, N03 | A02, N06, A17 | cart analysis | product optimization | export | product manage restricted | data delayed |
| N05 Clientes | A16, N01, A06 | A06, N07, A17 | cohort analysis | customer segment | export | raw PII export | privacy review |
| N06 Promociones | A16, A04, F06 | A04, A05, A17 | promo performance | coupon detail | export | promo manage restricted | data delayed |
| N07 Recompensas | A16, N05, C16 | N05, A17 | loyalty analysis | segment | export | raw customer restricted | data delayed |
| N08 Sucursales | A16, A08, F03 | F03, F05, N09, N10 | branch analysis | franchise compare | export | branch scope | no data/delayed |
| N09 Cocina | A16, K01, N08 | K01, N11, A17 | kitchen analysis | incident correlation | export | ops screen restricted | delayed data |
| N10 Entregas | A16, D01, N08 | D01, N11, A17 | delivery analysis | incident correlation | export | ops screen restricted | delayed data |
| N11 Incidentes | A16, S06, K08, D05 | S06, A15, A17 | incident analysis | logs | export | platform logs restricted | incident fallback |
| N12 Auditoria | A16, A14, S07 | A14, S07, A17 | compliance analysis | access audit | export | security-only details | security review |

## 3. Customer journey validation

| Journey | Entry point | Steps | Decision points | Error paths | Recovery paths | Exit points | Success criteria | Max click depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First Purchase | C01 Home/external campaign | C01 → C02/C05 → C04 → C07 → C08/C09 → C10/C11 → C13 | sucursal, fulfillment, product modifiers, guest vs login, payment state | sold out, invalid modifier, address out of coverage, payment rejected | substitute, edit cart, pickup, retry payment, support | C13 tracking, C23 account creation | paid order created and trackable | 7 from home to approved payment |
| Guest Purchase | C01/C06/campaign | C01 → C02/C04 → C07 → C08 → C10/C11 → C13 | contact, consent, delivery/pickup, payment | OTP/contact invalid, provider unavailable, token lost | validation, retry, C24 recovery | C13, C15, C23 | guest can pay and track without forced account | 6 |
| Authenticated Purchase | login/home/reorder | C01/C14/C21 → C04/C22 → C07 → C09 → C11 → C13 | saved address, reward, payment, promo | saved address invalid, reward ineligible | C18 edit address, remove reward, retry | C13/C14 | paid order linked to account | 5 |
| Repeat Purchase | C14/C21/C22 | C14/C15/C21 → C22/C04 → C07 → C09 → C13 | availability, price changes, substitutions | unavailable items, expired promo | substitute/edit cart | C13 tracking | repeat order completed faster than first purchase | 4 |
| Loyalty Redemption | C16/C09 | C16 → C09 → C11/C12 | eligible reward, points balance | insufficient/delayed points | choose other reward, continue without reward | C13/C16 | reward redeemed or safe checkout continues | 4 |
| Promotion Redemption | C06/C07 | C06 → C07 → C08/C09 | eligibility, code limits, branch scope | invalid/expired coupon | remove coupon, view terms, pick eligible item | checkout/tracking | valid discount applied transparently | 4 |
| Address Management | C09/C20 | C20/C17 → C18 → C09/C02 | default address, coverage | out-of-zone, map unavailable | edit pin, pickup, choose branch | saved address or checkout resume | valid address available for checkout | 3 from checkout |
| Profile Management | C20 | C20 → C17 → C20 | verification required, sensitive change | validation, reauth | verify phone/email, retry | C20/account | profile saved and audit-safe | 3 |
| Notification Management | C19/C20 | C20 → C19 → relevant notification destination | channel opt-in/out | WhatsApp/email unavailable | fallback channel, app inbox | C13/C15/C20 | preferences saved and notifications reachable | 3 |
| Support Request | C13/C15/error state | C13/C15/C26 → support entry → S02/S03 by support | self-service vs case | support unavailable, token expired | C24 recovery, alternate channel | case created/resolved | customer has case/reference | 3 customer clicks |
| Refund Request | C15 | C15 → support entry → S03/A07 | eligibility, order state, payment state | refund unavailable/provider error | support review, retry provider, partial refund | C15/S03 | request captured and status visible | 3 customer clicks |
| Order Cancellation | C13/C15 | C13/C15 → cancel action or support → A07 | cancellation window, kitchen state | ineligible after prep/dispatch | support/refund/ETA update | C15/C13 | cancellation or clear explanation | 2 if eligible, 4 via support |

## 4. Conversion funnel validation

| Funnel | Conversion goal | Entry screens | Exit screens | Friction points | Drop-off risks | Optimization opportunities | Required metrics |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Discovery Funnel | visitor reaches product or cart | C01, C05, C06 | C04, C07 | branch selection, slow menu, no availability | no clear product path | featured products, search, branch defaults | session start, menu view, search, category click |
| Product Funnel | product configured and added | C02-C05, C21 | C07 | modifiers complexity, unavailable items | confusion about price/modifiers | smart defaults, clear price summary | product view, modifier error, add-to-cart rate |
| Cart Funnel | cart proceeds to checkout | C07 | C08/C09 | fees, coupon errors, item changes | sticker shock, unavailable item | transparent totals, recover unavailable items | cart view, coupon success/failure, checkout start |
| Checkout Funnel | checkout submits payment | C08, C09 | C10/C11/C12 | forms, address coverage, login pressure | forced account perception, validation loops | guest-first checkout, saved data, inline validation | form errors, checkout completion, guest/auth split |
| Payment Funnel | payment approved or recoverable | C10-C12 | C11/C13 | pending/rejected/provider latency | duplicate payment fear | pending explanation, idempotent retry | approval rate, rejection reason, retry success |
| Tracking Funnel | customer self-serves status | C11, C13, C15 | C15/support only if needed | stale realtime, unclear ETA | support contact spike | timeline clarity, delay explanations | tracking views, support deflection, ETA accuracy |
| Loyalty Funnel | reward drives purchase | C16, C09 | C09/C13 | ineligible rewards, hidden rules | disappointment at checkout | show eligibility before checkout | reward views, redemption, incremental orders |
| Reorder Funnel | prior order becomes paid order | C14, C15, C21, C22 | C13 | unavailable items, price changes | rebuild effort | substitutions, one-tap add all | reorder start, substitution rate, reorder conversion |

## 5. Guest experience validation

| Guest area | Friction | Dead ends | Trust risks | Conversion risks | Recovery paths |
| --- | --- | --- | --- | --- | --- |
| Guest Discovery | branch availability and delivery coverage may appear late | none if Home/Menu always link to branch/menu | stale availability | browsing unavailable products | C01 branch selector, C25 no products, C27 cached menu |
| Guest Checkout | contact and address fields add effort | blocked only when required data missing | uncertainty about account requirement | forced signup perception | explicit guest checkout, C23 optional after payment, C26 validation |
| Guest Payment | external provider redirect and pending state | provider timeout could trap user | duplicate payment fear | rejected payment abandonment | C10 pending, C12 retry, cart preservation, support entry |
| Guest Tracking | token-based access can expire/lost link | tracking inaccessible without recovery | no account means lower perceived control | support contacts | C24 recovery via email/phone verification |
| Guest Reorder | original link may be missing or items unavailable | reorder blocked by expired token | price/availability changes | lower repeat conversion | C22 substitution, C24 recovery, C23 account creation |
| Guest Account Creation | duplicate account and OTP friction | user can always continue as guest | privacy/consent concerns | signup abandonment | C24 recover existing account, benefits explanation |
| Guest Recovery | OTP throttling and no matching order | no dead end if support entry exists | identity verification confusion | lost order confidence | resend, cooldown, support case, tracking token verification |

## 6. Kitchen operation journeys

| Journey | Actors | Screens | Actions | Failure scenarios | Recovery scenarios | Success criteria |
| --- | --- | --- | --- | --- | --- | --- |
| New Order | operador_cocina, supervisor | K01, K02, K03 | notice ticket, start prep | realtime disconnected, duplicate ticket | resync queue, conflict detection | paid order appears once in correct station |
| Preparation | operador_cocina | K02-K04 | mark item/order ready | modifier missed, timer overdue | detail review, delay escalation | ticket completed accurately |
| Priority Escalation | supervisor, operador_cocina | K05, K04, K02 | prioritize/rebalance | priority overload | return to queue order, incident link | high-risk order addressed |
| Kitchen Delay | supervisor, soporte if needed | K06, K08, C13, S06 | update ETA, notify, escalate | ETA update failure, customer anxiety | incident, support, saturation | customer sees revised ETA and ops has owner |
| Kitchen Incident | operador_cocina, supervisor | K08, K04, S06 | create/link/close incident | missing owner/root cause | assign, escalate, link orders | incident resolved and traceable |
| Pause Mode | supervisor/admin | K10, K01, A08 | activate/schedule resume | accidental pause, customer impact | impact preview, rollback/resume | intake paused safely and visibly |
| Saturation Mode | supervisor/admin | K11, K06, K01 | adjust ETA/capacity/menu | too late activation | recommendation from delays, incident | continued safe sales with truthful ETA |

## 7. Delivery operation journeys

| Journey | Actors | Screens | Dependencies | Recovery paths | Success criteria |
| --- | --- | --- | --- | --- | --- |
| Dispatch | operador_entrega/supervisor | D01, D02 | ready order, delivery capacity | hold, delay management, pickup suggestion | order assigned or held with reason |
| Assignment | supervisor/operator | D02, D07, D03 | available operator, route/zone | reassignment, conflict resolver | single accountable delivery owner |
| Pickup | operador_entrega | D03, D04 | kitchen handoff, proof/status | incident if missing items | pickup confirmed and tracking updated |
| In Transit | operador_entrega/customer | D03, D04, C13 | route/map/contact | map fallback, customer contact, ETA update | customer sees en camino and ETA |
| Delivered | operador_entrega | D03, D08, C13 | proof/confirmation | proof upload retry | delivery completed and auditable |
| Failed Delivery | operador_entrega/soporte | D03, D05, S03 | customer contact, incident | support case, reschedule/refund | failure reason captured and customer path exists |
| Delay Management | supervisor/operator | D06, D05, C13 | ETA, route, notification | notify fallback, reassignment | revised ETA communicated |
| Reassignment | supervisor | D07, D02, D03 | operator availability, audit reason | revert/reassign again | no unowned active delivery |
| Incident Resolution | supervisor/support | D05, S06, N11 | incident owner, linked order | escalation/platform support | incident closed with root cause |

## 8. Support journeys

| Journey | Screens | Permissions | Audit requirements | Recovery paths | Approval requirements |
| --- | --- | --- | --- | --- | --- |
| Case Creation | S01-S03, customer support entry | `support:case` | source, customer/order link, assignment logged | create from order/tracking/error | none unless sensitive data requested |
| Case Resolution | S02-S03, S08 | `support:case` | comments, status, resolution logged | escalation, incident link | supervisor approval for policy exceptions |
| Refund Investigation | S03, A07, S09 | `support:case`, order permissions for admin action | PII reveal, payment review, refund decision logged | retry provider, partial refund, escalation | approval by refund policy threshold |
| Order Investigation | S03, A07, K/D detail links | `support:case` | order timeline views logged | incident/escalation | temporary access for sensitive context |
| Temporary Access | S04, S07, S09 | `support:temporary_access` | request, approval, usage, revoke, expiry logged | deny with reason, break glass if emergency | approver required for sensitive scopes |
| Break Glass | S05, S07, S06 | `security:break_glass` | full immutable trail and post-review | incident command center | security approval and incident link required |
| Incident Escalation | S06, S08, A15, N11 | `ops:incident` | severity, owner, linked cases logged | platform escalation | severity-based approval |
| User Activity Investigation | S09, S03, S04 | `support:case`, `audit:view` if sensitive | search, reveal, access context logged | temporary access request | approval for masked/sensitive events |

## 9. Admin journeys

| Journey | Screens | Approvals | Dependencies | Audit requirements | Rollback paths |
| --- | --- | --- | --- | --- | --- |
| Create Product | A02, A03 | catalog owner if required | category, modifiers, images, availability | create event and actor | archive product, restore prior availability |
| Update Product | A02, A14 | optional approval for price/critical fields | active orders, promos | before/after values | revert version, disable affected promos |
| Disable Product | A02, C menu impact, K/D awareness | supervisor for high-volume items | availability, active carts | reason and scope | re-enable product, substitute recommendation |
| Create Promotion | A04, A05, N06 | marketing/admin approval | products, branches, eligibility | rule definition and publish event | pause/disable campaign |
| Disable Promotion | A04, A05 | approval if active shared campaign | active carts/orders | reason, affected scope | re-enable or replacement promo |
| Create User | A09, A10 | manager/security for elevated roles | auth, role, branch assignment | invite and assignment logged | disable user, revoke sessions |
| Manage Roles | A10, A11 | security approval | permissions, users | role diff and assignment impact | revert role version |
| Manage Permissions | A11, A14 | security admin approval | policy model, audit | policy change and simulation result | rollback policy, emergency lockout recovery |
| Generate Reports | A17, A16, N dashboards | export approval for sensitive data | analytics warehouse, email | report/export requested and downloaded | rerun, cancel schedule, revoke link |
| Review Audit Logs | A14, S07, N12 | export justification | audit store | search/export logged | escalate security incident |

## 10. Franchise journeys

| Journey | Screens | Dependencies | Approval requirements | Metrics |
| --- | --- | --- | --- | --- |
| View Portfolio | F01, F08, N01/N08 | branch scope, analytics freshness | none for authorized franchisor | sales, SLA, incidents, branch count |
| Compare Branches | F03, F04, F05, N08 | comparable branch data | none; scope enforced | variance, ranking, prep/delivery SLA |
| Publish Shared Promotion | F06, A04, N06 | campaign rules, branch opt-in | franchisor/marketing approval | opt-in rate, redemption, margin impact |
| Review Standards | F07, F02 | brand policies/templates | franchisor approval for changes | compliance status, branch tasks |
| Review Performance | F05, F08, N01-N11 | analytics and incidents | none for view; action approval by policy | KPI drivers, incident impact, trend |

## 11. Analytics journeys

| Journey | Entry point | Filters | Exports | Dependencies | Success criteria |
| --- | --- | --- | --- | --- | --- |
| Sales Analysis | A16/N01/F08 | date, sucursal, channel, fulfillment, franchise | CSV/XLSX/PDF | analytics warehouse | user identifies sales trend and driver |
| Conversion Analysis | N02 | date, device, source, branch, cohort | funnel CSV/report | event stream | user identifies funnel bottleneck |
| Checkout Analysis | N03 | payment method, device, guest/auth, branch | CSV/incident report | checkout/payment events | payment or form issue diagnosed |
| Operations Analysis | N08-N10 | branch, shift, station/zone, date | ops report | kitchen/delivery data | SLA and capacity issue identified |
| Loyalty Analysis | N07/N05 | tier, cohort, reward, branch | loyalty report | loyalty/orders | reward ROI understood |
| Incident Analysis | N11/S06 | severity, type, branch, owner | incident report | incidents/logs/orders | root cause and impact visible |
| Compliance Analysis | N12/A14/S07 | actor, role, permission, resource, date | compliance export | audit store | access risk reviewed and traceable |

## 12. Dead-end detection

| Audit item | Findings | Corrections required |
| --- | --- | --- |
| Screens with no logical exits | None acceptable. State hubs, payment states, support access, and analytics exports must all expose back/retry/home or owner context. | Enforce recovery destination on every screen and state. |
| Screens with too many exits | Home, Dashboard, Admin Dashboard, Analytics landing, Support Dashboard can become overloaded. | Prioritize primary CTA, group secondary destinations, hide restricted destinations. |
| Screens with confusing exits | Pago Pendiente, Pago Rechazado, Break Glass, Temporary Access, Reasignaciones. | Label safe primary action and explain consequences before leaving. |
| Screens with circular navigation | Menu ↔ Categoria ↔ Producto; Cart ↔ Checkout; Case Detail ↔ Access Request. | Preserve context and show breadcrumb/back-to-task action. |
| Excessive click depth | Guest recovery, refund support, report export with sensitive data. | Add shortcuts from tracking/detail/report screens to recovery/request flows. |
| Screens requiring shortcuts | C07, C13, K02, K06, D02, D06, S02, S03, A07, A15, F03, N03, N11, N12. | Provide sticky or contextual shortcuts listed in the navigation graph. |

## 13. Click depth audit

| Critical action | Ideal depth | Maximum acceptable | Current estimated | Risk assessment | Optimization recommendations |
| --- | --- | --- | --- | --- | --- |
| Add product to cart | 2 | 4 | 2-3 | Low unless modifiers are complex | default modifiers, sticky add button |
| Checkout | 1 from cart | 2 | 1 | Low | sticky checkout CTA and preserved cart |
| Track order | 1 after payment | 2 | 1 | Low | current order shortcut and notification deep link |
| Redeem reward | 2 | 4 | 2-3 | Medium if reward starts outside checkout | reward shortcut from checkout and eligibility preview |
| Open support case | 2 from order | 4 | 2-3 | Medium during token issues | support CTA from tracking/detail/error states |
| Assign delivery | 1 from queue | 3 | 1-2 | Low | assign-next shortcut and conflict feedback |
| Advance kitchen ticket | 1 from ticket | 2 | 1 | Low | large primary action and keyboard/touch shortcut |
| Generate report | 2 from analytics/admin | 4 | 2-3 | Medium for export approval | saved report templates and export status shortcut |
| Create product | 2 from admin | 4 | 2 | Low | create shortcut on Productos |
| Review audit access | 2 from security/support | 4 | 2-3 | Medium due scope filters | contextual audit links from access screens |
| Activate pause/saturation | 1 from kitchen dashboard | 2 | 1 | Medium because action is high impact | confirmation, impact preview, supervisor-only shortcut |
| Reassign delivery | 2 from delay/detail | 3 | 2 | Medium under overload | direct reassignment shortcut from delay screen |

## 14. Mobile navigation validation

| Mobile concern | Validation | Friction points | Required correction |
| --- | --- | --- | --- |
| Thumb reachability | Customer primary CTAs use bottom nav, CartFAB, and sticky checkout/pay/tracking actions. | Product modifier sheets can push CTA below fold. | Sticky add/pay CTA remains visible after validation. |
| Bottom navigation | Customer top destinations fit Home/Menu/Carrito/Seguimiento/Perfil. | Too many account destinations. | Account destinations remain behind account hub. |
| Sticky actions | Cart, checkout, product, tracking, kitchen ticket, delivery detail require sticky primary actions. | Sticky bars may conflict with keyboard. | Keyboard-aware safe area. |
| Floating actions | CartFAB useful in discovery only. | FAB clutter on checkout/tracking. | Hide FAB on transactional focus screens. |
| Drawer usage | Admin/support/franchise sidebars become drawers. | Deep admin tables can lose context. | Persistent title, scope, and back-to-list controls. |
| Modal usage | Destructive or high-impact confirmations only. | Modal stacks risk traps. | One modal at a time; escape/back closes safely. |
| Sheet usage | Filters, modifiers, address, map detail. | Nested sheets confuse back behavior. | Use breadcrumbs or replace, not stack, nested sheets. |
| Checkout flow | Accordion/step sections reduce scroll. | Guest form length. | Inline validation and progress summary. |
| Tracking flow | Timeline remains top; support is secondary. | Map can dominate small screens. | Map collapses below timeline. |
| Support flow | Customer support entry must be simple; agent support shell tablet/desktop preferred. | Mobile support case detail dense. | Case list/detail switcher and PII warning bar. |

## 15. Accessibility navigation audit

| Area | Validation rule | Risk | Required correction |
| --- | --- | --- | --- |
| Keyboard navigation | All navigable elements reachable in logical order; operational actions have visible focus. | Dense queues/tables. | Roving focus for boards and tables, skip links. |
| Focus order | Focus follows visual/task order and returns to triggering element after dialog/sheet. | Checkout and support access modals. | Explicit focus management and focus restoration. |
| Screen readers | Screen names, status changes, errors, timers, and realtime disconnection announced. | Kitchen/delivery live updates too noisy. | Polite/critical live-region rules by severity. |
| Reduced motion | Navigation and state transitions work without motion. | Tracking/ETA animations. | Static timeline alternatives. |
| Error recovery | Errors identify field, cause, and recovery target. | Payment/provider errors. | Error summary links to relevant field/action. |
| Navigation consistency | Same destinations maintain same labels across platforms. | Mixed account/support labels. | Canonical Spanish business labels. |
| Shortcut safety | Keyboard shortcuts cannot trigger destructive actions without confirmation. | Operational speed actions. | Confirmation for pause, saturation, cancellation, break glass. |

## 16. Journey failure analysis

| Failure | Affected screens | Affected users | Recovery strategy | Fallback navigation |
| --- | --- | --- | --- | --- |
| Payment Failure | C08-C12, A07, N03 | guests/clientes/admin/support | preserve cart, explain rejection, retry/change method, support | C12 → C08/C09/C07/support |
| Realtime Failure | C13, K01-K08, D01-D07 | customers/ops/support | stale badge, polling, resync, conflict detection | operational dashboard → incident/reconnect |
| Notification Failure | C13, C19, A13, S03 | customers/admin/support | app/inbox as source of truth, alternate channel, retry queue | notification status → tracking/support |
| Kitchen Failure | K02-K11, C13, S06, N09 | cocina/customers/support | pause/saturation, ETA updates, incident management | K06/K08/K10/K11, C13 support |
| Delivery Failure | D03-D07, C13, S06, N10 | delivery/customers/support | incident, reassignment, ETA update, failed delivery resolution | D05/D06/D07, support case |
| Support Failure | S01-S09, C15 | customers/soporte/security | escalation queue, fallback channel, platform incident | C15 alternative channel, S06 incident |
| Analytics Failure | A16-A17, N01-N12, F08 | admin/franchise/security | data freshness banner, cached aggregate, export retry | report retry, logs/incident |
| Permission Failure | all protected screens | all roles | forbidden screen with required permission and access request route | request access, switch scope, safe dashboard |

## 17. Coverage scorecard

| Area | Score | Deductions | Readiness statement |
| --- | --- | --- | --- |
| Customer Navigation | 9 | Guest recovery and refund paths require careful labeling to avoid anxiety. | Ready with explicit recovery CTAs. |
| Operations Navigation | 9 | Realtime failure and overload modes are high-risk if alerts are not prominent. | Ready with emergency navigation shortcuts. |
| Admin Navigation | 8 | Broad admin scope can become dense without strong grouping/search. | Ready if role-filtered sidebar and global search are enforced. |
| Support Navigation | 9 | Temporary access and break glass must avoid shortcut misuse. | Ready with approval/audit gates. |
| Franchise Navigation | 8 | Cross-scope branch visibility can confuse franchisees. | Ready with persistent scope indicators. |
| Analytics Navigation | 8 | Analytics dashboards can encourage over-navigation without saved views. | Ready with dashboard directory and related-dashboard links. |
| Accessibility | 8 | Operational live regions and dense boards require strict QA. | Ready for implementation with explicit focus/live-region rules. |
| Mobile UX | 9 | Admin/support mobile remains complex but acceptable as secondary. | Customer and operational mobile/tablet flows are ready. |
| Conversion Readiness | 9 | Payment provider and guest token recovery remain key risk points. | Funnel has no critical dead ends. |
| Operational Readiness | 9 | Overload actions are high-impact and need confirmation. | Queue, delay, incident, pause, and saturation paths are complete. |

## 18. Final navigation audit

| Audit dimension | Result | Evidence | Additions made in this blueprint |
| --- | --- | --- | --- |
| Missing Journeys | Passed | Customer, cocina, entrega, soporte, admin, franchise, and analytics journeys are enumerated with recovery and success criteria. | Added guest recovery, support access, compliance, pause/saturation, reassignment, and export journeys. |
| Missing Navigation | Passed | Every screen ID from the screen inventory has inbound, outbound, primary, secondary, shortcut, restricted, and recovery destinations. | Added complete navigation graph tables. |
| Missing Recovery Paths | Passed | Failure analysis and graph recovery destinations cover payment, realtime, notification, kitchen, delivery, support, analytics, and permission failures. | Added fallback navigation per failure. |
| Missing Shortcuts | Passed | Click depth and dead-end audits identify required shortcuts for conversion, operations, support, analytics, and emergency actions. | Added shortcut destinations per screen. |
| Missing Operational Paths | Passed | Kitchen and delivery journeys cover new order, prep, escalation, delay, incident, pause, saturation, dispatch, assignment, pickup, delivery, failure, reassignment. | Added success criteria and recovery paths. |
| Missing Support Paths | Passed | Support journeys cover case creation/resolution, refund/order investigations, temporary access, break glass, incident escalation, and user activity. | Added approval and audit requirements. |
| Missing Analytics Paths | Passed | Analytics journeys cover sales, conversion, checkout, operations, loyalty, incident, and compliance analysis. | Added filters, exports, dependencies, success criteria. |
| Critical dead ends | Passed | No screen is allowed to terminate without retry, back-to-context, safe dashboard/home, support, or access request path. | Added dead-end corrections. |
| Conversion bottlenecks | Passed | Funnel validation identifies risks and optimizations from discovery through reorder. | Added required metrics per funnel. |
| Navigation readiness | Passed | Scorecard scores all areas 8–9 with deductions documented and no blocking gaps. | This document is the official navigation and journey validation baseline. |
