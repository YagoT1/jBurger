-- Mutación atómica del carrito: compare-and-set sobre cart_version + reconciliación de ítems
-- en una única transacción. Devuelve la nueva versión, o NULL si hubo conflicto de concurrencia
-- (versión distinta, carrito inexistente o no activo). Solo invocable con service role.
create or replace function public.apply_cart_mutation(
  p_tenant_id uuid,
  p_cart_id uuid,
  p_expected_version integer,
  p_branch_id uuid,
  p_fulfillment_type text,
  p_items jsonb
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_version integer;
begin
  update public.carts
     set cart_version = cart_version + 1,
         branch_id = coalesce(p_branch_id, branch_id),
         fulfillment_type = coalesce(p_fulfillment_type, fulfillment_type),
         updated_at = now()
   where id = p_cart_id
     and tenant_id = p_tenant_id
     and cart_version = p_expected_version
     and status = 'active'
  returning cart_version into v_new_version;

  if v_new_version is null then
    return null;
  end if;

  delete from public.cart_items where cart_id = p_cart_id and tenant_id = p_tenant_id;

  insert into public.cart_items (id, tenant_id, cart_id, product_id, quantity, item_notes)
  select coalesce(nullif(item->>'id', '')::uuid, gen_random_uuid()),
         p_tenant_id,
         p_cart_id,
         (item->>'productId')::uuid,
         (item->>'quantity')::integer,
         nullif(item->>'notas', '')
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  return v_new_version;
end;
$$;

revoke execute on function public.apply_cart_mutation(uuid, uuid, integer, uuid, text, jsonb) from anon, authenticated, public;
