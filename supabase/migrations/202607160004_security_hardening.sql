-- Security hardening: advisors remediation
-- 1) search_path fijo en funciones (referencias ya calificadas con schema)
alter function public.current_tenant_id() set search_path = '';
alter function public.audit_auth_access_change() set search_path = '';
alter function public.audit_row_change() set search_path = '';

-- 2) Las funciones de auditoría son trigger-only: nadie debe ejecutarlas vía RPC
revoke execute on function public.audit_auth_access_change() from anon, authenticated, public;
revoke execute on function public.audit_row_change() from anon, authenticated, public;

-- 3) permissions: vocabulario global no sensible, lectura solo para usuarios autenticados
drop policy if exists permissions_read_authenticated on public.permissions;
create policy permissions_read_authenticated on public.permissions for select to authenticated using (true);
