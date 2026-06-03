-- RLS smoke assertions for local Supabase verification.
-- Execute after migrations with a JWT containing tenant_id.
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('users','roles','permissions','user_tenants','user_branches','session_tracking','audit_events');
