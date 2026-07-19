-- Datos base de J Burguer (tenant, sucursal Roque Pérez y catálogo inicial).
-- IDs alineados con el seed demo in-memory de la API (services/api/src/catalog/persistence/in-memory-catalog.store.ts).
-- Estándar de identificadores: RFC 4122, formato v4 (ver ADR-022).
insert into public.tenants (id, slug, nombre) values
  ('a0000000-0000-4000-8000-000000000001', 'jburger', 'J Burguer')
on conflict (id) do nothing;

insert into public.branches (id, tenant_id, nombre, address) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Casa Central Roque Pérez', '{"line1": "Roque Pérez", "city": "Roque Pérez", "state": "Buenos Aires", "country": "AR"}'::jsonb)
on conflict (id) do nothing;

insert into public.categories (id, tenant_id, nombre, orden) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Clásicas', 1),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Especiales', 2),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Acompañamientos', 3),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Bebidas', 4)
on conflict (id) do nothing;

insert into public.products (id, tenant_id, category_id, nombre, descripcion, price_amount, price_currency) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'J Simple', 'Medallón de carne, cheddar, lechuga y tomate.', 7500, 'ARS'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'J Doble', 'Doble medallón, doble cheddar y salsa de la casa.', 9200, 'ARS'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'J Bacon', 'Doble medallón, bacon crocante y cebolla caramelizada.', 10500, 'ARS'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'Papas J', 'Papas rústicas con cheddar y verdeo.', 4800, 'ARS'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', 'Gaseosa 500ml', null, 2500, 'ARS')
on conflict (id) do nothing;

insert into public.product_branch_availability (tenant_id, branch_id, product_id, disponible, price_override_amount) values
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000005', true, 2200)
on conflict (product_id, branch_id) do nothing;
