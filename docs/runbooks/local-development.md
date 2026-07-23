# Runbook: ejecución local completa

Estado de referencia: Bloques 1–5 cerrados (catálogo, autenticación, carrito, pedidos, pagos). Frontend `apps/web`: shell sin integración (ver `docs/status/functional-review-2026-07-22.md`).

## 1. Servicios que intervienen

| Servicio                                                         | Dónde corre          | Necesario para                                                  |
| ---------------------------------------------------------------- | -------------------- | --------------------------------------------------------------- |
| API NestJS (`@jburger/api`)                                      | local, puerto 3001   | todo el backend                                                 |
| Web Next.js (`@jburger/web`)                                     | local, puerto 3000   | shell de UI                                                     |
| Supabase (proyecto `jburger`, `atlhxzclsmcahqlfwdrm`, sa-east-1) | **remoto**           | Postgres, Auth, PostgREST                                       |
| Mercado Pago                                                     | **remoto (sandbox)** | solo el Bloque 5; sin credenciales la API usa el proveedor mock |

No hay Supabase local ni Docker: la base es el proyecto en la nube, ya migrado y con seeds cargados. `apps/{admin,kitchen,delivery,support}` son shells sin implementación (`admin` levanta en 3002; los otros tres solo imprimen un mensaje).

## 2. Requisitos previos

- Node ≥ 22, pnpm ≥ 10 (`packageManager: pnpm@10.28.1`).
- Espacio en disco disponible (un disco lleno rompe `pnpm install` y las operaciones de git).
- `SUPABASE_SERVICE_ROLE_KEY` del proyecto: Dashboard → Project Settings → API Keys. **Nunca se commitea.**
- Usuario OWNER aprovisionado en Supabase Auth y vinculado en `public.users` (ver `provision-first-user.md`). Sin este usuario no hay login posible: **la API no expone registro de usuarios**.

## 3. Configuración

```powershell
cd "<repo>"
copy services\api\.env.example services\api\.env
copy apps\web\.env.example apps\web\.env.local
```

Completar en `services/api/.env`:

- `SUPABASE_SERVICE_ROLE_KEY` — obligatoria. Sin ella la API arranca con persistencia in-memory y datos demo, no contra la base real.
- `MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_WEBHOOK_SECRET` — opcionales. Sin ambas se usa el proveedor mock; con ellas, Checkout Pro real (usar credenciales **sandbox**).
- `PUBLIC_API_URL` — solo si se prueban webhooks reales: debe ser una URL pública (túnel), no `localhost`. Mercado Pago no alcanza a `localhost`.

`apps/web/.env.local` no requiere secretos.

## 4. Arranque

```powershell
pnpm install

# Terminal 1 — API
pnpm --filter @jburger/api dev        # http://localhost:3001

# Terminal 2 — Web
pnpm --filter @jburger/web dev        # http://localhost:3000
```

No usar `pnpm dev` (raíz): `turbo dev --parallel` levanta las cinco aplicaciones a la vez, incluidas las tres que solo imprimen un mensaje, y mezcla la salida de todas en una sola terminal.

## 5. URLs disponibles

| URL                                                                                                                    | Contenido                              |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `http://localhost:3001/health`                                                                                         | health check de la API                 |
| `http://localhost:3001/docs`                                                                                           | Swagger con todos los endpoints        |
| `http://localhost:3000`                                                                                                | home del shell web                     |
| `http://localhost:3000/health`                                                                                         | health check del front                 |
| `http://localhost:3000/{menu,cart,checkout,order-review,order-confirmation,order-detail,order-history,product-detail}` | pantallas del shell (sin datos reales) |

## 6. Datos iniciales

Ya cargados en el proyecto remoto: migraciones `202606030001` … `202607220010`, seeds `000_permissions`, `001_jburger_base` (tenant, sucursal, 4 categorías, 5 productos), `002_roles_base` (8 roles, 42 asignaciones). No hay que ejecutar nada.

Identificadores canónicos: tenant `a0000000-0000-4000-8000-000000000001`, sucursal `b0000000-0000-4000-8000-000000000001`.

## 7. Recorrer el flujo completo

El flujo end-to-end **no es recorrible por la interfaz web**: ninguna pantalla llama a la API. Se recorre por HTTP (Swagger o `curl`), con `authorization: Bearer <token>`, `x-tenant-id` y `x-branch-id` en cada llamada:

1. `POST /auth/login` → tokens y principal.
2. `GET /menu` → catálogo por sucursal.
3. `POST /cart/items` → carrito con preview de precios.
4. `POST /orders` (`idempotencyKey`, `expectedTotal`, `fulfillmentType`) → pedido en `borrador`.
5. `POST /orders/:id/payment` (`idempotencyKey`) → intento de pago y `checkoutUrl`.
6. Pago aprobado en Mercado Pago → webhook a `POST /webhooks/mercadopago` → el pedido pasa a `confirmado`.

Con el proveedor mock el paso 6 no ocurre: el mock no emite ni acepta notificaciones. Para probar la confirmación por pago hacen falta credenciales sandbox **y** un túnel público apuntando a `PUBLIC_API_URL`.
