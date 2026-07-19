-- Seed del vocabulario canónico de permisos (fuente: @jburger/domain-permissions).
-- Formato de clave: <resource>.<action>
insert into public.permissions (key, resource, action, descripcion) values
  ('users.read', 'users', 'read', 'Leer usuarios'),
  ('users.write', 'users', 'write', 'Crear y modificar usuarios'),
  ('products.read', 'products', 'read', 'Leer catálogo de productos'),
  ('products.write', 'products', 'write', 'Administrar catálogo de productos'),
  ('orders.read', 'orders', 'read', 'Leer pedidos'),
  ('orders.write', 'orders', 'write', 'Crear y modificar pedidos'),
  ('payments.read', 'payments', 'read', 'Leer pagos'),
  ('payments.refund', 'payments', 'refund', 'Reembolsar pagos'),
  ('audit.read', 'audit', 'read', 'Leer auditoría'),
  ('audit.export', 'audit', 'export', 'Exportar auditoría'),
  ('support.access', 'support', 'access', 'Acceso de soporte'),
  ('support.break_glass', 'support', 'break_glass', 'Acceso de emergencia de soporte'),
  ('roles.read', 'roles', 'read', 'Leer roles'),
  ('roles.write', 'roles', 'write', 'Crear y modificar roles'),
  ('permissions.read', 'permissions', 'read', 'Leer permisos'),
  ('permissions.write', 'permissions', 'write', 'Administrar permisos'),
  ('sessions.read', 'sessions', 'read', 'Leer sesiones'),
  ('sessions.revoke', 'sessions', 'revoke', 'Revocar sesiones'),
  ('tenants.assign', 'tenants', 'assign', 'Asignar tenants'),
  ('branches.assign', 'branches', 'assign', 'Asignar sucursales')
on conflict (key) do update set
  resource = excluded.resource,
  action = excluded.action,
  descripcion = excluded.descripcion;
