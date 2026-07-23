# Revisión funcional integral y evaluación de despliegue — 2026-07-22

Alcance: estado real del producto tras cerrar los Bloques 1–5. Toda afirmación se apoya en evidencia del repositorio (archivo y línea). No se implementaron funcionalidades durante esta revisión.

## 1. Hallazgo principal

**El frontend no consume la API. Ninguna pantalla, en ningún grado.**

Evidencia: búsqueda de `fetch`, `useState`, `useEffect`, `'use client'` y `NEXT_PUBLIC_API_URL` en todo `apps/web/src` devuelve **cero** coincidencias en archivos de página. La única aparición de `env` está en `src/app/page.tsx:3`, que **imprime la URL de la API como texto**, sin llamarla.

Las 9 pantallas (`menu`, `product-detail`, `cart`, `checkout`, `order-review`, `order-confirmation`, `order-detail`, `order-history`, home) son componentes de servidor estáticos con la misma estructura: `Badge` + `Card` + un párrafo idéntico — _"Responsive accessible customer ordering foundation with loading, empty, error, and telemetry hooks ready."_ Ese texto describe capacidades que el código no tiene: no hay estados de carga, vacío ni error, ni telemetría.

**No existe navegación.** `src/app/layout.tsx` es `<html lang="es"><body>{children}</body></html>`: sin header, sin menú, sin un solo `<Link>`. Las pantallas solo se alcanzan escribiendo la URL.

**No existen pantallas de login, registro ni recuperación de contraseña.** No están en el árbol de rutas.

## 2. Segundo hallazgo: endpoints que fabrican respuestas exitosas

`services/api/src/users/users.controller.ts` y `roles.controller.ts` exponen operaciones protegidas por guards de permisos reales que **no persisten nada y devuelven éxito**:

| Endpoint                        | Devuelve                                            | Hace     |
| ------------------------------- | --------------------------------------------------- | -------- |
| `GET /users`                    | `{ data: [] }`                                      | nada     |
| `POST /users`                   | `{ id: crypto.randomUUID(), active: true, ...dto }` | nada     |
| `GET /users/:id`                | `{ id }`                                            | nada     |
| `PATCH /users/:id`              | `{ id, ...dto }`                                    | nada     |
| `POST /users/:id/disable`       | `{ id, active: false }`                             | **nada** |
| `POST /users/:id/roles`         | `{ userId, roleId, assigned: true }`                | **nada** |
| `POST /roles`, `GET /roles/:id` | objetos fabricados                                  | nada     |

`POST /users/:id/disable` es el caso grave: un operador que deshabilite a un empleado recibe confirmación y el usuario **sigue activo**. Es un defecto de seguridad, no una funcionalidad pendiente. Un 501 sería correcto; una confirmación falsa no.

## 3. Estado por capa

### Backend — sólido en el núcleo comercial

Implementado y verificado: auth (login/refresh/logout/me/sessions), catálogo (menú, productos, categorías, disponibilidad), carrito (mutación atómica con CAS), pedidos (checkout idempotente, snapshot financiero, máquina de estados), pagos (intento idempotente, webhook verificado, confirmación transaccional). Pipeline `pnpm validate` verde; Supabase migrado hasta `202607220010` con seeds cargados.

Deuda registrada y vigente: totales sin impuestos/descuentos/delivery fee; sin expiración automática de borradores ni carritos; auditoría por logger sin outbox durable; rotación de refresh token por hash pendiente; 7 dominios huérfanos del rebase sin consumidor.

### Frontend — shell sin producto

`packages/ui` aporta 6 componentes (`Badge`, `Button`, `Card`, `Dialog`, `Input`, `PageShell`/`Stack`/`Inline`) sobre Tailwind. Es una base razonable, pero de los 6 solo se usan 4 y ninguno recibe datos. No hay formularios, ni tablas, ni componentes de lista, ni skeletons.

### Integración — 0 %

| Pantalla                | Consume               | Endpoints                                                         | Estado       |
| ----------------------- | --------------------- | ----------------------------------------------------------------- | ------------ |
| Home                    | nada (imprime la URL) | —                                                                 | sin integrar |
| Menú                    | nada                  | `GET /menu` disponible sin usar                                   | sin integrar |
| Detalle de producto     | nada                  | `GET /catalog/products/:id` disponible sin usar                   | sin integrar |
| Carrito                 | nada                  | `GET/POST/PATCH/DELETE /cart` disponibles sin usar                | sin integrar |
| Checkout                | nada                  | `POST /orders` disponible sin usar                                | sin integrar |
| Revisión / Confirmación | nada                  | `GET /orders/:id` disponible sin usar                             | sin integrar |
| Historial               | nada                  | `GET /orders` disponible sin usar                                 | sin integrar |
| Detalle de pedido       | nada                  | `GET /orders/:id`, `GET /orders/:id/payment` disponibles sin usar | sin integrar |
| Login                   | **no existe**         | `POST /auth/login` disponible sin usar                            | ausente      |

Nada está mockeado ni usa datos estáticos de negocio: no hay datos en absoluto.

### UX/UI

No es evaluable como experiencia: no hay flujo que recorrer. Lo verificable:

- **Fortalezas:** design system con `cn()` y Tailwind; `lang="es"` correcto; `PageShell` usa `<main>`; layout centrado con `max-w-7xl` y padding consistente.
- **Debilidades:** sin navegación entre pantallas; sin jerarquía visual más allá de un `CardTitle`; sin feedback de ninguna clase; sin foco visible ni gestión de foco; sin `<h1>` por pantalla (el título vive en un `CardTitle`); metadata genérica (_"Foundation application shell"_) en todas las rutas; sin favicon ni branding; el texto de las 9 pantallas está en inglés mientras el documento declara `lang="es"`.
- **Responsive:** no verificable — no hay contenido que colapse.
- **Accesibilidad:** no hay landmarks de navegación, no hay `skip link`, no hay etiquetas de formulario porque no hay formularios.
- **Performance percibida:** irrelevante hoy (páginas estáticas sin datos).

## 4. Bugs y riesgos

| #   | Hallazgo                                                                                                                                   | Severidad                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| B1  | `POST /users/:id/disable` y `POST /users/:id/roles` confirman operaciones que no ocurren                                                   | **Crítico** (seguridad)    |
| B2  | `POST /users`, `PATCH /users/:id`, `POST /roles` devuelven entidades inexistentes                                                          | Alto                       |
| B3  | Las 9 pantallas afirman por texto tener estados de carga, vacío, error y telemetría que no existen                                         | Alto (engaña en demo)      |
| B4  | Sin navegación: las pantallas son inalcanzables sin escribir la URL                                                                        | Alto                       |
| B5  | `.env.example` raíz apuntaba a un Supabase local inexistente y omitía todas las variables de los Bloques 3–5                               | Medio — **corregido** (§6) |
| B6  | `apps/web` no tenía `.env.example`                                                                                                         | Medio — **corregido** (§6) |
| B7  | Sin runbook de ejecución local                                                                                                             | Medio — **corregido** (§6) |
| R1  | El proveedor mock de pagos no emite webhooks: el flujo de confirmación por pago no es demostrable sin credenciales sandbox y túnel público | Riesgo de demo             |
| R2  | No existe registro de usuarios: cada usuario requiere aprovisionamiento manual en Supabase                                                 | Riesgo de producto         |

## 5. Dictamen de despliegue

# NO APTO PARA DEPLOY

**Qué lo bloquea:**

1. **Funcional y de producto:** desplegar el frontend publica 9 páginas idénticas sin navegación ni datos. No hay ningún flujo de usuario completable. El producto desplegado no permite ver un menú, agregar al carrito ni pedir.
2. **Técnico y de seguridad:** los endpoints de `users`/`roles` confirman operaciones que no ejecutan (B1, B2). Desplegarlos habilita decisiones operativas sobre información falsa.
3. **De acceso:** sin pantalla de login ni registro, un usuario final no tiene forma de entrar.

**Impacto de desplegarlo así:** ante un cliente, el producto aparenta no existir — el backend, que es donde está el trabajo real, es invisible. Ante un operador, los endpoints de administración mienten. El daño reputacional excede cualquier beneficio de mostrar avance.

**Por qué tampoco es apto para deploy interno como producto:** un staging solo tiene valor si permite validar algo; hoy no hay nada que validar por interfaz.

**Alcance acotado que sí es desplegable:** la **API en aislamiento**, a un entorno interno, para integración y pruebas por Swagger — condicionado a retirar o devolver `501` en los endpoints stub de `users`/`roles`. Ese es un despliegue de servicio, no de producto, y no debe presentarse como versión del producto.

**Cambios mínimos para pasar a APTO PARA DEPLOY INTERNO (demo):** cliente HTTP tipado con sesión; pantalla de login; layout con navegación; menú, carrito, checkout y confirmación consumiendo la API real; estados de carga/vacío/error reales; retiro de los endpoints stub.

## 6. Cambios realizados durante esta revisión

Únicamente correcciones de bootstrap y documentación, autorizadas por el alcance de la Fase 1:

| Archivo                              | Cambio                                                                | Justificación                                                                                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.example` (raíz)                | Reemplazado por un índice que apunta a los `.env.example` de cada app | Contradecía a `services/api/.env.example` (apuntaba a un Supabase local inexistente) y omitía las variables de los Bloques 3–5. Dos fuentes de verdad en conflicto es peor que una sola |
| `apps/web/.env.example`              | Creado                                                                | No existía. Next.js lee `.env.local` del directorio de la app, no de la raíz: sin este archivo la configuración del front era adivinanza                                                |
| `docs/runbooks/local-development.md` | Creado                                                                | No existía guía de ejecución. Documenta servicios, orden, credenciales, URLs y por qué el flujo end-to-end no es recorrible por UI                                                      |

Cero cambios de código de aplicación.

## 7. Respuestas con evidencia

| Pregunta                                               | Respuesta                                                                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Puede ejecutarse completamente en local?              | Sí, backend y frontend levantan. El **flujo de negocio** solo es recorrible por HTTP, no por UI                                                       |
| ¿Puede desplegarse sin inconvenientes?                 | No (§5)                                                                                                                                               |
| ¿Está listo para mostrarse a un cliente?               | No. Por UI no hay producto observable                                                                                                                 |
| ¿La UX representa la calidad esperada?                 | No es evaluable: no hay experiencia implementada                                                                                                      |
| ¿Qué porcentaje del MVP está implementado e integrado? | Backend del núcleo comercial ≈ **70 %**; frontend ≈ **5 %** (design system + rutas vacías); integración **0 %**. MVP end-to-end utilizable ≈ **35 %** |
| ¿Cuál debe ser el alcance del Bloque 6?                | §8                                                                                                                                                    |

## 8. Alcance propuesto para el Bloque 6

El Bloque 6 es **integración frontend**, no funcionalidades nuevas. Orden por dependencia:

1. **Higiene previa:** retirar o devolver `501` en los endpoints stub de `users`/`roles` (B1, B2). Bloquea todo lo demás por ser un defecto de seguridad activo.
2. **Cliente HTTP tipado + sesión:** almacenamiento de tokens, refresh automático, headers `x-tenant-id`/`x-branch-id`, mapeo de errores del backend a errores de UI.
3. **Login y layout con navegación:** las dos ausencias que hacen inalcanzable todo lo demás.
4. **Flujo del cliente contra la API real:** menú → detalle → carrito → checkout → pago → confirmación → historial → detalle.
5. **Estados reales:** carga, vacío y error por pantalla, sustituyendo el texto que hoy los promete.
6. **Acceptance funcional por UI** y nueva revisión de despliegue.

Fuera del Bloque 6: registro de usuarios y recuperación de contraseña (decisión de producto pendiente), paneles de cocina/admin, notificaciones.
