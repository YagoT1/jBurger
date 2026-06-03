-- Wave 1 auth and access foundation
alter table public.user_roles add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
update public.user_roles ur set tenant_id = u.tenant_id from public.users u where ur.user_id = u.id and ur.tenant_id is null;
alter table public.role_permissions add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
update public.role_permissions rp set tenant_id = r.tenant_id from public.roles r where rp.role_id = r.id and rp.tenant_id is null;

create table if not exists public.user_tenants (
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

create table if not exists public.user_branches (
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  primary key (user_id, branch_id)
);

create table if not exists public.session_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  refresh_token_hash text not null,
  ip_address inet,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_tenants_tenant on public.user_tenants(tenant_id);
create index if not exists idx_user_branches_tenant_branch on public.user_branches(tenant_id, branch_id);
create index if not exists idx_session_tracking_user_active on public.session_tracking(user_id, expires_at desc) where revoked_at is null;

alter table public.user_tenants enable row level security;
alter table public.user_branches enable row level security;
alter table public.session_tracking enable row level security;

drop policy if exists user_roles_tenant_select on public.user_roles;
drop policy if exists role_permissions_tenant_select on public.role_permissions;
drop policy if exists user_tenants_select on public.user_tenants;
drop policy if exists user_branches_select on public.user_branches;
drop policy if exists session_tracking_select on public.session_tracking;

create policy user_roles_tenant_select on public.user_roles for select using (tenant_id = public.current_tenant_id());
create policy role_permissions_tenant_select on public.role_permissions for select using (tenant_id = public.current_tenant_id());
create policy user_tenants_select on public.user_tenants for select using (tenant_id = public.current_tenant_id());
create policy user_branches_select on public.user_branches for select using (tenant_id = public.current_tenant_id());
create policy session_tracking_select on public.session_tracking for select using (tenant_id = public.current_tenant_id() and revoked_at is null);

create or replace function public.audit_auth_access_change() returns trigger language plpgsql security definer as $$
begin
  insert into public.audit_events(tenant_id, actor_id, action, resource, resource_id, metadata)
  values (coalesce(new.tenant_id, old.tenant_id), null, tg_op || '_' || tg_table_name, tg_table_name, null, jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_user_tenants on public.user_tenants;
drop trigger if exists trg_audit_user_branches on public.user_branches;
drop trigger if exists trg_audit_session_tracking on public.session_tracking;
create trigger trg_audit_user_tenants after insert or update or delete on public.user_tenants for each row execute function public.audit_auth_access_change();
create trigger trg_audit_user_branches after insert or update or delete on public.user_branches for each row execute function public.audit_auth_access_change();
create trigger trg_audit_session_tracking after insert or update or delete on public.session_tracking for each row execute function public.audit_auth_access_change();
