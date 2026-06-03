# Security Foundation

## Secret Management Strategy

Runtime secrets are injected through environment variables by the hosting platform or local `.env` files that are excluded from source control. `.env.example` is the only committed reference.

## RBAC Foundation

Wave 1 begins from the API permission vocabulary in `services/api/src/security/permissions.ts`, the Nest `RbacGuard`, and Supabase role/permission tables.

## Audit Hooks

The API includes an `AuditInterceptor` placeholder and Supabase includes an `audit_events` table with tenant indexes and RLS enabled.

## Middleware Structure

The API applies a security context middleware to every route so downstream auth, audit, and tracing code can rely on request identifiers.
