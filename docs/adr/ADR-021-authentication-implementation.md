# ADR-021: Authentication Implementation (Supabase Auth + RBAC desde base de datos)

## Estado

Aprobado

## Fecha

2026-07-17

## Contexto

Al cierre del módulo Catalog (ADR-020), la autenticación de la API era un stub: `AuthController` devolvía tokens hardcodeados y `AuthenticatedGuard` concedía a cualquier Bearer token un contexto ADMIN con permisos fijos. Era el último bloqueante de seguridad antes de exponer la plataforma. El dominio `@jburger/domain-auth` ya definía la solución completa (ADR-008): `AuthService`, `SessionService`, contratos `AuthRepository`/`SessionRepository` y el gateway `FetchSupabaseAuthGateway`; faltaba la infraestructura que los conecta.

## Decisiones

### 1. Identidad unificada: `public.users.id` = `auth.users.id`

Migración `202607170005_users_auth_identity.sql`: se elimina el default de `public.users.id` y se agrega FK a `auth.users(id) on delete cascade` (patrón estándar Supabase). Esto evita una doble identidad aplicación/auth, mantiene intactos los contratos del dominio (el `userId` del gateway es directamente la clave de la fila de aplicación) y hace que `session_tracking.user_id` referencie consistentemente a la misma identidad.

Alternativa descartada: columna `auth_user_id` separada. Agregaba un mapeo adicional en cada resolución de principal sin aportar valor, y rompía la semántica de `AuthService.login` (que crea sesiones con el id del gateway).

### 2. Resolución de principal desde la base de datos

`SupabaseAuthRepository` (PostgREST, service role) resuelve el principal en cada validación: usuario activo del tenant (`users`), pertenencia a sucursal (`user_branches`: si el usuario tiene asignaciones explícitas, la sucursal solicitada debe estar entre ellas; sin asignaciones se lo trata como usuario tenant-wide), roles (`user_roles` con embed de `roles`) y permisos efectivos (`role_permissions` con embed de `permissions`, deduplicados). El aislamiento multi-tenant se aplica en cada consulta; un token válido de otro tenant produce 401, no un contexto cruzado.

### 3. Guard real y autorización por datos

`AuthenticatedGuard` ahora valida el access token contra Supabase Auth vía `AuthService` y construye `AuthorizationContext` con los permisos reales del usuario. `PermissionGuard` y el vocabulario canónico (`@jburger/domain-permissions`) no cambian: la autorización pasa de estar hardcodeada a estar gobernada por `roles`/`role_permissions`. Los roles por defecto y su mapeo viven en `@jburger/domain-roles` y se materializan con el seed `002_roles_base.sql` (OWNER y ADMIN incorporan `products.*` y `sessions.*`; el mapa del dominio fue alineado en el mismo cambio).

### 4. `AuthModule` global con infraestructura seleccionada por entorno

`AuthModule` es `@Global()` y exporta `AuthService`/`SessionService`: la autenticación es una preocupación transversal y los guards se resuelven por DI en cualquier módulo sin acoplamiento explícito. La factory `createAuthInfrastructure` selecciona: con `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` usa la infraestructura real (gateway con anon key — pública por diseño —, repositorios con service role); sin configuración, en producción aborta el bootstrap (fail-fast, mismo criterio que Catalog) y en desarrollo usa `DevAuthGateway`/`DevAuthRepository`/`InMemorySessionRepository`, cuyas credenciales fixture solo existen en ese modo.

### 5. Endpoints

`POST /auth/login` (credenciales → tokens + principal + sesión auditada; mensaje de error único para no revelar si falló la credencial o la asignación), `POST /auth/refresh`, `POST /auth/logout` (revoca sesión propia, o ajena solo con `sessions.revoke`), `GET /auth/me`, `GET /auth/sessions` (requiere `sessions.read`). Validación con DTOs estrictos (`IsUUID` en identificadores). Eventos `LOGIN_SUCCESS`, `LOGIN_FAILED` y `SESSION_REVOKED` se publican vía el dominio.

### 6. Cliente REST compartido

El cliente PostgREST se extrajo de Catalog a `common/persistence/supabase-rest.client.ts` (`SupabaseRestClient`) y lo comparten los repositorios de catálogo y auth. El token `EVENT_PUBLISHER` se movió a `common/events/tokens.ts`.

## Deuda técnica registrada

- `session_tracking.refresh_token_hash` pasó a nullable: la rotación y revocación por hash de refresh token queda para una iteración de hardening de sesiones (hoy la revocación es por id de sesión y expiración). Registrar el hash requiere extender el contrato de dominio con un puerto de hashing.
- La resolución de principal ejecuta hasta 4 consultas PostgREST por request autenticado. Optimización prevista cuando haya métricas: cache corto de principal por token (TTL ≤ 60s) o RPC única en Postgres.
- El guard no verifica todavía la sesión en `session_tracking` en cada request (la revocación aplica a refresh, no invalida access tokens ya emitidos, acotados por su expiración de 1h de Supabase). Mitigación futura junto con el punto 1.

## Aprovisionamiento del primer usuario

Ver `docs/runbooks/provision-first-user.md`.

## Acceptance Test (2026-07-17) — APROBADO

Validación funcional end-to-end contra el proyecto Supabase `jburger` con el usuario OWNER real:

- `POST /auth/login` → 200: autenticación contra GoTrue, resolución de principal/tenant/roles/permisos desde DB, emisión de `accessToken`/`refreshToken` y creación de sesión en `session_tracking`.
- `GET /auth/me` con Bearer real → contexto completo: `roleKeys: ["OWNER"]` y los 14 permisos del rol resueltos desde `role_permissions`.
- Validación de DTO estricta operativa (fue la que detectó los UUIDs no conformes, ver ADR-022).

Incidencias durante el Acceptance y resolución:

1. `400 tenantId must be a UUID`: los seeds usaban identificadores no conformes a RFC 4122. Se re-identificaron datos y seeds (ADR-022) sin debilitar la validación.
2. `401 Invalid credentials.` con usuario válido: se instrumentó el flujo (esta instrumentación queda como mejora permanente de observabilidad: `AuthGatewayError` preserva status/código/descripción originales de GoTrue en `LOGIN_FAILED` y en el log interno `auth_login_failure`, sin exponer detalle al cliente ni registrar credenciales). El diagnóstico confirmó que el backend no altera la contraseña; la causa fue la contraseña utilizada en la prueba, no un defecto del sistema.

## Consecuencias

Positivas: autenticación y autorización reales gobernadas por datos, aislamiento por tenant/sucursal verificado en cada resolución, sesiones auditadas, un único patrón de infraestructura por entorno en toda la API. Negativas: latencia adicional por request autenticado (aceptada y medible), y las deudas listadas arriba con su plan.

## Referencias

- ADR-008 Authentication Strategy
- ADR-015 Security and RBAC
- ADR-020 Catalog Foundation
