-- Phase 1 auth foundation: additive role key and canonical permission vocabulary support.
alter table public.roles add column if not exists key text;

update public.roles
set key = lower(regexp_replace(nombre, '[^a-zA-Z0-9]+', '_', 'g'))
where key is null;

alter table public.roles alter column key set not null;
create unique index if not exists idx_roles_tenant_key on public.roles(tenant_id, key);
