# jBurger — Screen Specification del MVP

**Versión 1.0 — 2026-07-22.** Contrato funcional por pantalla. Deriva de: Product Discovery v1.0, PRD v1.0, UX Strategy + IA v1.0. Define **comportamiento**, no diseño visual. Insumo directo de wireframes, Design System, prototipo, frontend, backend y QA.

**Trazabilidad:** cada pantalla cita su origen (RF/RN/US/UX-F/SC). "Backend: existente" = implementado y verificado; "Backend: NUEVO" = cambio justificado en PRD §17. Ningún endpoint inventado: los "NUEVO" figuran como requeridos, no como existentes.

**Convención de estados:** el catálogo transversal (UX §7) se define una vez en §3.0 y cada ficha referencia solo los estados que le aplican, con su disparador local.

---

## 1. Arquitectura general de pantallas

### Cliente (público + sesión ligera)

```
SC-01 Menú (raíz)
 ├─ SC-02 Detalle de producto
 ├─ SC-03 Carrito
 │   └─ Checkout (flujo lineal, una decisión por paso)
 │       ├─ SC-04 Identidad
 │       ├─ SC-05 Entrega
 │       ├─ SC-06 Revisión
 │       ├─ SC-07 Pago
 │       └─ SC-08 Resultado del pago
 ├─ SC-09 Seguimiento (acceso por código, sin login)
 ├─ SC-10 Historial (registrado) → SC-11 Detalle de pedido
 └─ SC-12 Autenticación (login / registro / reset)
```

### Administración (staff autenticado)

```
SA-01 Bandeja de pedidos → SA-02 Detalle de pedido (staff)
SA-03 Catálogo (productos / categorías / disponibilidad-precio)
SA-04 Parámetros operativos
```

**Relaciones y dependencias clave:** SC-04..08 son pasos de un único checkout (no pantallas independientes); SC-09 y SC-11 comparten datos pero difieren en acceso (código vs sesión) y no se fusionan; los dos árboles no tienen enlaces cruzados (guards distintos). Navegación principal cliente: Menú · Carrito · Seguimiento/Cuenta. Navegación principal staff: Pedidos · Catálogo · Parámetros.

## 2. Inventario completo

| Código | Nombre                    | Módulo           | Usuario             | Prioridad | Origen documental                          |
| ------ | ------------------------- | ---------------- | ------------------- | --------- | ------------------------------------------ |
| SC-01  | Menú                      | Cliente/Catálogo | cualquiera          | P0        | RF-001/003, US-01, UX-F01, SC-01           |
| SC-02  | Detalle de producto       | Cliente/Catálogo | cualquiera          | P0        | RF-002/010/011, US-02/03, UX-F03/04        |
| SC-03  | Carrito                   | Cliente/Carrito  | cualquiera          | P0        | RF-020/022, US-02, UX-F04                  |
| SC-04  | Checkout — Identidad      | Cliente/Checkout | cualquiera          | P0        | RF-030/031, US-04/08, UX-F05/06            |
| SC-05  | Checkout — Entrega        | Cliente/Checkout | cualquiera          | P0        | RF-040/041, US-06, UX-F16/17               |
| SC-06  | Checkout — Revisión       | Cliente/Checkout | cualquiera          | P0        | RF-042/060, RN-031, US-06/12, UX-F07/13/15 |
| SC-07  | Pago                      | Cliente/Pago     | cualquiera          | P0        | RF-050/051, US-05, UX-F08/09               |
| SC-08  | Resultado del pago        | Cliente/Pago     | cualquiera          | P0        | RF-052, E-05/E-08, UX-F08                  |
| SC-09  | Seguimiento               | Cliente/Pedidos  | cualquiera (código) | P0        | RF-070, US-07, UX-F10                      |
| SC-10  | Historial                 | Cliente/Cuenta   | registrado          | P1        | RF-032, US-08, UX-F—/SC-10                 |
| SC-11  | Detalle de pedido         | Cliente/Cuenta   | registrado          | P1        | RF-032/071, US-11, SC-11                   |
| SC-12  | Autenticación             | Cliente/Cuenta   | cualquiera          | P1        | RF-031, US-08, SC-12                       |
| SA-01  | Bandeja de pedidos        | Admin/Pedidos    | staff               | P0        | RF-081, US-10, SA-01                       |
| SA-02  | Detalle de pedido (staff) | Admin/Pedidos    | staff               | P0        | RF-051/081, US-10, RN-070                  |
| SA-03  | Catálogo (admin)          | Admin/Catálogo   | admin               | P0        | RF-080, US-09, RN-020                      |
| SA-04  | Parámetros operativos     | Admin/Config     | OWNER               | P1        | RF-082, RN-040/041/010/052                 |

**16 pantallas. Sin redundancias** (justificado en §1). No se agrega ninguna pantalla no derivable del PRD/UX.

## 3. Screen Specification

### 3.0 Catálogo transversal de estados (referenciado por las fichas)

| Estado              | Disparador genérico                   | Comportamiento                                        | Transición               |
| ------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------------ |
| Loading             | petición en curso                     | placeholder estructural si espera >1 s                | → Content \| Error       |
| Content             | datos recibidos                       | render normal                                         | → Updating \| Empty      |
| Empty               | respuesta sin datos                   | mensaje de marca, nunca blanco                        | → Content al haber datos |
| Updating            | escritura optimista                   | feedback inmediato + reconciliación                   | → Content \| Error       |
| Error (recuperable) | fallo de red/5xx                      | mensaje + reintento en el lugar                       | → Loading (retry)        |
| Offline             | sin conexión                          | banner no destructivo; acciones se reintentan         | → Content al reconectar  |
| Maintenance         | API caída/planificada                 | mensaje honesto; sin datos falsos                     | → Loading                |
| Out of Hours        | fuera de 18–23 (RN-040)               | navegación sí, checkout no                            | → habilitado en ventana  |
| PriceChanged        | revalidación difiere (RN-031)         | mostrar diferencia, pedir re-confirmar                | → Content \| Cart        |
| InvalidCart         | ítem removed/unavailable (E-01)       | excluir del total, ofrecer quitar                     | → Content al resolver    |
| PaymentPending      | pago en curso/webhook demorado (E-08) | "confirmando tu pago" + reintento; nunca afirma éxito | → Approved \| Rejected   |
| PaymentApproved     | webhook aprobado                      | pedido confirmado                                     | terminal del pago        |
| PaymentRejected     | rechazo/abandono (E-05)               | reintentar o cambiar a efectivo                       | → Pago                   |
| Unauthorized (401)  | sin sesión donde se requiere          | enviar a SC-12 sin perder contexto                    | → autenticado            |
| Forbidden (403)     | permiso insuficiente (staff)          | bloquear + mensaje                                    | terminal                 |
| Cancelled           | pedido cancelado                      | estado terminal con motivo                            | terminal                 |

---

### SC-01 — Menú

**General.** Código SC-01 · Catálogo · cualquiera · **P0**. Puerta de toda compra; presenta el catálogo real por categorías.
**Responsabilidad.** Problema: el cliente necesita ver qué hay y a qué precio. Decisión que permite: qué producto abrir. Por qué existe: es la home del cliente (UX P1); punto de entrada dominante desde Instagram.
**Datos.** `GET /menu` · sin auth · headers `x-tenant-id`, `x-branch-id` · consume: categorías, productos (nombre, precio, imagen, disponibilidad) · derivado: contador del carrito (local/server). Backend: **existente** (falta contenido real).
**Estados.** Loading, Content, Empty (catálogo sin publicar), Error, Offline, Maintenance. Out of Hours **no bloquea** esta pantalla (solo informa).
**Acciones.**
| Acción | Usuario | Condición | Resultado | Endpoint | Transición |
| Explorar/scroll por categoría | cualquiera | menú cargado | navega anclas | — | permanece |
| Abrir producto | cualquiera | producto visible | va a SC-02 | — | → SC-02 |
| Abrir carrito | cualquiera | siempre | va a SC-03 | — | → SC-03 |
**Validaciones.** Ninguna de entrada (pantalla de lectura).
**Errores.** API caída → Error con reintento (raíz: nunca pantalla muerta). Sucursal sin catálogo → Empty.
**Navegación.** Anterior: entrada externa (IG) / barra. Siguiente: SC-02, SC-03. Deep link: `/menu` (y `/menu#categoria`). Back: sale de la app.
**Dependencias.** Backend catálogo; sucursal activa; contenido cargado.
**Seguridad.** Pública; sin datos sensibles; no expone precios de otras sucursales (filtrado server).
**Accesibilidad.** `<h1>` "Menú"; nav landmark; anclas de categoría operables por teclado; targets ≥44 px; imágenes con alt = nombre del producto.
**Responsive.** Mobile: lista vertical con anclas. Tablet/Desktop: más columnas (comportamiento: mismo contenido, más densidad; sin cambios funcionales).
**Analytics.** `menu_view`, `category_anchor_click`, `product_open`; embudo paso 1; evento de conversión aguas abajo. KPIs: entrada del funnel, productos vistos/sesión.
**Logging.** Funcional: carga del menú. Error: fallo de `GET /menu`.
**QA.** Feliz: 8 categorías/34 productos con precio. Negativo: API 5xx → reintento. Límite: producto sin imagen (placeholder de marca, no rota). Concurrente: cambio de disponibilidad desde admin se refleja al recargar. CA: todo producto activo del catálogo real aparece con su precio de sucursal.

---

### SC-02 — Detalle de producto

**General.** SC-02 · Catálogo · cualquiera · **P0**. Da toda la info para decidir y personalizar.
**Responsabilidad.** Problema: decidir y configurar un producto (extra/variante/notas). Decisión: agregarlo o no, con qué modificadores. Por qué existe: los descriptores del menú venden; los modificadores con precio requieren superficie propia.
**Datos.** `GET /catalog/products/:id` · sin auth · consume: descriptores, precio, imagen, categoría; parámetro `precio_medallon_extra` y `max_medallones` (de SA-04). Backend: **existente** para el producto; **NUEVO** para extras/variante (PRD §17 RF-010/011).
**Estados.** Loading, Content, InvalidCart-precursor (producto pasa a no disponible → bloquea "agregar", E-01), Error.
**Acciones.**
| Ajustar medallón extra (0..máx) | cualquiera | categoría=Hamburguesas (RN-010) | recalcula precio del ítem en pantalla | — (cálculo local) | permanece |
| Elegir variante Cajita (burger/nuggets) | cualquiera | producto=Cajita (RN-011) | habilita "agregar" | — | permanece |
| Escribir nota | cualquiera | siempre | adjunta nota | — | permanece |
| Agregar al carrito | cualquiera | producto disponible + Cajita con elección | ítem al carrito | `POST /cart/items` | → SC-01 (P2 UX) o SC-03 |
**Validaciones.** Medallón: entero 0..máx (control deshabilita fuera de rango). Cajita: elección **obligatoria** antes de agregar (mensaje si falta). Nota: texto ≤ límite existente (200). Cantidad base: 1..20 (RN-032).
**Errores.** Producto no disponible al agregar → E-01 (bloquea, avisa). Conflicto de versión de carrito → reintento transparente (E-07).
**Navegación.** Anterior: SC-01. Siguiente: SC-03 o vuelta a SC-01. Deep link: `/producto/:id`. Back: a SC-01 sin perder carrito.
**Dependencias.** SC-01; parámetros de SA-04 (extra/máx); backend NUEVO de modificadores.
**Seguridad.** Pública; el precio del extra viene de parámetro server, no del cliente (RN-050 se refuerza en checkout).
**Accesibilidad.** `<h1>` = nombre; stepper del medallón con etiquetas y anuncio de precio actualizado; elección Cajita como grupo de radios etiquetado; foco al primer control.
**Responsive.** Igual contenido en todos los tamaños; sin cambios funcionales.
**Analytics.** `product_view`, `extra_added`, `variant_selected`, `add_to_cart`. KPI: adopción de extras (PRD §13). Abandono: `product_view` sin `add_to_cart`.
**Logging.** Add-to-cart; fallo de agregado; intento de agregar producto no disponible.
**QA.** Feliz: LEBRON +2 medallones = precio base + 2×extra, va al carrito. Negativo: Cajita sin elección → no agrega. Límite: medallón en el máximo → "+" deshabilitado. Concurrente: producto despublicado mientras se mira → bloqueo. CA: RF-010/011 verificables (extra suma, variante obligatoria y viaja al pedido).

---

### SC-03 — Carrito

**General.** SC-03 · Carrito · cualquiera · **P0**. Revisar y ajustar antes de comprar.
**Responsabilidad.** Problema: confirmar qué se pide y ver el total preview. Decisión: editar o avanzar a checkout. Por qué existe: el pedido multi-ítem necesita revisión (persona "grupo del viernes").
**Datos.** `CartModule`: `GET /cart`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart`. Auth opcional (invitado local / registrado server). Consume: ítems con extras/notas, subtotales, total preview. Backend: **existente** (extras dependen del NUEVO de SC-02).
**Estados.** Content (con ítems), **Empty** (carrito vacío), InvalidCart (ítems removed/unavailable, E-01), Updating (edición optimista), Loading, Error, Offline.
**Acciones.**
| Editar cantidad | cualquiera | ítem presente | recalcula, CAS por versión | `PATCH /cart/items/:productId` | Updating→Content |
| Quitar ítem | cualquiera | ítem presente | elimina | `DELETE /cart/items/:productId` | Updating→Content/Empty |
| Vaciar carrito | cualquiera | carrito con ítems | vacía (confirmación, acción costosa) | `DELETE /cart` | → Empty |
| Ir a checkout | cualquiera | carrito válido + horario | inicia checkout | — (valida en SC-06) | → SC-04 |
**Validaciones.** Cantidad 1..20 (RN-032); no avanzar con ítems inválidos (E-01).
**Errores.** Conflicto de versión (E-07) → recargar y reaplicar. Ítem removed (RN-033) → excluir del total, ofrecer quitar.
**Navegación.** Anterior: SC-01/02. Siguiente: SC-04. Vacío → CTA a SC-01. Deep link: `/carrito`. Back: a menú.
**Dependencias.** CartModule; SA-04 (para envío estimado, mostrado recién en SC-05/06).
**Seguridad.** El carrito de un cliente no es accesible por otro (server: por customer; local: por dispositivo).
**Accesibilidad.** Lista con encabezados; controles de cantidad etiquetados; el total anunciado al cambiar; confirmación de vaciar accesible.
**Responsive.** Mobile: total y CTA fijos accesibles al pulgar (comportamiento: siempre alcanzable). Sin cambios funcionales por tamaño.
**Analytics.** `cart_view`, `cart_edit`, `cart_remove`, `checkout_start`. KPI: abandono de carrito (PRD §13). Abandono: `cart_view` sin `checkout_start`.
**Logging.** Ediciones; conflicto de versión; intento de checkout con carrito inválido.
**QA.** Feliz: editar cantidad recalcula total. Negativo: quitar el último ítem → Empty con CTA. Límite: ítem despublicado → excluido, checkout bloqueado. Concurrente: dos pestañas editan → reconciliación por versión. CA: RF-020/022.

---

### SC-04 — Checkout · Identidad

**General.** SC-04 · Checkout · cualquiera · **P0**. Obtener el mínimo dato para operar.
**Responsabilidad.** Problema: identificar al comprador con mínima fricción. Decisión: invitado, login o registro. Por qué existe: el negocio necesita teléfono; el cliente no debe verse forzado a registrarse (RF-030, UX P4).
**Datos.** Invitado: sin endpoint (datos al crear el pedido). Login/registro/reset: auth existente + **NUEVO** (registro/reset self-service). Consume: nada de catálogo.
**Estados.** Content, Loading (auth), Error (credenciales), Success (autenticado → merge de carrito RF-021), Unauthorized-N/A.
**Acciones.**
| Continuar como invitado | cualquiera | nombre+teléfono válidos | guarda datos para el pedido | — | → SC-05 |
| Iniciar sesión | cualquiera | credenciales | autentica + merge carrito | `POST /auth/login` | → SC-05 |
| Registrarse | cualquiera | email+contraseña válidos | crea cuenta | `POST /auth/register` (**NUEVO**) | → SC-05 |
| Pedir reset | cualquiera | email | envía email | `POST /auth/reset` (**NUEVO**) | permanece |
**Validaciones.** Invitado: nombre no vacío; teléfono con formato AR (obligatorios, únicos). Registro: email válido, contraseña ≥ política existente (≥8). Mensajes por campo.
**Errores.** Credenciales inválidas → recuperable, no expulsa del checkout (UX §8). Email ya registrado → mensaje claro, ofrecer login.
**Navegación.** Anterior: SC-03. Siguiente: SC-05. Contextual: SC-12 comparte formularios (misma responsabilidad). Back: a carrito sin perder datos.
**Dependencias.** Auth existente; backend NUEVO de registro/reset; carrito válido; horario (se valida en SC-06 pero se puede advertir aquí).
**Seguridad.** Contraseñas nunca en el cliente en claro más de lo necesario; tokens en almacenamiento seguro; teléfono es PII: no va en URL.
**Accesibilidad.** Formularios etiquetados; teléfono con teclado numérico; errores asociados y anunciados; foco al primer campo con error.
**Responsive.** Sin cambios funcionales.
**Analytics.** `checkout_identity_view`, `guest_selected`, `login_success`, `register_success`. Abandono: identidad sin avanzar a entrega (fricción UX-3).
**Logging.** Login/registro; fallos de credenciales (sin exponer detalle al cliente — regla del proyecto).
**QA.** Feliz: invitado con nombre+teléfono avanza. Negativo: teléfono vacío → bloquea. Límite: login con carrito local → merge con reporte. CA: RF-030/031.

---

### SC-05 — Checkout · Entrega

**General.** SC-05 · Checkout · cualquiera · **P0**. Definir retiro o delivery.
**Responsabilidad.** Problema: cómo recibe el pedido y cuánto cuesta el envío. Decisión: retiro (sin costo) o delivery (dirección + envío). Por qué existe: fulfillment y costo afectan el total (RF-040/041).
**Datos.** Parámetros de SA-04: `costo_envio`, `zona` (**NUEVO**). Consume: método, dirección (texto, sin geocoding, RN-041).
**Estados.** Content, retiro-seleccionado, delivery-seleccionado, FueraDeZona (E-04), Loading (params), Error.
**Acciones.**
| Elegir retiro | cualquiera | siempre | sin dirección, sin envío | — | → SC-06 |
| Elegir delivery | cualquiera | siempre | pide dirección+referencia | — | permanece |
| Ingresar dirección | cualquiera | delivery | valida zona declarativa | — | → SC-06 o E-04 |
**Validaciones.** Delivery: dirección no vacía; referencia opcional; zona declarativa (checkbox/declaración "estoy en Roque Pérez"). Retiro: sin campos.
**Errores.** Fuera de zona (declarado) → E-04: mensaje + ofrecer retiro.
**Navegación.** Anterior: SC-04. Siguiente: SC-06. Back: a identidad sin perder datos. **Pendiente (gap):** default retiro/delivery no fijado (UX §10) — afecta esta pantalla.
**Dependencias.** SA-04 (envío/zona, backend NUEVO).
**Seguridad.** Dirección es PII: no en URL, no en logs de cliente.
**Accesibilidad.** Grupo de opciones etiquetado; campos de dirección con labels; error de zona asociado.
**Responsive.** Sin cambios funcionales.
**Analytics.** `fulfillment_selected` (pickup/delivery), `out_of_zone`. KPI: mix pickup/delivery (informa operación).
**Logging.** Selección de fulfillment; fuera de zona.
**QA.** Feliz: delivery en zona suma $2000 como línea separada. Negativo: dirección vacía en delivery → bloquea. Límite: cambio a retiro elimina el envío del total. CA: RF-040/041, RN-041/042.

---

### SC-06 — Checkout · Revisión

**General.** SC-06 · Checkout · cualquiera · **P0**. Mostrar el total definitivo y advertencias antes de pagar. **Pantalla más crítica del funnel.**
**Responsabilidad.** Problema: el cliente debe ver y aceptar el total real. Decisión: confirmar el total o volver a editar. Por qué existe: es el punto donde el precio deja de ser preview y se vuelve compromiso (RN-031).
**Datos.** `POST /orders` con `idempotencyKey`, `expectedTotal`, `fulfillmentType`, dirección si delivery. Auth: invitado (datos del pedido) o sesión. Consume: desglose (ítems, extras, envío), flag `contieneAlcohol` (**NUEVO**, por categoría). Backend: **existente** (checkout idempotente + PRICE_CHANGED); línea de envío y flag alcohol **NUEVO**.
**Estados.** Content, PriceChanged (RN-031, F-13), OutOfHours (RN-040, F-14), InvalidCart (E-01), Submitting, Success (pedido borrador creado), Error.
**Acciones.**
| Confirmar total | cualquiera | horario abierto + carrito válido | crea pedido borrador | `POST /orders` | → SC-07 \| PriceChanged \| OutOfHours \| InvalidCart |
| Volver a editar | cualquiera | siempre | vuelve a carrito/entrega | — | → SC-03/05 |
| Aceptar nuevo total | cualquiera | PriceChanged | continúa | reintento `POST /orders` con nuevo expectedTotal | → SC-07 |
**Validaciones.** `expectedTotal` = total mostrado (revalidación server). Aviso de alcohol presente si hay alcohol (RF-060), aceptado con la confirmación.
**Errores.** PRICE_CHANGED (409) → mostrar diferencia, re-confirmar (tratar como flujo normal, UX-2). CART_INVALID_ITEMS (422) → volver a resolver. Fuera de horario (RF-043) → bloquear con mensaje de ventana.
**Navegación.** Anterior: SC-05. Siguiente: SC-07. Back: a entrega sin perder datos. Deep link: no (requiere estado de checkout).
**Dependencias.** OrdersModule (existente); envío + flag alcohol (NUEVO); SA-04 (horario/envío).
**Seguridad.** El total es server-authoritative (RN-050); el cliente no puede forzar un total menor (revalidación).
**Accesibilidad.** Desglose como lista legible; el total es el elemento primario (jerarquía UX §6); aviso de alcohol anunciado; error de precio recibe foco.
**Responsive.** Sin cambios funcionales; total y CTA siempre alcanzables.
**Analytics.** `checkout_review_view`, `price_changed_shown`, `order_created`. Evento crítico: `order_created`. Abandono: revisión sin confirmar (posible causa: total sorpresa).
**Logging.** Creación de pedido (evento auditado existente ORDER_PLACED); PRICE_CHANGED; intento fuera de horario.
**QA.** Feliz: total con envío y extras correcto → pedido borrador. Negativo: precio cambió → re-confirmación obligatoria. Límite: ventana se cierra durante la revisión → bloqueo al confirmar. Concurrente: doble tap → idempotencia (un solo pedido, OT-2). CA: RF-042/060, RN-031.

---

### SC-07 — Pago

**General.** SC-07 · Pago · cualquiera · **P0**. Cobrar (MP) o registrar el método (efectivo).
**Responsabilidad.** Problema: elegir cómo paga. Decisión: MP o efectivo. Por qué existe: ambos métodos son decisión aprobada (RF-050/051).
**Datos.** MP: `POST /orders/:id/payment` con `idempotencyKey` → `checkoutUrl`. Efectivo: método `efectivo` (**NUEVO**). Consume: pedido borrador. Backend: **existente** (MP); efectivo **NUEVO**.
**Estados.** Content (métodos), Submitting, Redirect (a MP, salida temporal), PaymentPending, Error.
**Acciones.**
| Pagar con MP | cualquiera | pedido borrador | crea intento, redirige | `POST /orders/:id/payment` | → MP → SC-08 |
| Elegir efectivo | cualquiera | pedido borrador | pedido queda "pendiente de aceptación" | método efectivo (**NUEVO**) | → SC-08 (variante efectivo) |
**Validaciones.** Un pedido con pago aprobado no admite segundo pago (RN-051, 409 PAYMENT_ALREADY_APPROVED). Pedido debe estar en borrador (ORDER_NOT_PAYABLE si no).
**Errores.** PROVIDER_UNAVAILABLE (503) → reintento; el intento pendiente se reutiliza (sin doble preferencia). ORDER_NOT_PAYABLE (422) → volver a estado.
**Navegación.** Anterior: SC-06. Siguiente: SC-08. Back: bloqueado una vez en MP (lo maneja SC-08). Deep link: no.
**Dependencias.** PaymentsModule (existente); método efectivo (NUEVO).
**Seguridad.** Monto server-authoritative (RN-050); credenciales MP nunca en el cliente; idempotencia por clave.
**Accesibilidad.** Métodos como grupo etiquetado; el redirect anunciado ("te llevamos a Mercado Pago").
**Responsive.** Sin cambios funcionales.
**Analytics.** `payment_method_selected` (mp/cash), `mp_redirect`, `cash_selected`. Evento crítico. Abandono: método elegido sin desenlace (UX-1).
**Logging.** Inicio de pago (PAYMENT_INITIATED existente); proveedor no disponible.
**QA.** Feliz: MP devuelve checkoutUrl y redirige. Negativo: proveedor caído → reintento reusa intento. Límite: reintento con misma clave → sin doble preferencia (PT-2). CA: RF-050/051, RN-050/051.

---

### SC-08 — Resultado del pago

**General.** SC-08 · Pago · cualquiera · **P0**. Reflejar honestamente el desenlace (P5: nunca afirmar éxito no confirmado).
**Responsabilidad.** Problema: el cliente vuelve de MP (o eligió efectivo) y necesita saber qué pasó. Decisión: seguir su pedido o recuperarse de un fallo. Por qué existe: el redirect y el webhook son asíncronos (E-08).
**Datos.** `GET /orders/:id/payment`, `GET /orders/:id`. Consume: estado del pago y del pedido. Backend: **existente**.
**Estados.** PaymentPending ("confirmando tu pago" + reintento/polling), PaymentApproved (→ Seguimiento), PaymentRejected (E-05), Efectivo-pendiente (F-09: "el local está confirmando"), Error.
**Acciones.**
| Ir a seguimiento | cualquiera | aprobado o efectivo pendiente | va a SC-09 | — | → SC-09 |
| Reintentar pago | cualquiera | rechazado | vuelve a SC-07 | — | → SC-07 |
| Cambiar a efectivo | cualquiera | rechazado | registra efectivo | método efectivo (**NUEVO**) | → SC-09 |
**Validaciones.** No mostrar "aprobado" sin confirmación del backend (E-08). Polling con límite razonable + mensaje.
**Errores.** Webhook demorado → PaymentPending persistente con reintento; nunca "pagado" prematuro.
**Navegación.** Anterior: MP/SC-07. Siguiente: SC-09. Back: a menú (el pedido persiste). Deep link: retorno de MP con `?order=:id`.
**Dependencias.** PaymentsModule; método efectivo (NUEVO).
**Seguridad.** El estado proviene del backend, no del parámetro de retorno de MP (el redirect es no confiable).
**Accesibilidad.** Estado anunciado por lector; el mensaje de "confirmando" es una región viva (live region).
**Responsive.** Sin cambios funcionales.
**Analytics.** `payment_result` (approved/rejected/pending/cash), `payment_retry`, `switch_to_cash`. Conversión: `payment_approved`. Abandono crítico: rechazado sin recuperación.
**Logging.** Resultado de pago (PAYMENT_APPROVED/REJECTED existentes); polling agotado.
**QA.** Feliz: aprobado → seguimiento con pedido confirmado. Negativo: rechazado → reintento/efectivo. Límite: webhook tarda → "confirmando" sin afirmar éxito (E-08). CA: RF-052, E-05/E-08.

---

### SC-09 — Seguimiento

**General.** SC-09 · Pedidos · cualquiera con código · **P0**. Informar el estado sin requerir cuenta.
**Responsabilidad.** Problema: "¿cuándo está mi pedido?". Decisión: esperar, retirar, o cancelar si aplica. Por qué existe: el invitado no tiene cuenta y necesita seguimiento (RF-070).
**Datos.** `GET /orders/:id` por código (**NUEVO**: acceso por código no enumerable). Consume: estado del pedido y del pago, resumen. Auth: no (código).
**Estados.** cada estado del pedido (borrador/pendiente, confirmado, preparación, entregado, Cancelled), PaymentPending/Approved/Rejected, código-inexistente (mensaje neutro), Loading, Offline.
**Acciones.**
| Refrescar estado | cualquiera | pedido existe | reconsulta | `GET /orders/:id` | permanece |
| Cancelar | cliente | estado ∈ {borrador, confirmado} (RN-071) | cancela con confirmación | `POST /orders/:id/cancel` | → Cancelled |
**Validaciones.** Cancelar solo en estados permitidos; confirmación (acción costosa).
**Errores.** Código inexistente → mensaje neutro (no filtra existencia). Estado avanzó → 422 explicado, opción de cancelar desaparece.
**Navegación.** Anterior: SC-08 / enlace externo. Siguiente: — (terminal del journey). Deep link: `/seguimiento/:codigo`. Back: a menú.
**Dependencias.** OrdersModule; acceso por código (NUEVO).
**Seguridad.** Código no enumerable (no secuencial); no expone PII más allá del resumen del propio pedido; sin login pero sin listar otros pedidos.
**Accesibilidad.** Estado como región viva; código visible y copiable; cancelar accesible.
**Responsive.** Sin cambios funcionales.
**Analytics.** `tracking_view`, `order_status_seen`, `cancel_from_tracking`. KPI: retorno post-compra.
**Logging.** Consulta de seguimiento; cancelación (ORDER_CANCELLED existente).
**QA.** Feliz: código válido muestra estado en vivo. Negativo: código inválido → mensaje neutro. Límite: cancelar justo cuando pasó a preparación → 422 explicado. CA: RF-070/071.

---

### SC-10 — Historial (registrado)

**General.** SC-10 · Cuenta · registrado · **P1**. Reencontrar pedidos pasados.
**Responsabilidad.** Problema: el cliente frecuente quiere ver/rehacer pedidos. Decisión: abrir un pedido. Por qué existe: valor de la cuenta (RF-032, US-08).
**Datos.** `GET /orders` (propios) · auth requerida. Consume: lista por fecha con estado. Backend: **existente**.
**Estados.** Content, **Empty** (primer pedido: invitación a explorar), Loading, Unauthorized (→ SC-12), Error.
**Acciones.**
| Abrir detalle | registrado | pedido en lista | va a SC-11 | — | → SC-11 |
| (P2) Repetir pedido | registrado | pedido repetible | rearma carrito | — | → SC-03 |
**Validaciones.** Ninguna de entrada.
**Errores.** 401 → SC-12 conservando intención.
**Navegación.** Anterior: barra/Cuenta. Siguiente: SC-11. Deep link: `/cuenta/pedidos` (requiere sesión). Back: a menú.
**Dependencias.** Sesión; OrdersModule.
**Seguridad.** Solo pedidos del usuario (filtrado server por customer); 401 si no autenticado.
**Accesibilidad.** Lista con encabezados de fecha/estado; navegable por teclado.
**Responsive.** Sin cambios funcionales.
**Analytics.** `history_view`, `order_reopen`, (P2) `reorder`. KPI: recompra.
**Logging.** Acceso a historial.
**QA.** Feliz: lista ordenada por fecha. Negativo: sin sesión → login. Límite: sin pedidos → Empty con CTA. CA: RF-032.

---

### SC-11 — Detalle de pedido (registrado)

**General.** SC-11 · Cuenta · registrado · **P1**. Ver un pedido completo.
**Responsabilidad.** Problema: revisar un pedido puntual y actuar (seguir/cancelar). Decisión: seguir o cancelar. Por qué existe: profundidad del historial (RF-032/071).
**Datos.** `GET /orders/:id`, `GET /orders/:id/payment` · auth. Consume: ítems, totales, estado, pago. Backend: **existente**.
**Estados.** por estado del pedido; PaymentPending/Approved/Rejected; Loading; Forbidden (pedido ajeno → 403/404 sin fuga); Cancelled.
**Acciones.**
| Seguir | registrado | pedido propio | muestra estado | `GET /orders/:id` | permanece |
| Cancelar | registrado | estado permitido (RN-071) | cancela con confirmación | `POST /orders/:id/cancel` | → Cancelled |
**Validaciones.** Cancelar solo en estados permitidos.
**Errores.** Pedido ajeno → 404/403 sin distinguir (aislamiento). Estado avanzado → 422.
**Navegación.** Anterior: SC-10. Siguiente: — . Deep link: `/cuenta/pedidos/:id`. Back: a historial.
**Dependencias.** Sesión; OrdersModule.
**Seguridad.** Aislamiento por cliente/tenant (contrato existente); sin fuga de existencia.
**Accesibilidad.** Desglose legible; estado como región viva; cancelar accesible.
**Responsive.** Sin cambios funcionales.
**Analytics.** `order_detail_view`, `cancel_from_detail`.
**Logging.** Vista de detalle; cancelación.
**QA.** Feliz: detalle completo con pago. Negativo: pedido ajeno → sin acceso. Límite: cancelar en preparación → 422. CA: RF-032/071.

---

### SC-12 — Autenticación (login / registro / reset)

**General.** SC-12 · Cuenta · cualquiera · **P1**. Gestionar sesión opcional.
**Responsabilidad.** Problema: entrar, crear cuenta o recuperar acceso. Decisión: cuál de las tres. Por qué existe: registro opcional habilita historial (RF-031).
**Datos.** `POST /auth/login` (existente); `POST /auth/register`, `POST /auth/reset` (**NUEVO**). Consume: nada de catálogo.
**Estados.** Content, Loading, Error (credenciales/email en uso), Success (sesión), reset-enviado.
**Acciones.**
| Login | cualquiera | credenciales | crea sesión | `POST /auth/login` | → origen (checkout/cuenta) |
| Registrar | cualquiera | email+contraseña | crea cuenta | `POST /auth/register` (**NUEVO**) | → origen |
| Reset | cualquiera | email | envía email | `POST /auth/reset` (**NUEVO**) | permanece |
**Validaciones.** Email válido; contraseña ≥8 (política existente); mensajes por campo; no revelar si un email existe en el reset (privacidad).
**Errores.** Credenciales inválidas → recuperable (sin exponer detalle de GoTrue al cliente — regla del proyecto). Email en uso → ofrecer login.
**Navegación.** Anterior: SC-04 (checkout) o barra. Siguiente: pantalla de origen. Deep link: `/auth`. Back: al origen.
**Dependencias.** Auth existente + registro/reset NUEVO.
**Seguridad.** Detalle de error de auth solo para diagnóstico, nunca al cliente; tokens seguros; reset no enumera usuarios.
**Accesibilidad.** Formularios etiquetados; errores anunciados; foco gestionado; visibilidad de contraseña opcional accesible.
**Responsive.** Sin cambios funcionales.
**Analytics.** `auth_view`, `login_success/fail`, `register_success`, `reset_requested`.
**Logging.** Login/registro/reset; fallos (diagnóstico interno).
**QA.** Feliz: login vuelve al checkout con carrito intacto. Negativo: password corta → validación. Límite: reset de email inexistente → mismo mensaje neutro. CA: RF-031.

---

### SA-01 — Bandeja de pedidos (staff)

**General.** SA-01 · Admin/Pedidos · staff · **P0**. Operar el servicio.
**Responsabilidad.** Problema: el staff necesita ver y priorizar pedidos, y aceptar los de efectivo. Decisión: qué pedido atender/aceptar. Por qué existe: sin bandeja el negocio no opera el canal (RF-081).
**Datos.** `GET /orders` (staff, por sucursal/estado) · auth + `orders.read`. Consume: pedidos por estado, "efectivo pendiente de aceptación" destacado. Backend: **existente**.
**Estados.** Content (por estado), Empty, Loading, Forbidden (sin permiso), Error, Offline.
**Acciones.**
| Filtrar por estado | staff | `orders.read` | filtra | `GET /orders?estado=` | permanece |
| Abrir pedido | staff | `orders.read` | va a SA-02 | — | → SA-02 |
| Aceptar efectivo | staff | `orders.write` + pedido efectivo borrador | confirma pedido | `POST /orders/:id/confirm` | → confirmado |
**Validaciones.** Aceptar solo pedidos efectivo en borrador (RN-052); timeout configurable (SA-04).
**Errores.** 403 sin permiso; carrera al aceptar → conflicto y recarga (E-07).
**Navegación.** Anterior: login staff. Siguiente: SA-02. Deep link: `/admin/pedidos` (requiere permiso). Back: —.
**Dependencias.** OrdersModule; permisos; SA-04 (timeout efectivo).
**Seguridad.** `orders.read`/`orders.write`; solo la sucursal del staff; sin acceso al árbol cliente.
**Accesibilidad.** Tabla/lista con encabezados; filtros etiquetados; acciones por teclado.
**Responsive.** Mobile: prioriza estado y acción; Desktop: más columnas. Sin cambios funcionales.
**Analytics.** `staff_queue_view`, `cash_accepted`, `filter_used`. KPI: aceptación de efectivo < timeout (PRD §13).
**Logging.** Aceptación (ORDER_CONFIRMED auditado); accesos.
**QA.** Feliz: efectivo pendiente visible → aceptar → confirmado. Negativo: sin permiso → 403. Límite: dos cajeros aceptan el mismo → uno gana (CAS). CA: RF-081, RN-052.

---

### SA-02 — Detalle de pedido (staff)

**General.** SA-02 · Admin/Pedidos · staff · **P0**. Mover el pedido por su ciclo.
**Responsabilidad.** Problema: avanzar/cancelar un pedido. Decisión: la transición legal siguiente. Por qué existe: operación del ciclo de vida (RF-081, RN-070).
**Datos.** `GET /orders/:id`, `POST /orders/:id/status`, `POST /orders/:id/cancel`, `POST /orders/:id/confirm` · auth + `orders.write`. Consume: pedido completo, transiciones legales. Backend: **existente**.
**Estados.** por estado (con transiciones ofrecidas según RN-070), Submitting, conflicto de carrera (E-07), Forbidden, Error.
**Acciones.**
| Confirmar (efectivo/mostrador) | staff | borrador | → confirmado | `POST /orders/:id/confirm` | Submitting→confirmado |
| Pasar a preparación | staff | confirmado | → preparación | `POST /orders/:id/status` | → preparación |
| Marcar entregado | staff | preparación | → entregado | `POST /orders/:id/status` | → entregado (terminal) |
| Cancelar con motivo | staff | según máquina | → cancelado | `POST /orders/:id/cancel` | → cancelado |
**Validaciones.** Solo transiciones legales (RN-070); motivo requerido en cancelación de staff.
**Errores.** INVALID_TRANSITION (422); TRANSITION_CONFLICT (409) → recargar. 403 sin permiso.
**Navegación.** Anterior: SA-01. Siguiente: —. Deep link: `/admin/pedidos/:id`. Back: a bandeja.
**Dependencias.** OrdersModule; permisos.
**Seguridad.** `orders.write`; auditoría por transición (evento existente).
**Accesibilidad.** Acciones etiquetadas; solo transiciones legales visibles; confirmación de cancelar accesible.
**Responsive.** Sin cambios funcionales.
**Analytics.** `order_transition` (from/to), `order_cancelled_staff`.
**Logging.** Cada transición (ORDER_STATUS_CHANGED/CANCELLED auditados).
**QA.** Feliz: borrador→confirmado→preparación→entregado. Negativo: transición ilegal → 422. Concurrente: carrera → conflicto. CA: RF-081, RN-070.

---

### SA-03 — Catálogo (admin)

**General.** SA-03 · Admin/Catálogo · admin · **P0**. Mantener el menú.
**Responsabilidad.** Problema: el dueño debe crear/editar/despublicar productos, ajustar precio y disponibilidad. Decisión: qué se publica y a qué precio. Por qué existe: sin esto no hay catálogo real ni gestión de agotados (RF-080, RN-020).
**Datos.** Catálogo CRUD existente: `POST/PATCH /catalog/products`, `/categories`, `PUT /catalog/products/:id/availability`, `POST /catalog/products/:id/disable`. Auth + `catalog.*`. Backend: **existente**.
**Estados.** Content (listas editables), Saving, ValidationError, Forbidden, Error.
**Acciones.**
| Crear/editar producto | admin | `catalog.write` | persiste | `POST/PATCH /catalog/products` | Saving→Content |
| Despublicar | admin | `catalog.write` | sale del menú público | `POST /catalog/products/:id/disable` | → Content |
| Editar disponibilidad/precio por sucursal | admin | `catalog.write` | override por sucursal | `PUT /catalog/products/:id/availability` | → Content |
| Crear/editar categoría | admin | `catalog.write` | persiste | `POST/PATCH /catalog/categories` | → Content |
**Validaciones.** Precio entero ≥ 0 ARS; nombre requerido; imagen (URL) por producto; ortografía canónica (Discovery §4).
**Errores.** Validación de datos; 403 sin permiso.
**Navegación.** Anterior: panel. Siguiente: —. Deep link: `/admin/catalogo`. Back: a panel.
**Dependencias.** Catálogo CRUD; almacenamiento de imágenes (operativo).
**Seguridad.** `catalog.*`; solo staff; auditoría de cambios (trigger existente).
**Accesibilidad.** Formularios etiquetados; feedback de guardado anunciado.
**Responsive.** Sin cambios funcionales.
**Analytics.** `catalog_edit`, `product_disabled`, `price_changed_admin`.
**Logging.** Cambios de catálogo (auditados).
**QA.** Feliz: despublicar producto → desaparece del menú público. Negativo: precio inválido → validación. Límite: producto en carritos activos despublicado → aparece como removed en el cliente (RN-033). CA: RF-080.

---

### SA-04 — Parámetros operativos

**General.** SA-04 · Admin/Config · OWNER · **P1**. Ajustar reglas sin deploy.
**Responsabilidad.** Problema: horario, envío, precio del extra, zona y timeout de efectivo cambian con la operación. Decisión: sus valores vigentes. Por qué existe: RF-082 exige parametrización desde el día uno.
**Datos.** Entidad de parámetros por tenant + endpoints admin (**NUEVO**, PRD §17). Auth + OWNER. Consume/produce: `ventana_horaria`, `costo_envio`, `precio_medallon_extra`, `max_medallones`, `zona`, `timeout_efectivo`.
**Estados.** Content, Saving, ValidationError, Forbidden, Error.
**Acciones.**
| Editar parámetro | OWNER | rol OWNER | persiste, rige sin redeploy | endpoints params (**NUEVO**) | Saving→Content |
**Validaciones.** Horario válido (inicio<fin); montos ≥0; máx medallones ≥0; timeout >0.
**Errores.** Validación; 403 si no OWNER.
**Navegación.** Anterior: panel. Siguiente: —. Deep link: `/admin/parametros`. Back: a panel.
**Dependencias.** Backend NUEVO de parámetros; consumido por SC-02 (extra), SC-05/06 (envío/horario), SA-01 (timeout).
**Seguridad.** Solo OWNER; cambios auditados.
**Accesibilidad.** Formularios etiquetados; confirmación de guardado.
**Responsive.** Sin cambios funcionales.
**Analytics.** `param_changed` (cuál).
**Logging.** Cambios de parámetros (auditar).
**QA.** Feliz: cambiar horario a 19–23 bloquea checkout a las 18:30. Negativo: inicio>fin → validación. Límite: cambiar precio del extra se refleja en SC-02 sin redeploy. CA: RF-082, RN-040/041/010/052.

---

## 4. Screen Dependency Matrix

| Pantalla | Consume (datos)        | Produce                      | Depende de                           | Impacta            |
| -------- | ---------------------- | ---------------------------- | ------------------------------------ | ------------------ |
| SC-01    | menú                   | contexto de carrito          | catálogo, sucursal                   | SC-02/03           |
| SC-02    | producto, params extra | ítem de carrito              | SC-01, SA-04, backend extras         | SC-03              |
| SC-03    | carrito                | carrito válido               | SC-02, CartModule                    | SC-04              |
| SC-04    | — / sesión             | identidad del pedido, sesión | auth, backend registro               | SC-05              |
| SC-05    | params envío/zona      | fulfillment                  | SA-04                                | SC-06              |
| SC-06    | desglose, flag alcohol | pedido borrador              | Orders, SA-04, backend envío/alcohol | SC-07              |
| SC-07    | pedido borrador        | intento de pago              | Payments, backend efectivo           | SC-08              |
| SC-08    | estado pago/pedido     | —                            | Payments                             | SC-09              |
| SC-09    | pedido por código      | cancelación                  | Orders, acceso por código            | —                  |
| SC-10    | pedidos propios        | —                            | sesión, Orders                       | SC-11              |
| SC-11    | pedido+pago            | cancelación                  | sesión, Orders                       | —                  |
| SC-12    | —                      | sesión                       | auth, backend registro/reset         | SC-04/10           |
| SA-01    | pedidos sucursal       | aceptación efectivo          | Orders, permisos, SA-04              | SA-02              |
| SA-02    | pedido                 | transiciones                 | Orders, permisos                     | SA-01              |
| SA-03    | catálogo               | catálogo publicado           | catálogo CRUD                        | SC-01/02           |
| SA-04    | parámetros             | parámetros vigentes          | backend params                       | SC-02/05/06, SA-01 |

## 5. Navigation Matrix

| Origen       | Acción              | Destino          | Condición                       | Excepciones                         |
| ------------ | ------------------- | ---------------- | ------------------------------- | ----------------------------------- |
| externo (IG) | abrir enlace        | SC-01            | —                               | —                                   |
| SC-01        | abrir producto      | SC-02            | producto visible                | no disponible → aviso               |
| SC-01        | ir a carrito        | SC-03            | —                               | —                                   |
| SC-02        | agregar             | SC-01/03         | Cajita con elección; disponible | E-01 bloquea                        |
| SC-03        | checkout            | SC-04            | carrito válido                  | InvalidCart bloquea                 |
| SC-04        | continuar           | SC-05            | invitado válido o sesión        | credenciales inválidas → permanece  |
| SC-05        | continuar           | SC-06            | retiro, o delivery en zona      | fuera de zona → E-04                |
| SC-06        | confirmar total     | SC-07            | horario abierto, carrito válido | PriceChanged/OutOfHours/InvalidCart |
| SC-07        | pagar MP            | MP→SC-08         | pedido borrador                 | proveedor caído → reintento         |
| SC-07        | efectivo            | SC-08            | pedido borrador                 | —                                   |
| SC-08        | seguir              | SC-09            | aprobado o efectivo pendiente   | —                                   |
| SC-08        | reintentar/efectivo | SC-07/SC-09      | rechazado                       | —                                   |
| SC-09        | cancelar            | SC-09(Cancelled) | estado permitido                | 422 si avanzó                       |
| SC-10        | abrir               | SC-11            | sesión                          | 401 → SC-12                         |
| SC-12        | login ok            | origen           | credenciales                    | —                                   |
| SA-01        | abrir/aceptar       | SA-02/confirmado | permiso                         | 403; carrera                        |
| SA-02        | transición          | mismo            | transición legal                | 422/409                             |

## 6. State Matrix (resumen por pantalla)

Máquina genérica de pantallas de lectura (SC-01, SC-09, SC-10, SA-01): `Loading → Content → (Updating) → Content | Empty | Error(→Loading)`.
Máquina de escritura/checkout (SC-06, SC-07, SC-08):

```
Content → Submitting → Success            (→ siguiente pantalla)
                    ↘ PriceChanged → Content (re-confirmar)
                    ↘ OutOfHours → bloqueado
                    ↘ InvalidCart → Content (resolver)
                    ↘ Failure → Retry → Submitting
SC-08: PaymentPending → Approved (terminal) | Rejected → Retry/Cash
```

Máquina de pedido (SA-02, refleja RN-070): `borrador → confirmado → preparacion → entregado`; `borrador|confirmado → cancelado`; terminales `entregado`, `cancelado`.
Cada ficha (§3) detalla los disparadores locales.

## 7. Frontend API Matrix

| Pantalla | Endpoint                              | Método           | Auth        | Cache                    | Errores     | Reintentos            | Timeout |
| -------- | ------------------------------------- | ---------------- | ----------- | ------------------------ | ----------- | --------------------- | ------- |
| SC-01    | `/menu`                               | GET              | no          | corta (menú cambia poco) | 5xx→Error   | sí (idempotente)      | ~5 s    |
| SC-02    | `/catalog/products/:id`               | GET              | no          | corta                    | 404/5xx     | sí                    | ~5 s    |
| SC-03    | `/cart*`                              | GET/PATCH/DELETE | opcional    | no (estado vivo)         | 409 versión | reconciliar, no ciego | ~5 s    |
| SC-04    | `/auth/login`,`/auth/register`\*      | POST             | no          | no                       | 401/409     | no (evitar lockout)   | ~10 s   |
| SC-06    | `/orders`                             | POST             | opcional    | no                       | 409/422     | idempotente por clave | ~10 s   |
| SC-07    | `/orders/:id/payment`                 | POST             | opcional    | no                       | 503/409/422 | idempotente por clave | ~15 s   |
| SC-08    | `/orders/:id`,`/payment`              | GET              | opcional    | no (polling)             | 5xx         | polling con límite    | ~5 s    |
| SC-09    | `/orders/:id` (código)                | GET              | no (código) | no                       | 404 neutro  | sí                    | ~5 s    |
| SC-10/11 | `/orders`,`/orders/:id`               | GET              | sí          | corta                    | 401/403     | sí                    | ~5 s    |
| SC-12    | `/auth/*`                             | POST             | no          | no                       | 401/409     | no                    | ~10 s   |
| SA-01    | `/orders`                             | GET              | sí+perm     | no                       | 403         | sí                    | ~5 s    |
| SA-02    | `/orders/:id/{status,cancel,confirm}` | POST             | sí+perm     | no                       | 409/422     | recargar en conflicto | ~10 s   |
| SA-03    | `/catalog/*`                          | POST/PATCH/PUT   | sí+perm     | no                       | 422         | no ciego              | ~10 s   |
| SA-04    | params\*                              | GET/PUT          | sí+OWNER    | no                       | 422         | no                    | ~10 s   |

`*` = endpoint marcado NUEVO en PRD §17 (no existe aún; requerido).

## 8. Dependency Matrix (pantalla → infra)

| Pantalla | Backend        | Servicio           | Config                         | Parámetros                    | Feature flag                | Permisos          |
| -------- | -------------- | ------------------ | ------------------------------ | ----------------------------- | --------------------------- | ----------------- |
| SC-01/02 | Catálogo       | Supabase/PostgREST | SUPABASE\_\*                   | precio extra, máx             | —                           | público           |
| SC-03    | Cart           | Supabase RPC       | SUPABASE\_\*                   | máx cantidad                  | —                           | público           |
| SC-04/12 | Auth           | Supabase Auth      | JWT_SECRET                     | —                             | registro on/off (implícito) | público           |
| SC-05/06 | Orders         | Supabase RPC       | SUPABASE\_\*                   | envío, zona, horario, alcohol | —                           | público           |
| SC-07/08 | Payments       | Mercado Pago       | MERCADOPAGO*\*, PUBLIC*\*\_URL | timeout efectivo              | proveedor mock/real         | público           |
| SC-09    | Orders         | —                  | —                              | —                             | —                           | acceso por código |
| SC-10/11 | Orders         | —                  | —                              | —                             | —                           | sesión            |
| SA-01/02 | Orders         | —                  | —                              | timeout efectivo              | —                           | orders.read/write |
| SA-03    | Catálogo       | —                  | —                              | —                             | —                           | catalog.\*        |
| SA-04    | Params (NUEVO) | —                  | —                              | —                             | —                           | OWNER             |

## 9. Riesgos (priorizados)

| #   | Riesgo                                               | Tipo                   | Prioridad | Mitigación                                                      |
| --- | ---------------------------------------------------- | ---------------------- | --------- | --------------------------------------------------------------- |
| R-1 | Construir SC-02 antes del backend de modificadores   | Técnico/implementación | **Alta**  | Backend extras (RF-010/011) precede a SC-02; secuenciado en PRD |
| R-2 | Abandono en redirect MP (SC-07/08)                   | UX/comercial           | **Alta**  | Efectivo visible; SC-08 sin callejón; E-05/E-08                 |
| R-3 | PRICE_CHANGED leído como estafa (SC-06)              | UX                     | **Alta**  | Flujo normal, no error; diferencia transparente                 |
| R-4 | Acceso por código (SC-09) inexistente                | Funcional              | **Alta**  | Endpoint NUEVO; sin él el invitado no sigue su pedido           |
| R-5 | Stubs users/roles activos exponen operaciones falsas | Técnico/seguridad      | **Alta**  | Retirar antes de tocar admin (ya dictaminado)                   |
| R-6 | Default fulfillment sin decidir (SC-05)              | Funcional              | Media     | Gap §10; decisión del negocio antes de wireframes               |
| R-7 | Zona declarativa → pedidos fuera de zona             | Operativo              | Media     | Copy claro; staff valida al aceptar                             |
| R-8 | Polling de pago sin límite                           | Técnico                | Media     | Límite + mensaje (SC-08)                                        |

## 10. Gaps (clasificados; nunca inventados)

**Bloqueantes (impiden completar la especificación de una pantalla):**

- G-1 **Default de fulfillment** (retiro/delivery) — SC-05. No fijado por PRD/UX. Decisión del negocio.
- G-2 **Búsqueda de productos** — el enunciado la mencionó; no es RF del PRD. Tratada como P2 (anclas). Si el negocio la quiere en MVP, es RF nuevo → nueva pantalla/comportamiento en SC-01.
- G-3 **Formato del código de seguimiento** (longitud, no enumerable, reenvío por SMS/WhatsApp) — SC-08/09. Requiere definición de producto + backend NUEVO.

**Importantes (no bloquean wireframes, sí implementación):**

- G-4 Aclaraciones abiertas del PRD: medallón extra en veggies/pollo (RN-010) y elección del juguete (RN-011) — comportamiento por defecto ya definido en el PRD.
- G-5 Texto legal exacto del aviso de alcohol (RF-060) — contenido, no comportamiento.
- G-6 Política de cache concreta por endpoint (§7 da lineamientos, no TTLs) — decisión de frontend arquitectura.

**Deseables / no bloqueantes:**

- G-7 Material de marca (Instagram) para el Design System — no afecta comportamiento.
- G-8 Instrumentación analítica concreta (nombres finales de eventos) — §3 propone; se cierra en UX analytics.

## 11. Ready for Wireframes — Checklist

| Criterio                             | Estado    | Nota                                                                    |
| ------------------------------------ | --------- | ----------------------------------------------------------------------- |
| Todas las pantallas existen          | ✓         | 16, sin agregar ni quitar                                               |
| Todas tienen responsabilidad         | ✓         | §3, tres preguntas respondidas por ficha                                |
| Todos los endpoints identificados    | ✓         | existentes + NUEVO marcados (§7), ninguno inventado                     |
| Todos los estados definidos          | ✓         | catálogo §3.0 + locales por ficha                                       |
| Todos los errores documentados       | ✓         | por ficha + E-01..E-08 del PRD                                          |
| Toda la navegación definida          | ✓         | §5 matriz + por ficha                                                   |
| Todas las dependencias identificadas | ✓         | §4, §8                                                                  |
| Todos los permisos documentados      | ✓         | por ficha + §8                                                          |
| Todos los casos límite identificados | ✓         | QA por ficha                                                            |
| Sin contradicciones                  | ⚠ Parcial | 3 gaps bloqueantes (G-1/2/3) documentados, no resueltos unilateralmente |

**Veredicto:** listo para iniciar wireframes de **13 de 16 pantallas** sin ambigüedad. SC-05 (G-1), SC-01-búsqueda (G-2) y SC-08/09-código (G-3) requieren tres decisiones del negocio antes de sus wireframes definitivos. Ninguna bloquea el Design System ni el arranque del frontend en las pantallas restantes.

---

_Fin del documento. Especificación funcional oficial del frontend del MVP. Trazable a Discovery/PRD/UX. Actualizable solo con nueva evidencia o decisiones del negocio sobre los gaps._
