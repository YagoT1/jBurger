-- Catalog foundation: categories, products, branch availability (Menú ≠ Producto; Disponibilidad ≠ Producto)
-- Sigue el estilo de la foundation: schema public, multi-tenant, RLS-ready, audit-ready.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null,
  descripcion text,
  orden integer not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, nombre)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  nombre text not null,
  descripcion text,
  price_amount numeric(12, 2) not null check (price_amount > 0),
  price_currency text not null default 'ARS' check (price_currency in ('ARS', 'USD', 'MXN', 'EUR')),
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, nombre)
);

create table if not exists public.product_branch_availability (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  disponible boolean not null default true,
  price_override_amount numeric(12, 2) check (price_override_amount is null or price_override_amount > 0),
  updated_by uuid,
  updated_at timestamptz not null default now(),
  primary key (product_id, branch_id)
);

create index if not exists idx_categories_tenant_orden on public.categories(tenant_id, orden) where activa;
create index if not exists idx_products_tenant_category on public.products(tenant_id, category_id) where activo;
create index if not exists idx_product_availability_tenant_branch on public.product_branch_availability(tenant_id, branch_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_branch_availability enable row level security;

drop policy if exists categories_tenant_select on public.categories;
drop policy if exists products_tenant_select on public.products;
drop policy if exists product_availability_tenant_select on public.product_branch_availability;

create policy categories_tenant_select on public.categories for select using (tenant_id = public.current_tenant_id());
create policy products_tenant_select on public.products for select using (tenant_id = public.current_tenant_id());
create policy product_availability_tenant_select on public.product_branch_availability for select using (tenant_id = public.current_tenant_id());

-- Auditoría de cambios de disponibilidad (impacto operativo directo sobre el menú publicado).
create or replace function public.audit_row_change() returns trigger language plpgsql security definer as $$
begin
  insert into public.audit_events(tenant_id, actor_id, action, resource, resource_id, metadata)
  values (coalesce(new.tenant_id, old.tenant_id), null, tg_op || '_' || tg_table_name, tg_table_name, null, jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_product_availability on public.product_branch_availability;
create trigger trg_audit_product_availability
  after insert or update or delete on public.product_branch_availability
  for each row execute function public.audit_row_change();
