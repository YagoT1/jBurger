# J Burguer — Enterprise Security and Tenant Isolation Architecture

## 0. Security Scope

This document defines the production security, tenant isolation, identity, authorization, infrastructure protection, fraud prevention, compliance, audit, and resilience architecture for the J Burguer food-tech platform.

The platform must protect customer data, financial workflows, realtime restaurant operations, privileged administration, franchise boundaries, and operational continuity across organizations, branches, customers, staff, support users, and platform operators.

Security assumptions:

- The frontend is untrusted.
- Client claims are untrusted.
- Webhook delivery order is untrusted.
- Realtime connections are transient and must be authorized continuously.
- Admin tooling is high risk and must be explicitly constrained.
- Service-role access is dangerous and must be isolated to server-only controlled boundaries.
- Every tenant, branch, role, and feature boundary must be enforced server-side and at the database layer.

---

## 1. Security Architecture Philosophy

### 1.1 Security Objective

The J Burguer platform security model must enforce least privilege, tenant isolation, financial integrity, and operational auditability while preserving a fast mobile commerce experience and realtime restaurant operations.

### 1.2 Core Principles

1. **Secure by default**: new tables, routes, storage buckets, queues, and realtime channels are private until explicitly opened.
2. **Defense in depth**: authorization is enforced in application logic, database RLS, storage policies, queue boundaries, and observability controls.
3. **Least privilege**: users, service roles, workers, and integrations receive only the permissions required for their scope.
4. **Tenant isolation first**: organization and branch boundaries are primary data constraints, not UI filters.
5. **Financial immutability**: payments, refunds, webhooks, loyalty ledgers, and audit events are append-only or correction-by-event.
6. **Auditable privilege**: privileged actions require actor identity, reason where appropriate, before/after state, correlation ID, and immutable audit trail.
7. **Hostile environment assumption**: traffic, payloads, files, sessions, and provider callbacks are treated as potentially malicious.
8. **Realtime safety**: subscribing to data must be as strictly authorized as fetching it through an API.
9. **Operational recovery**: security incidents require kill switches, tenant isolation controls, credential rotation, replay-safe recovery, and forensic data.
10. **Privacy minimization**: store only necessary PII, expose only necessary fields, and anonymize analytics wherever possible.

---

## 2. Zero Trust Model

### 2.1 Trust Boundaries

The system uses zero trust between:

- Browser/mobile clients and backend APIs.
- Guest users and customer-owned resources.
- Customers and staff/admin data.
- Branch staff and other branches.
- Organization admins and other organizations.
- Support operators and unrestricted data export.
- Platform super-admins and normal operational flows.
- External providers and canonical internal state.
- Queue workers and arbitrary job payloads.

### 2.2 Verification Requirements

Every request must verify:

- Authenticated identity or guest tracking token.
- Session validity.
- Actor role.
- Organization scope.
- Branch scope where applicable.
- Feature permission.
- Current aggregate state for commands.
- Rate limit and risk posture.
- Payload schema and business invariants.

### 2.3 Explicit Trust Decisions

Trust is never inherited from:

- Hidden form fields.
- URL parameters.
- Client-side role flags.
- Client-provided branch IDs.
- Client-provided order totals.
- Client-provided payment status.
- Client-provided file metadata.
- Unvalidated webhook payloads.

---

## 3. Tenant Isolation Strategy

### 3.1 Tenant Hierarchy

The platform tenant hierarchy is:

```text
platform
  organization
    branch
      operational resources
        order
        staff assignment
        delivery task
        branch inventory
        branch availability
  customer identity and customer-owned resources
```

### 3.2 Isolation Layers

Tenant isolation is enforced through:

- Tenant-aware schema design.
- Mandatory `organization_id` on organization-scoped records.
- Mandatory `branch_id` on branch-operational records.
- Database RLS on all tenant data.
- Server-side authorization checks.
- Tenant-aware realtime policies.
- Tenant-aware queue partitioning.
- Tenant-aware storage paths and policies.
- Tenant-aware audit logs.
- Tenant-scoped analytics projections.

### 3.3 Isolation Invariants

- An organization admin cannot read or mutate another organization's data.
- A branch manager cannot control another branch without explicit membership.
- Branch staff cannot subscribe to organization-wide financial streams by default.
- Customers cannot infer other customers' orders, addresses, loyalty, or payments.
- Guest tracking tokens expose only the single order they were minted for.
- Support access is scoped, temporary, audited, and purpose-bound.
- Platform super-admin access is exceptional, monitored, and never used for routine operations.

---

## 4. Multi-Tenant Data Boundaries

### 4.1 Boundary Types

| Boundary | Applies To | Security Requirement |
| --- | --- | --- |
| Organization | Branches, staff, menus, campaigns, analytics | Mandatory `organization_id`, RLS, scoped admin permissions |
| Branch | Orders, kitchen queues, delivery tasks, availability | Mandatory `branch_id`, branch membership checks |
| Customer | Addresses, loyalty, order history | Customer ownership or secure guest token |
| Financial | Payments, refunds, webhook records | Append-only, privileged access, reconciliation audit |
| Support | Customer/order lookup | Temporary and audited purpose-limited access |
| Platform | Super-admin operations | Break-glass controls and high-severity monitoring |

### 4.2 Query Boundary Rules

- Tenant filters must be applied in database policy, not only application code.
- Organization and branch filters must be explicit in admin and staff queries.
- Aggregate dashboards must read pre-scoped projections, not unbounded raw tables.
- Search endpoints must return only records within actor scope.
- Background workers must process tenant-aware batches.

### 4.3 Cross-Tenant Aggregation

Cross-tenant platform analytics are allowed only in anonymized or platform-super-admin contexts. Franchise benchmarking must use aggregated, anonymized metrics that cannot reveal another organization's individual customers or sensitive financial records.

---

## 5. Organization Isolation Model

### 5.1 Organization-Scoped Resources

Organization-scoped resources include:

- Branches.
- Staff memberships.
- Menu catalog templates.
- Promotions.
- Loyalty programs.
- Customer segments.
- Notification templates.
- Analytics dashboards.
- Organization settings.
- Payment configuration metadata.

### 5.2 Organization Invariants

- Every organization-scoped table must include `organization_id`.
- Organization IDs are immutable after record creation unless a controlled migration is executed.
- Organization admins manage only their organization.
- Organization-wide exports require explicit permission and audit logging.
- Franchise-level operators require separate scope from organization admins.

### 5.3 Organization Admin Limits

Organization admins should not automatically receive:

- Raw payment provider secrets.
- Service-role access.
- Cross-organization analytics.
- Platform configuration.
- Unredacted support logs.
- Direct SQL access.

---

## 6. Branch Isolation Model

### 6.1 Branch-Scoped Resources

Branch-scoped resources include:

- Orders.
- Kitchen queues.
- Delivery tasks.
- Branch-specific product availability.
- Branch hours.
- Branch delivery zones.
- Branch capacity state.
- Staff shift assignments.
- Operational incidents.

### 6.2 Branch Authorization Rules

- Staff actions require active membership in the target branch.
- Branch managers can manage branch operations for assigned branches only.
- Delivery operators see delivery tasks for assigned branch or assigned route only.
- Kitchen staff see active kitchen orders for assigned branch only.
- Admin organization scope may include all branches only if role permission allows it.

### 6.3 Branch Escalation Prevention

The backend must reject:

- Client-submitted branch IDs that do not match actor membership.
- Staff attempts to subscribe to another branch queue.
- Staff attempts to mutate branch capacity outside assignment.
- Order status transitions from unassigned branch staff.
- Cross-branch refunds or cancellations without higher privilege.

---

## 7. Authorization Philosophy

### 7.1 Authorization Model

Authorization is a combination of:

- RBAC for coarse role capabilities.
- Scoped permissions for organization, branch, feature, and resource constraints.
- State-based authorization for commands.
- Attribute checks for customer ownership and guest tracking.
- Risk-based controls for sensitive operations.

### 7.2 Authorization Decision Inputs

Authorization decisions should consider:

- Actor identity.
- Actor role and permission set.
- Organization membership.
- Branch membership.
- Resource ownership.
- Feature scope.
- Current resource state.
- Session assurance level.
- Risk score.
- Temporary access grants.

### 7.3 Deny-by-Default

If permission cannot be proven, access is denied. Ambiguous scope, missing tenant IDs, stale sessions, missing membership, or unsupported feature permissions must produce denial rather than fallback access.

---

## 8. RBAC Architecture

### 8.1 Role Families

| Role | Scope | Primary Capabilities |
| --- | --- | --- |
| Guest | Single order/cart/session | Browse, checkout, track own guest order |
| Customer | Own account | Orders, addresses, loyalty, profile |
| Kitchen Staff | Branch | View/update preparation workflow |
| Branch Staff | Branch | Accept orders, manage order status, basic availability |
| Delivery Operator | Branch/route | Delivery task updates and limited order info |
| Branch Manager | Branch | Staff operations, availability, local reports, refunds if permitted |
| Organization Admin | Organization | Branch/menu/promo/staff management and analytics |
| Support Operator | Purpose-limited | Customer/order support with redaction and audit |
| Franchise Operator | Franchise group | Multi-organization oversight with constrained aggregation |
| Platform Super-Admin | Platform | Emergency and platform operations only |

### 8.2 RBAC Storage

Recommended authorization tables:

- `roles`.
- `permissions`.
- `role_permissions`.
- `staff_memberships`.
- `organization_memberships`.
- `branch_memberships`.
- `temporary_access_grants`.
- `support_access_sessions`.
- `privileged_action_approvals`.

### 8.3 Role Assignment Rules

- Role assignment changes require privileged actor and audit log.
- High-risk roles require MFA and elevated session assurance.
- Platform super-admin assignment requires out-of-band governance.
- Temporary roles must expire automatically.
- Role removal invalidates active sessions or forces token refresh.

---

## 9. Permission Hierarchy

### 9.1 Permission Format

Use structured permissions:

```text
<domain>:<action>:<scope>
```

Examples:

- `orders:read:branch`
- `orders:refund:organization`
- `menu:update:branch`
- `staff:invite:organization`
- `payments:read_redacted:organization`
- `support:impersonate:none`

### 9.2 Scope Levels

Scope levels:

- `self`
- `guest_order`
- `assigned_route`
- `branch`
- `organization`
- `franchise`
- `platform`

### 9.3 Permission Inheritance

- Higher scope does not automatically imply every sensitive lower-scope action.
- Financial actions require explicit permission even for organization admins.
- Support permissions are purpose-bound and do not inherit admin write privileges.
- Platform permissions should be split between read, support, security, finance, and emergency operations.

### 9.4 Sensitive Permissions

Sensitive permissions include:

- Refunds.
- Manual payment reconciliation.
- Loyalty balance adjustment.
- Promo creation with financial impact.
- Staff invitation and role changes.
- Data export.
- Support access to customer PII.
- Branch channel pause/resume.
- Security settings changes.

Sensitive permissions require enhanced audit and may require step-up authentication.

---

## 10. IAM Strategy

### 10.1 Identity Types

Identity types:

- Anonymous session.
- Guest checkout identity.
- Customer account.
- Staff account.
- Support account.
- Platform operator account.
- Service identity.
- External provider identity.

### 10.2 Account Separation

Staff/admin identities should be distinct from customer identities where operational security requires it. If one Supabase Auth user can have multiple profiles, the active context must be explicit and role switching must be controlled and audited.

### 10.3 MFA Requirements

MFA should be required for:

- Organization admins.
- Branch managers with refund or staff-management permissions.
- Support operators.
- Platform super-admins.
- Any user performing exports, refunds, manual payment repair, or role changes.

### 10.4 Identity Lifecycle

- Staff invitations expire.
- Offboarding revokes memberships and sessions.
- Role changes invalidate permission caches.
- Dormant privileged accounts are disabled or require re-verification.
- Break-glass accounts are monitored and used only in emergencies.

---

## 11. Authentication Architecture

### 11.1 Authentication Methods

The platform may support:

- Email/password or magic links for customers.
- OTP or email verification for checkout identity verification.
- Stronger staff/admin authentication with MFA.
- OAuth only if provider risk and domain restrictions are acceptable.

### 11.2 Authentication Requirements

- Staff/admin routes require authenticated sessions.
- Privileged actions require recent authentication or step-up.
- Guest order tracking requires unguessable scoped tokens.
- Login attempts are rate-limited and monitored.
- Account enumeration is prevented through neutral responses.

### 11.3 Account Recovery

Account recovery must:

- Use short-lived tokens.
- Invalidate old sessions after sensitive recovery.
- Notify user of security-sensitive changes.
- Require additional checks for staff/admin accounts.

---

## 12. Session Management

### 12.1 Session Security

Sessions must be:

- Shorter for staff/admin than customers.
- Refreshable through secure mechanisms.
- Invalidated on role changes, offboarding, password reset, or suspected compromise.
- Bound to device/session metadata where possible.
- Monitored for impossible travel or suspicious reuse.

### 12.2 Session Assurance Levels

Define assurance levels:

- `low`: anonymous or guest session.
- `standard`: authenticated customer.
- `staff`: authenticated staff with active branch membership.
- `privileged`: MFA-verified admin/support session.
- `break_glass`: emergency platform access with enhanced monitoring.

Sensitive operations require minimum assurance.

### 12.3 Session Revocation

Revocation triggers:

- Staff removed from branch.
- Role downgraded.
- Suspicious login detected.
- Credential compromise suspected.
- Support access window expires.
- Emergency security action.

---

## 13. JWT Strategy

### 13.1 JWT Claims

JWTs should carry only stable, low-risk claims needed for authorization acceleration. Claims may include:

- User ID.
- Session ID.
- Role family summary.
- Active organization context if appropriate.
- Assurance level.
- Token issue and expiry times.

Do not rely solely on JWT claims for high-risk authorization. Branch membership, temporary access, and sensitive permission checks must be verified against current server/database state when required.

### 13.2 JWT Lifetime

- Customer JWTs may have standard short lifetimes with refresh.
- Staff/admin JWTs should have shorter lifetimes.
- Elevated session claims should expire quickly.
- Token refresh must re-check active role and membership status.

### 13.3 JWT Revocation

Maintain a revocation strategy through:

- Session records.
- Token version counters.
- Forced refresh after role changes.
- Revocation lists for compromised sessions.

---

## 14. Secure Cookie Strategy

### 14.1 Cookie Requirements

Session cookies must use:

- `HttpOnly` where applicable.
- `Secure` in production.
- `SameSite=Lax` or stricter depending on payment redirect requirements.
- Minimal lifetime.
- Scoped domain and path.

### 14.2 CSRF Protection

State-changing server routes must protect against CSRF through:

- SameSite cookies.
- CSRF tokens where cookie-authenticated POSTs are used.
- Origin and Referer validation for sensitive endpoints.
- Re-authentication for high-risk actions.

### 14.3 Payment Redirect Considerations

Payment redirects may require careful SameSite behavior, but the platform must never trust redirect parameters as payment truth. Payment state must be confirmed server-side through validated provider events or provider status fetch.

---

## 15. Realtime Authorization Security

### 15.1 Realtime Security Principles

- Realtime subscriptions are authorization events.
- Realtime data must be subject to RLS or equivalent scoped projection policies.
- Clients must not subscribe to wildcard operational channels.
- Presence payloads must not expose sensitive PII.
- Realtime auth must refresh when JWT/session changes.

### 15.2 Customer Realtime Rules

Customers may subscribe only to:

- Their own active order tracking projection.
- Their own loyalty/account notifications.
- Guest order projection through a scoped tracking token.

Customer tracking projections should expose only fields needed for order status and support, not internal staff notes, full payment payloads, or other customer data.

### 15.3 Staff Realtime Rules

Staff may subscribe only to:

- Assigned branch order queue.
- Assigned branch kitchen events.
- Assigned branch availability/capacity.
- Delivery tasks within assigned branch or route.

Staff realtime permissions must be invalidated when membership changes.

### 15.4 Admin Realtime Segmentation

Admin realtime channels must be segmented by:

- Organization.
- Branch where relevant.
- Feature permission.
- Metric sensitivity.

High-cardinality analytics or raw financial streams should not be directly broadcast to browsers.

---

## 16. API Security Architecture

### 16.1 API Boundary Rules

All API/server action boundaries must enforce:

- Authentication or explicit guest token validation.
- Authorization against current resource scope.
- Schema validation.
- Business invariant validation.
- Rate limiting.
- Idempotency for retryable commands.
- Audit logging for privileged actions.

### 16.2 API Design Rules

- Never accept order totals from the client as truth.
- Never accept payment status from the client as truth.
- Never expose service-role operations to client code.
- Never return more fields than the actor needs.
- Use resource IDs plus tenant checks, not IDs alone.
- Separate public customer APIs from staff/admin APIs.

### 16.3 Sensitive API Surfaces

Sensitive surfaces include:

- Checkout and payment preference creation.
- Mercado Pago webhooks.
- Refunds.
- Promo and loyalty redemption.
- Staff status transitions.
- Branch channel controls.
- Admin exports.
- Support lookups.
- File uploads.

---

## 17. Input Validation Strategy

### 17.1 Validation Layers

Validation occurs at:

- UI for immediate feedback.
- API boundary for trust enforcement.
- Domain command handlers for business invariants.
- Database constraints for final integrity.
- Provider integration adapters for external payload schemas.

### 17.2 Validation Rules

- Validate type, length, range, enum, format, and allowed transitions.
- Normalize phone, email, address, and money fields.
- Validate money as integer minor units.
- Validate all IDs as scoped resources.
- Validate modifier selections server-side against current menu and branch availability.
- Validate file metadata and content independently.

### 17.3 Rejection Handling

Invalid input should produce safe error messages that do not leak:

- Whether an account exists.
- Whether an order belongs to another customer.
- Whether a branch ID is valid outside actor scope.
- Internal provider details.
- SQL or infrastructure details.

---

## 18. Request Verification Strategy

### 18.1 Request Verification Controls

Requests should verify:

- HTTP method.
- Content type.
- Payload size.
- Auth token/session.
- CSRF where applicable.
- Origin for browser-sensitive endpoints.
- Idempotency key for retryable operations.
- Correlation ID for traceability.
- Rate limit budget.

### 18.2 High-Risk Request Requirements

High-risk requests require:

- Step-up authentication where appropriate.
- Recent session validation.
- Permission check against fresh DB state.
- Audit log entry.
- Optional approval workflow for especially risky operations.

### 18.3 Replay Resistance

Replay resistance uses:

- Idempotency records.
- Timestamp windows for signed requests.
- Nonces for sensitive commands where appropriate.
- Provider event IDs for webhooks.
- Short-lived guest and support access tokens.

---

## 19. Command Authorization Rules

### 19.1 Command Pattern

Clients issue commands; server validates and emits durable state changes/events. Commands are not accepted as facts.

### 19.2 Command Authorization Inputs

Each command must validate:

- Actor identity.
- Required permission.
- Resource tenant scope.
- Branch membership.
- Current aggregate state.
- Command idempotency key.
- Risk flags.

### 19.3 Command Examples

| Command | Required Authorization |
| --- | --- |
| `accept_order` | Staff assigned to order branch with `orders:accept:branch` |
| `mark_order_ready` | Kitchen/branch staff assigned to branch |
| `pause_delivery` | Branch manager or org admin with branch scope |
| `issue_refund` | Explicit refund permission, step-up auth, reason code |
| `adjust_loyalty_points` | Org admin/support permission, audited reason, approval threshold |
| `export_customers` | Organization export permission, MFA, audit, privacy purpose |

---

## 20. Database Security Architecture

### 20.1 Database Security Principles

- RLS is enabled on every tenant or customer data table.
- All tables have explicit ownership and access policy.
- Critical writes are done through controlled server paths or security-definer functions with strict checks.
- Database constraints enforce invariants that application bugs cannot bypass.
- Critical financial and audit records are append-only.

### 20.2 Required Controls

- Primary and foreign key constraints.
- Check constraints for status enums and money values.
- Unique constraints for idempotency keys.
- Immutable organization and branch IDs after creation for scoped records.
- Append-only triggers or policies for critical ledgers.
- Audit triggers for privileged mutations.

### 20.3 Sensitive Tables

Sensitive tables include:

- `payments`.
- `payment_events`.
- `payment_webhook_events`.
- `orders`.
- `order_status_events`.
- `loyalty_transactions`.
- `audit_events`.
- `staff_memberships`.
- `support_access_sessions`.
- `customer_addresses`.

---

## 21. PostgreSQL Security Model

### 21.1 Roles

Use separate database access patterns for:

- Anonymous client access through Supabase anon role.
- Authenticated user access through RLS.
- Server-side app access for constrained operations.
- Service-role access only in server-only isolated contexts.
- Migration/admin access only through controlled CI/CD or privileged operations.

### 21.2 Database Function Security

Security-definer functions must:

- Set a safe `search_path`.
- Validate actor and tenant scope internally.
- Avoid dynamic SQL unless necessary and safe.
- Be narrowly scoped.
- Be reviewed as privileged code.
- Emit audit events for sensitive mutations.

### 21.3 Migration Safety

Migrations must:

- Enable RLS immediately for new tenant tables.
- Add deny-all policies before permissive policies.
- Avoid accidental broad grants.
- Backfill tenant IDs safely.
- Include rollback and data repair plan for sensitive schema changes.

---

## 22. Row-Level Security (RLS) Strategy

### 22.1 RLS Philosophy

RLS is a mandatory containment layer. Application authorization errors should not become tenant data leaks.

### 22.2 RLS Policy Classes

Policy classes:

- Customer self-access.
- Guest order token access.
- Branch staff branch-scoped access.
- Organization admin organization-scoped access.
- Support purpose-limited access.
- Platform super-admin emergency access.
- Service worker controlled access.

### 22.3 RLS Rules

- Customer policies use authenticated user ID or controlled mapping table.
- Staff policies join against active branch/organization memberships.
- Support policies require active support session with purpose and expiration.
- Admin policies require organization membership and permission.
- Realtime-enabled tables use the same RLS policies or safe projections.
- Sensitive provider payload tables are never exposed to normal clients.

### 22.4 RLS Testing

Every policy must have tests for:

- Allowed same-tenant access.
- Denied cross-tenant access.
- Denied unauthenticated access.
- Denied stale membership access.
- Denied privilege escalation.
- Denied realtime subscription leakage.

---

## 23. Service Role Isolation

### 23.1 Service Role Rules

Supabase service role must:

- Never be exposed to browser/client bundles.
- Never be used in generic shared utilities imported by client code.
- Be used only in server-only integration boundaries.
- Be wrapped in narrow functions with explicit authorization and audit.
- Be separated by environment.

### 23.2 Service Role Use Cases

Permitted use cases:

- Mercado Pago webhook processing.
- Payment reconciliation.
- Controlled background workers.
- Admin-approved data repair.
- Notification dispatch worker.
- Migration and maintenance tasks.

### 23.3 Service Role Abuse Prevention

- Code review required for service-role usage.
- Static checks should prevent service-role imports into client components.
- Service-role operations include correlation IDs and audit entries.
- Service-role credentials are rotated after suspected exposure.

---

## 24. Secret Management Strategy

### 24.1 Secret Classes

Secrets include:

- Supabase service role key.
- Supabase database credentials.
- Mercado Pago access tokens and webhook secrets.
- WhatsApp API credentials.
- Email provider credentials.
- Encryption keys.
- Internal signing secrets.
- Admin emergency credentials.

### 24.2 Secret Controls

- Store secrets only in Vercel/Supabase secret stores or approved vaults.
- Separate development, staging, and production secrets.
- Apply least privilege to provider credentials.
- Rotate secrets periodically and after personnel or incident events.
- Never log secrets or provider authorization headers.
- Do not include secrets in PRs, build artifacts, or client-side environment variables.

### 24.3 Secret Rotation

Rotation plans must include:

- Dual-secret validation windows for webhooks where supported.
- Deployment order.
- Rollback plan.
- Provider update checklist.
- Post-rotation verification.

---

## 25. Environment Security

### 25.1 Environment Separation

Environments:

- Local development.
- Preview.
- Staging.
- Production.

Each environment must have:

- Separate Supabase project or isolated database.
- Separate Mercado Pago credentials.
- Separate notification credentials.
- Separate storage buckets.
- Separate logs and monitoring labels.

### 25.2 Production Data Restrictions

- Production data must not be copied to local or preview environments without anonymization and approval.
- Test payments must not use production payment credentials.
- Preview deployments must not connect to production Supabase by default.
- Staff/admin testing in non-production must use synthetic accounts.

---

## 26. Infrastructure Hardening

### 26.1 Infrastructure Principles

- Reduce public attack surface.
- Enforce TLS everywhere.
- Apply least privilege to runtime integrations.
- Use managed provider security features.
- Monitor configuration drift.
- Protect deployment pipeline.

### 26.2 Runtime Protection

- Security headers on all web responses.
- Strict CORS policies.
- Request body limits.
- Timeout limits.
- Rate limiting.
- Bot protection for public surfaces.
- Controlled error responses.

### 26.3 CI/CD Protection

- Branch protection.
- Required review for security-sensitive files.
- Secret scanning.
- Dependency scanning.
- Build artifact review for leaked environment variables.
- Separate production deployment permissions.

---

## 27. Vercel Security Strategy

### 27.1 Vercel Controls

- Use Vercel environment variable scoping.
- Restrict production deployment permissions.
- Protect preview deployment access where needed.
- Apply custom security headers.
- Monitor function errors and latency.
- Ensure server-only secrets are not prefixed as public environment variables.

### 27.2 Edge and Serverless Considerations

- Avoid long-running critical payment work in request lifecycle; persist and process asynchronously.
- Ensure webhook handlers quickly persist raw events and return only after safe acknowledgement conditions.
- Use idempotency for serverless retries.
- Avoid relying on in-memory state across invocations.

### 27.3 Headers

Recommended security headers:

- Content Security Policy.
- Strict Transport Security.
- X-Content-Type-Options.
- Referrer-Policy.
- Permissions-Policy.
- Frame-ancestors restrictions.

---

## 28. Supabase Security Strategy

### 28.1 Supabase Controls

- RLS enabled on tenant and customer tables.
- Realtime enabled only on safe tables or projections.
- Storage buckets private by default.
- Auth settings configured for secure redirect URLs.
- Service role used only server-side.
- Database backups protected.
- API keys separated by environment.

### 28.2 Supabase Auth Hardening

- Restrict allowed redirect URLs.
- Configure email/OTP rate limits where available.
- Enforce MFA for privileged users where supported.
- Monitor failed login and OTP attempts.
- Disable unused providers.

### 28.3 Supabase Realtime Hardening

- Minimize realtime-enabled tables.
- Use projection tables to reduce sensitive payload exposure.
- Ensure RLS policies apply to realtime subscriptions.
- Monitor connection count and authorization failures.

---

## 29. Storage Security Rules

### 29.1 Bucket Classification

| Bucket | Visibility | Purpose |
| --- | --- | --- |
| `public-menu-media` | Public read, controlled write | Product/category/brand media |
| `private-customer-uploads` | Private | Customer support attachments if needed |
| `private-admin-documents` | Private | Internal operational documents |
| `quarantine-uploads` | Private | Files awaiting validation/scanning |
| `exports` | Private signed URL | Temporary data exports |

### 29.2 Storage Path Strategy

Paths should include tenant scope:

```text
organizations/<organization_id>/branches/<branch_id>/...
customers/<customer_id>/...
exports/<organization_id>/<export_id>/...
```

### 29.3 Signed URL Rules

- Use short-lived signed URLs for private assets.
- Validate actor access before generating signed URL.
- Do not generate broad folder-level access.
- Log export signed URL creation and access where possible.

---

## 30. File Upload Security

### 30.1 Upload Validation

File uploads must validate:

- Authenticated or authorized context.
- Tenant scope.
- File size.
- MIME type from content inspection, not only extension.
- Extension allowlist.
- Image dimensions where relevant.
- Malware scan status where supported.

### 30.2 Upload Flow

1. Upload to quarantine or controlled staging path.
2. Validate metadata and content.
3. Scan for malware when available.
4. Strip unsafe metadata for images where appropriate.
5. Move to final bucket/path.
6. Record audit event for admin uploads.

### 30.3 Public Media Controls

Admin-uploaded menu media can become public only after validation. Customer uploads should never be public by default.

---

## 31. Payment Security Architecture

### 31.1 Payment Boundary

Mercado Pago is the payment processor. J Burguer must not store raw card data. Internal systems store only provider identifiers, payment status, amount, currency, order reference, and audit metadata.

### 31.2 Payment Trust Rules

- Client redirects do not prove payment.
- Client-submitted payment status is ignored.
- Provider webhooks are untrusted until validated.
- Provider status fetch is required for uncertain or critical transitions.
- Internal order fulfillment depends on validated payment state.

### 31.3 Financial State Protection

- Payment records are append-only or correction-by-event.
- Refunds require explicit permission and reason.
- Manual reconciliation requires privileged audit trail.
- Duplicate approval states trigger anomaly handling.
- Amount/currency/order reference must match expected order values.

---

## 32. Mercado Pago Hardening

### 32.1 Mercado Pago Configuration

- Use separate credentials for each environment.
- Store access tokens only server-side.
- Use webhook secrets or provider-supported signature validation.
- Restrict callback/notification URLs to controlled domains.
- Include internal order/payment attempt references in metadata where supported.

### 32.2 Provider Trust Boundary

Mercado Pago events become internal financial facts only after:

1. Webhook authenticity verification.
2. Payload schema validation.
3. Idempotency check.
4. Provider status confirmation when required.
5. Amount, currency, and merchant account verification.
6. Valid state machine transition.

### 32.3 Double-Payment Prevention

- Payment attempts are linked to one order.
- New attempts are allowed only when previous attempt is terminal or safely abandoned.
- Multiple approved attempts for one order create high-severity financial anomaly.
- Fulfillment is blocked or reviewed if duplicate approval is detected before kitchen acceptance.

### 32.4 Refund Security

Refund operations require:

- Explicit refund permission.
- MFA or elevated session for privileged roles.
- Reason code.
- Amount validation.
- Provider response persistence.
- Customer/order audit event.
- Reconciliation job verification.

---

## 33. Webhook Security

### 33.1 Webhook Handling Rules

Webhook endpoints must:

- Accept only expected methods.
- Enforce payload size limits.
- Persist raw receipt safely.
- Validate signature or provider verification mechanism.
- Reject stale signed payloads where timestamps exist.
- Deduplicate by provider event/payment identifiers.
- Fetch provider status for critical transitions.
- Never expose processing secrets in errors.

### 33.2 Webhook Replay Protection

Replay protection uses:

- Provider event ID.
- Provider payment ID and transition key.
- Signature timestamp window.
- Payload hash fallback.
- Idempotency table.

### 33.3 Webhook Failure Modes

- Invalid signature: store security event, do not process.
- Duplicate event: acknowledge safely, no duplicate side effects.
- Out-of-order event: fetch provider canonical status.
- Provider unavailable: retry reconciliation, keep payment pending.
- Internal processing failure: DLQ and alert for payment-critical events.

---

## 34. Fraud Prevention Systems

### 34.1 Fraud Domains

Fraud prevention covers:

- Fake account creation.
- Payment fraud.
- Promo abuse.
- Coupon farming.
- Loyalty farming.
- Refund abuse.
- Bot checkout abuse.
- Credential attacks.
- Webhook spoofing.
- Staff privilege abuse.

### 34.2 Fraud Scoring Inputs

Signals may include:

- Account age.
- Order velocity.
- Payment attempts per order.
- Failed payment ratio.
- Promo usage frequency.
- Loyalty earning/redeeming patterns.
- Device/session fingerprint where legally appropriate.
- IP risk and ASN.
- Address reuse patterns.
- Refund/cancellation history.
- Branch-specific anomaly thresholds.

### 34.3 Fraud Response Levels

| Risk Level | Action |
| --- | --- |
| Low | Allow and monitor |
| Medium | Add friction, require verification, suppress promo |
| High | Hold order for review, block reward redemption |
| Critical | Block action, alert security/operations |

---

## 35. Abuse Prevention Systems

### 35.1 Abuse Categories

- Credential stuffing.
- Brute-force login attempts.
- Promo validation scraping.
- Inventory/menu scraping at abusive rates.
- Checkout spam.
- Support form spam.
- Realtime subscription abuse.
- Notification abuse.

### 35.2 Abuse Controls

- Rate limits by IP, user, session, endpoint, and branch.
- Progressive friction.
- Bot protection for public endpoints.
- CAPTCHA or challenge only where needed.
- Endpoint-specific throttles.
- Realtime subscription limits.
- Queue enqueue protections.

### 35.3 Abuse Escalation

Escalate when:

- Failed login attempts spike.
- Promo validation attempts spike.
- Realtime authorization failures spike.
- Guest tracking token failures spike.
- Payment attempt failures spike.
- Support tooling access anomalies occur.

---

## 36. Bot Protection Strategy

### 36.1 Protected Surfaces

- Login and OTP endpoints.
- Signup.
- Guest checkout.
- Promo validation.
- Payment preference creation.
- Contact/support forms.
- Guest order tracking.
- Public menu endpoints under scraping pressure.

### 36.2 Bot Controls

- Behavioral rate limits.
- IP reputation checks.
- Challenge-based verification for suspicious flows.
- Honeypot fields for forms.
- Request signature or nonce on sensitive browser flows.
- Progressive friction rather than blanket challenges.

### 36.3 Customer Experience Balance

Bot controls should not add friction to normal food ordering unless risk warrants it. Security measures should escalate based on behavior and risk signals.

---

## 37. Rate Limiting Architecture

### 37.1 Rate Limit Dimensions

Rate limits apply by:

- IP hash.
- User ID.
- Session ID.
- Device token where appropriate.
- Endpoint.
- Organization ID.
- Branch ID.
- Order ID.
- Promo code.
- Payment attempt.

### 37.2 Endpoint Classes

| Endpoint Class | Rate Limit Posture |
| --- | --- |
| Menu browsing | Generous, bot-aware |
| Cart validation | Moderate, session-aware |
| Checkout creation | Strict, idempotent |
| Payment status polling | Controlled, order-aware |
| Promo validation | Strict, promo-aware |
| Auth endpoints | Strict, credential-attack aware |
| Admin mutations | Strict, actor-aware |
| Webhooks | Provider-aware, quarantine invalid bursts |

### 37.3 Backpressure

When under pressure:

- Throttle analytics and marketing first.
- Preserve payment and order lifecycle processing.
- Apply branch-level ordering pause if kitchen is overwhelmed.
- Return `Retry-After` guidance where appropriate.

---

## 38. Device/IP Risk Analysis

### 38.1 Risk Signals

Signals include:

- IP velocity.
- ASN or hosting provider risk.
- Geo mismatch with delivery region.
- Device/session churn.
- Multiple accounts per device signal.
- Multiple failed payment attempts.
- High promo redemption velocity.
- Repeated guest checkout failures.

### 38.2 Privacy Constraints

Device/IP analysis must respect legal and privacy requirements. Store only necessary risk signals, avoid invasive fingerprinting where prohibited, and disclose relevant processing in privacy policies.

### 38.3 Risk Actions

- Require login or OTP confirmation.
- Suppress promo eligibility.
- Require payment method confirmation.
- Hold for manual review.
- Block abusive traffic.
- Alert security or operations.

---

## 39. Checkout Abuse Prevention

### 39.1 Checkout Risks

- Fake orders.
- Payment attempt spam.
- Inventory reservation abuse.
- Branch queue spam.
- Address probing.
- Delivery fee probing at abusive rates.

### 39.2 Controls

- Server-side cart validation.
- Idempotent order creation.
- Payment attempt caps per order/session.
- Address validation throttles.
- Branch capacity checks.
- Order hold for high-risk patterns.
- Guest checkout verification thresholds.

### 39.3 Fulfillment Safety

Do not send an order to kitchen until payment state and fraud posture allow it. If risk is high after payment approval, mark order for staff review according to policy rather than silently fulfilling.

---

## 40. Coupon Abuse Prevention

### 40.1 Coupon Abuse Risks

- Code brute forcing.
- Coupon farming with fake accounts.
- Sharing single-use codes.
- Stacking unintended discounts.
- Using region/branch-specific coupons outside scope.

### 40.2 Coupon Controls

- Promo validation rate limits.
- Redemption limits by customer, phone, email, session, device risk, and payment instrument where allowed.
- Branch and organization scope checks.
- Expiration and budget caps.
- Server-side discount computation.
- Audit events for promo creation and redemption.

### 40.3 Promo Governance

High-impact promotions require approval, budget, start/end date, branch scope, and rollback plan.

---

## 41. Loyalty Abuse Prevention

### 41.1 Loyalty Risks

- Points farming.
- Referral abuse.
- Reward redemption loops.
- Refund-after-reward abuse.
- Staff-issued unauthorized adjustments.

### 41.2 Loyalty Controls

- Points awarded only after eligible order completion.
- Refunds create reversing ledger transactions.
- Rewards reserved during checkout and released on failure/expiration.
- Manual adjustments require reason and audit.
- Referral rewards have anti-self-referral rules.
- Velocity and anomaly monitoring.

### 41.3 Ledger Integrity

Loyalty ledger is append-only. Balance is derived or transactionally updated with immutable ledger entries and reconciliation checks.

---

## 42. Admin Panel Security

### 42.1 Admin Security Requirements

- Admin routes require authenticated privileged sessions.
- MFA required for sensitive roles.
- Permissions enforced per feature and scope.
- Sensitive actions require step-up authentication.
- Admin UI must not expose hidden controls as security boundary.
- All admin mutations are audited.

### 42.2 Admin Segmentation

Admin capabilities are segmented by:

- Menu management.
- Branch operations.
- Promotions.
- Loyalty.
- Staff management.
- Financial operations.
- Analytics.
- Support.
- Security settings.

### 42.3 Admin Export Controls

Exports require:

- Explicit export permission.
- Purpose selection.
- MFA.
- Scoped data filtering.
- Redaction where possible.
- Short-lived signed URL.
- Audit trail.

---

## 43. Support Tooling Security

### 43.1 Support Access Model

Support access should be purpose-bound, time-limited, and audited. Support users should see only the minimum data needed to resolve a customer issue.

### 43.2 Support Controls

- Ticket or reason required for lookup.
- PII redaction by default.
- Reveal-sensitive-data action requires additional permission and audit.
- No unrestricted impersonation.
- Any customer-impacting action requires explicit command and reason.
- Support sessions expire automatically.

### 43.3 Impersonation Policy

Avoid full user impersonation. Prefer scoped support actions and read-only troubleshooting views. If impersonation is unavoidable in future, require customer-safe banner, audit, approval, and strict expiration.

---

## 44. Audit Logging Strategy

### 44.1 Audit Event Requirements

Audit events must capture:

- Actor ID.
- Actor role.
- Organization ID.
- Branch ID where applicable.
- Action.
- Target resource.
- Before/after state for sensitive changes.
- Reason code.
- Correlation ID.
- IP hash and user agent where policy allows.
- Timestamp.

### 44.2 Audited Actions

Audit:

- Staff role changes.
- Branch channel pause/resume.
- Order cancellation.
- Refunds.
- Manual payment reconciliation.
- Loyalty adjustment.
- Promo creation/update.
- Customer data export.
- Support PII access.
- Storage signed URL generation for private files.
- Security settings changes.

### 44.3 Audit Log Protection

- Audit logs are append-only.
- Access to audit logs is privileged and monitored.
- Audit logs are tenant-scoped where appropriate.
- Platform security audit logs are not editable by organization admins.

---

## 45. Security Event Monitoring

### 45.1 Security Events

Monitor:

- Failed logins.
- MFA failures.
- Role changes.
- Privileged action attempts.
- Cross-tenant access denials.
- RLS denials if observable.
- Realtime authorization failures.
- Webhook validation failures.
- Rate limit hits.
- Payment anomalies.
- Support access events.

### 45.2 Alert Classes

| Severity | Examples |
| --- | --- |
| Critical | Service-role exposure, webhook secret compromise, cross-tenant leak |
| High | Payment anomaly, admin account compromise, privilege escalation attempt |
| Medium | Repeated realtime auth failures, promo abuse spike |
| Low | Isolated failed login or validation failure |

### 45.3 Security Dashboards

Dashboards should include:

- Auth health.
- Admin activity.
- Payment security.
- Realtime authorization failures.
- Tenant access denials.
- Abuse/rate limit events.
- Support access logs.
- Secret rotation status.

---

## 46. Threat Detection Strategy

### 46.1 Detection Rules

Detect:

- Impossible travel for staff/admin accounts.
- Login from unusual ASN for privileged accounts.
- Spike in failed promo validations.
- Multiple approved payments for one order.
- Repeated rejected payment attempts from same identity signals.
- Staff accessing unusual branch scope.
- Support operator searching many customers.
- Realtime subscription attempts across many branches.

### 46.2 Anomaly Baselines

Establish baselines by:

- Branch.
- Hour of day.
- Campaign period.
- Device class.
- Customer cohort.
- Staff role.
- Payment method.

### 46.3 Response Automation

Automated responses can include:

- Session revocation.
- Temporary account lock.
- Promo suppression.
- Payment review hold.
- Branch channel pause.
- Provider secret rotation workflow.
- Security incident creation.

---

## 47. Incident Response Strategy

### 47.1 Incident Classes

- Customer data exposure.
- Credential compromise.
- Admin account compromise.
- Webhook secret compromise.
- Payment anomaly/fraud incident.
- Cross-tenant access bug.
- Branch operational compromise.
- Storage asset exposure.
- Realtime authorization failure.

### 47.2 Response Phases

1. Detect and classify.
2. Contain affected user, branch, organization, provider, or feature.
3. Preserve evidence and logs.
4. Rotate credentials if needed.
5. Disable or kill-switch affected feature.
6. Repair state through audited recovery flows.
7. Notify stakeholders according to legal/compliance requirements.
8. Perform post-incident review.

### 47.3 Emergency Kill Switches

Kill switches should exist for:

- Checkout.
- Payment retries.
- Promo redemption.
- Loyalty redemption.
- WhatsApp notifications.
- Public file uploads.
- Staff dashboard writes.
- Branch ordering channel.
- Realtime non-critical broadcasts.

---

## 48. Disaster Recovery Security

### 48.1 DR Security Requirements

Disaster recovery must preserve security controls. Restored systems must not come up with disabled RLS, broad permissions, stale secrets, or public private buckets.

### 48.2 Recovery Validation

After recovery verify:

- RLS enabled.
- Policies present.
- Secrets current.
- Storage buckets private/public as expected.
- Webhooks point to correct environment.
- Admin roles are intact.
- Audit logging works.
- Realtime policies function.

### 48.3 Emergency Access

Break-glass access must be:

- Pre-approved.
- MFA protected.
- Logged.
- Time-limited.
- Reviewed after use.

---

## 49. Backup Security

### 49.1 Backup Controls

- Backups encrypted at rest.
- Access limited to infrastructure/security roles.
- Backup restore operations audited.
- Production backups not restored into insecure environments without anonymization.
- Backup retention follows compliance and business needs.

### 49.2 Backup Testing

Regularly test:

- Restore process.
- RLS and policy preservation.
- Data integrity.
- Audit trail continuity.
- Secret/environment separation after restore.

---

## 50. Encryption Strategy

### 50.1 Encryption in Transit

- TLS for all browser, API, webhook, provider, and database connections.
- Secure WebSocket connections for realtime.
- No plaintext provider callbacks.

### 50.2 Encryption at Rest

- Use managed encryption for database, storage, logs, and backups.
- Consider field-level encryption for highly sensitive operational data if required.
- Protect encryption keys through managed provider controls or approved vault.

### 50.3 Hashing and Tokenization

- Hash IPs where full IP storage is not required.
- Tokenize or redact customer identifiers in analytics.
- Store only provider payment IDs, not card data.
- Use strong random tokens for guest tracking and signed access.

---

## 51. PII Protection Strategy

### 51.1 PII Classes

| Class | Examples | Protection |
| --- | --- | --- |
| Basic identity | Name, email, phone | Access control, masking in support views |
| Address | Delivery address, notes | Customer/staff need-to-know, retention rules |
| Financial metadata | Provider payment ID, status, amount | Privileged access, audit |
| Support data | Attachments, messages | Private storage, redaction |
| Analytics identifiers | User/session IDs | Pseudonymization/anonymization |

### 51.2 PII Minimization

- Do not store unnecessary delivery instructions after operational need expires unless business/legal requires it.
- Avoid sending PII to analytics providers unnecessarily.
- Redact PII in logs.
- Minimize PII in realtime payloads.
- Mask PII in staff views where full data is not needed.

### 51.3 PII Access Controls

- Customers access own PII.
- Branch staff see only PII required to fulfill orders.
- Delivery operators see delivery-relevant PII only.
- Support sees redacted PII unless elevated reveal is justified.
- Admin exports are privileged and audited.

---

## 52. Compliance Strategy

### 52.1 Compliance Scope

The platform should prepare for:

- Privacy obligations similar to GDPR-style rights.
- Payment processor contractual requirements.
- Marketing consent rules.
- Data retention obligations.
- Security incident notification obligations.
- Local consumer and refund policy requirements.

### 52.2 Payment Compliance

- Do not store raw card data.
- Use Mercado Pago-hosted or approved payment flows.
- Keep payment audit records.
- Restrict refund permissions.
- Reconcile provider and internal records.

### 52.3 Policy Documentation

Maintain:

- Privacy policy.
- Terms of service.
- Refund policy.
- Cookie/analytics disclosure.
- Marketing consent language.
- Data retention policy.
- Incident response policy.

---

## 53. GDPR-Style Data Governance

### 53.1 Data Rights

Support workflows for:

- Access request.
- Correction request.
- Deletion request where legally allowed.
- Data export request.
- Marketing consent withdrawal.
- Processing restriction where applicable.

### 53.2 Governance Controls

- Data inventory by table and field classification.
- Purpose limitation for data collection.
- Consent records for marketing.
- Processor/vendor registry.
- Audit trail for data rights handling.

### 53.3 Deletion Constraints

Deletion requests must respect:

- Financial record retention.
- Fraud prevention retention.
- Legal obligations.
- Operational dispute windows.

Where deletion is restricted, use anonymization or suppression where appropriate.

---

## 54. Data Retention Policies

### 54.1 Retention Categories

| Data | Retention Posture |
| --- | --- |
| Active orders | Operational retention plus support window |
| Payment records | Longer legal/accounting retention |
| Payment webhook records | Legal/audit retention with access restrictions |
| Customer addresses | Until deleted by customer or retention policy expires |
| Marketing consent | Retain proof while needed for compliance |
| Analytics raw events | Time-limited then aggregate/anonymize |
| Audit logs | Long retention, append-only |
| Support attachments | Short retention unless case requires longer |

### 54.2 Retention Enforcement

- Scheduled deletion/anonymization jobs.
- Retention policy table by data category.
- Audit of retention job execution.
- Legal hold support for disputes.

---

## 55. Secure Deletion Flows

### 55.1 Deletion Types

- Hard delete for non-critical transient data.
- Soft delete for recoverable operational data.
- Anonymization for retained business records.
- Suppression for marketing/contact restrictions.

### 55.2 Deletion Workflow

1. Validate requester identity.
2. Determine legal/business constraints.
3. Identify data across systems.
4. Delete, anonymize, or suppress according to category.
5. Record deletion audit event.
6. Confirm completion to requester when required.

### 55.3 Critical Record Handling

Payment, order, audit, and loyalty ledger records should not be destructively deleted when retention is legally or operationally required. Use anonymized customer references where appropriate.

---

## 56. Data Export Flows

### 56.1 Customer Export

Customer exports should include:

- Profile.
- Addresses.
- Order history.
- Loyalty transactions.
- Marketing consent state.

Exclude or redact:

- Internal fraud scores.
- Staff notes not appropriate for disclosure.
- Other customers' data.
- Sensitive provider security data.

### 56.2 Admin Export

Admin exports require:

- Explicit permission.
- MFA.
- Organization/branch scope.
- Purpose.
- Redaction options.
- Short-lived signed URL.
- Audit trail.

### 56.3 Export Storage

Exports must be stored in private storage with expiration and access logging. Export files should be deleted automatically after expiration.

---

## 57. Infrastructure Observability Security

### 57.1 Secure Observability

Observability systems must not become data leakage channels. Logs, traces, metrics, and dashboards should be access-controlled and redacted.

### 57.2 Redaction Rules

Redact:

- Tokens and secrets.
- Authorization headers.
- Full payment provider payload secrets.
- Passwords and OTPs.
- Full customer addresses where not needed.
- Sensitive support attachments.

### 57.3 Observability Access

- Engineers see operational logs with PII redacted.
- Support sees customer-specific support views, not raw infrastructure logs.
- Security team can access security logs with governance.
- Organization admins do not access platform logs.

---

## 58. Security QA Strategy

### 58.1 Security Test Categories

- Auth boundary tests.
- RBAC permission tests.
- RLS policy tests.
- Realtime subscription authorization tests.
- Tenant isolation tests.
- Webhook spoofing tests.
- Replay attack tests.
- CSRF tests.
- Rate limit tests.
- File upload security tests.
- Payment consistency tests.

### 58.2 Required Automated Tests

- Customer cannot read another customer's order.
- Staff cannot read another branch queue.
- Organization admin cannot access another organization.
- Guest tracking token cannot access unrelated order.
- Expired support access cannot reveal PII.
- Duplicate webhook does not duplicate effects.
- Invalid webhook signature is rejected/quarantined.
- Service-role utilities are not imported into client bundles.

### 58.3 Manual Security QA

Manual QA should include:

- Admin role downgrade while session active.
- Staff branch removal while realtime dashboard is open.
- Support reveal-PII workflow.
- Refund permission and step-up flow.
- Data export and signed URL expiration.
- File upload bypass attempts.

---

## 59. Penetration Testing Strategy

### 59.1 Pen Test Scope

Penetration testing should cover:

- Public customer ordering flows.
- Guest order tracking.
- Checkout and payment redirects.
- Mercado Pago webhook endpoints.
- Staff dashboards.
- Admin panel.
- Supabase RLS policies.
- Supabase Realtime subscriptions.
- Storage upload/download policies.
- Support tooling.

### 59.2 Required Attack Scenarios

- Cross-tenant data access by ID tampering.
- Branch escalation through manipulated branch ID.
- Realtime unauthorized subscription.
- Webhook spoofing and replay.
- Coupon brute forcing.
- Loyalty double-spend.
- Refund privilege escalation.
- File upload malware or polyglot file.
- CSRF on admin mutation.
- Service-role leakage attempts.

### 59.3 Remediation Process

- Classify severity.
- Patch root cause.
- Add regression tests.
- Review related authorization patterns.
- Update threat model.
- Record remediation evidence.

---

## 60. Production Security Checklist

### 60.1 Identity and Access

- [ ] MFA enforced for privileged roles.
- [ ] Role and permission matrix approved.
- [ ] Staff offboarding revokes sessions.
- [ ] Temporary access expires automatically.
- [ ] Privileged actions require audit logs.

### 60.2 Tenant Isolation

- [ ] Every tenant table has `organization_id` or justified exception.
- [ ] Every branch operational table has `branch_id` or justified exception.
- [ ] RLS policies tested for cross-tenant denial.
- [ ] Realtime subscriptions tested for branch/customer scope.
- [ ] Queue workers process tenant-aware jobs.

### 60.3 Payment Security

- [ ] Mercado Pago secrets are server-only.
- [ ] Webhook validation implemented.
- [ ] Duplicate webhook handling tested.
- [ ] Payment reconciliation implemented.
- [ ] Refund authorization and audit implemented.
- [ ] Double-payment anomaly alerts configured.

### 60.4 Infrastructure and Secrets

- [ ] Production secrets separated from staging/preview.
- [ ] Service role not exposed to client bundles.
- [ ] Security headers configured.
- [ ] CORS restricted.
- [ ] Secret scanning enabled.
- [ ] Backup access restricted.

### 60.5 Storage and Files

- [ ] Buckets classified public/private.
- [ ] Private signed URLs expire.
- [ ] Upload validation implemented.
- [ ] Malware scanning strategy defined.
- [ ] Exports auto-expire.

### 60.6 Fraud and Abuse

- [ ] Auth rate limits configured.
- [ ] Checkout abuse controls enabled.
- [ ] Promo abuse limits configured.
- [ ] Loyalty abuse monitoring enabled.
- [ ] Bot protection enabled for risky surfaces.

### 60.7 Observability and Incident Response

- [ ] Security dashboards configured.
- [ ] Critical security alerts configured.
- [ ] Incident response runbooks approved.
- [ ] Kill switches implemented.
- [ ] Credential rotation procedure tested.
- [ ] Audit logs are append-only and queryable.

### 60.8 Compliance and Privacy

- [ ] PII classification completed.
- [ ] Privacy policy and consent language approved.
- [ ] Data export flow implemented.
- [ ] Secure deletion/anonymization flow implemented.
- [ ] Retention jobs configured and audited.

This checklist is a launch gate. Production release should be blocked if tenant isolation, payment security, service-role isolation, webhook validation, or privileged-action auditability is incomplete.
