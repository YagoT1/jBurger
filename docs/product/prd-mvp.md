# jBurger — PRD del MVP (Product Requirements Document)

**Versión 1.0 — 2026-07-22.** Contrato funcional entre Producto, UX, Diseño, Backend y Frontend. Fundado en el Product Discovery v1.0 (fuente de verdad estratégica) y en las decisiones de negocio aprobadas por el propietario el 2026-07-22. No redescubre el negocio; lo especifica.

**Convenciones:** RF-xxx = requisito funcional · RN-xxx = regla de negocio · US-xxx = historia de usuario · P0/P1/P2/P3 = prioridad (P0 = sin esto no hay MVP). "Backend: existente" = implementado y verificado en el repositorio; "Backend: NUEVO" = requiere cambio, justificado en §17.

---

## 1. Executive Summary

**Propósito.** Darle a jBurger su primer canal de pedidos online propio: que un cliente de Roque Pérez vea el menú real, arme su pedido, pague (Mercado Pago o efectivo) y siga su estado, sin intermediarios ni WhatsApp.

**Objetivo del MVP.** Un cliente completa un pedido de punta a punta desde el celular en menos de 3 minutos, y el negocio lo opera (confirmar, preparar, entregar) desde el mismo sistema.

**Problema que resuelve.** Hoy los pedidos son manuales (mostrador/mensajería): sin registro estructurado, sin cobro online, sin trazabilidad, y con un backend ya construido que ningún cliente puede usar por falta de frontend.

**Alcance en una frase.** Catálogo real (34 productos, 8 categorías, con imagen), carrito con medallón extra, checkout como invitado o registrado, pago MP o efectivo, pickup o delivery en Roque Pérez (18:00–23:00, envío parametrizado), seguimiento de estados, y administración de catálogo y pedidos para el negocio.

## 2. Product Vision

**Propósito:** ser el mostrador digital de jBurger — no un marketplace, no un ecommerce genérico.
**Visión:** pedirle a jBurger desde el celular se siente como pedirle al mostrador de siempre, sin fila.
**Principios (heredados del Discovery y del proyecto):** simplicidad > completitud; mobile-first; identidad de dos tintas del menú como lenguaje visual; mínima fricción (invitado permitido, registro opcional); el precio mostrado es compromiso solo en el checkout (Cart ≠ Order); server-authoritative en todo lo financiero.
**Objetivos del producto (MVP):** (1) primer pedido online real completado por un cliente; (2) el 100 % de los pedidos online visibles y operables por el staff; (3) cero cobros incorrectos (extras incluidos en el total).
**Métricas de éxito:** ver §13.

## 3. Alcance del MVP

### Incluye

1. Catálogo público navegable por categoría con imagen, descripción, precio y disponibilidad por sucursal.
2. Detalle de producto con modificador "medallón extra" (hamburguesas) y elección de la Cajita Feliz.
3. Carrito persistente con edición, notas por ítem y preview de total.
4. Checkout como **invitado** (nombre + teléfono) o autenticado; registro opcional con email/contraseña.
5. Fulfillment: retiro en local o delivery en Roque Pérez con costo de envío parametrizado.
6. Pago: Mercado Pago (Checkout Pro) o efectivo al recibir/retirar.
7. Aviso de verificación de identidad (DNI) cuando el carrito contiene alcohol.
8. Seguimiento del pedido por estados; historial para usuarios registrados.
9. Cancelación por el cliente en estados permitidos.
10. Ventana horaria de pedidos 18:00–23:00, parametrizada.
11. Administración (staff): catálogo (CRUD + disponibilidad + precio por sucursal), pedidos (listar, confirmar, transicionar, cancelar), parámetros operativos (horario, zona, costo de envío).

### No incluye (documentado como futuro, §14 P3)

Programa de puntos · imágenes/reseñas de clientes · favoritos · combos comerciales · cupones · notificaciones push · multi-sucursal · reservas · panel de cocina avanzado · reembolsos self-service · propinas · programación de pedidos para más tarde · seguimiento GPS del repartidor · edición de pedidos post-checkout.

**Zona gris cerrada explícitamente:** recuperación de contraseña **queda dentro** del MVP solo en su variante mínima (email de reset vía Supabase Auth); cualquier flujo custom queda fuera.

## 4. Roles

| Rol                          | Quién es             | Permisos (vocabulario existente)                                    | Acciones en el MVP                                                                                                                                            |
| ---------------------------- | -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente invitado**         | Comprador sin cuenta | ninguno (sesión anónima)                                            | navegar, armar carrito, checkout con nombre+teléfono, pagar, seguir su pedido por enlace/código                                                               |
| **Cliente registrado**       | Comprador con cuenta | autenticado sin permisos de staff                                   | todo lo del invitado + historial, repetir datos, cancelar desde su cuenta                                                                                     |
| **Administrador** (OWNER)    | Dueño                | todos (`catalog.*`, `orders.*`, `payments.*`, `users.*`, `roles.*`) | catálogo completo, parámetros operativos, pedidos, precios, disponibilidad                                                                                    |
| **Empleado** (CAJERO/COCINA) | Staff del local      | `orders.read`, `orders.write`, `payments.read`                      | ver pedidos de la sucursal, confirmar (efectivo), pasar a preparación/entregado, cancelar con motivo                                                          |
| **Repartidor**               | Entrega a domicilio  | —                                                                   | **Sin interfaz propia en el MVP.** Opera con la información que le da el staff. El rol existe en seeds para el futuro; cualquier pantalla de repartidor es P3 |

## 5. Requisitos funcionales

> Formato: descripción · prioridad · justificación · criterio de aceptación (CA). La trazabilidad completa (endpoint, backend nuevo/existente) está en §17.

**Catálogo**

- **RF-001** Listar el menú por categorías con nombre, descripción, precio vigente e imagen. P0. Justif.: núcleo de la propuesta. CA: las 8 categorías y 34 productos reales se muestran con su precio por sucursal; un producto no disponible aparece marcado o oculto según RN-020.
- **RF-002** Ver el detalle de un producto con descripción completa de ingredientes. P0. Justif.: el menú real vende por descriptores. CA: todo texto del menú oficial es visible antes de agregar.
- **RF-003** Reflejar disponibilidad y precio por sucursal en tiempo de consulta. P0. Justif.: ya es contrato del backend. CA: cambiar disponibilidad desde admin se refleja en la siguiente carga del menú.

**Modificadores**

- **RF-010** Permitir agregar N medallones extra a cualquier producto de la categoría Hamburguesas, con precio unitario parametrizado (inicial $3.300) sumado al ítem. P0. Justif.: único modificador con precio del menú real; sin él, el total cobrado es incorrecto. CA: ítem con 2 medallones extra suma exactamente 2×precio_extra; el extra viaja al snapshot del pedido y al ticket.
- **RF-011** Cajita Feliz: elección obligatoria entre "hamburguesa cheddar" y "nuggets" antes de agregar al carrito; papas pequeñas y juguete incluidos e informados. P0. Justif.: decisión aprobada. CA: no puede agregarse una Cajita sin elección; la elección viaja al pedido y es visible por cocina.
- **RF-012** Notas de texto libre por ítem (ya soportadas). P1. Justif.: personalizaciones sin precio ("sin tomate"). CA: la nota llega al detalle del pedido.

**Carrito**

- **RF-020** Carrito persistente para invitados (local) y registrados (server), con alta/edición/quita/vaciado. P0. CA: recargar la página no pierde el carrito.
- **RF-021** Merge automático del carrito invitado al iniciar sesión (regla existente del backend). P1. CA: iniciar sesión con carrito local produce un único carrito fusionado con reporte de ajustes.
- **RF-022** Preview de total no vinculante con subtotales por ítem, extras y costo de envío estimado si es delivery. P0. CA: el desglose iguala al del checkout salvo cambio de precio (RN-031).

**Identidad y acceso**

- **RF-030** Checkout como invitado con nombre y teléfono obligatorios. P0. Justif.: decisión aprobada; mínima fricción. CA: un pedido de invitado queda asociado a esos datos y es consultable por su enlace/código de seguimiento.
- **RF-031** Registro opcional con email y contraseña; login; logout; reset de contraseña por email. P1. Justif.: habilita historial y recompra; decisión aprobada como opcional. CA: un usuario puede registrarse solo, sin intervención del negocio.
- **RF-032** Historial de pedidos y detalle para registrados. P1. CA: lista ordenada por fecha con estado actual.

**Checkout y fulfillment**

- **RF-040** Selección de fulfillment: retiro en local o delivery. P0. CA: delivery exige dirección dentro de la zona (RN-041); retiro no pide dirección.
- **RF-041** Cobro de envío parametrizado sumado al total solo en delivery (inicial $2.000). P0. CA: el total del pedido persiste envío como línea separada del snapshot.
- **RF-042** Checkout idempotente con revalidación canónica de precios: si el total cambió, se informa y se pide re-confirmación (RN-031). P0. CA: doble tap/reintento no duplica pedidos (contrato existente OT-2).
- **RF-043** Bloqueo de checkout fuera de la ventana horaria con mensaje claro; el menú sigue navegable. P0. CA: a las 23:01 no se puede confirmar un pedido; a las 18:00 sí.

**Pago**

- **RF-050** Pago con Mercado Pago (Checkout Pro): redirect, y confirmación automática del pedido al aprobarse (contrato existente). P0. CA: pago aprobado ⇒ pedido `confirmado` sin acción del staff; rechazado ⇒ pedido sigue `borrador` con opción de reintentar o cambiar a efectivo.
- **RF-051** Pago en efectivo: el pedido queda `borrador` hasta aceptación explícita del staff (que lo confirma); el cobro ocurre al entregar/retirar. P0. Justif.: decisión aprobada; mitiga pedidos falsos (RN-052). CA: un pedido efectivo aparece para el staff como "pendiente de aceptación" y pasa a `confirmado` solo por acción del staff.
- **RF-052** Estado del pago visible en el detalle del pedido. P1. CA: refleja `pendiente/aprobado/rechazado` reales.

**Alcohol**

- **RF-060** Si el carrito contiene productos de la categoría Bebidas con alcohol, mostrar aviso antes de confirmar: "podrá requerirse DNI al momento de la entrega/retiro". P0. Justif.: decisión aprobada; no se implementa validación legal adicional. CA: el aviso aparece siempre que haya alcohol y queda aceptado junto con la confirmación.

**Seguimiento y cancelación**

- **RF-070** Seguimiento del pedido por estados (borrador→confirmado→preparación→entregado / cancelado), accesible sin cuenta mediante enlace/código. P0. CA: el estado mostrado corresponde al de la API en la última consulta; se actualiza al refrescar o por polling.
- **RF-071** Cancelación por el cliente solo en `borrador` o `confirmado`, con motivo opcional (regla existente). P1. CA: en `preparación` la opción no se ofrece y la API la rechaza (422).

**Administración**

- **RF-080** CRUD de categorías y productos, disponibilidad y precio por sucursal, imagen por producto. P0 (es prerequisito de contenido). CA: el dueño puede despublicar un producto y desaparece del menú público.
- **RF-081** Bandeja de pedidos del staff filtrable por estado, con transiciones y cancelación con motivo. P0. CA: cada transición queda auditada (evento existente).
- **RF-082** Edición de parámetros operativos: ventana horaria, costo de envío, precio del medallón extra, zona (texto). P1. CA: el cambio rige sin redeploy.

## 6. Reglas de negocio

**Carrito y precios**

- RN-030: el carrito nunca persiste precios; todo precio mostrado es preview (arquitectura existente).
- RN-031: el precio se vuelve compromiso en el checkout; si difiere del preview, el sistema responde `PRICE_CHANGED` y la UI muestra el total nuevo pidiendo re-confirmación. Nunca se cobra un total no confirmado por el cliente.
- RN-032: cantidad por ítem 1–20 (parametrizado, existente).
- RN-033: un ítem cuyo producto fue despublicado se reporta como `removed` y se excluye del total (existente).

**Modificadores**

- RN-010: medallón extra aplica a la categoría Hamburguesas; precio parametrizado; máximo por ítem parametrizado (inicial: 3). **Pendiente de aclaración del negocio:** ¿aplica a Veggies (medallón veggie) y Pollo? Hasta respuesta: NO aplica fuera de Hamburguesas.
- RN-011: la Cajita Feliz exige la elección burger/nuggets; sin diferencia de precio. **Pendiente:** ¿el juguete se elige al pedir (lista) o en la entrega? Hasta respuesta: se informa "juguete sorpresa/a elección en el local" y no se selecciona en la app.

**Pagos**

- RN-050: el monto a cobrar se toma siempre del pedido persistido, nunca del cliente (existente).
- RN-051: MP aprobado confirma el pedido atómicamente (existente). Un pedido con pago aprobado no admite segundo pago.
- RN-052: efectivo no confirma automáticamente: requiere aceptación del staff. Un pedido efectivo no aceptado en X minutos (parámetro, inicial 15) puede cancelarse por el staff con motivo "sin aceptación".
- RN-053: si el pago MP es rechazado o el cliente abandona el redirect, el pedido permanece `borrador` y puede reintentar pago o cambiar a efectivo mientras la ventana horaria siga abierta.

**Delivery y horario**

- RN-040: ventana de pedidos 18:00–23:00 (parametrizada, zona horaria AR). Fuera de ella: navegación sí, checkout no.
- RN-041: zona de cobertura = Roque Pérez (validación MVP: declarativa — la dirección es texto + referencia; sin geocoding). Costo $2.000 parametrizado, línea separada del total.
- RN-042: retiro en local sin costo adicional.

**Alcohol**

- RN-060: presencia de alcohol ⇒ aviso obligatorio de posible verificación de DNI (RF-060). No se implementa ninguna otra validación hasta definición legal del negocio.

**Pedidos y cancelaciones**

- RN-070: máquina de estados existente: `borrador→{confirmado,cancelado}`, `confirmado→{preparacion,cancelado}`, `preparacion→entregado`; terminales `entregado`/`cancelado`.
- RN-071: cliente cancela solo en `borrador`/`confirmado`; staff cancela según máquina de estados; siempre con auditoría.
- RN-072: cancelar no restaura el carrito (existente, documentado).

**Disponibilidad y stock**

- RN-020: disponibilidad es un interruptor por producto+sucursal con override de precio (existente). **No hay stock numérico en el MVP** — el menú real no lo exige; agotado = despublicar.

## 7. Modelo funcional (comportamiento de punta a punta)

```
Menú (categorías → productos, disponibilidad/precio por sucursal)
  ↓ ver
Detalle (descriptores del menú oficial, imagen)
  ↓ personalizar
Modificadores (medallón extra ×N si Hamburguesas · elección Cajita · notas)
  ↓ agregar
Carrito (preview no vinculante, editar/quitar, persistencia invitado o server)
  ↓ iniciar checkout (dentro de ventana horaria)
Identidad (invitado: nombre+teléfono · o login/registro opcional)
  ↓
Fulfillment (retiro | delivery→dirección en zona, +envío parametrizado)
  ↓  (si hay alcohol: aviso DNI)
Confirmación de total (revalidación canónica; PRICE_CHANGED ⇒ re-confirmar)
  ↓ elegir pago
 ├─ Mercado Pago → redirect → aprobado ⇒ pedido CONFIRMADO (webhook, atómico)
 │                          → rechazado/abandono ⇒ sigue BORRADOR (reintentar/efectivo)
 └─ Efectivo → pedido BORRADOR "pendiente de aceptación" → staff acepta ⇒ CONFIRMADO
  ↓
Seguimiento (código/enlace; estados en vivo por consulta) → PREPARACIÓN → ENTREGADO
Cancelación cliente: solo BORRADOR/CONFIRMADO.
```

## 8. User Stories (selección normativa; todas con CA)

- **US-01 (P0)** Como vecino con hambre, quiero ver el menú con precios reales sin registrarme, para decidir rápido. CA: menú completo accesible sin cuenta ni datos.
- **US-02 (P0)** Como fan de las burgers grandes, quiero agregarle medallones extra a mi LEBRON y ver cuánto suma, para no llevarme sorpresas. CA: el precio del ítem se actualiza en pantalla al sumar extras y coincide con el cobrado.
- **US-03 (P0)** Como padre/madre, quiero elegir si la Cajita viene con burger o nuggets, para que mi hijo coma lo que le gusta. CA: la elección es obligatoria y llega a cocina.
- **US-04 (P0)** Como cliente nuevo, quiero pedir como invitado con mi nombre y teléfono, para no crear otra cuenta más. CA: pedido completo sin registro; recibo código/enlace de seguimiento.
- **US-05 (P0)** Como cliente, quiero pagar con Mercado Pago o elegir efectivo, para pagar como me convenga. CA: ambas opciones visibles; MP confirma solo; efectivo queda pendiente de aceptación.
- **US-06 (P0)** Como cliente de delivery, quiero saber el costo de envío antes de confirmar, para conocer el total final. CA: envío como línea separada visible antes del pago.
- **US-07 (P0)** Como cliente, quiero seguir el estado de mi pedido, para saber cuándo salir a buscarlo o esperarlo. CA: estados reales visibles vía enlace sin login.
- **US-08 (P1)** Como cliente frecuente, quiero registrarme y ver mi historial, para repetir sin recargar todo. CA: registro autónomo; historial con detalle.
- **US-09 (P0)** Como dueño, quiero despublicar un producto agotado desde el celular, para no recibir pedidos imposibles. CA: efecto inmediato en el menú público.
- **US-10 (P0)** Como cajero, quiero ver los pedidos en efectivo pendientes y aceptarlos, para que la cocina arranque solo con pedidos reales. CA: bandeja filtrada; aceptar ⇒ `confirmado` auditado.
- **US-11 (P1)** Como cliente, quiero cancelar si todavía no empezaron a prepararlo, para no pagar algo que ya no quiero. CA: opción visible solo en estados permitidos.
- **US-12 (P0)** Como comprador de cerveza, quiero saber de antemano que pueden pedirme el DNI, para no llevarme una sorpresa en la puerta. CA: aviso presente siempre que haya alcohol.

## 9. Casos de uso (formales, resumidos)

| CU                       | Actor    | Precondición               | Flujo principal                  | Postcondición                                            | Excepciones                                                            |
| ------------------------ | -------- | -------------------------- | -------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| CU-01 Comprar            | Cliente  | Ventana horaria abierta    | §7 completo                      | Pedido `confirmado` con pago aprobado o aceptación staff | E-01..E-06 (§11)                                                       |
| CU-02 Agregar producto   | Cliente  | Producto disponible        | detalle→modificadores→carrito    | Ítem en carrito versionado                               | producto agotado (E-01); conflicto de versión → reintento transparente |
| CU-03 Modificar carrito  | Cliente  | Carrito activo             | editar cantidad/quitar/vaciar    | Carrito actualizado                                      | versión obsoleta ⇒ recarga y reaplica                                  |
| CU-04 Checkout           | Cliente  | Carrito válido, horario    | identidad→fulfillment→total→pago | Pedido `borrador`                                        | E-02, E-03, E-04                                                       |
| CU-05 Pagar MP           | Cliente  | Pedido `borrador`          | redirect→aprueba→webhook         | Pedido `confirmado`                                      | E-05                                                                   |
| CU-06 Aceptar efectivo   | Empleado | Pedido efectivo `borrador` | bandeja→aceptar                  | `confirmado`                                             | timeout RN-052                                                         |
| CU-07 Seguir pedido      | Cliente  | Pedido existente           | enlace/código→estado             | —                                                        | pedido inexistente ⇒ mensaje neutro                                    |
| CU-08 Cancelar (cliente) | Cliente  | Estado permitido           | cancelar+motivo                  | `cancelado` auditado                                     | estado avanzado ⇒ 422 explicado                                        |
| CU-09 Operar pedido      | Empleado | `confirmado`/`preparacion` | transición                       | Estado siguiente auditado                                | carrera ⇒ conflicto y recarga                                          |
| CU-10 Gestionar catálogo | Admin    | permiso                    | CRUD/disponibilidad/precio       | Menú actualizado                                         | validaciones de datos                                                  |

## 10. Estados del sistema

**Pedido:** `borrador → confirmado → preparacion → entregado`; `borrador|confirmado → cancelado`. Terminales: `entregado`, `cancelado`. (Existente; fuente única en dominio.)
**Pago (MP):** `pendiente → aprobado | rechazado | expirado`; `aprobado → reembolsado` (reembolso operativo P3). `aprobado` dispara `borrador→confirmado` atómico. **Efectivo:** sin entidad de pago online; el estado de cobro es implícito al flujo (cobra el local al entregar).
**Carrito:** `active → converted` (checkout) `| expired | abandoned` (jobs futuros; en MVP solo `active/converted`).
**Checkout (sesión de UI):** `armando → identificado → fulfillment → total_confirmado → pago_en_curso → finalizado|abandonado`. Un checkout abandonado con pedido creado deja el pedido `borrador` (RN-053).
**Disponibilidad:** por producto+sucursal `disponible | no_disponible` con `precioOverride` opcional. `producto.activo=false` lo retira del catálogo completo.

## 11. Errores esperados y reacción del sistema

| #    | Situación                                               | Reacción obligatoria                                                                                                                      |
| ---- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| E-01 | Producto agotado/despublicado con el ítem en el carrito | El ítem se marca no disponible, se excluye del total y se ofrece quitarlo; el checkout se bloquea hasta resolverlo (`CART_INVALID_ITEMS`) |
| E-02 | Precio actualizado entre carrito y checkout             | Mostrar total nuevo con diferencia visible y pedir re-confirmación; nunca cobrar sin re-confirmar (`PRICE_CHANGED`)                       |
| E-03 | Fuera de horario                                        | Checkout deshabilitado con mensaje de ventana ("Pedidos de 18:00 a 23:00"); menú navegable                                                |
| E-04 | Dirección fuera de zona                                 | Mensaje claro al ingresar la dirección; ofrecer retiro en local                                                                           |
| E-05 | Pago rechazado / abandono del redirect                  | Pedido sigue `borrador`; ofrecer reintentar MP o cambiar a efectivo; sin duplicar pedido (idempotencia)                                   |
| E-06 | Conexión perdida / doble envío                          | Reintentos idempotentes (clave por checkout/pago); al recuperar conexión, el estado real se re-consulta antes de permitir acciones        |
| E-07 | Conflicto de carrito concurrente (dos pestañas)         | Recargar versión y reaplicar la acción; informar solo si el resultado difiere                                                             |
| E-08 | Webhook demorado (pagó pero sigue "borrador")           | Pantalla post-pago consulta el estado con reintentos y mensaje "confirmando tu pago"; nunca afirma éxito sin confirmación del backend     |

## 12. Requisitos no funcionales

- **Rendimiento:** menú interactivo < 2 s en 4G; acciones de carrito < 500 ms percibidos (optimista + reconciliación); imágenes optimizadas (peso máx. definido en design system).
- **Seguridad:** todo lo financiero server-authoritative (existente); tokens en almacenamiento seguro con refresh (contrato existente); webhooks firmados (existente); sin PII en URLs salvo el código de seguimiento no enumerable; guards de permisos en todo endpoint de staff (existente).
- **Accesibilidad:** WCAG 2.1 AA como objetivo: contraste del azul de marca verificado, foco visible, formularios etiquetados, navegación por teclado, `lang="es"`.
- **Responsive / mobile-first:** diseño para 360 px primero; desktop es adaptación, no origen.
- **Disponibilidad:** la del stack (Supabase + hosting); sin SLA formal en MVP; el menú debe degradar con mensaje claro si la API no responde.
- **Mantenibilidad:** parámetros operativos (horario, envío, extra, zona, timeout efectivo) editables sin deploy; el pipeline `pnpm validate` sigue siendo gate de todo cambio.

## 13. KPIs del MVP

| KPI                 | Definición                                           | Objetivo inicial                                  |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Conversión          | pedidos confirmados / sesiones con carrito           | ≥ 25 % (baseline a medir)                         |
| Abandono de carrito | carritos con ítems sin checkout / carritos con ítems | ≤ 60 %                                            |
| Tiempo de compra    | menú→pedido confirmado (mediana)                     | ≤ 3 min                                           |
| Ticket promedio     | total / pedidos                                      | ≥ ticket de mostrador (dato del dueño, pendiente) |
| Éxito de pago MP    | aprobados / intentos                                 | ≥ 85 %                                            |
| Adopción de extras  | pedidos con medallón extra / pedidos con burgers     | medir (sin objetivo)                              |
| Efectivo vs MP      | mix de métodos                                       | medir (informa decisiones futuras)                |
| Aceptación efectivo | aceptados / solicitados en < RN-052                  | ≥ 95 %                                            |

_Instrumentación mínima: eventos de dominio ya auditados + analítica de frontend a definir en UX Strategy._

## 14. Backlog priorizado

- **P0 (sin esto no hay MVP):** RF-001..003, 010, 011, 020, 022, 030, 040..043, 050, 051, 060, 070, 080, 081 · retiro de stubs users/roles (defecto B1/B2) · carga del catálogo real con imágenes.
- **P1:** RF-012, 021, 031, 032, 052, 071, 082 · "repetir pedido" · polling de estado refinado.
- **P2:** upsell papas+bebida en checkout · reporte simple de ventas para el dueño · mensajes de marca en estados vacíos.
- **P3 (futuro declarado):** puntos, favoritos, combos, cupones, push, multi-sucursal, reservas, panel cocina avanzado, reembolsos, propinas, GPS, imágenes de clientes, pedidos programados, app repartidor.

## 15. Dependencias

**Decisiones pendientes del negocio:** RN-010 (extra en veggies/pollo) · RN-011 (elección del juguete) · confirmación de credenciales MP sandbox y URL pública de webhook (ya documentado) · ticket promedio actual (para KPI) · material de Instagram para el design system (no bloquea este PRD).
**Técnicas:** los cambios de backend de §17 preceden a sus pantallas; catálogo real cargado precede a toda demo; hosting/dominio para el redirect de MP y el webhook.
**Operativas:** fotos de 34 productos (workstream del dueño); definición del texto legal del aviso de alcohol; capacitación mínima del staff en la bandeja de pedidos.

## 16. Riesgos y mitigaciones

| Riesgo                                                         | Tipo         | Mitigación                                                                                                                   |
| -------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Pedidos en efectivo falsos                                     | Operativo    | RN-052 (aceptación staff + timeout); teléfono obligatorio del invitado                                                       |
| Abandono en redirect MP                                        | Comercial/UX | E-05/E-08: reintento y cambio a efectivo sin rehacer el pedido                                                               |
| Extras mal cobrados si se implementa la UI antes que el modelo | Técnico      | §17: RF-010/011 marcados "backend NUEVO" y son prerequisito de la pantalla de detalle                                        |
| Invitado sin cuenta pierde el enlace de seguimiento            | UX           | código corto re-consultable por teléfono en el local; historial solo registrado                                              |
| Contenido (fotos) demora el lanzamiento                        | Operativo    | workstream paralelo con fecha; lanzar con placeholder de marca está PROHIBIDO por identidad — decisión consciente de bloqueo |
| Ventana horaria hardcodeada por apuro                          | Técnico      | RF-082/RN-040 exigen parámetro desde el día uno                                                                              |
| Cambios de precio frecuentes (inflación)                       | Comercial    | RN-031 ya lo resuelve; la UI debe tratar `PRICE_CHANGED` como flujo normal, no como error raro                               |

## 17. Trazabilidad (requisito → negocio → backend)

| RF           | Necesidad                   | Regla              | Historia  | Backend                                                                                                                                                           |
| ------------ | --------------------------- | ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001–003      | Ver el menú real            | RN-020             | US-01     | **Existente:** `GET /menu`, catálogo CRUD; `imagenUrl` ya modelado. Falta solo contenido                                                                          |
| 010          | Cobrar el extra real        | RN-010             | US-02     | **NUEVO:** extras con precio en `cart_items`/`order_items` + pricing + snapshot (decisión 12.1 del Discovery, alcance mínimo)                                     |
| 011          | Cajita fiel al menú         | RN-011             | US-03     | **NUEVO:** variante simple por producto (mismo cambio de modelo que RF-010, sin precio)                                                                           |
| 012, 020–022 | Armar pedido sin fricción   | RN-030..033        | US-02..04 | **Existente:** `CartModule` completo (CAS, merge, pricing)                                                                                                        |
| 030          | Comprar sin cuenta          | —                  | US-04     | **NUEVO:** checkout invitado (pedido con nombre+teléfono sin `customer_id` de cuenta; hoy los guards exigen usuario autenticado) + código de seguimiento          |
| 031–032      | Registro opcional           | —                  | US-08     | **NUEVO (menor):** endpoint de registro sobre Supabase Auth (el gateway ya existe) + reset por email                                                              |
| 040          | Elegir entrega              | RN-041/042         | US-06     | **Existente:** `fulfillmentType` + `direccionEntrega`                                                                                                             |
| 041          | Total con envío             | RN-041             | US-06     | **NUEVO:** línea de envío en el snapshot del pedido (deuda declarada de ADR-024) + parámetro                                                                      |
| 042          | No pagar de más ni duplicar | RN-031             | US-05     | **Existente:** `POST /orders` idempotente + `PRICE_CHANGED`                                                                                                       |
| 043          | Operar solo en horario      | RN-040             | US-01     | **NUEVO (menor):** parámetro de ventana + validación en checkout                                                                                                  |
| 050          | Pago digital                | RN-050/051         | US-05     | **Existente:** `PaymentsModule` completo (MP + webhook + confirmación atómica)                                                                                    |
| 051          | Pago en efectivo            | RN-052             | US-05/10  | **NUEVO (menor):** método `efectivo` en el checkout (sin entidad de pago online; confirma el staff con el flujo existente `orders.write`) + timeout parametrizado |
| 052          | Transparencia de pago       | RN-051             | US-05     | **Existente:** `GET /orders/:id/payment`                                                                                                                          |
| 060          | Aviso de alcohol            | RN-060             | US-12     | **NUEVO (mínimo):** flag `contieneAlcohol` por categoría/producto (o por categoría fija) para que la UI detecte; el aviso es de frontend                          |
| 070          | Saber cuándo llega          | RN-070             | US-07     | **Existente** (`GET /orders/:id`) + **NUEVO:** acceso por código de invitado                                                                                      |
| 071          | Arrepentirse a tiempo       | RN-071             | US-11     | **Existente:** `POST /orders/:id/cancel`                                                                                                                          |
| 080–081      | Operar el negocio           | RN-020/070         | US-09/10  | **Existente:** catálogo CRUD + bandeja por estado + transiciones                                                                                                  |
| 082          | Parámetros sin deploy       | RN-040/041/010/052 | US-09     | **NUEVO:** entidad de parámetros operativos por tenant + endpoints admin                                                                                          |

**Resumen de cambios de backend que este PRD justifica (y ningún otro):** (1) extras/variante mínimos en carrito-pedido; (2) checkout invitado + código de seguimiento; (3) registro/reset self-service; (4) línea de envío en snapshot; (5) método efectivo; (6) ventana horaria; (7) parámetros operativos; (8) flag de alcohol; (9) retiro de stubs `users`/`roles`. Todo lo demás del MVP se construye sobre la arquitectura actual sin modificarla.

---

**Verificación de calidad (auto-check):** sin contradicciones internas detectadas entre RN-05x y RF-05x (efectivo nunca confirma solo; MP siempre confirma solo); todo RF tiene CA verificable; todos los flujos de §7/§9 tienen fin definido (terminal o excepción); el alcance §3 no deja zonas grises declaradas salvo las 2 aclaraciones pendientes del negocio, explícitamente contenidas (RN-010/RN-011) con comportamiento por defecto definido para no bloquear el desarrollo.
