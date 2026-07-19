-- Cart foundation: el carrito es intención de compra, nunca verdad financiera (ADR-009, commerce-engine §3–5).
-- No persiste precios: el pricing preview se recalcula contra catálogo y disponibilidad vigentes.

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid not null references public.users(id) on delete cascade,
  cart_version integer not null default 1 check (cart_version >= 1),
  status text not null default 'active' check (status in ('active', 'converted', 'expired', 'abandoned')),
  fulfillment_type text check (fulfillment_type in ('pickup', 'delivery')),
  expires_at timestamptz,
  last_priced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un único carrito activo por cliente y tenant.
create unique index if not exists uq_carts_active_per_customer on public.carts(tenant_id, customer_id) where status = 'active';
create index if not exists idx_carts_tenant_status on public.carts(tenant_id, status);

-- product_id deliberadamente SIN foreign key al catálogo (ver plan del bloque y ADR-023):
-- el carrito debe sobrevivir a la desaparición del producto y reportarlo como `removed`
-- en el pricing preview, sin bloquear el borrado del catálogo ni perder el ítem en silencio.
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null,
  quantity integer not null check (quantity >= 1 and quantity <= 99),
  item_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index if not exists idx_cart_items_cart on public.cart_items(cart_id);
create index if not exists idx_cart_items_tenant on public.cart_items(tenant_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists carts_tenant_select on public.carts;
drop policy if exists cart_items_tenant_select on public.cart_items;

create policy carts_tenant_select on public.carts for select using (tenant_id = public.current_tenant_id());
create policy cart_items_tenant_select on public.cart_items for select using (tenant_id = public.current_tenant_id());
