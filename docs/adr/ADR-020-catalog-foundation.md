# ADR-020: Catalog Foundation (Categorías, Productos, Disponibilidad, Menú)

## Estado

Aprobado

## Fecha

2026-07-16

## Contexto

Tras la estabilización del repositorio (ADR-019), el núcleo comercial de la plataforma seguía sin implementación real: los dominios products, cart, orders y payments eran placeholders y la API devolvía datos simulados. El bloque de mayor valor para continuar es el catálogo, ya que carrito, checkout y pedidos dependen de él.

Durante el análisis se detectaron además tres inconsistencias reales:

1. El vocabulario de permisos existía por triplicado y divergía: `@jburger/domain-permissions` (formato `resource.action`), `services/api/src/security/permissions.ts` (formato `resource:action`, sin consumidores) y `supabase/seeds/000_permissions.sql` (formato `resource:action`, parcial).
2. `CurrencyCode` no incluía `ARS`, siendo la operación local en Roque Pérez, Argentina.
3. Existen dos estrategias de base de datos en la documentación: la foundation implementada (`supabase/migrations/`, schema `public`) y el plan Wave 1 (51 migraciones, schemas `app_public`/`app_private`), explícitamente bloqueado pendiente de aprobación.

## Decisiones

### 1. Fuente única del vocabulario de permisos

`@jburger/domain-permissions` es la única fuente de verdad del vocabulario (`resource.action`). El archivo `services/api/src/security/permissions.ts` pasa a re-exportar el vocabulario del dominio y los seeds SQL se alinean al formato canónico. El catálogo reutiliza los permisos existentes `products.read` y `products.write` (ya mapeados en los roles por defecto), sin ampliar el vocabulario.

### 2. Moneda ARS

Se agrega `ARS` a `CurrencyCode` en `@jburger/shared-kernel` y se usa como moneda por defecto en la API y en la base de datos.

### 3. Continuidad sobre la baseline de base de datos

El desarrollo continúa sobre la foundation implementada (schema `public`, convenciones de `202606030001/0002`). El plan Wave 1 se mantiene como diseño objetivo de referencia y no bloquea la entrega de funcionalidades. Migrar hacia Wave 1 requerirá un ADR propio.

### 4. Modelo de catálogo

Se respetan los límites del commerce engine: Menú ≠ Producto y Disponibilidad ≠ Producto.

- `public.categories`: categorías por tenant con orden de presentación.
- `public.products`: productos por tenant con precio base (`price_amount`, `price_currency`) y categoría obligatoria.
- `public.product_branch_availability`: disponibilidad y override de precio por sucursal (clave `product_id + branch_id`), con trigger de auditoría (`public.audit_row_change`).
- El menú no es una tabla: es un read-model (`MenuService`) que compone categorías activas, productos activos y disponibilidad de la sucursal, aplicando overrides y podando categorías vacías. El menú es server-authoritative y se sirve por la API; no se exponen policies `anon` de lectura directa.

### 5. Dominios y puertos

- `@jburger/domain-categories`: contratos + `CategoryService` (auditoría vía `EventPublisher`).
- `@jburger/domain-products`: contratos + `ProductService`, `AvailabilityService` y `MenuService` con puerto `MenuSource` (DIP: el dominio no conoce la persistencia ni a otros dominios).
- Invariantes mínimas en dominio: nombre no vacío y precio > 0 (reflejadas también como constraints SQL).

### 6. Persistencia por puertos, seleccionada por entorno

La API implementa los repositorios del dominio detrás de puertos (`CategoryRepository`, `ProductRepository`, `AvailabilityRepository`, `MenuSource`) con dos implementaciones:

- **Supabase** (`SupabaseCatalogClient` + repositorios PostgREST con service role, patrón `FetchSupabaseAuthGateway`): se activa cuando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configuradas. Proyecto productivo: `jburger` (`atlhxzclsmcahqlfwdrm`, sa-east-1), con migraciones `foundation`, `auth_access_foundation`, `catalog_foundation` y `security_hardening` aplicadas, y seeds de permisos y datos base cargados.
- **In-memory** (`InMemoryCatalogStore` con seed demo): fallback para desarrollo y tests. En producción, la ausencia de configuración Supabase aborta el bootstrap (fail-fast).

### 7. API

`CatalogModule` expone:

- `GET /menu` (público, requiere headers `x-tenant-id` y `x-branch-id`).
- `GET/POST/PATCH /catalog/categories`, `POST /catalog/categories/:id/disable` (`products.read` / `products.write`).
- `GET/POST/PATCH /catalog/products`, `POST /catalog/products/:id/disable`, `PUT /catalog/products/:id/availability` (`products.read` / `products.write`).

Los eventos de auditoría del dominio se publican vía `LoggingEventPublisher` (estructurado a stdout) hasta que exista el outbox definido en la arquitectura event-driven.

## Consecuencias

### Positivas

- Primer flujo funcional end-to-end del producto (menú digital) con patrón de referencia dominio → puerto → API replicable para cart, orders y payments.
- Vocabulario de permisos consistente entre código y datos.
- Modelo de catálogo alineado al commerce engine sin sobre-diseño.

### Negativas / deuda asumida

- `AuthenticatedGuard` sigue siendo stub (concede permisos fijos); el login real con `@jburger/domain-auth` es prerequisito para producción.
- El repositorio Supabase usa PostgREST con service role desde el servidor; al introducirse un cliente directo desde frontend deberán revisarse las policies RLS de escritura.

## Estado de validación

`pnpm validate` ejecutado en verde (lint, typecheck, test, build — 37 paquetes) el 2026-07-16, incluyendo los tests de catálogo.

## Acceptance Test (2026-07-17) — APROBADO

Validación funcional end-to-end ejecutada contra la API local conectada al proyecto Supabase `jburger`:

- `GET /menu` responde 200 con headers `x-tenant-id: 00000000-0000-0000-0000-000000000001` y `x-branch-id: 00000000-0000-0000-0000-000000000101`, y 400 con mensaje explícito ante su ausencia.
- Origen de datos verificado objetivamente: se insertó un producto marcador ("Verificación DB") solo en la base de datos, se confirmó su presencia en la respuesta y se eliminó tras la prueba. Esto descarta el fallback in-memory como origen.
- Override por sucursal verificado: `Gaseosa 500ml` a ARS 2200 (precio base 2500).
- Las 4 categorías respondieron en el orden esperado con su contenido completo.

## Incidente TLS (2026-07-16/17) — CERRADO

Síntoma: `TypeError: fetch failed` con causa `UNABLE_TO_VERIFY_LEAF_SIGNATURE` en toda conexión de Node hacia `*.supabase.co`, con navegador funcionando y pipeline en verde.

Causa raíz: interceptación TLS local en la máquina de desarrollo. El certificado re-firmado por el interceptor está anclado en el almacén de certificados de Windows (por eso el navegador valida) pero no en el bundle de CAs de Mozilla que Node usa por defecto. Se descartó el proyecto como causa mediante reproducción del fallo con `fetch` aislado fuera del repositorio, y se descartó el endpoint verificando la cadena desde una red independiente.

Resolución: `NODE_OPTIONS=--use-system-ca` (Node ≥ 22.15), que agrega el almacén del sistema como fuente de confianza sin deshabilitar la validación TLS. No se modificó código del proyecto. Detalle operativo en `docs/troubleshooting.md`.

## Próximos pasos

1. Configurar `services/api/.env` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (ver `.env.example`).
2. Conectar `AuthController` y `AuthenticatedGuard` con `@jburger/domain-auth` (login real, validación de token, permisos desde DB).
3. Carrito (ADR-009) sobre el patrón establecido: Cart ≠ Order Draft ≠ Order.
4. Frontend: página de menú en `apps/web` consumiendo `GET /menu`.

## Referencias

- ADR-009 Shopping Cart Strategy
- ADR-011 Domain-Driven Design
- ADR-015 Security and RBAC
- ADR-019 Repository Stabilization Baseline
- docs/architecture/commerce-engine-architecture.md
