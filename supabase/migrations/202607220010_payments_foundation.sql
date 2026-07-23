-- Payments foundation: el pago es verdad financiera server-authoritative ligada al pedido.
-- Intentos idempotentes (misma clave o pendiente existente => mismo intento), ingesta de webhooks
-- idempotente, y confirmacion del pedido gateada por el pago aprobado EN LA MISMA transaccion
-- (cierra el supuesto 2 de ADR-024: la confirmacion quedo separada del checkout para este gate).

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado', 'reembolsado', 'expirado')),
  provider text not null check (provider in ('mercadopago', 'mock')),
  provider_payment_id text,
  provider_preference_id text,
  checkout_url text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null check (currency in ('ARS', 'USD', 'MXN', 'EUR')),
  idempotency_key uuid not null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

-- Un solo intento pendiente y un solo pago aprobado por pedido (PT-2, PT-9).
create unique index if not exists uq_payments_pending_per_order on public.payments(order_id) where estado = 'pendiente';
create unique index if not exists uq_payments_approved_per_order on public.payments(order_id) where estado = 'aprobado';
-- Idempotencia de ingesta: una referencia de pago del proveedor no puede aplicar dos veces (PT-4).
create unique index if not exists uq_payments_provider_ref on public.payments(tenant_id, provider, provider_payment_id) where provider_payment_id is not null;
create index if not exists idx_payments_tenant_order on public.payments(tenant_id, order_id);

-- Bitacora append-only de notificaciones del proveedor: incluye intentos con firma invalida (PT-5),
-- por eso tenant_id/payment_id son opcionales (pueden no resolverse) y sin FK a tenants (criterio audit_events).
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  event_type text not null,
  signature_valid boolean not null,
  action_applied text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_payment_events_payment on public.payment_events(payment_id, occurred_at);

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists payments_tenant_select on public.payments;
create policy payments_tenant_select on public.payments for select using (tenant_id = public.current_tenant_id());
-- payment_events sin politica de lectura: RLS activa sin policies = solo service role (contiene payloads crudos del proveedor).

-- Creacion idempotente del intento de pago. Devuelve el id del intento (existente si la clave ya fue
-- usada o si el pedido ya tiene un intento pendiente), o NULL si el pedido no es pagable.
-- El monto se copia del pedido: server-authoritative, nunca del cliente.
create or replace function public.create_payment_intent(
  p_tenant_id uuid,
  p_order_id uuid,
  p_idempotency_key uuid,
  p_provider text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_amount numeric;
  v_currency text;
  v_estado text;
begin
  select id into v_id from public.payments
   where tenant_id = p_tenant_id and idempotency_key = p_idempotency_key;
  if v_id is not null then
    return v_id;
  end if;

  select id into v_id from public.payments
   where tenant_id = p_tenant_id and order_id = p_order_id and estado = 'pendiente';
  if v_id is not null then
    return v_id;
  end if;

  select total_amount, total_currency, estado into v_amount, v_currency, v_estado
    from public.orders where id = p_order_id and tenant_id = p_tenant_id;
  if v_estado is null or v_estado <> 'borrador' then
    return null;
  end if;

  insert into public.payments (tenant_id, order_id, provider, amount, currency, idempotency_key)
  values (p_tenant_id, p_order_id, p_provider, v_amount, v_currency, p_idempotency_key)
  returning id into v_id;
  return v_id;
exception when unique_violation then
  -- Carrera de dos iniciaciones simultaneas: el indice parcial de pendiente serializa; el perdedor reusa.
  select id into v_id from public.payments
   where tenant_id = p_tenant_id and order_id = p_order_id and estado = 'pendiente';
  return v_id;
end;
$$;

-- Transicion del pago con CAS + bitacora + (si aprobado) confirmacion del pedido, todo atomico.
-- Devuelve: 'applied' | 'applied_order_not_confirmed' | 'duplicate' | 'conflict'.
-- 'applied_order_not_confirmed': el pago aprobo pero el pedido ya no estaba en borrador
-- (p. ej. cancelado durante el pago) - queda visible en la bitacora para conciliacion manual.
create or replace function public.apply_payment_transition(
  p_tenant_id uuid,
  p_payment_id uuid,
  p_from text,
  p_to text,
  p_provider_payment_id text,
  p_event_type text,
  p_payload jsonb,
  p_actor_id uuid
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
  v_order_id uuid;
  v_provider text;
  v_estado text;
  v_existing_ref text;
  v_confirmed boolean;
  v_action text;
begin
  update public.payments
     set estado = p_to,
         provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
         approved_at = case when p_to = 'aprobado' then now() else approved_at end,
         updated_at = now()
   where id = p_payment_id and tenant_id = p_tenant_id and estado = p_from
  returning order_id, provider into v_order_id, v_provider;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    select estado, provider_payment_id, provider into v_estado, v_existing_ref, v_provider
      from public.payments where id = p_payment_id and tenant_id = p_tenant_id;
    if v_estado = p_to and (p_provider_payment_id is null or v_existing_ref = p_provider_payment_id) then
      v_action := 'duplicate';
    else
      v_action := 'conflict';
    end if;
    insert into public.payment_events (tenant_id, payment_id, provider, event_type, signature_valid, action_applied, payload)
    values (p_tenant_id, p_payment_id, coalesce(v_provider, 'unknown'), p_event_type, true, v_action, coalesce(p_payload, '{}'::jsonb));
    return v_action;
  end if;

  v_action := 'applied';
  if p_to = 'aprobado' then
    v_confirmed := public.transition_order(p_tenant_id, v_order_id, 'borrador', 'confirmado', p_actor_id, 'pago aprobado');
    if not v_confirmed then
      v_action := 'applied_order_not_confirmed';
    end if;
  end if;

  insert into public.payment_events (tenant_id, payment_id, provider, event_type, signature_valid, action_applied, payload)
  values (p_tenant_id, p_payment_id, v_provider, p_event_type, true, v_action, coalesce(p_payload, '{}'::jsonb));

  return v_action;
exception when unique_violation then
  -- provider_payment_id ya aplicado sobre otro pago del tenant: ingesta duplicada/cruzada.
  return 'conflict';
end;
$$;

revoke execute on function public.create_payment_intent(uuid, uuid, uuid, text) from anon, authenticated, public;
revoke execute on function public.apply_payment_transition(uuid, uuid, text, text, text, text, jsonb, uuid) from anon, authenticated, public;
