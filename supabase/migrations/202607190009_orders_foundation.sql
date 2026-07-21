-- Orders foundation: el pedido ES verdad financiera inmutable (a diferencia del carrito).
-- Checkout idempotente y transaccional vía place_order; ciclo de vida vía transition_order.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  customer_id uuid not null references public.users(id) on delete restrict,
  numero bigint generated always as identity,
  estado text not null default 'borrador' check (estado in ('borrador', 'confirmado', 'preparacion', 'entregado', 'cancelado')),
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')),
  delivery_address jsonb,
  notas text,
  cart_id uuid,
  cart_version_at_checkout integer,
  idempotency_key uuid not null,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  total_currency text not null check (total_currency in ('ARS', 'USD', 'MXN', 'EUR')),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

-- product_id sin FK: el snapshot del pedido debe sobrevivir a cambios/bajas del catálogo (mismo criterio que cart_items, ADR-023).
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null,
  nombre text not null,
  quantity integer not null check (quantity >= 1),
  unit_price_amount numeric(12, 2) not null check (unit_price_amount > 0),
  unit_price_currency text not null check (unit_price_currency in ('ARS', 'USD', 'MXN', 'EUR')),
  subtotal_amount numeric(12, 2) not null check (subtotal_amount > 0),
  item_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_estado text,
  to_estado text not null,
  actor_id uuid,
  reason text,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_orders_tenant_branch_estado on public.orders(tenant_id, branch_id, estado);
create index if not exists idx_orders_tenant_customer on public.orders(tenant_id, customer_id, created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_status_events_order on public.order_status_events(order_id, occurred_at);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;

drop policy if exists orders_tenant_select on public.orders;
drop policy if exists order_items_tenant_select on public.order_items;
drop policy if exists order_status_events_tenant_select on public.order_status_events;

create policy orders_tenant_select on public.orders for select using (tenant_id = public.current_tenant_id());
create policy order_items_tenant_select on public.order_items for select using (tenant_id = public.current_tenant_id());
create policy order_status_events_tenant_select on public.order_status_events for select using (tenant_id = public.current_tenant_id());

-- Checkout transaccional e idempotente. Devuelve el id del pedido (existente si la clave ya fue usada),
-- o NULL si el carrito no pudo convertirse (versión/estado en conflicto).
create or replace function public.place_order(
  p_tenant_id uuid,
  p_customer_id uuid,
  p_branch_id uuid,
  p_cart_id uuid,
  p_expected_cart_version integer,
  p_idempotency_key uuid,
  p_fulfillment_type text,
  p_delivery_address jsonb,
  p_notas text,
  p_total_amount numeric,
  p_total_currency text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_converted integer;
begin
  select id into v_order_id from public.orders
   where tenant_id = p_tenant_id and idempotency_key = p_idempotency_key;
  if v_order_id is not null then
    return v_order_id;
  end if;

  update public.carts
     set status = 'converted', updated_at = now()
   where id = p_cart_id
     and tenant_id = p_tenant_id
     and customer_id = p_customer_id
     and status = 'active'
     and cart_version = p_expected_cart_version;
  get diagnostics v_converted = row_count;
  if v_converted = 0 then
    return null;
  end if;

  insert into public.orders (
    tenant_id, branch_id, customer_id, estado, fulfillment_type, delivery_address, notas,
    cart_id, cart_version_at_checkout, idempotency_key, total_amount, total_currency
  ) values (
    p_tenant_id, p_branch_id, p_customer_id, 'borrador', p_fulfillment_type, p_delivery_address, nullif(p_notas, ''),
    p_cart_id, p_expected_cart_version, p_idempotency_key, p_total_amount, p_total_currency
  ) returning id into v_order_id;

  insert into public.order_items (tenant_id, order_id, product_id, nombre, quantity, unit_price_amount, unit_price_currency, subtotal_amount, item_notes)
  select p_tenant_id,
         v_order_id,
         (item->>'productId')::uuid,
         item->>'nombre',
         (item->>'quantity')::integer,
         (item->>'unitPriceAmount')::numeric,
         item->>'currency',
         (item->>'subtotalAmount')::numeric,
         nullif(item->>'notas', '')
    from jsonb_array_elements(p_items) as item;

  insert into public.order_status_events (tenant_id, order_id, from_estado, to_estado, actor_id)
  values (p_tenant_id, v_order_id, null, 'borrador', p_customer_id);

  return v_order_id;
end;
$$;

-- Transición de estado con CAS sobre el estado origen + evento, en una transacción.
create or replace function public.transition_order(
  p_tenant_id uuid,
  p_order_id uuid,
  p_from text,
  p_to text,
  p_actor_id uuid,
  p_reason text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.orders
     set estado = p_to,
         updated_at = now(),
         confirmed_at = case when p_to = 'confirmado' then now() else confirmed_at end,
         cancelled_at = case when p_to = 'cancelado' then now() else cancelled_at end
   where id = p_order_id and tenant_id = p_tenant_id and estado = p_from;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  insert into public.order_status_events (tenant_id, order_id, from_estado, to_estado, actor_id, reason)
  values (p_tenant_id, p_order_id, p_from, p_to, p_actor_id, nullif(p_reason, ''));

  return true;
end;
$$;

revoke execute on function public.place_order(uuid, uuid, uuid, uuid, integer, uuid, text, jsonb, text, numeric, text, jsonb) from anon, authenticated, public;
revoke execute on function public.transition_order(uuid, uuid, text, text, uuid, text) from anon, authenticated, public;
