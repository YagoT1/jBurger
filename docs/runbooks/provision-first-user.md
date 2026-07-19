# Runbook: aprovisionar el primer usuario OWNER

Prerequisitos: migraciones aplicadas hasta `202607170006_audit_events_decouple.sql` y seeds `000`–`002` cargados.

Identificadores canónicos (RFC 4122, ver ADR-022): tenant `a0000000-0000-4000-8000-000000000001`, sucursal `b0000000-0000-4000-8000-000000000001`, rol OWNER `e0000000-0000-4000-8000-000000000001`.

## 1. Crear el usuario en Supabase Auth

Dashboard del proyecto `jburger` → **Authentication → Users → Add user**. Usar email real y contraseña fuerte (≥ 8 caracteres). Marcar **Auto confirm user**. Copiar el **User UID** generado.

## 2. Vincularlo a la aplicación (SQL Editor)

Reemplazar `<AUTH_USER_ID>`, `<EMAIL>` y `<NOMBRE>`:

```sql
insert into public.users (id, tenant_id, email, nombre)
values ('<AUTH_USER_ID>', 'a0000000-0000-4000-8000-000000000001', '<EMAIL>', '<NOMBRE>');

insert into public.user_tenants (user_id, tenant_id)
values ('<AUTH_USER_ID>', 'a0000000-0000-4000-8000-000000000001');

insert into public.user_roles (user_id, role_id, tenant_id)
values ('<AUTH_USER_ID>', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001');
```

Nota: no se asigna `user_branches`; sin asignaciones explícitas de sucursal el usuario opera tenant-wide (ver ADR-021). Para restringir a una sucursal, insertar la fila correspondiente en `public.user_branches`.

## 3. Verificar

```powershell
curl.exe -X POST http://localhost:3001/auth/login -H "content-type: application/json" -d '{\"email\":\"<EMAIL>\",\"password\":\"<PASSWORD>\",\"tenantId\":\"a0000000-0000-4000-8000-000000000001\"}'
```

Debe devolver tokens, `sessionId` y el principal con `roleKeys: ["OWNER"]` y sus permisos. Con el `accessToken`:

```powershell
curl.exe http://localhost:3001/auth/me -H "authorization: Bearer <ACCESS_TOKEN>" -H "x-tenant-id: a0000000-0000-4000-8000-000000000001"
curl.exe http://localhost:3001/catalog/products -H "authorization: Bearer <ACCESS_TOKEN>" -H "x-tenant-id: a0000000-0000-4000-8000-000000000001"
```

Casos negativos esperados: token inválido → 401; sin header `authorization` → 401; tenant ajeno en `x-tenant-id` → 401 (el principal no resuelve en ese tenant).
