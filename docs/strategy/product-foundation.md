# J Burguer — Complete Definitive Product Foundation

## 0. Executive Product Thesis

J Burguer is a premium burger food-tech ecosystem designed to operate as both a high-converting customer commerce product and a realtime restaurant operating system. The platform is not a static restaurant website; it is a mobile-first digital ordering, loyalty, kitchen orchestration, branch operations, and growth infrastructure layer for a modern burger brand.

The product must unify five business capabilities:

1. **Customer commerce** — discovery, customization, cart, checkout, payment, order tracking, retention.
2. **Restaurant operations** — realtime kitchen workflow, branch availability, delivery/pickup orchestration, inventory signals.
3. **Growth engine** — promotions, loyalty, CRM automation, referrals, campaign attribution, lifecycle messaging.
4. **Operational intelligence** — sales analytics, branch performance, menu performance, fulfillment SLA monitoring.
5. **Scalable infrastructure** — secure Supabase-backed data platform, realtime events, modular Next.js frontend, production deployment on Vercel.

The visual inspiration benchmark is Nubelar's J Burger reference, but the final direction should be more app-like, premium, operationally complete, conversion-focused, and technically scalable.

---

## 1. Product Vision

### Vision Statement

Build the most loved premium burger ordering experience in its market: fast enough for impulse purchases, rich enough for premium brand storytelling, operational enough for real restaurants, and scalable enough for multi-branch franchise growth.

### Product Principles

- **Mobile-first by default**: every critical purchase flow must be optimized for one-handed mobile usage.
- **Commerce before decoration**: visuals should increase appetite, trust, speed, or average order value.
- **Realtime confidence**: customers and staff should always know the current order state.
- **Operational truth**: the customer UI must reflect branch hours, stock, kitchen capacity, delivery zones, and payment state.
- **Modular growth**: menu, branches, loyalty, promotions, and notifications must be built for expansion.
- **Premium warmth**: brand experience should feel craft, fresh, confident, and energetic rather than generic fast food.

### North Star Metric

**Completed paid orders per active customer per month**, segmented by branch and acquisition channel.

### Supporting Metrics

- Add-to-cart rate.
- Checkout completion rate.
- Average order value.
- Repeat purchase rate.
- Time from landing to paid order.
- Payment approval rate.
- Kitchen acceptance time.
- Order fulfillment SLA adherence.
- Delivery ETA accuracy.
- Loyalty redemption rate.
- Campaign revenue attribution.

---

## 2. Brand Strategy

### Brand Positioning

J Burguer should position itself as a premium, crave-worthy burger brand with startup-level digital convenience. The brand promise is: **restaurant-quality burgers with app-quality ordering speed**.

### Brand Attributes

- **Premium**: high-quality ingredients, strong photography, careful spacing, dark cinematic palette.
- **Bold**: strong type hierarchy, confident copy, high-contrast CTAs.
- **Fast**: clear ordering paths, persistent cart, quick reorder, payment certainty.
- **Fresh**: ingredient storytelling, real product visuals, branch-level availability.
- **Friendly**: conversational microcopy, helpful empty states, WhatsApp support.

### Tone of Voice

- Short, sensory, and confident.
- Avoid generic hype; emphasize flavor and convenience.
- Use action-oriented commerce copy.

Examples:

- Hero CTA: **Order your burger now**.
- Cart upsell: **Make it a combo and save**.
- Order tracking: **Your burger is on the grill**.
- Loyalty: **You earned sauce points**.

### Visual Identity Direction

- Dark premium base: charcoal, deep black, warm brown.
- Appetite accents: cheddar yellow, flame orange, fresh green.
- Product-first imagery: close-up burgers, melted cheese, grill texture, sauces.
- UI shell: app-like cards, sticky bottom actions, rounded premium surfaces.

---

## 3. User Experience Strategy

### UX Objective

Reduce cognitive load from product discovery to payment while increasing confidence, appetite, and basket size.

### Experience Pillars

1. **Immediate ordering clarity**: the first screen must expose branch status, delivery/pickup options, hero item, and primary order CTA.
2. **Low-friction menu browsing**: categories, filters, product cards, and customization must support quick decisions.
3. **Safe customization**: modifiers must be clear, priced, constrained, and reversible.
4. **Persistent cart awareness**: cart state must be visible without disrupting browsing.
5. **Trust-rich checkout**: delivery fee, ETA, payment method, discounts, and totals must be transparent.
6. **Realtime post-purchase reassurance**: order tracking should reduce support contacts.

### Critical UX Risks

- Users abandon if address capture occurs too early.
- Users abandon if menu availability changes late in checkout.
- Users lose trust if delivery fee appears only at final step.
- Users become frustrated if modifiers are ambiguous.
- Staff reject orders if kitchen capacity is not reflected.

### UX Resolution

- Use progressive disclosure: browse first, validate address before checkout commitment.
- Show delivery availability and ETA early when location is known.
- Validate branch, stock, price, and promo server-side before payment.
- Provide clear replacement paths for unavailable products.

---

## 4. User Personas

### 4.1 The Impulse Mobile Buyer

- **Context**: hungry, on mobile, wants fast decision.
- **Goals**: order in under three minutes.
- **Needs**: popular items, combos, Apple/Google-style payment speed where available, quick address reuse.
- **Risks**: abandons with long forms or unclear fees.

### 4.2 The Loyal Regular

- **Context**: has ordered before, likely repeats favorites.
- **Goals**: reorder quickly, earn rewards, discover limited drops.
- **Needs**: order history, saved addresses, loyalty balance, personalized offers.
- **Risks**: churns if rewards feel hidden or unavailable.

### 4.3 The Group Order Organizer

- **Context**: ordering for family, friends, or office.
- **Goals**: customize multiple items, avoid mistakes, delivery reliability.
- **Needs**: clear cart item labels, notes, item duplication, larger bundles.
- **Risks**: frustrated by cart confusion and lack of item-level customization summaries.

### 4.4 The Pickup Customer

- **Context**: near a branch or on commute.
- **Goals**: schedule or place pickup, arrive when ready.
- **Needs**: branch selector, preparation ETA, pickup instructions.
- **Risks**: arrives too early or wrong branch.

### 4.5 The Store Operator

- **Context**: branch manager or kitchen lead.
- **Goals**: accept orders, manage prep queue, control availability, prevent overload.
- **Needs**: realtime dashboard, item availability toggles, order SLA visibility.
- **Risks**: operational chaos from unthrottled demand.

### 4.6 The Business Owner

- **Context**: monitors profitability and growth.
- **Goals**: understand sales, retention, branch performance, campaign ROI.
- **Needs**: dashboards, exports, alerts, menu analytics.
- **Risks**: lacks visibility into margin leakage and fulfillment bottlenecks.

---

## 5. Commerce Strategy

### Revenue Levers

- Premium burgers as hero products.
- Combo upgrades as default basket expansion.
- Sides and sauces as low-friction add-ons.
- Limited-time drops for urgency.
- Loyalty rewards for retention.
- Branch-local campaigns for demand shaping.
- Scheduled pickup/delivery for capacity smoothing.

### Menu Commerce Model

Products should be structured as:

- **Base product**: burger, side, drink, dessert, combo.
- **Variant**: size, protein, bun, drink size.
- **Modifier groups**: required or optional choices.
- **Add-ons**: paid extras such as bacon, cheese, sauce.
- **Exclusions**: remove onion, remove pickles.
- **Availability rules**: branch, time window, stock, channel.
- **Tax and fee rules**: branch jurisdiction and delivery context.

### Average Order Value Strategy

- Product page: default combo CTA.
- Cart: intelligent upsells based on missing category.
- Checkout: final add-on shelf for drinks, sauces, dessert.
- Loyalty: threshold nudges such as “Add $X to unlock reward”.
- Promotions: bundle discount instead of broad percentage discounts.

---

## 6. Restaurant Operational Strategy

### Operating Model

The platform should operate on branch-specific truth. Each branch has:

- Opening hours.
- Delivery radius or zones.
- Current order capacity.
- Menu availability.
- Kitchen prep time baseline.
- Delivery provider or internal driver status.
- Payment settlement configuration.

### Kitchen Workflow

Order states:

1. `created` — cart converted into order pending payment.
2. `payment_pending` — waiting for Mercado Pago confirmation.
3. `paid` — payment approved.
4. `accepted` — branch accepted order.
5. `in_preparation` — kitchen started.
6. `ready_for_pickup` — pickup order ready or delivery packed.
7. `out_for_delivery` — driver assigned and dispatched.
8. `completed` — delivered or picked up.
9. `cancelled` — cancelled by system, staff, or customer.
10. `refunded` — refund processed.

### Staff Controls

- Accept/reject order with reason.
- Pause delivery or pickup channel.
- Adjust prep time multiplier.
- Toggle item availability.
- Mark order stages.
- Trigger customer notification.
- Escalate delayed orders.

---

## 7. UX/UI System

### UI Architecture

The interface should use a composable design system based on shadcn/ui primitives, TailwindCSS design tokens, and custom commerce components.

### Core UI Components

- App shell.
- Sticky mobile navigation.
- Branch status pill.
- Menu category tabs.
- Product card.
- Product detail sheet.
- Modifier selector.
- Cart drawer.
- Checkout stepper.
- Payment status panel.
- Order timeline.
- Loyalty badge.
- Promo input.
- Staff order card.
- Admin data table.
- Empty states.
- Toast notifications.

### Design Tokens

- **Color**: brand, surface, foreground, muted, success, warning, danger.
- **Spacing**: compact mobile rhythm with generous product-card breathing room.
- **Radius**: rounded cards and buttons for app-like warmth.
- **Shadow**: subtle depth for sticky commerce surfaces.
- **Typography**: display for appetite moments, clean sans for transactional clarity.

### Accessibility UX

- Minimum 44px touch targets.
- Visible focus states.
- Semantic headings.
- Dialog focus trapping.
- Color contrast WCAG AA minimum.
- Screen-reader labels for price, quantity, and modifiers.
- Reduced motion support.

---

## 8. Conversion Optimization Strategy

### Conversion Funnel

1. Landing view.
2. Menu engagement.
3. Product detail open.
4. Add to cart.
5. Cart review.
6. Checkout started.
7. Address validated.
8. Payment initiated.
9. Payment approved.
10. Repeat purchase.

### CRO Tactics

- Sticky “View cart” bottom bar after first item.
- Default popular category first.
- Product badges: popular, spicy, new, limited.
- Combo upgrade at product level.
- Cart progress indicator for promo thresholds.
- Guest checkout with optional account creation after purchase.
- Saved addresses for returning users.
- Reorder from homepage.
- Payment retry without losing cart.
- WhatsApp recovery for failed or abandoned orders where consent exists.

### Experiment Backlog

- Hero product vs category-first landing.
- Combo preselection vs manual upgrade.
- Cart drawer vs full cart page.
- Loyalty points naming.
- Free delivery threshold vs combo discount.
- Checkout one-page vs stepper.

---

## 9. Mobile-First Strategy

### Mobile Priorities

- One-thumb navigation.
- Bottom sticky cart and checkout CTA.
- Product detail as bottom sheet on mobile.
- Address confirmation as streamlined modal.
- Branch selector with geolocation fallback.
- Reorder and favorites on home.
- Reduced typing through saved data.

### Mobile Performance Targets

- LCP under 2.5 seconds on key pages.
- INP under 200ms.
- CLS under 0.1.
- Menu browsing with skeleton states.
- Optimized image sizes and priority hero imagery.

### Future App Compatibility

The frontend architecture should preserve API contracts and domain logic so future React Native or native apps can consume the same Supabase-backed services.

---

## 10. Design Philosophy

Design should feel like a premium food ordering app, not a brochure.

### Principles

- **Food is the hero**: product photography carries appetite.
- **Commerce is persistent**: cart and branch status are always visible when relevant.
- **Trust is explicit**: fees, ETA, availability, and payment status are never hidden.
- **Every screen has a job**: remove ornamental blocks that do not advance appetite, trust, or purchase.
- **Operational state is designed**: closed branches, unavailable items, delayed orders, and failed payments need polished UI.

---

## 11. Motion Design Philosophy

Motion should communicate state, hierarchy, and progress without slowing ordering.

### Motion Rules

- Use Framer Motion for small transitions: cart changes, sheets, category switch, order timeline.
- Keep durations between 120ms and 280ms for commerce interactions.
- Avoid blocking animations during checkout.
- Respect `prefers-reduced-motion`.
- Use micro-interactions for add-to-cart confirmation, loyalty earnings, and order stage changes.

### Signature Motions

- Product card lift on hover/tap.
- Add-to-cart item fly or pulse to cart badge.
- Checkout step transition.
- Order timeline stage completion animation.
- Subtle flame or grill-inspired loading motif.

---

## 12. Information Architecture

### Public Customer IA

- Home.
- Menu.
- Product detail.
- Cart.
- Checkout.
- Order confirmation.
- Order tracking.
- Loyalty.
- Account.
- Order history.
- Branches.
- Help.

### Staff IA

- Staff login.
- Kitchen dashboard.
- Order detail.
- Availability management.
- Prep time controls.
- Branch settings.

### Admin IA

- Admin dashboard.
- Orders.
- Menu management.
- Branch management.
- Promotions.
- Loyalty rules.
- Customers.
- Analytics.
- Notifications.
- Settings.

---

## 13. Complete Sitemap

```text
/
/menu
/menu/[category]
/product/[slug]
/cart
/checkout
/checkout/payment-status
/orders/[orderId]
/orders/[orderId]/tracking
/account
/account/profile
/account/addresses
/account/orders
/account/loyalty
/account/favorites
/branches
/branches/[slug]
/help
/help/contact
/help/faq
/legal/privacy
/legal/terms
/legal/refund-policy
/staff
/staff/orders
/staff/orders/[orderId]
/staff/availability
/staff/settings
/admin
/admin/orders
/admin/orders/[orderId]
/admin/menu
/admin/menu/products
/admin/menu/categories
/admin/menu/modifiers
/admin/branches
/admin/promotions
/admin/loyalty
/admin/customers
/admin/analytics
/admin/notifications
/admin/settings
```

---

## 14. User Flows

### First-Time Delivery Order

1. User lands on home.
2. User sees open branch status and primary CTA.
3. User opens menu.
4. User selects product.
5. User customizes required modifiers.
6. User adds combo upgrade.
7. User reviews cart drawer.
8. User starts checkout as guest.
9. User enters delivery address.
10. System validates delivery zone and branch.
11. User selects payment method.
12. System creates order and payment preference.
13. User pays through Mercado Pago.
14. Webhook confirms payment.
15. Branch accepts order.
16. User tracks realtime order status.

### Returning Reorder Flow

1. User lands authenticated.
2. Home shows “Order again”.
3. User taps previous order.
4. System validates current availability and prices.
5. User reviews substitutions if needed.
6. User checks out with saved address.
7. User pays and tracks order.

### Pickup Flow

1. User chooses pickup.
2. User selects branch.
3. Menu filters to branch availability.
4. User places order.
5. Staff accepts and prepares.
6. User receives ready notification.
7. Staff marks completed after pickup.

### Staff Fulfillment Flow

1. Paid order enters branch queue.
2. Staff receives realtime alert.
3. Staff accepts or rejects.
4. Staff starts preparation.
5. Staff marks ready.
6. Delivery or pickup completion is recorded.
7. SLA metrics update.

---

## 15. Checkout Experience

### Checkout Model

Checkout should be a compact guided flow, optimized for mobile but capable of desktop side-by-side summary.

### Checkout Steps

1. **Fulfillment**: delivery or pickup, branch, address, ETA.
2. **Customer**: name, phone, email, optional account login.
3. **Review**: items, modifiers, notes, fees, discounts.
4. **Payment**: Mercado Pago checkout.
5. **Confirmation**: realtime status and support options.

### Checkout Rules

- Guest checkout must be supported.
- Account creation should be offered post-purchase.
- Cart must be revalidated before payment.
- Prices, discounts, delivery fees, and availability must be computed server-side.
- Payment failure must preserve order intent and allow retry.
- Mercado Pago webhooks are the source of truth for payment status.

---

## 16. Cart System Logic

### Cart Capabilities

- Add product with variant and modifiers.
- Edit cart line item.
- Duplicate configured item.
- Remove item.
- Quantity changes.
- Item-level notes.
- Cart-level notes.
- Promo code application.
- Loyalty redemption.
- Delivery fee preview.
- Branch-specific validation.

### Cart Pricing Model

Cart total should be computed from:

- Base item price.
- Variant price delta.
- Modifier price deltas.
- Quantity.
- Discounts.
- Loyalty redemption.
- Taxes.
- Delivery fee.
- Service fees if applicable.

### Cart Persistence

- Anonymous carts stored client-side with server validation.
- Authenticated carts persisted to Supabase.
- Cart recovery supported by customer identity and consent.
- Cart expiration rules prevent stale prices.

---

## 17. Loyalty System

### Loyalty Goals

- Increase repeat frequency.
- Reward high-value customers.
- Create emotional attachment.
- Support campaigns without discount addiction.

### Loyalty Model

- Points earned per paid order.
- Bonus points for combos, off-peak pickup, referrals, and limited campaigns.
- Tier progression based on rolling spend or order count.
- Reward catalog with free sides, drinks, sauces, desserts, or discounts.

### Loyalty Rules

- Points awarded only after order completion or non-refunded payment.
- Points reversed on refund.
- Redemptions require server-side validation.
- Fraud patterns should be monitored.

### Tier Examples

- **Grill Starter**: entry tier.
- **Cheese Lover**: repeat customers.
- **Burger Royalty**: VIP customers.

---

## 18. Notification System

### Channels

- WhatsApp.
- Email.
- In-app toast and order timeline.
- Future push notifications.

### Notification Events

- Order received.
- Payment approved.
- Order accepted.
- Preparation started.
- Ready for pickup.
- Out for delivery.
- Completed.
- Delayed order.
- Cancelled or refunded.
- Loyalty reward earned.
- Abandoned cart recovery.
- Winback campaign.

### Governance

- Consent must be captured for marketing notifications.
- Transactional messages must be separated from marketing messages.
- Templates should support localization.
- Delivery failures should be logged.

---

## 19. Delivery System

### Delivery Model

Support branch-managed delivery first, with future third-party or driver app integration.

### Delivery Capabilities

- Branch delivery zones.
- Distance-based fee rules.
- Minimum order thresholds.
- ETA calculation.
- Driver assignment placeholder.
- Delivery status updates.
- Customer delivery instructions.

### Delivery SLA Metrics

- Time to accept.
- Time in preparation.
- Time ready-to-dispatch.
- Time out-for-delivery.
- Total order duration.
- Delay rate.

---

## 20. Order Tracking System

### Customer Tracking Experience

The order tracking page should display:

- Current order state.
- Estimated time.
- Item summary.
- Branch contact.
- Delivery address or pickup branch.
- Payment status.
- Support CTA.

### Staff Tracking Requirements

Staff events should update the customer timeline through Supabase Realtime. All transitions should be auditable and timestamped.

### Event Timeline

Each order should maintain immutable status events for:

- Payment changes.
- Staff actions.
- Customer-visible milestones.
- Delivery transitions.
- Cancellation and refund events.

---

## 21. Realtime Architecture

### Realtime Use Cases

- Customer order tracking.
- Kitchen order queue.
- Staff order updates.
- Item availability updates.
- Branch capacity status.
- Admin dashboards.

### Supabase Realtime Strategy

- Use Postgres row changes for order status and kitchen queue updates.
- Use channel authorization policies to restrict visibility.
- Customers subscribe only to their own orders.
- Staff subscribe only to assigned branch orders.
- Admin users subscribe to permitted organization data.

### Realtime Reliability

- Reconnect with state resync.
- Never rely only on realtime events; always fetch canonical state on page load.
- Store all important transitions in durable tables.
- Use optimistic UI only for reversible customer interactions, not payment or fulfillment truth.

---

## 22. Frontend Architecture

### Stack

- Next.js 15 App Router.
- TypeScript.
- TailwindCSS.
- shadcn/ui.
- Framer Motion.
- Supabase client libraries.

### Layering

```text
app/                 Route segments and layouts
components/          Shared UI and commerce components
features/            Domain feature modules
lib/                 Cross-cutting utilities
server/              Server actions and server-only integrations
styles/              Global styles and Tailwind tokens
types/               Shared TypeScript contracts
```

### Domain Modules

- `menu`.
- `cart`.
- `checkout`.
- `orders`.
- `loyalty`.
- `branches`.
- `account`.
- `staff`.
- `admin`.
- `notifications`.
- `analytics`.

### Frontend Principles

- Server Components for SEO and initial menu rendering.
- Client Components for cart, customization, realtime order tracking, staff dashboard.
- Server Actions or route handlers for secure mutations.
- Strict TypeScript domain types.
- Validation shared between UI and server using schema definitions.
- Keep payment secrets server-only.

---

## 23. Backend Architecture

### Backend Components

- Supabase PostgreSQL as system of record.
- Supabase Auth for customers, staff, and admins.
- Supabase Realtime for operational updates.
- Supabase Storage for product and brand media.
- Next.js route handlers for Mercado Pago, WhatsApp, email, and secure server operations.
- Scheduled jobs for cart cleanup, loyalty processing, reporting, and campaign automation.

### API Boundary

All sensitive operations should happen server-side:

- Checkout session creation.
- Mercado Pago preference creation.
- Payment webhook validation.
- Final cart pricing.
- Loyalty redemption.
- Staff role enforcement.
- Admin mutations.
- Notification dispatch.

### Integration Pattern

- Use idempotency keys for payment and order creation.
- Store webhook payloads for audit.
- Process external events through durable records.
- Retry notification failures with backoff.

---

## 24. Database Architecture

### Core Tables

- `organizations`.
- `branches`.
- `branch_hours`.
- `branch_delivery_zones`.
- `profiles`.
- `customer_addresses`.
- `staff_memberships`.
- `menu_categories`.
- `products`.
- `product_variants`.
- `modifier_groups`.
- `modifiers`.
- `product_modifier_groups`.
- `product_availability`.
- `carts`.
- `cart_items`.
- `orders`.
- `order_items`.
- `order_item_modifiers`.
- `order_status_events`.
- `payments`.
- `payment_webhook_events`.
- `promotions`.
- `promotion_redemptions`.
- `loyalty_accounts`.
- `loyalty_transactions`.
- `notifications`.
- `inventory_items`.
- `inventory_movements`.
- `analytics_events`.

### Data Design Principles

- Orders store immutable snapshots of item names, prices, modifiers, and totals.
- Menu tables represent current catalog state.
- Payment records are separate from orders.
- Status events provide auditability.
- Branch scope is present on operational records.
- RLS policies enforce tenant, branch, and user isolation.

### Suggested Order Fields

- `id`.
- `order_number`.
- `organization_id`.
- `branch_id`.
- `customer_id` nullable for guest.
- `customer_name`.
- `customer_phone`.
- `customer_email`.
- `fulfillment_type`.
- `status`.
- `payment_status`.
- `subtotal`.
- `discount_total`.
- `delivery_fee`.
- `tax_total`.
- `grand_total`.
- `delivery_address_snapshot`.
- `requested_time`.
- `estimated_ready_at`.
- `created_at`.
- `updated_at`.

---

## 25. Security Architecture

### Security Objectives

- Protect customer data.
- Protect payment integrity.
- Prevent unauthorized branch/admin access.
- Preserve order and audit integrity.
- Minimize exposure of secrets.

### Controls

- Supabase RLS enabled on all customer, staff, and admin data tables.
- Role-based access for customer, staff, branch manager, organization admin, super admin.
- Server-side validation for all commerce mutations.
- Webhook signature validation for Mercado Pago.
- Environment secrets stored in Vercel encrypted environment variables.
- Rate limiting for checkout, auth, promo, and webhook endpoints.
- Audit logs for staff/admin actions.
- Least-privilege service role usage only in server-only code.

### Payment Security

- Do not store raw card data.
- Use Mercado Pago-hosted or approved payment flows.
- Store payment provider IDs, statuses, and audit payloads only.
- Implement idempotency to avoid duplicate charges.

---

## 26. QA Strategy

### QA Coverage

- Unit tests for pricing, modifiers, promotions, loyalty, delivery fee rules.
- Component tests for cart, checkout, product detail, order timeline.
- Integration tests for order creation and payment webhooks.
- E2E tests for delivery order, pickup order, failed payment retry, staff fulfillment.
- Accessibility audits for customer-facing commerce flows.
- Performance testing for menu and checkout pages.
- Security testing for RLS and role boundaries.

### Critical Test Scenarios

- Add product with required modifiers.
- Remove unavailable cart item before checkout.
- Apply valid and invalid promo codes.
- Complete Mercado Pago approved payment flow.
- Handle duplicate webhook events.
- Customer can view own order only.
- Staff can view branch orders only.
- Admin can manage permitted organization only.

---

## 27. Analytics Strategy

### Analytics Event Taxonomy

- `page_view`.
- `menu_viewed`.
- `category_selected`.
- `product_viewed`.
- `modifier_selected`.
- `add_to_cart`.
- `cart_viewed`.
- `checkout_started`.
- `address_validated`.
- `payment_started`.
- `payment_approved`.
- `order_created`.
- `order_completed`.
- `promo_applied`.
- `loyalty_redeemed`.
- `reorder_clicked`.
- `support_clicked`.

### Analytics Dimensions

- Branch.
- Fulfillment type.
- Device.
- Traffic source.
- Customer status.
- Product category.
- Promotion.
- Payment method.

### Reporting

- Daily sales dashboard.
- Funnel dashboard.
- Menu performance dashboard.
- Branch SLA dashboard.
- Customer retention dashboard.
- Campaign ROI dashboard.

---

## 28. SEO Strategy

### SEO Goals

- Capture branded searches.
- Capture local burger searches.
- Support branch discovery.
- Make menu indexable where operationally appropriate.

### SEO Pages

- Home.
- Menu landing.
- Category pages.
- Branch pages.
- FAQ.
- Legal pages.

### Technical SEO

- Server-render menu and branch content.
- Structured data for restaurant, menu, local business, opening hours.
- Optimized metadata per branch.
- Canonical URLs.
- XML sitemap.
- Robots policy.
- Open Graph images.

---

## 29. Accessibility Strategy

### Accessibility Standard

Target WCAG 2.2 AA for public customer journeys.

### Requirements

- Keyboard navigable menu, cart, checkout, and dialogs.
- Screen-reader announcements for cart updates.
- Accessible names for all icon buttons.
- Visible focus indicators.
- Sufficient color contrast.
- Error messages associated with form fields.
- Reduced motion support.
- Alternative text for meaningful imagery.

### Accessibility QA

- Automated checks in CI.
- Manual keyboard walkthrough.
- Screen reader smoke testing.
- Color contrast review.

---

## 30. Scalability Strategy

### Application Scalability

- Separate customer, staff, and admin feature domains.
- Keep business rules server-side and reusable.
- Cache read-heavy menu and branch data.
- Invalidate cache on menu or availability changes.
- Use image optimization for media-heavy experiences.

### Database Scalability

- Index operational filters: branch, status, created date, customer.
- Partition or archive old events when scale requires it.
- Keep analytics events append-only and query-optimized.
- Avoid unbounded realtime subscriptions.

### Organizational Scalability

- Organization and branch hierarchy from day one.
- Role-based permissions.
- Branch-local settings.
- Franchise-ready configuration separation.

---

## 31. Multi-Branch Strategy

### Branch Model

Each branch should have independent:

- Menu availability.
- Business hours.
- Delivery zones.
- Prep time settings.
- Staff memberships.
- Order queue.
- Payment settlement metadata.
- Inventory signals.

### Customer Branch Selection

- Auto-suggest nearest branch based on address.
- Allow manual branch selection for pickup.
- Warn when selected branch cannot deliver.
- Persist preferred branch for returning users.

### Admin Controls

- Global menu templates.
- Branch overrides.
- Branch-specific pricing if required.
- Branch campaign assignment.
- Branch performance dashboards.

---

## 32. DevOps & Deployment Strategy

### Environments

- Local development.
- Preview deployments per branch on Vercel.
- Staging connected to staging Supabase.
- Production connected to production Supabase.

### Deployment Pipeline

1. Typecheck.
2. Lint.
3. Unit tests.
4. Integration tests.
5. Build.
6. Database migration validation.
7. Preview deployment.
8. Smoke tests.
9. Production deployment with rollback plan.

### Secrets

- Use Vercel environment variables.
- Separate public Supabase anon key from server-only service key.
- Never expose Mercado Pago access token.
- Rotate webhook secrets and integration keys periodically.

---

## 33. Monitoring Strategy

### Monitoring Domains

- Frontend performance.
- API errors.
- Payment webhook health.
- Supabase database health.
- Realtime subscription behavior.
- Notification delivery.
- Order SLA metrics.

### Alerts

- Payment webhook failure spike.
- Checkout error rate spike.
- Order acceptance delays.
- Realtime disconnect anomalies.
- Database error rate.
- Branch queue overload.
- Notification provider failures.

### Logging

- Structured logs for server actions and route handlers.
- Correlation IDs across order, payment, and notification events.
- Redact PII in logs.
- Persist critical external webhook payloads securely for audit.

---

## 34. Reliability Strategy

### Reliability Principles

- Payment and order state must be durable.
- Webhooks must be idempotent.
- Realtime is enhancement, not the only truth.
- Customers must never lose cart state on transient errors.
- Staff must have clear recovery paths.

### Failure Handling

- Payment pending page polls canonical state.
- Duplicate webhook events ignored safely.
- Failed notification retries queued.
- Temporarily unavailable branch disables checkout but not browsing.
- Mercado Pago interruption preserves order intent.
- Staff dashboard resyncs on reconnect.

---

## 35. Fraud Prevention Strategy

### Fraud Risks

- Promo abuse.
- Loyalty abuse.
- Fake orders.
- Chargeback patterns.
- Staff privilege misuse.
- Webhook spoofing.

### Controls

- Promo redemption limits by user, phone, email, and device signals where legally appropriate.
- Loyalty points issued only after valid payment and completion rules.
- Rate limiting on checkout and promo validation.
- Mercado Pago status verification server-side.
- Staff/admin audit logs.
- Suspicious order monitoring.
- Manual review flags for high-risk patterns.

---

## 36. Automation Strategy

### Operational Automation

- Auto-pause ordering when branch capacity threshold is exceeded.
- Auto-adjust ETA based on queue size.
- Auto-notify customers on delays.
- Auto-mark abandoned carts for recovery campaigns.
- Auto-generate daily sales summaries.
- Auto-expire stale carts.
- Auto-reverse loyalty points on refunds.

### Marketing Automation

- First-order welcome sequence.
- Second-order incentive.
- Winback after inactivity.
- Birthday reward.
- VIP limited drop early access.
- Post-order review request.

---

## 37. AI Recommendation Opportunities

### Near-Term Opportunities

- Personalized reorder suggestions.
- “Complete your meal” cart recommendations.
- Branch-specific popular item ranking.
- Smart promo targeting.
- Estimated prep time refinement.

### Mid-Term Opportunities

- Demand forecasting by branch and hour.
- Inventory depletion prediction.
- Customer churn scoring.
- Menu profitability recommendations.
- Campaign content generation with human approval.

### Guardrails

- Recommendations must not hide full menu access.
- Pricing and promotion eligibility must remain deterministic server-side.
- Sensitive customer data must be minimized.
- AI outputs used for operations should be explainable to staff.

---

## 38. Future Expansion Strategy

### Product Expansion

- Native mobile apps.
- Driver app.
- Customer subscription or membership.
- Group ordering.
- Corporate catering.
- Gift cards.
- Franchise portal.
- Advanced inventory and purchasing.

### Platform Expansion

- Multi-brand support under one organization.
- Third-party delivery provider integrations.
- POS integration.
- Accounting exports.
- Marketing platform integrations.
- Data warehouse integration.

---

## 39. Business Intelligence Strategy

### Executive Dashboards

- Gross sales.
- Net sales.
- Order volume.
- Average order value.
- Repeat rate.
- Customer lifetime value.
- Branch ranking.
- Top products.
- Refund and cancellation rates.

### Operations Dashboards

- Live order queue.
- Average prep time.
- Delayed orders.
- Branch capacity.
- Delivery SLA.
- Product stockout frequency.

### Growth Dashboards

- Funnel conversion.
- Campaign ROI.
- Promo redemption quality.
- Loyalty engagement.
- Customer cohorts.
- Reorder behavior.

---

## 40. Production Readiness Checklist

### Product

- [ ] Product positioning approved.
- [ ] Menu taxonomy finalized.
- [ ] Branch operating rules documented.
- [ ] Loyalty rules approved.
- [ ] Notification templates approved.
- [ ] Legal policies prepared.

### UX/UI

- [ ] Mobile-first customer journey designed.
- [ ] Cart and checkout states designed.
- [ ] Empty, error, loading, closed, and unavailable states designed.
- [ ] Staff dashboard states designed.
- [ ] Accessibility review completed.

### Frontend

- [ ] Next.js 15 project configured.
- [ ] TypeScript strict mode enabled.
- [ ] TailwindCSS tokens configured.
- [ ] shadcn/ui base components installed.
- [ ] Framer Motion reduced-motion patterns implemented.
- [ ] Image optimization configured.

### Backend

- [ ] Supabase project provisioned.
- [ ] Database migrations created.
- [ ] RLS policies implemented and tested.
- [ ] Auth roles implemented.
- [ ] Realtime channels scoped securely.
- [ ] Storage buckets and policies configured.

### Commerce

- [ ] Cart pricing validated server-side.
- [ ] Promotion engine implemented.
- [ ] Loyalty ledger implemented.
- [ ] Mercado Pago integration implemented.
- [ ] Payment webhooks validated and idempotent.
- [ ] Refund handling defined.

### Operations

- [ ] Staff order queue implemented.
- [ ] Branch availability controls implemented.
- [ ] Item availability controls implemented.
- [ ] Prep time controls implemented.
- [ ] Delivery zone validation implemented.

### Security

- [ ] Secrets stored securely.
- [ ] Webhook signatures validated.
- [ ] Rate limiting enabled.
- [ ] Audit logs implemented.
- [ ] PII redaction in logs.
- [ ] Security QA completed.

### QA

- [ ] Unit tests passing.
- [ ] Integration tests passing.
- [ ] E2E checkout tests passing.
- [ ] Accessibility checks passing.
- [ ] Performance checks passing.
- [ ] RLS tests passing.

### DevOps

- [ ] Vercel environments configured.
- [ ] Preview deployments configured.
- [ ] Staging and production Supabase separated.
- [ ] CI pipeline configured.
- [ ] Rollback strategy documented.

### Monitoring

- [ ] Error monitoring configured.
- [ ] Payment alerts configured.
- [ ] Order SLA alerts configured.
- [ ] Notification failure alerts configured.
- [ ] Analytics dashboards configured.

---

## 41. Definitive Implementation Sequence

Although no application code is generated in this foundation, implementation should proceed in this order:

1. Brand and design tokens.
2. Database schema and RLS baseline.
3. Menu, branch, and media management.
4. Customer menu browsing.
5. Cart and pricing engine.
6. Checkout and Mercado Pago integration.
7. Order creation and realtime tracking.
8. Staff kitchen dashboard.
9. Notifications.
10. Loyalty and promotions.
11. Admin analytics.
12. Multi-branch operational controls.
13. Hardening, QA, observability, and launch readiness.

This sequence avoids prototype shortcuts by establishing operational truth and security before advanced growth features.

## 42. Architecture Hardening References

The detailed production event-driven, realtime, asynchronous processing, payment reliability, queue, replay, and observability strategy is defined in [`docs/architecture/event-driven-realtime-architecture.md`](../architecture/event-driven-realtime-architecture.md).

The platform security, tenant isolation, IAM, authorization, fraud prevention, compliance, and infrastructure hardening model is defined in [`docs/architecture/security-tenant-isolation-architecture.md`](../architecture/security-tenant-isolation-architecture.md).

The hardened commerce engine, cart, checkout, pricing, promotion, loyalty redemption, delivery fee, payment orchestration, and peak-load protection model is defined in [`docs/architecture/commerce-engine-architecture.md`](../architecture/commerce-engine-architecture.md).

The hardened restaurant operations, kitchen workflow, fulfillment queue, delivery dispatch, staff synchronization, branch resilience, ETA, and peak-hour operations model is defined in [`docs/architecture/restaurant-operations-architecture.md`](../architecture/restaurant-operations-architecture.md).

The hardened frontend, UX, design system, realtime UI, dashboard, mobile-first, accessibility, performance, and design governance model is defined in [`docs/architecture/frontend-ux-design-system-architecture.md`](../architecture/frontend-ux-design-system-architecture.md).

The hardened infrastructure, DevOps, deployment, observability, SRE, disaster recovery, scalability, cost governance, and production operations model is defined in [`docs/architecture/infrastructure-devops-observability-architecture.md`](../architecture/infrastructure-devops-observability-architecture.md).

The hardened data, analytics, BI, experimentation, forecasting, recommendation systems, growth intelligence, and AI readiness model is defined in [`docs/architecture/data-analytics-intelligence-architecture.md`](../architecture/data-analytics-intelligence-architecture.md).

The hardened governance, engineering operations, product operations, release, quality, design operations, ownership, lifecycle, and long-term platform sustainability model is defined in [`docs/architecture/governance-engineering-operations-architecture.md`](../architecture/governance-engineering-operations-architecture.md).
