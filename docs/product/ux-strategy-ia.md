# jBurger — UX Strategy e Information Architecture del MVP

**Versión 1.0 — 2026-07-22.** Arquitectura de la experiencia del MVP. Deriva del Product Discovery v1.0 y del PRD v1.0 (fuentes de verdad). No redefine producto ni reglas. Base directa para Screen Inventory, wireframes, Design System, prototipo y frontend.

**Trazabilidad:** cada decisión cita el requisito (RF-xxx), regla (RN-xxx) o hallazgo del Discovery que la respalda. Nada de estética (color, tipografía, componentes) — fuera de alcance por instrucción.

---

## 1. UX Strategy

### Objetivos de experiencia

1. **Pedir en ≤ 3 minutos desde el celular** (KPI del PRD §13). Todo lo demás se subordina a esto.
2. **Cero sorpresas de precio** — el total que ve el cliente al confirmar es el que paga (RN-031).
3. **Adopción sin barrera de cuenta** — el invitado es ciudadano de primera clase, no un camino degradado (RF-030).
4. **El negocio opera sin fricción** — el staff ve y mueve pedidos de un vistazo (RF-081).

### Principios de diseño (con criterio de aplicación)

- **P1 — El menú es la home.** El vecino ya sabe qué es jBurger; no necesita una landing, necesita el menú. Justif.: Discovery persona "cliente local habitual" pide "la de siempre"; el touchpoint de entrada será un enlace de Instagram directo al catálogo.
- **P2 — El carrito acompaña, no interrumpe.** Agregar un producto no saca al cliente del menú. Justif.: pedidos multi-ítem (persona "grupo del viernes"); minimizar pasos.
- **P3 — El precio siempre presente.** Cada decisión (agregar extra, elegir delivery) muestra su efecto en el total en el acto. Justif.: RN-031, objetivo 2.
- **P4 — Invitado por defecto, cuenta como beneficio.** Nunca se pide registro para avanzar; se ofrece al final como forma de guardar. Justif.: RF-030/031, principio de mínima fricción del PRD.
- **P5 — El sistema es honesto sobre su estado.** Nunca afirma un éxito que el backend no confirmó (pago, pedido). Justif.: E-08 del PRD; contrato de idempotencia.
- **P6 — Recuperable antes que perfecto.** Ante un error, el camino de salida es siempre visible (reintentar, cambiar método, quitar ítem). Justif.: E-01..E-08.

### Principios de interacción

- Optimista con reconciliación: las acciones de carrito responden al instante y se corrigen si el backend difiere (RNF rendimiento < 500 ms percibidos; CAS existente).
- Una decisión por pantalla en el flujo de checkout: identidad → entrega → pago, no todo junto. Justif.: reduce carga cognitiva en la pantalla más crítica.
- Progreso siempre visible en procesos de más de un paso (checkout, post-pago).

### Tono de la experiencia

Directo, en voseo, cálido de pueblo — coherente con el menú ("AGREGÁ", "TU HAMBURGUESA"). Los nombres de las burgers son protagonistas del texto (Discovery §3). El microcopy informa y tranquiliza; no vende con signos de admiración. (El _cómo_ visual es del Design System; aquí solo se fija el registro.)

### Prioridades del usuario (orden de resolución de conflictos)

Cuando dos necesidades compiten, gana la de arriba:

1. Entender qué estoy pidiendo y cuánto sale.
2. Completar el pedido rápido.
3. Saber qué pasa después (estado).
4. Guardar mis datos para la próxima.

### Criterios para resolver conflictos de UX

- **Velocidad vs. control:** para acciones reversibles, velocidad (sin confirmación). Para irreversibles o costosas (pagar, cancelar un pedido confirmado), control (confirmación explícita). Regla operativa en §8.
- **Menos pasos vs. claridad:** nunca fusionar pasos si eso oculta el precio o el método de pago. La claridad del total es innegociable (RN-031).
- **Invitado vs. datos del negocio:** el negocio necesita teléfono para operar; es el único dato obligatorio que se le pide al invitado (RF-030). No se pide nada más "por si acaso".

---

## 2. Information Architecture

Dos árboles separados, sin cruce de navegación entre cliente y administración (roles y guards distintos, PRD §4).

### Árbol Cliente (público + sesión ligera)

```
Menú (raíz / home)
├── Categoría (ancla o sección dentro del menú, no pantalla aparte)
├── Detalle de producto
│     └── Personalización (medallón extra / elección Cajita / notas)
├── Carrito
│     └── Checkout
│            ├── Identidad (invitado: nombre+teléfono | login | registro)
│            ├── Entrega (retiro | delivery→dirección)
│            ├── Revisión + aviso alcohol + confirmación de total
│            └── Pago (Mercado Pago | efectivo)
│                   └── Resultado del pago (post-redirect / confirmación)
├── Seguimiento de pedido (por código/enlace, sin login)
└── Cuenta (solo registrado)
      ├── Historial de pedidos
      └── Detalle de pedido
```

### Árbol Administración (staff autenticado con permisos)

```
Panel (raíz staff)
├── Pedidos
│     ├── Bandeja por estado (incluye "efectivo pendiente de aceptación")
│     └── Detalle de pedido (transiciones + cancelar con motivo)
├── Catálogo
│     ├── Productos (CRUD + imagen + activo)
│     ├── Categorías (CRUD)
│     └── Disponibilidad y precio por sucursal
└── Parámetros operativos (horario, costo de envío, precio del extra, zona, timeout efectivo)
```

### Jerarquía y relaciones

- **Menú es la raíz del cliente** (P1): todo camino de compra nace ahí. Categoría es organización _dentro_ del menú, no un nivel de navegación aparte — evita un tap extra (34 productos, 8 categorías caben en scroll con anclas).
- **Detalle → Personalización** es una relación de contención, no una pantalla nueva salvo que la complejidad lo exija (decisión diferida a wireframes; la responsabilidad está definida en §5).
- **Seguimiento vive fuera de Cuenta**: es accesible sin login (RF-070) porque el invitado no tiene cuenta. Cuenta lo _reagrupa_ para el registrado, no lo _encierra_.
- **Administración es un producto aparte** que comparte backend: el mismo dominio, distinta superficie. No hay enlace de la app cliente al panel.

---

## 3. Navigation Model

### Cliente

- **Navegación principal (persistente, mobile):** Menú · Carrito (con contador) · Seguimiento/Cuenta. Tres destinos, no más — regla de mínima fricción. El Carrito es persistente porque es el objetivo; su contador es el feedback de P2.
- **Navegación secundaria:** categorías dentro del Menú (anclas/tabs de scroll), no un nivel jerárquico.
- **Navegación contextual:** dentro del detalle → "agregar y volver al menú" (P2); dentro del checkout → progreso lineal con "volver" habilitado hasta el pago (§8).
- **Puntos de entrada:** (1) enlace de Instagram → Menú (entrada dominante, Discovery); (2) enlace/código de seguimiento → Seguimiento (post-compra, posiblemente desde otro dispositivo); (3) login → Cuenta (registrado recurrente).
- **Puntos de salida:** redirect a Mercado Pago (salida temporal, retorna a Resultado del pago); fin de compra (Seguimiento); abandono (el carrito persiste, P4).

**Por qué minimiza fricción:** el 90 % de las sesiones son Menú→Carrito→Checkout en una sola dirección; la barra de 3 destinos cubre ese eje sin submenús. La categoría como ancla ahorra el patrón "categoría→lista→producto" (dos taps) reemplazándolo por "scroll→producto" (cero taps de navegación).

### Administración

- **Navegación principal:** Pedidos · Catálogo · Parámetros. Pedidos primero: es la tarea de alta frecuencia (cada servicio), Catálogo es media, Parámetros es rara.
- **Navegación administrativa contextual:** dentro de un pedido, las transiciones disponibles dependen del estado (RN-070) — la UI solo ofrece transiciones legales.
- **Entrada:** login staff. **Salida:** logout; sin puentes al árbol cliente.

---

## 4. User Flows

> Notación: `→` paso · `◇` decisión · `⚠` excepción · `⊡` estado del sistema · `✓` resultado. Todo flujo tiene inicio y fin.

**F-01 Explorar menú.** Inicio: entrada a Menú. → cargar menú por sucursal ⊡(carga→contenido | vacío | error) → scroll por categorías → ◇ ¿toca un producto? → Detalle (F-03). ✓ cliente con producto en vista. ⚠ API caída → estado error con reintento (menú es la raíz: si falla, se ofrece reintentar, no se deja pantalla muerta).

**F-02 Buscar producto.** Inicio: Menú. **Decisión de alcance:** con 34 productos en 8 categorías, la búsqueda textual **no es P0** — el scroll con anclas de categoría resuelve el hallazgo. Búsqueda queda P2 (backlog PRD). Este flujo se documenta como _filtrado por categoría_ (anclas), no como buscador. ✓ cliente ubica su producto por categoría. _(No contradice el PRD: el PRD no lista búsqueda como RF; se registra la ausencia como decisión consciente.)_

**F-03 Ver detalle.** Inicio: tap en producto. → mostrar descriptores + precio + imagen ⊡(carga | error) → ◇ ¿es Hamburguesa? sí→ ofrecer medallón extra (F-04) · ◇ ¿es Cajita? sí→ exigir elección burger/nuggets (RF-011) → notas opcionales. ✓ producto configurado listo para agregar. ⚠ producto pasó a no disponible mientras se miraba → bloquear "agregar" con aviso (E-01).

**F-04 Agregar modificadores.** Inicio: en Detalle, Hamburguesa. → ◇ ¿suma medallón? → ajustar cantidad (0..máx RN-010) → el precio del ítem se recalcula en pantalla (P3, RF-010) → agregar al carrito ⊡(optimista→confirmado | conflicto→reintento). ✓ ítem con extras en carrito, total actualizado. ⚠ excede máximo → control deshabilita el "+".

**F-05 Comprar como invitado.** Inicio: Carrito con ítems. → checkout → ◇ identidad = invitado → pedir nombre+teléfono (únicos obligatorios, RF-030) → Entrega (F-16/17) → Revisión → Pago (F-08/09) → ✓ pedido creado + código de seguimiento mostrado y reenviable. ⚠ fuera de horario → F-14 antes de permitir avanzar.

**F-06 Comprar con cuenta.** Inicio: Carrito. → checkout → ◇ identidad = login → autenticar → merge del carrito invitado (RF-021, ⊡ reporte de ajustes si hubo) → Entrega → Revisión → Pago → ✓ pedido asociado a la cuenta + aparece en Historial. ⚠ credenciales inválidas → error recuperable, no expulsa del checkout.

**F-07 Checkout (troncal).** Inicio: intención de comprar con carrito válido y horario abierto. → Identidad ◇(invitado|login|registro) → Entrega ◇(retiro|delivery) → Revisión: desglose (ítems, extras, envío si aplica) + aviso alcohol si aplica (F-15) → confirmar total ⊡(revalidación: ok | PRICE_CHANGED→F-13) → elegir método → Pago. ✓ pedido `borrador` con método elegido. ⚠ carrito con ítem inválido → E-01 bloquea hasta resolver.

**F-08 Pago Mercado Pago.** Inicio: método = MP sobre pedido `borrador`. → redirect a MP (⊡ pago_en_curso; salida temporal de la app) → ◇ resultado: aprobado → webhook confirma → ⊡ "confirmando tu pago" hasta que el backend lo refleje (E-08, P5) → ✓ pedido `confirmado`, va a Seguimiento. ⚠ rechazado/abandono → pedido sigue `borrador` → ofrecer reintentar MP o cambiar a efectivo (E-05), sin recrear el pedido (idempotencia).

**F-09 Pago en efectivo.** Inicio: método = efectivo sobre pedido `borrador`. → confirmar → ⊡ pedido `borrador` "pendiente de aceptación" (RN-052) → ✓ cliente ve "esperando confirmación del local" con su código. ⚠ no aceptado en timeout (RN-052) → el staff puede cancelar; el cliente ve `cancelado` con motivo. _Nota: el cliente NO ve "confirmado" hasta que el staff acepta (P5)._

**F-10 Seguimiento.** Inicio: código/enlace (con o sin login). → mostrar estado actual ⊡(borrador/pendiente | confirmado | preparación | entregado | cancelado) → refresco por consulta/polling. ✓ cliente informado. ⚠ código inexistente → mensaje neutro sin filtrar existencia.

**F-11 Cancelación (cliente).** Inicio: Seguimiento/Detalle, estado ∈ {borrador, confirmado} (RN-071). → ◇ confirmar cancelación (control, acción costosa) → motivo opcional → ⊡ `cancelado`. ✓ pedido cancelado, auditado. ⚠ estado avanzó a preparación entre vista y acción → 422 explicado ("ya lo estamos preparando"), opción desaparece.

**F-12 Producto agotado.** Disparadores: en Detalle (F-03 ⚠), en Carrito (ítem `removed`), en Checkout (E-01). Reacción única y consistente: marcar no disponible, excluir del total, ofrecer quitar; el checkout no avanza con ítems inválidos. ✓ carrito válido o cliente informado.

**F-13 Precio actualizado.** Inicio: revalidación en checkout devuelve PRICE_CHANGED (RN-031). → mostrar total anterior vs nuevo con la diferencia → ◇ ¿acepta el nuevo total? sí→ continúa a pago · no→ vuelve al carrito. ✓ nunca se cobra sin re-confirmar. _(Tratar como flujo normal, no como error alarmante — riesgo UX §10.)_

**F-14 Fuera de horario.** Inicio: intento de checkout fuera de 18:00–23:00 (RN-040). → menú y carrito siguen navegables → checkout deshabilitado con mensaje de ventana ("Pedís de 18 a 23"). ✓ cliente entiende cuándo volver; el carrito persiste (P4). ⚠ la ventana se cierra durante el armado → aviso al intentar confirmar, no bloqueo silencioso.

**F-15 Alcohol.** Inicio: carrito contiene categoría Bebidas con alcohol. → en Revisión, mostrar aviso "podrá requerirse DNI en la entrega/retiro" (RF-060) → aceptación implícita al confirmar. ✓ cliente advertido. Sin validación de edad adicional (RN-060).

**F-16 Delivery.** Inicio: Entrega = delivery. → pedir dirección + referencia (texto, sin geocoding, RN-041) → ◇ ¿declara estar en Roque Pérez? → sumar envío parametrizado como línea separada (RF-041) → continúa. ⚠ fuera de zona (declarativo) → E-04: mensaje + ofrecer retiro. ✓ pedido con dirección y envío.

**F-17 Pickup.** Inicio: Entrega = retiro. → sin dirección, sin envío (RN-042) → continúa a Revisión. ✓ pedido de retiro. _(Camino más corto: es el default sugerido para minimizar pasos si el negocio lo confirma — pendiente, ver §10.)_

---

## 5. Screen Inventory

> Responsabilidad, no diseño. "Datos" cita el endpoint (PRD §17). Estados y errores refieren a §7/§11 del PRD.

### Cliente

**SC-01 Menú (home).** Objetivo: presentar el catálogo y ser puerta de toda compra. Usuario: cualquiera. Muestra: categorías, productos (nombre, precio, imagen, disp.), acceso a carrito. Acciones: explorar, abrir producto, ir al carrito. Datos: `GET /menu`. Estados: carga, contenido, vacío (catálogo sin publicar), error. Errores: API caída. Dependencias: sucursal activa, catálogo cargado.

**SC-02 Detalle de producto.** Objetivo: dar toda la info para decidir y personalizar. Usuario: cualquiera. Muestra: descriptores completos, precio, imagen, opciones (extra/Cajita/notas). Acciones: configurar, agregar al carrito, volver. Datos: `GET /catalog/products/:id`. Estados: carga, contenido, no disponible. Errores: E-01. Dependencias: SC-01.

**SC-03 Carrito.** Objetivo: revisar y ajustar antes de comprar. Usuario: cualquiera. Muestra: ítems con extras y notas, subtotales, total preview, contador. Acciones: editar cantidad, quitar, vaciar, ir a checkout. Datos: `CartModule`. Estados: con ítems, **vacío**, con ítems inválidos (E-01), carga. Errores: conflicto de versión (E-07). Dependencias: SC-01/02.

**SC-04 Checkout — Identidad.** Objetivo: obtener el mínimo dato para operar. Usuario: cualquiera. Muestra: opción invitado (nombre+teléfono) | login | registro. Acciones: elegir camino, autenticar, continuar. Datos: auth existente; registro (backend NUEVO). Estados: carga, error de credenciales. Errores: credenciales inválidas (recuperable). Dependencias: carrito válido, horario abierto.

**SC-05 Checkout — Entrega.** Objetivo: definir retiro o delivery. Muestra: opciones; si delivery, dirección+referencia y costo de envío. Acciones: elegir, ingresar dirección, continuar. Datos: parámetros operativos (envío, zona — backend NUEVO). Estados: retiro, delivery, fuera de zona (E-04). Dependencias: SC-04.

**SC-06 Checkout — Revisión.** Objetivo: mostrar el total definitivo y advertencias antes de pagar. Muestra: desglose completo (ítems, extras, envío), aviso de alcohol si aplica, total. Acciones: confirmar total, volver a editar. Datos: revalidación en `POST /orders`. Estados: ok, PRICE_CHANGED (F-13), fuera de horario (F-14). Errores: E-01, E-02, E-03. Dependencias: SC-05.

**SC-07 Pago.** Objetivo: cobrar o registrar el método. Muestra: MP y efectivo. Acciones: elegir método, ir a MP, confirmar efectivo. Datos: `POST /orders/:id/payment` (MP); método efectivo (backend NUEVO). Estados: en curso, redirect. Errores: E-05. Dependencias: pedido `borrador`.

**SC-08 Resultado del pago.** Objetivo: reflejar honestamente el desenlace. Muestra: confirmando / aprobado / rechazado. Acciones: ir a seguimiento (éxito), reintentar o cambiar a efectivo (fallo). Datos: `GET /orders/:id/payment`, `GET /orders/:id`. Estados: pago pendiente/confirmando (E-08), aprobado, rechazado. Dependencias: SC-07.

**SC-09 Seguimiento.** Objetivo: informar el estado sin requerir cuenta. Usuario: cualquiera con código. Muestra: estado actual del pedido y del pago, resumen. Acciones: refrescar, cancelar si aplica (F-11). Datos: `GET /orders/:id` por código (backend NUEVO: acceso por código). Estados: cada estado del pedido; código inexistente. Dependencias: pedido creado.

**SC-10 Historial (registrado).** Objetivo: reencontrar pedidos pasados. Usuario: registrado. Muestra: lista por fecha con estado. Acciones: abrir detalle, (P2) repetir. Datos: `GET /orders`. Estados: con pedidos, **vacío**, carga. Dependencias: sesión.

**SC-11 Detalle de pedido (registrado).** Objetivo: ver un pedido completo. Muestra: ítems, totales, estado, pago. Acciones: seguir, cancelar si aplica. Datos: `GET /orders/:id`, `/payment`. Estados: por estado. Dependencias: SC-10.

**SC-12 Autenticación (login/registro/reset).** Objetivo: gestionar sesión opcional. Muestra: formularios mínimos. Acciones: login, registrar, pedir reset. Datos: auth existente + registro/reset (backend NUEVO). Estados: carga, error, éxito. Dependencias: ninguna (accesible desde checkout y cuenta).

### Administración

**SA-01 Bandeja de pedidos.** Objetivo: operar el servicio. Usuario: staff. Muestra: pedidos por estado, con "efectivo pendiente de aceptación" destacado. Acciones: filtrar, abrir, aceptar efectivo. Datos: `GET /orders` (staff). Estados: con pedidos por columna/estado, vacío, carga. Dependencias: permisos `orders.read`.

**SA-02 Detalle de pedido (staff).** Objetivo: mover el pedido por su ciclo. Muestra: pedido completo, transiciones legales según estado. Acciones: confirmar/preparación/entregado, cancelar con motivo. Datos: `/orders/:id`, `/status`, `/cancel`. Estados: por estado; conflicto de carrera (E-07). Dependencias: `orders.write`.

**SA-03 Catálogo — productos/categorías.** Objetivo: mantener el menú. Muestra: listas editables. Acciones: crear/editar/despublicar, imagen, precio, disponibilidad. Datos: catálogo CRUD existente. Estados: normal, guardando, error de validación. Dependencias: `catalog.*`.

**SA-04 Parámetros operativos.** Objetivo: ajustar reglas sin deploy. Muestra: horario, envío, precio del extra, zona, timeout efectivo. Acciones: editar y guardar. Datos: parámetros (backend NUEVO). Estados: normal, guardando. Dependencias: OWNER.

**Sin redundancias:** SC-09 (seguimiento público) y SC-11 (detalle registrado) comparten datos pero difieren en usuario y acceso (código vs sesión); no se fusionan porque el invitado no puede acceder a SC-11. SC-04..08 son pasos de un mismo checkout, no pantallas independientes duplicadas: cada una tiene una única responsabilidad (una decisión por pantalla, §1).

---

## 6. Jerarquía de información (por pantalla)

| Pantalla          | Primaria                       | Secundaria                     | Opcional            |
| ----------------- | ------------------------------ | ------------------------------ | ------------------- |
| SC-01 Menú        | producto + precio              | categoría, disponibilidad      | descripción corta   |
| SC-02 Detalle     | nombre, precio, opciones       | descriptores completos, imagen | notas               |
| SC-03 Carrito     | total + ítems                  | extras/notas por ítem          | acciones de edición |
| SC-06 Revisión    | **total final**                | desglose, aviso alcohol        | dirección/método    |
| SC-07 Pago        | métodos                        | —                              | —                   |
| SC-08 Resultado   | estado del pago                | acción siguiente               | detalle             |
| SC-09 Seguimiento | estado del pedido              | resumen                        | acción cancelar     |
| SA-01 Bandeja     | estado + antigüedad del pedido | cliente, total, método         | ítems               |

**Por qué:** en cada pantalla la información primaria es aquella sin la cual la tarea de esa pantalla no puede completarse. En el Menú es el par producto-precio (decidir); en Revisión es el total (el compromiso, RN-031); en Seguimiento es el estado (la única pregunta del cliente post-compra). Lo secundario da contexto; lo opcional no compite por atención. Esta jerarquía es el insumo directo del layout en wireframes.

---

## 7. Estados UX (catálogo transversal)

| Estado                     | Dónde aplica          | Comportamiento                                                                         |
| -------------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| Vacío (catálogo)           | SC-01                 | mensaje de marca "menú en preparación"; nunca pantalla en blanco                       |
| Carrito vacío              | SC-03                 | invitación a volver al menú; el carrito nunca "no existe", está vacío                  |
| Historial vacío            | SC-10                 | primer pedido: invitación a explorar                                                   |
| Carga                      | todas con datos       | placeholder de estructura (skeleton conceptual); nunca spinner solo si la espera > 1 s |
| Error recuperable          | todas                 | mensaje + acción de reintento; nunca callejón sin salida (P6)                          |
| Éxito                      | acciones de escritura | feedback breve no bloqueante (agregar al carrito), o pantalla dedicada (pago)          |
| Fuera de horario           | checkout              | F-14: navegación sí, confirmación no                                                   |
| Sin conexión               | global                | banner no destructivo; las acciones se reintentan al recuperar (E-06); nada se pierde  |
| Mantenimiento              | global                | mensaje honesto; si la API cae, el menú lo dice, no finge datos                        |
| Pedido cancelado           | SC-09/11              | estado terminal con motivo visible                                                     |
| Pago pendiente/confirmando | SC-08/09              | "confirmando tu pago" con reintento; NUNCA "pagado" sin confirmación (E-08, P5)        |
| Pago rechazado             | SC-08                 | camino de recuperación: reintentar o efectivo (E-05)                                   |

---

## 8. Reglas de interacción

- **Confirmaciones:** solo para acciones irreversibles o costosas — pagar (implícito en el redirect/confirmación), cancelar un pedido, vaciar el carrito. **No** para agregar/quitar un ítem (reversible, P6).
- **Volver atrás:** habilitado en todo el checkout hasta el pago; una vez en Mercado Pago, el retorno lo maneja el resultado del pago (SC-08), no el "atrás" del navegador. Antes del pago, volver nunca pierde datos ya cargados.
- **Bloquear acciones:** checkout bloqueado fuera de horario (RN-040) y con ítems inválidos (E-01); "agregar" bloqueado en producto no disponible; transiciones ilegales nunca ofrecidas (RN-070). El bloqueo siempre explica su causa.
- **Mensajes:** informar cuando el estado del sistema cambia algo que el usuario debe saber (precio cambió, fuera de zona, pago rechazado). No informar lo obvio (ítem agregado se ve en el contador). Un mensaje = una causa + una salida.
- **Errores recuperables:** siempre con acción de recuperación en el mismo lugar; el error no expulsa del flujo (credenciales, pago rechazado, conflicto de carrito).
- **Procesos largos:** el único proceso potencialmente largo es la confirmación del pago vía webhook (SC-08): se comunica progreso ("confirmando"), se consulta con reintentos, y no se afirma resultado hasta tenerlo. Nunca se deja al usuario sin saber si pagó.

---

## 9. Accesibilidad (criterios UX mínimos, sin estética)

- **Navegación:** operable por teclado y por lector de pantalla; landmarks (main/nav) y un `<h1>` por pantalla (corrige la carencia detectada en la revisión funcional); "saltar al contenido".
- **Contraste:** objetivo WCAG AA; el azul de marca se valida contra el papel off-white antes de fijarse (el Design System ejecuta; aquí queda el requisito).
- **Foco:** visible siempre, orden lógico, foco gestionado al abrir/cerrar pasos del checkout y al aparecer errores (el error recibe foco).
- **Tamaños táctiles:** objetivos ≥ 44×44 px (mobile-first); acciones primarias alcanzables con el pulgar.
- **Lectura:** textos en español, lenguaje llano; los descriptores del menú se muestran completos (no truncados sin acceso).
- **Formularios:** cada campo etiquetado (no solo placeholder); errores asociados al campo y anunciados; el teléfono del invitado con tipo de teclado numérico.

---

## 10. Riesgos UX (priorizados por impacto)

| #    | Riesgo                                                       | Impacto  | Punto | Mitigación UX                                                                                                       |
| ---- | ------------------------------------------------------------ | -------- | ----- | ------------------------------------------------------------------------------------------------------------------- |
| UX-1 | Abandono en el redirect a Mercado Pago                       | **Alto** | F-08  | Ofrecer efectivo como alternativa visible antes y después; SC-08 nunca deja al usuario sin salida (E-05/E-08)       |
| UX-2 | PRICE_CHANGED percibido como error/estafa                    | **Alto** | F-13  | Tratarlo como flujo normal: mostrar diferencia con transparencia y tono tranquilo (RN-031); nunca lenguaje de error |
| UX-3 | Fricción del dato de invitado interrumpe el impulso          | Medio    | SC-04 | Un solo paso, dos campos; pedir después de que el carrito ya representa una decisión tomada                         |
| UX-4 | Efectivo "pendiente de aceptación" leído como pedido fallido | Medio    | F-09  | Copy explícito "el local está confirmando"; distinguir de rechazo; código visible desde el inicio                   |
| UX-5 | Cliente pierde el código de seguimiento (invitado)           | Medio    | F-10  | Mostrarlo de forma prominente y reenviable (teléfono); el local puede recuperarlo por teléfono                      |
| UX-6 | Menú largo (34 productos) cansa el scroll                    | Medio    | SC-01 | Anclas de categoría como navegación secundaria (§3); búsqueda diferida a P2                                         |
| UX-7 | Zona declarativa (sin geocoding) → pedidos fuera de zona     | Medio    | F-16  | Copy claro de cobertura; el staff valida al aceptar; riesgo aceptado por alcance MVP (RN-041)                       |
| UX-8 | Doble árbol (cliente/admin) confunde si se mezclan           | Bajo     | IA    | Separación estricta sin enlaces cruzados (§2)                                                                       |

**Oportunidades de simplificación detectadas (para wireframes):** sugerir "retiro" como opción por defecto acelera el camino más corto (F-17) — **pendiente de confirmación del negocio** (¿el negocio prefiere empujar delivery o retiro?); la categoría como ancla en vez de nivel de navegación elimina dos taps por producto (§3).

---

## Contradicciones y pendientes detectados (documentados, no resueltos)

1. **Búsqueda de productos** aparece en el enunciado de flujos pero **no es un RF del PRD**. Decisión de UX: no es P0 con 34 productos; se resuelve con anclas de categoría y se registra búsqueda como P2. No modifico el PRD; señalo que ambos documentos quedan consistentes con esta lectura. Si el negocio quiere buscador en el MVP, es un RF nuevo.
2. **Default de fulfillment** (retiro vs delivery) no está fijado por el PRD. Impacto: afecta el paso más frecuente del checkout. Lo dejo como pendiente (§10) para decisión del negocio antes de wireframes.
3. **Acceso de seguimiento por código para invitado** es una capacidad que el PRD ya marcó como "backend NUEVO" (§17 RF-070); la IA depende de ella (SC-09). Sin ese endpoint, el invitado no puede seguir su pedido — dependencia crítica registrada.

---

_Fin del documento. Insumo directo de Screen Inventory detallado, wireframes y Design System. Actualizable solo con nueva evidencia del PRD/Discovery o decisiones del negocio._
