# jBurger — Product Discovery

**Versión 1.0 — 2026-07-22.** Fuente de verdad estratégica para Product Strategy, UX Strategy, Information Architecture, Design System, prototipos y frontend.

**Fuentes utilizadas:** (1) repositorio completo — auditado exhaustivamente durante los Bloques 1–5 y la revisión funcional del 2026-07-22; (2) menú oficial — 3 páginas provistas por el propietario; (3) Instagram `@jburger.ok` — **NO accesible en esta sesión** (página renderizada por JS, extensión de navegador desconectada, contenido no indexado por buscadores); toda la sección de marca se construye desde el menú y queda marcada la brecha; (4) información del cliente — la registrada en el repositorio (`docs/`).

**Convención de certeza:** cada afirmación relevante lleva etiqueta **[HECHO]** (con fuente), **[INFERENCIA]** (con justificación), **[SUPOSICIÓN]** o **[PREGUNTA]**.

---

## 1. Executive Summary

jBurger es una hamburguesería real de Roque Pérez (provincia de Buenos Aires), operando desde 2019 **[HECHO: menú, "Desde 2019"]**, con un catálogo de 34 productos en 8 categorías y una identidad visual definida y consistente **[HECHO: menú]**. El sistema en construcción tiene un backend transaccional sólido — catálogo, autenticación con RBAC, carrito con concurrencia optimista, checkout idempotente con snapshot financiero, pagos con Mercado Pago y confirmación gateada por pago aprobado — validado por pipeline y aplicado sobre Supabase **[HECHO: repositorio, Bloques 1–5 cerrados]**, y un frontend que es un shell sin integración (0 % de consumo de API, sin navegación, sin login) **[HECHO: `functional-review-2026-07-22.md`]**.

**El hallazgo central de este discovery** es que el menú real y el modelo de datos implementado están alineados en casi todo — precios enteros en ARS, catálogo por categorías, disponibilidad por sucursal — con **una excepción estructural: el menú vende un modificador con precio ("agregá medallón extra por $3300") y una elección de variante (Cajita Feliz: hamburguesa o nuggets) que el modelo de carrito actual no puede representar** — solo admite cantidad y notas de texto libre **[HECHO: `domains/cart/src/contracts.ts`, `cart_items` sin modificadores]**. Esa brecha, conocida y diferida deliberadamente (backlog "modifiers/combos" desde ADR-023), pasa de deuda tolerable a decisión de producto urgente ahora que el frontend va a exponer el catálogo real.

La segunda conclusión es que **el discovery de marca está incompleto por evidencia inaccesible** (Instagram) y **el discovery de operación está incompleto por información que solo el propietario tiene** (horarios, zona de cobertura, costo de envío, efectivo vs digital, volumen). Ninguna decisión de UX que dependa de eso debe tomarse todavía; están listadas como preguntas abiertas priorizadas (§11).

---

## 2. Business Discovery

### Propuesta de valor observada

- Hamburguesas smash/artesanales con recetas propias y salsas de la casa ("salsa Jota" aparece en 4 productos — firma de la casa; "Jota" = J de jBurger **[INFERENCIA: nomenclatura]**), en un rango de $7.500–$18.500 **[HECHO: menú]**.
- Cobertura amplia de públicos en un solo menú: línea clásica, línea premium (BLUE, DANIELE con pesto y cherrys confitados), línea XL por apilamiento (CHICAGO 2, LA TRINCHERA 3, FASE 4 4 medallones), línea veggie real (3 productos con medallones propios de zapallo/espinaca y arroz yamaní, no "la misma burger sin carne"), cerdo (bondiola deshebrada), pollo, kids con juguete **[HECHO: menú]**.
- Operación local en Roque Pérez con delivery propio como objetivo del sistema **[HECHO: principios del proyecto en el repositorio]**.

### Modelo operativo

- **[HECHO: repositorio]** El sistema modela: tenant único (jBurger), sucursal única activa, fulfillment `pickup | delivery`, pago online (Checkout Pro) y confirmación del pedido al aprobarse el pago; pago en mostrador cubierto por confirmación manual de staff (`orders.write`).
- **[HECHO: menú]** Venta de alcohol (6 SKUs incluyendo fernet y vino) — implica restricción legal de venta/entrega a menores.
- **[SUPOSICIÓN]** Canal de pedidos actual: WhatsApp/Instagram/mostrador. No hay evidencia en el repo de un canal digital previo. **[PREGUNTA P-01]**.

### FODA

|                   |                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fortalezas**    | Catálogo profundo y diferenciado (veggie real, XL, salsas propias) [HECHO: menú]; identidad visual fuerte y consistente [HECHO: menú]; backend transaccional correcto ya construido [HECHO: repo]; marca establecida desde 2019 [HECHO: menú]                                  |
| **Debilidades**   | Sin canal digital propio operativo (frontend 0 % integrado) [HECHO]; modelo de modificadores ausente vs menú real [HECHO]; sin registro de usuarios — cada cliente requiere aprovisionamiento manual [HECHO: repo, runbook]                                                    |
| **Oportunidades** | Primer canal de pedidos online propio del pueblo [SUPOSICIÓN — verificar competencia local, P-02]; upsell estructurado (papas+bebida al checkout) [INFERENCIA: el menú separa guarniciones]; datos de demanda por producto que hoy no existen                                  |
| **Amenazas**      | Dependencia de apps de terceros si existieran (PedidosYa no suele operar en localidades chicas [SUPOSICIÓN]); fricción de pago online en un pueblo donde el efectivo puede dominar [SUPOSICIÓN — P-03]; costo de mantenimiento del canal si el volumen es bajo [PREGUNTA P-04] |

---

## 3. Brand Discovery (Brand Bible v0 — fuente: menú; Instagram pendiente)

> **Límite explícito:** esta sección descubre la identidad **desde el menú oficial**, que es material de marca real producido por el negocio. El Instagram no pudo observarse; las preguntas de marca no cubiertas están en §11. Nada de lo siguiente es una identidad inventada: cada rasgo cita su evidencia.

**¿Quién es jBurger?** Una hamburguesería de pueblo con orgullo de marca: logo caligráfico propio, "Desde 2019", ilustraciones propias (nene con perro y burger, hamburguesa geométrica) **[HECHO: menú]**. No se presenta como cadena ni como dark kitchen: se presenta como _la_ marca local.

**Personalidad.** Juguetona y cancherа, con humor de referencia compartida: burgers bautizadas MESSI, LEBRON, PARKER, CHICAGO, YANKEE, GOLDEN (deporte), CUARTO DE LIBRA (guiño paródico a McDonald's, igual que CAJITA FELIZ), FASE 4 (humor de cuarentena para una burger de 4 medallones), LA TRINCHERA, DANIELE (nombre propio — **[PREGUNTA P-05]** ¿homenaje personal?) **[HECHO: nombres; INFERENCIA: las lecturas]**. Habla en voseo argentino directo: "AGREGÁ MEDALLÓN EXTRA A TU HAMBURGUESA" **[HECHO: menú]**.

**Identidad visual.** Un solo color de marca — azul/índigo intenso — sobre fondo papel off-white con textura; tipografía condensada, bold, TODO EN MAYÚSCULAS para títulos y productos; precios grandes y sin decimales; bloques de color pleno como separadores de categoría; logo manuscrito como contrapunto humano **[HECHO: 3 páginas del menú, consistentes entre sí]**. Es una identidad de dos tintas, casi de imprenta — no gradientes, no fotografía en el menú, no paleta multicolor.

**Emociones que transmite:** apetito directo (el producto y el precio, sin adornos), pertenencia local (los chistes se entienden si sos de acá), confianza informal ("desde 2019", precios de frente). **Emociones que NO debe transmitir:** corporativismo de cadena, minimalismo frío tech, lujo gourmet solemne, ni infantilismo (el humor es adulto-juguetón, no caricatura — la única concesión kids está contenida en su categoría) **[INFERENCIA de todo lo anterior]**.

**¿Cómo debería sentirse usar la aplicación?** Como pedirle al mostrador de siempre, sin fila: rápida, en voseo, con los nombres de las burgers como protagonistas y el azul/papel como escenografía. La app es un canal de la marca existente — el design system debe derivar de este menú, no de tendencias de delivery apps **[INFERENCIA; es además el mandato del proyecto: "no es un ecommerce genérico"]**.

---

## 4. Product Discovery (catálogo)

### Estructura real

**[HECHO: menú]** 8 categorías, 34 productos:

| Categoría           | Productos                                               | Rango de precio |
| ------------------- | ------------------------------------------------------- | --------------- |
| Hamburguesas        | 14 (CHEDDAR $7500 → FASE 4 $18500)                      | $7.500–18.500   |
| Veggies             | 3 (precio plano $12.000)                                | $12.000         |
| Cerdo               | 2                                                       | $11.500–12.000  |
| Pollo               | 2                                                       | $10.000–11.000  |
| Kids                | 1 (CAJITA FELIZ, con elección burger/nuggets + juguete) | $16.000         |
| Papas fritas        | 5 (guarnición $3.500 → papas cheddar $9.800)            | $3.500–9.800    |
| Bebidas sin alcohol | 5                                                       | $1.500–3.000    |
| Bebidas con alcohol | 6                                                       | $4.000–12.000   |

### Reglas de negocio inferibles del menú

1. **[HECHO]** Un único modificador con precio explícito y alcance global: medallón extra $3.300 "a tu hamburguesa". **[PREGUNTA P-06]** ¿aplica también a veggies/pollo? ¿límite de medallones?
2. **[HECHO]** Una elección de variante sin diferencia de precio: Cajita Feliz "hamburguesa cheddar o nuggets", "juguete a elección". **[PREGUNTA P-07]** ¿el juguete se elige al pedir o en el local?
3. **[INFERENCIA]** Escala de apilamiento no lineal: 1→2 medallones cuesta +$3.300 como extra, pero CHICAGO/TRINCHERA/FASE 4 son productos propios con recetas fijas — el negocio distingue "burger con extra" de "burger XL de la casa".
4. **[HECHO]** Sin combos en el menú (no existe "burger + papas + bebida"). Las papas son guarniciones separadas con su propia escala.
5. **[HECHO]** Sin tamaños ni opciones de punto de cocción, sin sección de aderezos aparte, sin "armá tu burger".
6. **[INFERENCIA]** "Lactonesa de ajo (alioli)" — emulsión sin huevo; el menú aclara ingredientes con precisión (pepinos agridulces, cebolla morada, arroz yamaní), lo que sugiere clientela que pregunta por composición. Los descriptores importan para la UI.

### Consistencias e inconsistencias detectadas

- **[HECHO]** Los precios reales (enteros, ARS, hasta $18.500) encajan sin cambios en el modelo `Money { amount: number; currency: 'ARS' }` y en `numeric(12,2)` de la DB.
- **[HECHO — inconsistencia de datos]** El seed `001_jburger_base.sql` tiene 4 categorías y 5 productos demo ("J Simple" $7.500…) que **no** son el catálogo real. Antes de cualquier demo con el frontend hay que cargar el catálogo real (34 productos) vía los endpoints de catálogo existentes.
- **[HECHO — brecha de modelo]** `cart_items` = producto + cantidad + notas. El medallón extra ($3.300) **no es representable con precio**: hoy solo cabría como nota de texto sin cobro. Impacto directo en checkout (el total no reflejaría el extra) — es LA decisión de modelo previa al frontend (§12).
- **[HECHO]** Tipografía del menú escribe "medallon/medallón" y "GUARNICION" con acentuación inconsistente — al digitalizar el catálogo hay que fijar ortografía canónica.
- **[INFERENCIA — riesgo de catálogo]** MESSI y CAJITA FELIZ/CUARTO DE LIBRA usan marcas de terceros; en un canal digital público esto tiene otra exposición que en un menú impreso. Decisión del propietario, no técnica **[PREGUNTA P-08]**.

---

## 5. Software Discovery

**[HECHO — todo esta sección: repositorio, pipeline verde 2026-07-22]**

### Completo y verificado

| Capacidad                                                                                                      | Estado                                      |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Autenticación (login/refresh/logout/me/sessions, Supabase Auth + RBAC desde DB, 8 roles, 42 permisos)          | Completa; sin registro de usuarios          |
| Catálogo (categorías, productos, disponibilidad y precio por sucursal, menú compuesto `GET /menu`)             | Completa; CRUD protegido por permisos       |
| Carrito (CAS por versión, merge guest→login, pricing preview determinista, límite configurable por ítem)       | Completa **sin modificadores**              |
| Pedidos (checkout idempotente, snapshot financiero inmutable, máquina de estados, cancelación por matriz)      | Completa; totales sin impuestos/desc./envío |
| Pagos (intento idempotente, Checkout Pro, webhook con firma verificada, confirmación transaccional del pedido) | Completa; reembolsos fuera del MVP          |

### Incompleto o defectuoso

- Frontend: 9 rutas estáticas, 0 % integración, sin navegación ni login **[HECHO: revisión funcional]**.
- `users`/`roles` controllers: stubs que confirman operaciones que no ejecutan — defecto de seguridad B1/B2, ya dictaminado como bloqueante.
- Sin expiración de carritos/borradores; auditoría sin outbox durable; 7 dominios huérfanos del rebase.

### Qué falta implementar (orden de dependencia, no de deseo)

1. Decisión + (si aplica) modelo de modificadores (§12.1) — condiciona DTOs, carrito, snapshot y UI de producto.
2. Cliente HTTP + sesión, login, navegación, flujo cliente completo (alcance Bloque 6 ya definido).
3. Carga del catálogo real (34 productos, imágenes, descriptores) — operación de contenido, no de código.
4. Registro/alta de clientes — hoy es imposible que un cliente nuevo se autoregistre **[HECHO: runbook de aprovisionamiento manual]**. Decisión de producto pendiente (§12).
5. Delivery: zona, costo de envío, datos de dirección — el modelo tiene `direccionEntrega` pero no tarifa **[HECHO]** **[PREGUNTAS P-09/P-10]**.

---

## 6. Business Flows

**Flujo principal — pedido online con pago digital [respaldado por el backend existente]:**

```
Cliente conoce jBurger (local / boca a boca / Instagram)
  ↓
Explora el menú (por categoría; disponibilidad y precio por sucursal)
  ↓
Selecciona producto (descriptores de ingredientes)
  ↓
[BRECHA] Personaliza (medallón extra $3300 / elección Cajita) — hoy solo notas de texto sin precio
  ↓
Agrega al carrito (preview de precios no vinculante; ítems inválidos se reportan)
  ↓
[BRECHA UX] Se autentica (login existe por API; registro NO existe)
  ↓
Checkout: elige pickup o delivery (+dirección) → confirma total (revalidación canónica: si un precio cambió, PRICE_CHANGED y se le muestra el nuevo)
  ↓
Pedido en `borrador` → redirect a Mercado Pago (Checkout Pro)
  ↓
Pago aprobado (webhook verificado) → pedido `confirmado` — automático y atómico
  ↓
Staff: `confirmado` → `preparacion` → `entregado`   (cancelación: cliente solo en borrador/confirmado)
  ↓
Cliente sigue el estado (historial + detalle + estado del pago)
```

**Flujo alternativo — pago en mostrador [respaldado]:** checkout igual → el pedido queda `borrador` → staff con `orders.write` confirma manualmente al cobrar. **[PREGUNTA P-03]** ¿el negocio quiere ofrecer "pagás al retirar" como opción de primera clase? Cambia el checkout de la UI.

**Flujo staff [respaldado]:** login → pedidos de la sucursal filtrados por estado → transiciones + cancelaciones con motivo → (futuro: panel cocina, bloque 9 del roadmap).

**Flujo NO soportado hoy:** autoregistro de cliente; recupero de contraseña; propinas; reembolsos self-service; programar pedido para más tarde **[HECHO: ausencia en API]**.

---

## 7. Personas

> Solo la primera tiene respaldo directo. Las demás son hipótesis de trabajo marcadas como tales, a validar con el propietario (P-11) — no deben usarse para decisiones finas de UX sin esa validación.

1. **El dueño/operador (respaldada [HECHO: roles OWNER/CAJERO/COCINA en seeds; runbook])** — administra catálogo, precios y disponibilidad; confirma pedidos de mostrador; necesita que cargar/despublicar un producto sea trivial y que el estado de los pedidos sea visible de un vistazo.
2. **El cliente local habitual [SUPOSICIÓN]** — conoce el menú de memoria, pide "la de siempre" por WhatsApp; el canal nuevo compite contra un mensaje de texto: si pedir cuesta más de ~2 minutos, vuelve a WhatsApp. Móvil, posiblemente con datos limitados.
3. **El grupo del viernes [SUPOSICIÓN]** — pedido multi-ítem (4-6 burgers + papas + bebidas), sensible a "¿cuánto quedó el total?"; beneficiario principal del carrito robusto y del historial para repetir.
4. **La familia [SUPOSICIÓN]** — Cajita Feliz + veggies + clásicas; la elección burger/nuggets y el juguete importan; horario temprano.

---

## 8. Customer Journey (con fricciones y riesgos)

| Etapa          | Estado actual            | Fricción / riesgo                                                                                                               | Evidencia                |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Descubrimiento | Instagram + local físico | La app no existe aún como touchpoint; el enlace IG→app será el puente crítico                                                   | [HECHO: no hay frontend] |
| Exploración    | Menú impreso/IG          | Digital: necesita descriptores completos e imágenes que hoy no existen como contenido                                           | [HECHO: seeds demo]      |
| Selección      | —                        | Sin modificadores, el medallón extra se pierde o va por nota sin cobro → ticket promedio baja o cobro manual incorrecto         | [HECHO: modelo]          |
| Autenticación  | Solo login por API       | **Fricción máxima del journey**: un cliente nuevo NO puede crearse cuenta. Bloquea la adopción por completo                     | [HECHO: runbook]         |
| Checkout       | API completa             | `PRICE_CHANGED` es correcto pero necesita traducción UX cuidadosa ("actualizamos el precio") o parece error                     | [HECHO: contrato 409]    |
| Pago           | MP Checkout Pro          | Redirect fuera de la app: punto clásico de abandono; el estado queda `borrador` si no paga → necesita recordatorio/reintento UX | [HECHO: flujo]           |
| Espera         | Estados en API           | Sin notificaciones (bloque futuro): el cliente debe refrescar. Aceptable para MVP local, no ideal                               | [HECHO: roadmap]         |
| Entrega        | pickup/delivery          | Sin zona ni costo de envío definidos; alcohol requiere mayoría de edad en la entrega                                            | [HECHO: modelo; menú]    |
| Recompra       | Historial por API        | Oportunidad "repetir pedido" — barata con el modelo actual                                                                      | [INFERENCIA]             |

---

## 9. Oportunidades (impacto × esfuerzo → prioridad)

| #   | Oportunidad                                                                                                | Impacto                                | Esfuerzo         | Prioridad                               |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------- | --------------------------------------- |
| O1  | Modelar el medallón extra + elección Cajita (modificadores mínimos, no un motor genérico)                  | Alto (ticket + fidelidad al menú real) | Medio            | **P1 — antes del frontend de producto** |
| O2  | Registro de clientes (email+contraseña vía Supabase Auth, ya disponible en el gateway)                     | Alto (desbloquea adopción)             | Medio            | **P1**                                  |
| O3  | Carga del catálogo real con descriptores del menú                                                          | Alto                                   | Bajo (contenido) | **P1**                                  |
| O4  | Upsell al checkout: papas + bebida (el menú ya separa guarniciones)                                        | Medio-alto                             | Bajo (UI)        | P2                                      |
| O5  | "Repetir último pedido" desde historial                                                                    | Medio                                  | Bajo             | P2                                      |
| O6  | Estado del pedido en vivo (polling simple primero; notificaciones después)                                 | Medio                                  | Bajo/Medio       | P2                                      |
| O7  | Combos (burger+papas+bebida) — hoy NO existen en el menú: es decisión comercial del dueño, no del software | Alto si el dueño quiere                | Alto             | P3 — requiere P-12                      |
| O8  | Datos de demanda por producto para el dueño                                                                | Medio                                  | Medio            | P3                                      |

## 10. Riesgos

| Tipo           | Riesgo                                                                                               | Mitigación                                             |
| -------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Técnico        | Construir la UI de producto sin resolver O1 obliga a rehacer detalle de producto, carrito y snapshot | Decidir §12.1 primero                                  |
| Técnico        | Stubs de `users`/`roles` (B1/B2) siguen activos                                                      | Retirarlos al abrir el Bloque 6 (ya dictaminado)       |
| Operativo      | Cargar 34 productos sin proceso de contenido (fotos, textos) retrasa todo                            | Tratarlo como workstream paralelo del dueño con fechas |
| Operativo      | Venta de alcohol online sin verificación de edad definida                                            | Decisión P-13 antes de publicar la categoría           |
| Comercial      | Pago online obligatorio en un mercado que quizá es efectivo-primero                                  | P-03; el flujo mostrador ya existe como fallback       |
| Comercial      | Marcas de terceros en nombres de productos en canal público                                          | P-08 (decisión del dueño)                              |
| UX             | Diseñar con estética genérica de delivery app y romper la identidad de dos tintas                    | Brand Bible §3 como contrato del design system         |
| Implementación | Discovery de marca incompleto (Instagram)                                                            | Cerrar P-14 antes del design system; no bloquea O1–O3  |

## 11. Información faltante (priorizada)

**Bloqueantes de decisiones de producto (antes del diseño):**

- **P-06** Medallón extra: ¿aplica a todas las burgers? ¿máximo? ¿también en veggies (medallón veggie extra) y pollo?
- **P-07** Cajita Feliz: ¿la elección (burger/nuggets, juguete) se toma en el pedido o en el local?
- **P-03** ¿Se acepta pago en efectivo al retirar/recibir como opción del canal online?
- **P-09/P-10** Delivery: ¿zona de cobertura, costo (fijo/por zona/gratis desde X), horarios de operación?
- **P-15** ¿Registro abierto de clientes, o pedidos como invitado con teléfono? (condiciona todo el onboarding)
- **P-13** Alcohol online: ¿se vende? ¿con qué verificación?

**Bloqueantes del design system (antes de UI):**

- **P-14** Acceso al material de Instagram (basta con capturas de: bio, 6–9 posts recientes, historias destacadas) o respuestas directas: ¿fotografía real o ilustración?, ¿tono de los copies?, ¿tipografías oficiales/logo vectorial disponibles?
- **P-05** Historia de los nombres (DANIELE, LA TRINCHERA, salsa Jota) — alimenta microcopy.

**Importantes no bloqueantes:** P-01 canal actual de pedidos y volumen semanal; P-02 competencia local con canal digital; P-04 expectativa de volumen online; P-08 marcas de terceros; P-12 ¿quiere combos?; P-11 validación de personas 2–4.

## 12. Recomendaciones estratégicas

**12.1 — Decidir YA el alcance de modificadores, y decidirlo chico.** La evidencia del menú demanda exactamente dos capacidades: (a) un extra con precio por ítem (medallón, $3.300) y (b) una elección sin precio (Cajita). **No** demanda un motor genérico de modifiers/combos (el backlog heredado de origin sobredimensiona esto). Recomendación: extender `cart_items`/`order_items` con una lista acotada de extras (id, nombre, precio, cantidad) definidos por producto, y variantes como atributo simple. Justificación: es la brecha menú↔modelo más barata de cerrar ahora y carísima después del frontend (rehace detalle de producto, carrito, snapshot y UI). _Decidible hoy_ con P-06/P-07 respondidas.

**12.2 — Resolver el acceso de clientes antes que cualquier pantalla de compra.** Sin registro (o invitado), el funnel completo es inutilizable por definición **[HECHO]**. Decisión P-15 primero; la infraestructura (Supabase Auth) ya está.

**12.3 — Secuenciar el Bloque 6 así:** (1) retirar stubs B1/B2 → (2) decisión 12.1 + 12.2 → (3) carga de catálogo real (workstream del dueño en paralelo) → (4) cliente HTTP/sesión/login/navegación → (5) flujo de compra. Justificación: cada paso desbloquea al siguiente; invertir el orden produce retrabajo demostrable.

**12.4 — Postergar:** combos (P-12, sin evidencia de demanda), notificaciones push, paneles de cocina/admin visuales, reembolsos, multi-sucursal. Ninguno bloquea el primer pedido online real.

**12.5 — Decisiones que ya pueden tomarse sin más evidencia:** el design system parte del menú (dos tintas azul/papel, tipografía condensada bold, mayúsculas, voseo, precios protagonistas); mobile-first (delivery local **[INFERENCIA razonable]**); los nombres de productos son protagonistas de la UI, no las fotos (coherente con un menú sin fotografía). **Decisiones que NO deben tomarse aún:** cualquier flujo de onboarding (P-15), checkout con/sin efectivo (P-03), presencia de alcohol (P-13), tono fotográfico (P-14).

---

_Fin del documento. Actualizable únicamente con nueva evidencia: cada edición debe citar fuente._
