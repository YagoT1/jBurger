# J Burguer — UX/UI Production Blueprint

> **Language policy:** This document is governed by `docs/architecture/language-standard-business-spanish-technical-english.md`: business language is Spanish and technical language remains English. Business labels, domain concepts, workflows, statuses, dashboard labels, and customer-facing terminology must use Spanish. Technical UX, UI, frontend, analytics, accessibility, and infrastructure terminology may remain in English.

> **Implementation status:** This is a production UX/UI blueprint. It does not define code, visual mockups, wireframes, or component implementation. It defines the experience architecture that Product, Design, Frontend, Operaciones, Cocina, Entregas, Marketing, and Soporte must use before visual design and implementation begin.

## 0. Scope and non-negotiables

### 0.1 Mission

J Burguer must feel like a premium ordering product, not a brochure site. The experience must move a cliente from appetite to paid pedido with the fewest possible decisions, while increasing confianza, valor promedio del pedido, recompra, and operational clarity.

### 0.2 Non-negotiable product rules

1. **Mobile-first by default:** every core journey must be designed first for one-handed mobile use.
2. **Carrito always recoverable:** the cliente must never lose context, selected productos, modifier decisions, direccion, or payment progress because of navigation, refresh, reconnect, or login prompts.
3. **Checkout must be shorter than browsing:** finalizacion_compra must never introduce unnecessary account creation, redundant fields, or hidden delivery costs.
4. **Operational truth beats decorative UI:** cocina, entregas, and sucursal interfaces prioritize queue accuracy, status clarity, and exception handling over brand animation.
5. **Spanish business language only:** labels such as pedido, carrito, sucursal, entrega, recompensa, cupon, promocion, direccion, pago, and cliente are canonical.
6. **Premium does not mean slow:** motion, imagery, and typography must support speed, clarity, and conversion.
7. **Every conversion surface must have an owner:** home, menu, detalle_producto, carrito, finalizacion_compra, seguimiento_pedido, recompensas, and operaciones require measurable KPIs.

### 0.3 Reference handling

The provided reference aesthetic is treated only as market context. The platform must not copy layouts, assets, images, copy, animation, or interaction patterns. The target experience is more premium, more modern, more scalable, more mobile-first, and more conversion-focused.

## 1. Experience Vision

### 1.1 Experience philosophy

The platform must compress the emotional gap between seeing an appetizing hamburguesa and completing a pedido. The experience must combine high appetite appeal with operational trust: the cliente should feel the brand is desirable, fast, reliable, and in control of the entire journey.

### 1.2 Emotional positioning

| Attribute | Required feeling | UX implication |
| --- | --- | --- |
| Premium | The product feels crafted, generous, and worth paying for. | Hero imagery, decisive typography, restrained animation, clear quality cues, confident pricing. |
| Fast | The cliente can order before motivation fades. | Persistent carrito, minimal taps, preselected defaults, quick reorder, compact checkout. |
| Addictive | Returning feels rewarding and familiar. | Favoritos, ultimos pedidos, recompensas, milestones, personalized suggestions. |
| Effortless | Decisions are simplified without removing control. | Smart defaults, modifier grouping, clear combo upgrades, frictionless direccion and pago. |
| Reliable | The cliente trusts ETA, availability, and payment state. | Realtime estados, transparent stock/branch availability, payment confirmation, delivery reassurance. |
| Modern | The brand feels digital-native. | Mobile app-like navigation, fluid feedback, subtle motion, systemized components. |

### 1.3 Brand perception principles

- **Crave first:** visual and content hierarchy should lead with producto desirability before operational details.
- **Confidence second:** delivery estimate, pickup readiness, sucursal availability, and payment trust must be visible before checkout commitment.
- **Action third:** every page must make the next action obvious without feeling aggressive.
- **Memory fourth:** repeat behavior must be easier than first-time behavior.

### 1.4 Customer expectations

Clientes expect:

- menu loading quickly on mobile data;
- actual availability by sucursal;
- transparent precios, cargos, promociones, and delivery times;
- easy customization without making mistakes;
- guest checkout;
- Mercado Pago reliability;
- WhatsApp/email updates that match the app status;
- visible reassurance when cocina or entrega is delayed.

### 1.5 Mobile-first philosophy

Mobile UX must assume:

- one-handed use;
- thumb-zone primary actions;
- intermittent connectivity;
- low patience during hunger moments;
- users switching between WhatsApp, maps, Mercado Pago, and browser tabs;
- night ordering with reduced attention;
- shared decision-making for family/group pedidos.

### 1.6 Conversion philosophy

Conversion must be driven by relevance, not pressure:

- show the fastest path to a pedido;
- present upgrades where they make contextual sense;
- use scarcity only when operationally true;
- explain value of combos and recompensas;
- recover abandoned carrito respectfully;
- optimize for paid pedidos and repeat pedidos, not vanity clicks.

## 2. Personas

### 2.1 First-time cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Discover whether the brand is worth trying, understand menu quality, avoid checkout risk. |
| Frustrations | Unknown delivery coverage, unclear precios, too many choices, forced account creation. |
| Behavior patterns | Scans hero, best sellers, social proof, delivery area, payment methods, promotions. |
| Conversion opportunities | First-pedido incentivo, clear menu preview, guest checkout, trust badges, visible ETA, best-seller shortcuts. |

### 2.2 Returning cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Repeat a known pedido quickly, reuse direccion and pago, check new promociones. |
| Frustrations | Having to rebuild the same carrito, lost preferences, irrelevant suggestions. |
| Behavior patterns | Looks for ultimos pedidos, favoritos, recompensas, and delivery estimate. |
| Conversion opportunities | Repetir pedido, modifier memory, direccion default, personalized upsell, loyalty progress. |

### 2.3 Frequent cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Speed, exclusivity, rewards, recognition, reliable operations. |
| Frustrations | No visible benefit from loyalty, slow checkout, repeated availability surprises. |
| Behavior patterns | Uses quick actions, compares rewards, responds to limited editions. |
| Conversion opportunities | Tier progress, early access, surprise recompensa, saved combos, one-tap reorder. |

### 2.4 Family pedido cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Feed multiple people, manage preferences, avoid missing items, control total spend. |
| Frustrations | Complex modifiers, unclear portions, hard item editing, no group structure. |
| Behavior patterns | Builds larger carrito, needs item labels, reviews order carefully. |
| Conversion opportunities | Family combos, item notes, duplicated items, bundle savings, desserts/beverages cross-sell. |

### 2.5 Group pedido cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Coordinate a shared pedido for friends/work, split preferences, reduce decision chaos. |
| Frustrations | Long back-and-forth, unavailable items late, no clear item ownership. |
| Behavior patterns | Shares screenshots/links, changes carrito repeatedly, confirms final total. |
| Conversion opportunities | Shareable carrito summary, named items, combo suggestions, time-boxed checkout reminders. |

### 2.6 Late-night cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Fast comfort food, minimum decisions, reliable delivery. |
| Frustrations | Closed sucursal discovered too late, long ETA, failed payment, complicated navigation. |
| Behavior patterns | Goes directly to best sellers, uses saved direccion, values ETA and open status. |
| Conversion opportunities | Open-now indicator, late-night menu, quick checkout, high-contrast mode, WhatsApp reassurance. |

### 2.7 Pickup cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Avoid delivery cost, pick up fast, coordinate arrival time. |
| Frustrations | Unclear pickup readiness, branch confusion, no parking/arrival instructions. |
| Behavior patterns | Selects sucursal early, checks estimated preparation time, tracks cocina status. |
| Conversion opportunities | Pickup-first CTA, sucursal distance, readiness ETA, pickup instructions, scheduled pickup. |

### 2.8 Delivery cliente

| Dimension | Definition |
| --- | --- |
| Motivations | Convenience, reliable ETA, live updates, contactless confidence. |
| Frustrations | Coverage uncertainty, late delivery, no driver visibility, poor address validation. |
| Behavior patterns | Enters direccion early, monitors seguimiento_pedido, expects notifications. |
| Conversion opportunities | Address coverage validation, delivery ETA before checkout, live status, delivery proof, reorder prompt. |

## 3. Customer Journey

### 3.1 Journey map

| Stage | Cliente question | Primary touchpoints | UX requirements | Conversion risk | Required instrumentation |
| --- | --- | --- | --- | --- | --- |
| Discovery | Is this worth ordering from? | Home, SEO result, social link, promocion link, branch landing. | Strong appetite hero, fast menu preview, trust signals, delivery/pickup clarity. | Bounce before menu. | source, landing_page, first_menu_view. |
| First visit | Can I order where I am? | Home, selector_sucursal, direccion prompt. | Non-blocking location prompt, manual direccion fallback, open/closed status. | Asking too much too early. | branch_selected, coverage_checked. |
| Menu exploration | What should I eat? | Menu, categorias, buscador, featured productos. | Sticky categoria tabs, best sellers, clear pricing, image performance. | Choice overload. | categoria_viewed, producto_viewed, search_used. |
| Product evaluation | Is this item right for me? | Detalle_producto, modifiers, allergen/nutrition sections. | Large product image, ingredients, customization defaults, combo upgrade. | Modifier confusion. | modifier_group_viewed, combo_upgrade_seen. |
| Add to cart | Did I configure it correctly? | Add-to-cart sheet, carrito mini summary. | Clear item summary, edit option, success feedback, next recommendation. | Unclear modifier summary. | item_added, upsell_presented. |
| Cart review | Is the total fair and complete? | Carrito page/sheet. | Item edit, quantities, promociones, delivery estimate, missing item prompts. | Surprise total. | cart_viewed, promo_applied, cart_abandoned. |
| Checkout | Can I finish quickly? | Finalizacion_compra, address, payment, confirmation. | Guest checkout, saved details, Mercado Pago clarity, single review step. | Forced login/payment friction. | checkout_started, payment_selected, checkout_error. |
| Payment | Did the pago work? | Mercado Pago redirect/SDK, confirmation, email/WhatsApp. | Loading reassurance, idempotency messaging, failure recovery, no duplicate fear. | Duplicate payment anxiety. | payment_started, payment_approved, payment_failed. |
| Tracking | Where is my pedido? | Seguimiento_pedido, notifications, WhatsApp. | Timeline, ETA confidence, current status, support escalation. | Lack of trust. | tracking_opened, eta_changed, support_contacted. |
| Delivery/pickup | How do I receive it? | Delivery tracking, pickup instructions, proof. | Driver/sucursal clarity, arrival state, contact options. | Missed delivery/pickup confusion. | delivery_arrived, pickup_ready, order_completed. |
| Post-purchase | Was it good? | Rating prompt, receipt, recompensas, reorder. | Timely feedback, loyalty progress, repeat CTA. | No retention loop. | rating_submitted, reward_earned, reorder_clicked. |
| Repeat | Can I get the same again? | Home personalized section, pedidos history, favoritos. | One-tap repetir pedido, saved modifiers, current availability validation. | Rebuild friction. | reorder_started, reorder_completed. |

### 3.2 Journey design rules

- Every stage must expose a single dominant next action.
- No step may hide operational constraints that affect the decision: open hours, coverage, ETA, availability, delivery cost, or payment limits.
- Login is a benefit, not a gate. Guest checkout remains available unless a fraud or compliance rule requires authentication.
- Realtime status must include degraded-state language when live updates are stale.

## 4. Sitemap

### 4.1 Public pages

| Page | Purpose | Goal | Primary CTA | Secondary CTA |
| --- | --- | --- | --- | --- |
| Home | Create appetite, communicate premium brand, route to ordering. | Start pedido. | Ver menu | Repetir pedido / Ver promociones |
| Menu | Let clientes browse productos and build carrito. | Add first item. | Agregar al carrito | Ver detalle / Aplicar filtros |
| Detalle producto | Convert product interest into configured item. | Add configured item. | Agregar al carrito | Convertir en combo / Ver alergenos |
| Promociones | Surface valid ofertas and bundles. | Apply promocion to carrito. | Usar promocion | Ver productos incluidos |
| Fidelizacion | Explain recompensas and motivate account creation. | Enroll or check progress. | Unirme a recompensas | Ver beneficios |
| Sobre la marca | Build trust and premium perception. | Reinforce brand affinity. | Ver menu | Encontrar sucursal |
| Contacto | Provide support and branch contact pathways. | Resolve pre-order questions. | Contactar soporte | Ver preguntas frecuentes |
| Sucursales | Show open sucursales and coverage. | Select branch or coverage. | Elegir sucursal | Ver horarios |
| Seguimiento pedido publico | Let guest track via secure token. | Reduce support contacts. | Ver estado del pedido | Contactar soporte |

### 4.2 Authenticated cliente pages

| Page | Purpose | Goal | Primary CTA | Secondary CTA |
| --- | --- | --- | --- | --- |
| Perfil | Manage personal identity and preferences. | Keep data current. | Guardar cambios | Ver privacidad |
| Direcciones | Manage delivery addresses. | Reuse direccion reliably. | Agregar direccion | Editar direccion |
| Pedidos | View history and reorder. | Increase repeat pedidos. | Repetir pedido | Ver detalle |
| Recompensas | Show points, tiers, and rewards. | Drive retention. | Canjear recompensa | Ver progreso |
| Configuracion | Manage notifications, privacy, and sessions. | Build control and trust. | Actualizar preferencias | Cerrar sesiones |
| Metodos de pago | Explain/surface stored payment options when supported. | Reduce checkout friction. | Gestionar pago | Ver seguridad |

### 4.3 Operations pages

| Page | Purpose | Goal | Primary CTA | Secondary CTA |
| --- | --- | --- | --- | --- |
| Panel cocina | Manage tickets_cocina by station/status. | Prepare pedidos accurately and fast. | Avanzar estado | Marcar incidencia |
| Cola pedidos | Triage incoming pedidos and surge. | Keep throughput stable. | Priorizar pedido | Pausar canal |
| Panel entregas | Assign and monitor entregas. | Deliver on time. | Asignar repartidor | Reasignar entrega |
| Panel sucursal | Monitor health of sucursal operations. | Detect bottlenecks. | Resolver alerta | Ver metricas |
| Administracion | Manage menu, horarios, promociones, usuarios, roles. | Keep business configuration safe. | Crear cambio | Solicitar aprobacion |
| Soporte | Resolve customer issues with scoped access. | Resolve case safely. | Abrir caso | Solicitar acceso temporal |

## 5. Mobile Navigation System

### 5.1 Bottom navigation

The default mobile bottom navigation must contain five stable destinations:

1. **Inicio**: personalized entry and promos.
2. **Menu**: category/product browsing.
3. **Carrito**: persistent cart with item count and total.
4. **Pedidos**: active tracking first, history second.
5. **Perfil**: cuenta, direcciones, recompensas, configuracion.

Rules:

- Carrito tab becomes visually dominant when it contains items.
- Pedidos tab shows active pedido badge while any pedido is preparing, ready, assigned, or in delivery.
- Bottom navigation hides only in focused checkout payment steps where sticky checkout actions replace it.
- The active route label must be textual, not icon-only.

### 5.2 Sticky actions

| Context | Sticky action | Behavior |
| --- | --- | --- |
| Menu with carrito | Ver carrito — total | Opens carrito sheet or page. |
| Detalle producto | Agregar al carrito — precio | Disabled until required modifiers are valid. |
| Carrito | Continuar compra | Keeps total, delivery estimate, and promo state visible. |
| Checkout | Confirmar pedido / Pagar | Shows final total and current payment state. |
| Tracking | Ver estado actual | Jumps to live timeline and support contact. |

### 5.3 Floating actions

Floating actions are allowed only when they reduce effort without obscuring content:

- **Repetir pedido** on Inicio for returning clientes.
- **Buscar** on long menu pages.
- **Ayuda** on checkout/tracking when status is blocked or delayed.
- No decorative floating buttons.

### 5.4 Cart behavior

- Carrito starts as a bottom sheet on mobile and can expand to full page.
- Adding an item triggers a compact success sheet, not a blocking modal.
- Carrito persists through login, branch switching warning, checkout, and payment return.
- If changing sucursal invalidates items, the system must show an item-by-item availability resolution flow.

### 5.5 Shortcuts

- Checkout shortcut appears after first item with valid branch/delivery mode.
- Tracking shortcut appears globally for active pedidos.
- Reorder shortcut appears on Inicio and Pedidos when past items remain available.
- Loyalty shortcut appears when a recompensa is close to redemption or applicable to carrito.

## 6. Conversion Architecture

### 6.1 Home conversion strategy

Home must answer in order:

1. What makes this brand craveable?
2. Can I order now?
3. What should I order first?
4. What benefit do I get today?
5. How do I repeat or track quickly?

Required modules:

- premium hero with one ordering CTA;
- open sucursal / delivery coverage status;
- best sellers carousel;
- promociones validas;
- repetir pedido for returning clientes;
- loyalty progress for authenticated clientes;
- operational reassurance: payment, ETA, WhatsApp updates.

### 6.2 Menu conversion strategy

- First screen must include category navigation and top recommended productos.
- Best sellers and limited editions get priority above full catalog complexity.
- Product cards show image, name, short appetite description, price, availability, and quick add when no required modifiers exist.
- Search must tolerate accents, typos, and category synonyms.
- Filters must not hide too much by default; active filters must be visible and easily removable.

### 6.3 Product conversion strategy

- Required modifiers are grouped and sequenced by decision difficulty.
- Defaults should represent the recommended product experience.
- Combo upgrades must show incremental price and value clearly.
- Nutritional/allergen details must be accessible but not interrupt purchase flow.
- Recommendations must complement the product, not cannibalize it.

### 6.4 Cart conversion strategy

- Carrito must show total breakdown early: subtotal, discounts, delivery, estimated total.
- Upsells appear after core review, not before item validation.
- Recommended add-ons should be limited to 2-4 high-confidence items.
- Empty carrito must recover intent with best sellers, recent pedidos, and promociones.
- Abandoned carrito recovery must respect channel preferences and avoid spam.

### 6.5 Checkout conversion strategy

- Checkout must support guest flow.
- Default path: delivery/pickup selection, direccion/sucursal, contact, payment, review, confirmation.
- Saved direccion and recent preferences reduce fields for returning clientes.
- Payment failure must preserve carrito and show retry options without duplicate anxiety.
- Login prompt should appear after confirmation or as optional benefit before checkout, not as a hard blocker.

### 6.6 Post-purchase conversion strategy

- Confirmation page must immediately reassure: pedido number, ETA, status, notification channels.
- Recompensa progress appears after payment success.
- Rating prompt must trigger after delivery/pickup completion, not while hungry.
- Reorder CTA should appear after a positive rating or completed pedido history.

### 6.7 Upsell, cross-sell, combo, reward, and reorder rules

| Mechanic | Where used | Rule |
| --- | --- | --- |
| Upsell | Detalle producto, carrito | Increase value of selected product, never unrelated clutter. |
| Cross-sell | Carrito, post-add sheet | Complement meal: papas, bebida, postre, salsas. |
| Combo | Product detail and menu | Show savings, items included, and upgrade clarity. |
| Recompensa | Home, carrito, checkout | Apply when valid; never surprise-remove value. |
| Reorder | Home, pedidos, post-purchase | Validate current availability before one-tap confirmation. |

## 7. Menu Experience

### 7.1 Category browsing

Canonical categorias:

- Hamburguesas
- Combos
- Papas y acompañamientos
- Bebidas
- Postres
- Salsas
- Promociones
- Edicion limitada

Category UX rules:

- Sticky category tabs on mobile.
- Horizontal category chips only if labels remain readable.
- Categoria selected state must be explicit.
- Unavailable categorias are hidden by default but can be surfaced with explanation when relevant.

### 7.2 Product discovery

Discovery hierarchy:

1. Recommended for current context.
2. Best sellers.
3. Limited editions.
4. Promotions.
5. Full category catalog.
6. Search results.

Product cards must show:

- appetizing image or high-quality fallback;
- product name;
- short appetite-led description;
- starting price;
- availability state;
- quick add or configure CTA;
- badges: nuevo, mas vendido, picante, vegetariano, limitado, recompensa.

### 7.3 Filters and search

Filters:

- availability now;
- delivery/pickup availability;
- price band;
- dietary/allergen flags;
- combo eligible;
- promotions;
- spicy level;
- vegetarian option if available.

Search behavior:

- search across producto names, ingredientes, categorias, modifiers, and synonyms;
- empty search recommends best sellers;
- no results offers category reset and support/contact alternative;
- mobile search opens in a focused overlay with recent searches.

### 7.4 Featured, best sellers, seasonal, limited editions

- Featured products are curated by marketing but must respect sucursal availability.
- Best sellers are calculated by recent paid pedidos, not static assumptions.
- Seasonal products require end date visibility when scarcity is real.
- Limited editions must show availability countdown only if inventory tracking supports it.

### 7.5 Loading strategy

- Menu shell loads before images.
- Skeletons preserve card dimensions to avoid layout shift.
- Product images lazy-load below fold.
- Critical best sellers and active categorias prefetch for returning clientes.
- Degraded mode shows cached menu with explicit freshness timestamp.

## 8. Product Detail Experience

### 8.1 Product gallery

- One dominant appetizing image first.
- Secondary images may show texture, ingredients, size, combo, or packaging.
- Gallery must not slow primary CTA.
- Image zoom is optional and must not trap mobile gestures.

### 8.2 Ingredients and customization

- Ingredientes are readable, concise, and grouped.
- Required modifier groups must appear before optional groups.
- Each modifier shows price impact, selection limit, and default state.
- Conflicts must be resolved inline: e.g., mutually exclusive bread choices.
- Notes for cocina are allowed only where operations can honor them.

### 8.3 Combo upgrades

Combo upgrade UI must show:

- included items;
- price difference;
- savings if true;
- default side and drink choices;
- availability by sucursal;
- editability after adding to carrito.

### 8.4 Recommendations

Recommendation types:

- completes the meal;
- popular with this producto;
- eligible for promocion;
- close to reward threshold;
- family/group add-on.

Recommendations must never obscure required modifiers or primary add-to-cart action.

### 8.5 Nutrition and allergen sections

- Alergenos must be accessible before purchase.
- Nutrition data can be collapsed but searchable for regulated needs.
- Missing allergen data must be explicit, not silently omitted.
- Customer safety information must take precedence over conversion copy.

### 8.6 Conversion behaviors

- Add-to-cart CTA updates price as modifiers change.
- Required missing selections are indicated near the group and in sticky CTA state.
- Success feedback confirms product, quantity, modifiers, and next best action.
- Back navigation preserves selected modifiers until checkout or explicit reset.

## 9. Cart Experience

### 9.1 Cart architecture

Carrito structure:

1. Items grouped by product and named customizations.
2. Editable quantities and modifiers.
3. Promo and reward application.
4. Delivery/pickup estimate.
5. Totals breakdown.
6. Contextual upsells.
7. Checkout CTA.

### 9.2 Editing flow

- Editing opens the same modifier model used in product detail.
- Quantity changes are immediate but undoable for short duration.
- Removing item asks no confirmation unless item has complex customization; then show undo.
- Duplicate item option must preserve modifiers and allow item label for group/family pedidos.

### 9.3 Upsell flow

- Upsell suggestions appear after validation and before checkout CTA.
- Suggestions are constrained by availability, allergen filters, and cart context.
- Maximum one high-value combo prompt per cart view.
- Never force users through upsell to checkout.

### 9.4 Empty cart

Empty carrito must show:

- best sellers;
- recent pedidos if available;
- active promociones;
- branch/delivery status;
- primary CTA: Ver menu.

### 9.5 Abandoned cart

Abandoned cart recovery rules:

- Trigger only after meaningful carrito value and inactivity threshold.
- Respect WhatsApp/email preferences.
- Include exact recovery link and current availability warning.
- Do not send if pedido was completed, payment is pending, or user opted out.

### 9.6 Friction reduction

- No surprise fees after checkout starts.
- Promocion errors explain reason and next best action.
- Delivery estimate updates in context, not as a blocking alert.
- Carrito supports branch-change resolution with item replacement suggestions.

## 10. Checkout Experience

### 10.1 Guest checkout

Guest checkout requires only:

- name/contact required for order fulfillment;
- direccion or pickup sucursal;
- delivery instructions when needed;
- payment selection;
- explicit acceptance of terms if required.

Account creation is offered after success with benefits: save direccion, track pedidos, earn recompensas.

### 10.2 Authenticated checkout

Authenticated checkout must prefill:

- cliente contact;
- default direccion;
- prior delivery notes;
- loyalty/recompensa status;
- recent payment context where supported.

### 10.3 Address selection

Direccion UX rules:

- validate coverage before final payment;
- show map/address confirmation when ambiguity exists;
- support apartment/floor/reference notes;
- warn if delivery estimate changes;
- keep invalid direccion editable, not discarded.

### 10.4 Delivery estimation

ETA must show confidence level:

- normal estimate;
- high demand estimate;
- degraded estimate when realtime is unavailable;
- pickup preparation estimate.

ETA changes after payment must explain cause and provide support path when threshold exceeded.

### 10.5 Payment selection

- Mercado Pago must be clearly identified.
- Payment pending states must be explicit.
- Payment retry must preserve pedido intent and idempotency messaging.
- Failure messaging must never imply duplicate charge unless confirmed.
- Cash/manual payment options, if introduced later, require separate operational risk review.

### 10.6 Order confirmation

Confirmation must show:

- pedido number;
- sucursal;
- delivery/pickup mode;
- ETA;
- payment status;
- notification channels;
- tracking CTA;
- support CTA;
- loyalty/reward progress.

### 10.7 Minimum friction flow

Target happy path:

1. Select product.
2. Configure required options.
3. Add to carrito.
4. Continue checkout.
5. Confirm direccion/sucursal.
6. Choose Mercado Pago.
7. Confirm pedido.
8. Track status.

No extra marketing modal may interrupt this path.

## 11. Order Tracking Experience

### 11.1 Timeline

Canonical pedido timeline:

1. Pedido recibido.
2. Pago confirmado.
3. En preparacion.
4. Listo para retirar / Asignando entrega.
5. En camino / Listo en sucursal.
6. Entregado / Retirado.
7. Finalizado.

### 11.2 Status system

Each status must include:

- plain Spanish label;
- operational meaning;
- ETA impact;
- whether customer action is needed;
- support escalation threshold.

### 11.3 Estimated times

- Show ranges rather than false precision when uncertainty is high.
- Show last updated timestamp.
- Explain delay categories: alta demanda, clima, cocina, repartidor, direccion.
- Avoid changing ETA too frequently unless material.

### 11.4 Delivery tracking

Delivery UX must include:

- assigned repartidor state when available;
- contact rules;
- address confirmation;
- delivery proof after completion when applicable;
- fallback status when live location is unavailable.

### 11.5 Notifications

Notification channels:

- in-app/browser status;
- WhatsApp for key updates;
- email receipt and exceptional updates.

Notification content must match app status names exactly.

### 11.6 Reassurance strategy

- Always show what is happening now.
- Always show what happens next.
- Always show when the app last synced.
- Always provide support path after delay threshold.
- Never show a completed state until source-of-truth status confirms it.

## 12. Loyalty Experience

### 12.1 Points system

- Points must be visible after payment confirmation.
- Pending vs available points must be distinct.
- Expiration must be visible before checkout when relevant.
- Points cannot be represented as money unless finance rules approve conversion.

### 12.2 Rewards system

Reward UX:

- clear eligibility;
- redemption rules;
- branch/product constraints;
- expiration;
- impact on cart total;
- non-stackable conflicts.

### 12.3 Tier system

Tier UX must show:

- current tier;
- next tier progress;
- benefits;
- qualification period;
- what action helps progress.

### 12.4 Milestones

Milestones:

- first pedido;
- third pedido;
- birthday/anniversary if collected lawfully;
- streaks;
- high-value combo milestone;
- referral milestone if implemented later.

### 12.5 Surprise rewards

Surprise rewards must be:

- operationally valid;
- explainable enough to avoid distrust;
- non-manipulative;
- clearly limited by expiration and eligibility.

### 12.6 Retention mechanics

- Recompensas appear where they affect a decision: Home, Carrito, Checkout, Post-purchase.
- Reorder prompts should include current loyalty benefit when relevant.
- Win-back campaigns must use consented channels and avoid over-discounting premium perception.

## 13. Operations Experience

### 13.1 Kitchen dashboard — Panel cocina

Panel cocina must optimize for speed, accuracy, and stress reduction.

Required UX:

- tickets_cocina grouped by station and status;
- visual aging timers;
- priority flags for delayed pedidos;
- modifier clarity and allergen warnings;
- one-tap status advancement;
- exception action: falta stock, retraso, error preparacion, cancelar requires approval;
- audio/visual alerts configurable by sucursal.

### 13.2 Delivery dashboard — Panel entregas

Panel entregas must support dispatch decisions.

Required UX:

- cola_entregas by readiness and route;
- repartidor availability;
- assignment/reassignment actions;
- delivery SLA status;
- proof and incident capture;
- customer contact guardrails;
- map view as support, not sole interface.

### 13.3 Branch dashboard — Panel sucursal

Panel sucursal must show operational health:

- incoming pedidos rate;
- kitchen backlog;
- delivery backlog;
- paused channels;
- stock/menu availability issues;
- active incidents;
- high-risk overrides;
- daily metrics.

### 13.4 Operational workflows

| Workflow | Required UX guardrails |
| --- | --- |
| Accept pedido | Show payment, fulfillment mode, ETA commitment, item complexity. |
| Advance cocina state | Prevent skipping critical statuses unless authorized. |
| Mark item unavailable | Show affected carritos/pedidos and require reason. |
| Reassign entrega | Preserve audit trail and notify customer if ETA materially changes. |
| Apply override | Require role, reason, expiration, audit event. |
| Pause ordering channel | Require scope, duration, reason, and customer-facing message. |

### 13.5 Alerts, queues, and priorities

Priority order:

1. Safety/allergen incidents.
2. Payment or duplicate charge risk.
3. Pedido delayed beyond SLA.
4. Delivery assignment failure.
5. Kitchen bottleneck.
6. Stock/menu availability conflict.
7. Customer support escalation.

Alerts must be actionable, scoped, and dismissible only with reason when high risk.

## 14. Microinteractions

### 14.1 Hover states

- Hover states clarify clickability on desktop.
- No hover-only information for mobile-critical content.
- Product cards may lift subtly but must not shift layout.

### 14.2 Press states

- Press states must provide immediate tactile feedback.
- Add-to-cart and payment CTAs must transition to loading state within 100ms.
- Destructive actions require undo or confirmation depending risk.

### 14.3 Loading states

| Context | Loading state |
| --- | --- |
| Menu | Skeleton cards with stable layout. |
| Product detail | Image skeleton plus preserved content areas. |
| Cart update | Inline item spinner and optimistic total when safe. |
| Checkout payment | Full reassurance state with no back-pressure panic. |
| Tracking | Sync indicator and last updated timestamp. |
| Operations | Queue-level loading without hiding existing tickets. |

### 14.4 Success states

- Added-to-cart success must show item summary and next action.
- Payment success must show pedido confirmation, not generic success.
- Operational success must confirm status change and update queue position.

### 14.5 Error states

Error messages must include:

- what happened;
- whether user action is required;
- whether data was saved;
- next recommended action;
- support path for blocking errors.

### 14.6 Empty states

Empty states must be useful:

- no pedidos: show first order CTA;
- no rewards: show how to earn;
- no delivery coverage: show pickup/sucursales alternatives;
- no search results: show best sellers and clear filters;
- no kitchen tickets: show last sync and branch state.

### 14.7 Animations

Animation rules:

- Use motion to explain transitions, not decorate.
- Keep core ordering path responsive.
- Respect reduced motion preferences.
- Avoid long intro animations.
- Operational dashboards use minimal motion to prevent fatigue.

### 14.8 Feedback systems

- Haptic feedback may be used on supported mobile devices for add/remove actions.
- Toasts must not cover CTA or totals.
- Critical alerts require inline persistent messaging, not transient toast only.

## 15. Accessibility Standards

### 15.1 WCAG strategy

The platform targets WCAG 2.2 AA as minimum for customer and operational surfaces. High-risk flows such as checkout, payment recovery, support access, and cocina alerts must be reviewed with stricter internal accessibility criteria.

### 15.2 Contrast rules

- Text and meaningful icons must meet AA contrast.
- Status colors require text labels and icons; color alone is forbidden.
- Premium dark UI must be tested in low brightness and night scenarios.
- Disabled states must remain readable.

### 15.3 Focus rules

- Every interactive element must have visible focus.
- Focus order follows visual/task order.
- Modals/sheets trap focus and restore it after close.
- Checkout errors move focus to the first blocking field.

### 15.4 Keyboard support

- Full menu browsing, product configuration, cart editing, and checkout must be keyboard operable.
- Operational dashboards support keyboard shortcuts only if discoverable and not destructive by default.
- Escape closes non-critical overlays; it must not cancel payment or lose cart state.

### 15.5 Screen reader support

- Product cards expose name, price, availability, and CTA.
- Modifier groups announce required/optional status and selection limits.
- Cart total updates use polite live regions.
- Payment and tracking state changes use appropriate live region priority.
- Cocina/delivery alerts have text equivalents.

## 16. Design Foundation

### 16.1 Visual hierarchy

Visual priority:

1. Appetite-driving product imagery.
2. Product name and key value proposition.
3. Price and availability.
4. Primary CTA.
5. Secondary details.
6. Legal/safety details where required.

Premium visual direction:

- bold but readable typography;
- rich food photography;
- warm high-contrast palette;
- restrained shadows/glow;
- confident spacing;
- modern card system;
- editorial moments for brand storytelling;
- operational surfaces with denser, calmer UI.

### 16.2 Content hierarchy

Content must be written in clear Argentine Spanish for business terms and customer labels.

Rules:

- CTA starts with action verb: Ver, Agregar, Continuar, Confirmar, Pagar, Repetir, Canjear.
- Status labels are short and consistent.
- Error copy avoids blame.
- Premium tone is confident, not exaggerated.
- Operational copy is direct and unambiguous.

### 16.3 Layout hierarchy

- Mobile layout uses single-column content with sticky actions.
- Desktop supports richer menu grids but must preserve the same decision order.
- Checkout uses progressive disclosure.
- Operations dashboards use split panes only when they reduce context switching.
- Critical totals, statuses, and CTAs remain visible near decision points.

### 16.4 Information architecture

Primary IA groups:

- Comprar: Inicio, Menu, Promociones, Carrito, Finalizacion compra.
- Gestionar: Perfil, Direcciones, Pedidos, Recompensas, Configuracion.
- Seguir: Seguimiento pedido, Notificaciones, Soporte.
- Operar: Cocina, Entregas, Sucursal, Administracion.

### 16.5 Design system implications

- Components must support Spanish labels with longer text lengths.
- Currency, date, time, and address formats must match Argentina expectations.
- All product, cart, checkout, and operations components must expose loading/error/empty/degraded states.
- shadcn/ui primitives may provide technical foundation, but product components must be brand-specific and conversion-tested.

## 17. KPI Framework

### 17.1 Conversion KPIs

| KPI | Definition | Primary owner |
| --- | --- | --- |
| menu_to_cart_rate | Menu sessions with at least one item added. | Product / Growth |
| product_add_rate | Product detail views that add to carrito. | Product / Design |
| cart_to_checkout_rate | Carritos that start finalizacion_compra. | Product / Frontend |
| checkout_completion_rate | Checkout starts that become paid pedidos. | Product / Payments |
| payment_failure_recovery_rate | Failed payments recovered successfully. | Payments / UX |
| average_order_value | Paid pedido revenue average. | Growth / Commerce |
| promo_attach_rate | Paid pedidos with valid promocion. | Marketing / Commerce |
| combo_upgrade_rate | Eligible items upgraded to combo. | Growth / Menu |

### 17.2 Engagement KPIs

| KPI | Definition | Primary owner |
| --- | --- | --- |
| search_success_rate | Searches leading to product view/add. | Product |
| category_engagement_rate | Category interactions per menu session. | Product |
| reorder_click_rate | Returning sessions clicking repetir pedido. | Growth |
| tracking_open_rate | Paid pedidos with tracking page opened. | Product / Operations |
| notification_opt_in_rate | Clientes accepting WhatsApp/email updates. | CRM |

### 17.3 Retention KPIs

| KPI | Definition | Primary owner |
| --- | --- | --- |
| repeat_order_rate_30d | Clientes with another paid pedido within 30 days. | Growth |
| loyalty_enrollment_rate | Eligible clientes joining recompensas. | CRM |
| reward_redemption_rate | Available recompensas redeemed. | CRM |
| winback_conversion_rate | Win-back messages that generate paid pedido. | CRM |
| favorite_or_recent_reorder_rate | Pedidos created from favoritos/recents. | Product |

### 17.4 Operational KPIs

| KPI | Definition | Primary owner |
| --- | --- | --- |
| kitchen_ticket_cycle_time | Time from received to ready. | Operaciones |
| delivery_assignment_time | Time from ready to assigned repartidor. | Entregas |
| eta_accuracy | Difference between promised and actual delivery/pickup time. | Operaciones |
| order_exception_rate | Pedidos requiring support/override. | Operaciones / Soporte |
| support_contact_rate | Pedidos generating support contact. | Soporte |
| menu_availability_conflict_rate | Attempts to buy unavailable items. | Menu Ops |

### 17.5 Accessibility and quality KPIs

- accessibility_violation_count by release;
- checkout_error_rate by field;
- layout_shift_score for menu/product pages;
- mobile_core_web_vitals pass rate;
- degraded_realtime_sessions;
- customer_reported_confusion themes from support cases.

## 18. Final delivery rules

### 18.1 Product and design handoff requirements

Before visual design begins, each core journey must have:

- journey objective;
- target persona;
- success KPI;
- required states: default, loading, empty, error, success, degraded;
- accessibility notes;
- analytics events;
- content rules;
- operational dependencies;
- conversion hypothesis.

### 18.2 Frontend implementation readiness requirements

Before frontend implementation begins, each screen must define:

- canonical Spanish business labels;
- component ownership;
- responsive behavior;
- realtime requirements;
- data dependencies;
- fallback states;
- performance budget;
- privacy/security constraints;
- test expectations.

### 18.3 UX approval gate

A journey is not implementation-ready until Product, Design, Frontend, Operaciones, Seguridad, Accessibility, and Analytics owners approve:

- no forced login in core purchase flow unless required by risk policy;
- carrito persistence and recovery;
- checkout total transparency;
- order tracking reassurance;
- operational dashboard action safety;
- WCAG 2.2 AA coverage;
- instrumentation coverage for KPIs.
