# J Burguer — Estándar Canónico de Lenguaje: Negocio en Español, Técnica en Inglés

## 0. Alcance y autoridad

Este documento es la política canónica de lenguaje para toda la plataforma J Burguer. Aplica a documentación, dominios, entidades, agregados, value objects, eventos de negocio, DTOs, commands, queries, APIs de negocio, tablas, columnas, enums, status, workflows, servicios de negocio, etiquetas de UX, paneles administrativos, operación de cocina, entregas, promociones, fidelización, soporte y analítica de negocio.

La política oficial es:

```text
BUSINESS LANGUAGE = SPANISH
TECHNICAL LANGUAGE = ENGLISH
```

Esta política no genera código ni migraciones. Define el vocabulario obligatorio que debe usarse antes de implementar paquetes, dominios, contratos, eventos, base de datos, APIs, pantallas o documentación operativa.

### 0.1 Regla principal

Todo concepto de negocio debe nombrarse en español. Toda infraestructura técnica, patrón técnico, runtime, framework, protocolo, herramienta, o mecanismo transversal técnico debe conservarse en inglés.

### 0.2 Español para negocio

Deben estar en español:

- Dominios de negocio.
- Entidades.
- Agregados.
- Value Objects de negocio.
- Eventos de negocio.
- DTOs de negocio.
- Commands y Queries de negocio.
- Tablas y columnas de negocio.
- Enums y status de negocio.
- Workflows de negocio.
- Servicios de negocio.
- APIs de negocio.
- Documentación de negocio.
- Labels de dashboards, administración y operación.
- Términos de cocina, entrega, fidelización, promociones y soporte.

### 0.3 Inglés para técnica

Deben permanecer en inglés:

- `auth`, `audit`, `analytics`, `storage`, `realtime`.
- `repository`, `service`, `provider`, `middleware`, `worker`, `consumer`, `producer`.
- `contract`, `event`, `schema`, `migration`, `policy`.
- Next.js, Supabase, PostgreSQL, Mercado Pago, Vercel.
- API, SDK, Webhook, JWT, OAuth, RLS.
- `Edge Function`, `Outbox`, `Replay`, `Idempotency`, `CI/CD`, `SLO`, `RTO`, `RPO`.

### 0.4 Regla de identificadores técnicos

Los identificadores de código y base de datos usan español sin tildes y en ASCII para evitar problemas de herramientas, URLs, imports, SQL, shells y sistemas externos.

| Contexto | Forma correcta |
| --- | --- |
| Texto humano | `Organización`, `Dirección`, `Promoción`, `Analítica Clientes` |
| Clase/Tipo | `Organizacion`, `Direccion`, `Promocion`, `AnaliticaClientes` |
| Tabla/columna | `organizaciones`, `direccion`, `promocion_id`, `analitica_clientes` |
| Evento | `pedido.creado.v1`, `pago.aprobado.v1` |
| Carpeta dominio | `domains/pedidos`, `domains/promociones-fidelizacion` |

---

## 1. Language Audit Report

### 1.1 Resultado general de auditoría

La arquitectura existente fue escrita principalmente en inglés y mezcla términos de negocio en inglés con términos técnicos correctamente en inglés. Desde esta política, todos los términos de negocio en inglés quedan marcados como **deprecated architecture language** y deben migrarse al vocabulario español canónico durante la implementación y en toda modificación documental posterior.

### 1.2 Documentos auditados

| Documento | Inconsistencias detectadas | Normalización obligatoria |
| --- | --- | --- |
| `docs/strategy/product-foundation.md` | Usa `customer`, `order`, `loyalty`, `branch`, `menu`, `delivery`, `support`, `promotion` como términos de negocio. | Reemplazar por `cliente`, `pedido`, `fidelizacion`, `sucursal`, `menu`, `entrega`, `soporte`, `promocion`. |
| `docs/architecture/commerce-engine-architecture.md` | Dominios y workflows de commerce en inglés: `cart`, `checkout`, `order`, `payment`, `refund`, `coupon`, `promotion`, `reward`. | Usar `carrito`, `finalizacion_compra`, `pedido`, `pago`, `reembolso`, `cupon`, `promocion`, `recompensa`. |
| `docs/architecture/restaurant-operations-architecture.md` | Operación en inglés: `kitchen`, `ticket`, `station`, `delivery`, `dispatch`, `branch`, `incident`. | Usar `cocina`, `ticket_cocina`, `estacion_cocina`, `entrega`, `despacho`, `sucursal`, `incidente`. |
| `docs/architecture/event-driven-realtime-architecture.md` | Eventos de negocio en inglés: `order.created`, `payment.approved`, `delivery.assigned`, `notification.sent`. | Usar `pedido.creado`, `pago.aprobado`, `entrega.asignada`, `notificacion.enviada`; conservar `event`, `consumer`, `producer`, `realtime`. |
| `docs/architecture/security-tenant-isolation-architecture.md` | Mezcla negocio/técnica: `tenant`, `organization`, `branch`, `customer`, `support access`, `refund`, `payment`. | Mantener `auth`, `RLS`, `JWT`; usar `organizacion`, `sucursal`, `cliente`, `acceso_soporte`, `reembolso`, `pago`. |
| `docs/architecture/frontend-ux-design-system-architecture.md` | Labels y componentes de negocio en inglés: `Kitchen Dashboard`, `Order Queue`, `Customer Account`, `Branch Operations`. | Usar `Panel Cocina`, `Cola Pedidos`, `Cuenta Cliente`, `Operaciones Sucursal`; conservar `Design System`, `component`, `provider`, `hook`. |
| `docs/architecture/infrastructure-devops-observability-architecture.md` | Términos de negocio en flujos técnicos: `checkout`, `order`, `payment`, `branch`, `customer impact`. | Usar `finalizacion_compra`, `pedido`, `pago`, `sucursal`, `impacto_cliente`; conservar `worker`, `queue`, `deployment`, `rollback`. |
| `docs/architecture/data-analytics-intelligence-architecture.md` | Métricas de negocio en inglés: `customer`, `order`, `conversion`, `delivery`, `loyalty`, `promotion`. | Usar `cliente`, `pedido`, `conversion`, `entrega`, `fidelizacion`, `promocion`; conservar `analytics`, `warehouse`, `metric`. |
| `docs/architecture/governance-engineering-operations-architecture.md` | Gobernanza técnica correcta, pero dominios en inglés: `Commerce`, `Orders`, `Payments`, `Support`, `Branch Operations`. | Usar `Comercio`, `Pedidos`, `Pagos`, `Soporte`, `Operaciones Sucursal` cuando el término sea de negocio. |
| `docs/architecture/implementation-blueprint.md` | Monorepo y technical packages correctos, pero dominios, domain-types, events, APIs y tablas de negocio en inglés. | Renombrar dominios y business identifiers según este estándar; conservar `packages`, `contracts`, `events`, `schemas`, `migrations`, `workers`. |
| `docs/architecture/database-implementation-specification.md` | Define tablas, columnas y logical names en inglés: `orders`, `order_items`, `payments`, `branches`, `customers`. | Usar diccionario de base de datos de este documento: `pedidos`, `items_pedido`, `pagos`, `sucursales`, `clientes`. |

### 1.3 Tipos de inconsistencia encontrados

| Categoría | Ejemplos encontrados | Forma canónica |
| --- | --- | --- |
| Dominios mixtos | `orders`, `payments`, `delivery`, `support`, `catalog-menu` | `pedidos`, `pagos`, `entregas`, `soporte`, `catalogo-menu` |
| Entidades en inglés | `Order`, `Payment`, `Branch`, `Customer`, `KitchenTicket` | `Pedido`, `Pago`, `Sucursal`, `Cliente`, `TicketCocina` |
| Tablas en inglés | `order_items`, `payment_attempts`, `delivery_assignments` | `items_pedido`, `intentos_pago`, `asignaciones_entrega` |
| Eventos en inglés | `order.created.v1`, `payment.approved.v1` | `pedido.creado.v1`, `pago.aprobado.v1` |
| Commands en inglés | `CreateOrderCommand`, `RefundPaymentCommand` | `CrearPedidoCommand`, `ReembolsarPagoCommand` |
| Queries en inglés | `GetOrderQuery`, `ListBranchOrdersQuery` | `ObtenerPedidoQuery`, `ListarPedidosSucursalQuery` |
| DTOs en inglés | `OrderResponse`, `PaymentDTO`, `CustomerProfile` | `PedidoResponse`, `PagoDTO`, `PerfilCliente` |
| Labels UX en inglés | `Kitchen Dashboard`, `Order Queue`, `Delivery Queue` | `Panel Cocina`, `Cola Pedidos`, `Cola Entregas` |
| Status en inglés | `pending`, `approved`, `cancelled`, `delivered` | `pendiente`, `aprobado`, `cancelado`, `entregado` |

### 1.4 Regla de remediación documental

Los documentos existentes no deben seguir ampliándose con términos de negocio en inglés. Toda modificación posterior debe:

1. Usar este glosario como fuente de verdad.
2. Mantener en inglés únicamente la terminología técnica.
3. Agregar una nota de compatibilidad si se referencia un término histórico en inglés.
4. Actualizar tablas, ejemplos, eventos y APIs al vocabulario canónico español.
5. Bloquear PRs que creen nuevos nombres de negocio en inglés.

---

## 2. Canonical Business Glossary

### 2.1 Organizacion, sucursales y marca

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Organization | Organización | `Organizacion` / `organizacion` | Tenant principal del negocio. |
| Tenant | Organización | `Organizacion` / `organizacion` | Usar `tenant` solo en explicación técnica de multi-tenancy; en negocio usar organización. |
| Branch | Sucursal | `Sucursal` / `sucursal` | Unidad física-operativa. |
| Brand | Marca | `Marca` / `marca` | Identidad comercial/visual. |
| Franchise | Franquicia | `Franquicia` / `franquicia` | Organización o relación de expansión. |
| Franchisee | Franquiciado | `Franquiciado` / `franquiciado` | Operador de franquicia. |
| Branch Settings | Configuración Sucursal | `ConfiguracionSucursal` / `configuracion_sucursal` | Configuración general de sucursal. |
| Branch Hours | Horarios Sucursal | `HorariosSucursal` / `horarios_sucursal` | Horarios comerciales/operativos. |
| Branch Delivery Zone | Zona Entrega Sucursal | `ZonaEntregaSucursal` / `zona_entrega_sucursal` | Área de entrega de una sucursal. |
| Branch Operational Settings | Configuración Operativa Sucursal | `ConfiguracionOperativaSucursal` / `configuracion_operativa_sucursal` | Capacidad, pausas y reglas operativas. |

### 2.2 Clientes e identidad de negocio

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Customer | Cliente | `Cliente` / `cliente` | Persona que compra. |
| Customer Profile | Perfil Cliente | `PerfilCliente` / `perfil_cliente` | Datos visibles del cliente. |
| Customer Address | Dirección Cliente | `DireccionCliente` / `direccion_cliente` | Dirección guardada del cliente. |
| Staff | Personal | `Personal` / `personal` | Usuario operativo de sucursal/organización. |
| Admin | Administrador | `Administrador` / `administrador` | Usuario con permisos administrativos. |
| Support Operator | Operador Soporte | `OperadorSoporte` / `operador_soporte` | Usuario de soporte. |
| Driver | Repartidor | `Repartidor` / `repartidor` | Persona que realiza entregas. |
| User Membership | Membresía Usuario | `MembresiaUsuario` / `membresia_usuario` | Relación usuario-organización/sucursal. |
| Role | Rol | `Rol` / `rol` | Conjunto de permisos. |
| Permission | Permiso | `Permiso` / `permiso` | Acción autorizable. |
| Session | Sesión | `Sesion` / `sesion` | Sesión de aplicación; `auth session` puede quedar técnico. |

### 2.3 Catalogo y menu

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Catalog | Catálogo | `Catalogo` / `catalogo` | Dominio de oferta comercial. |
| Menu | Menú | `Menu` / `menu` | Carta visible. |
| Category | Categoría | `Categoria` / `categoria` | Agrupación de productos. |
| Menu Item | Producto Menú | `ProductoMenu` / `producto_menu` | Ítem vendible individual. |
| Modifier | Modificador | `Modificador` / `modificador` | Opción seleccionable. |
| Modifier Group | Grupo Modificadores | `GrupoModificadores` / `grupo_modificadores` | Reglas de selección. |
| Combo | Combo | `Combo` / `combo` | Oferta combinada. |
| Combo Item | Item Combo | `ItemCombo` / `item_combo` | Componente de combo. |
| Availability Rule | Regla Disponibilidad | `ReglaDisponibilidad` / `regla_disponibilidad` | Disponibilidad por tiempo/sucursal. |
| Branch Override | Override Sucursal | `OverrideSucursal` / `override_sucursal` | Excepción local. |
| Image | Imagen | `Imagen` / `imagen` | Imagen de producto/categoría/marca. |

### 2.4 Carrito, finalizacion y pedidos

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Cart | Carrito | `Carrito` / `carrito` | Pre-pedido mutable. |
| Cart Item | Item Carrito | `ItemCarrito` / `item_carrito` | Producto seleccionado. |
| Cart Modifier | Modificador Carrito | `ModificadorCarrito` / `modificador_carrito` | Modificador elegido. |
| Checkout | Finalización Compra | `FinalizacionCompra` / `finalizacion_compra` | Proceso de validación y pago. |
| Checkout Session | Sesión Finalización Compra | `SesionFinalizacionCompra` / `sesion_finalizacion_compra` | Contexto de checkout. |
| Order | Pedido | `Pedido` / `pedido` | Transacción confirmada. |
| Order Item | Item Pedido | `ItemPedido` / `item_pedido` | Producto comprado. |
| Order Modifier | Modificador Pedido | `ModificadorPedido` / `modificador_pedido` | Modificador comprado. |
| Order Status History | Historial Estado Pedido | `HistorialEstadoPedido` / `historial_estado_pedido` | Transiciones append-only. |
| Order Event | Evento Pedido | `EventoPedido` / `evento_pedido` | Evento de negocio del pedido. |

### 2.5 Pagos, reembolsos y finanzas

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Payment | Pago | `Pago` / `pago` | Registro de pago provider-neutral. |
| Payment Attempt | Intento Pago | `IntentoPago` / `intento_pago` | Intento con Mercado Pago u otro provider. |
| Refund | Reembolso | `Reembolso` / `reembolso` | Devolución total/parcial. |
| Payment Reconciliation | Conciliación Pago | `ConciliacionPago` / `conciliacion_pago` | Revisión contra provider. |
| Payment Review | Revisión Pago | `RevisionPago` / `revision_pago` | Caso de revisión financiera. |
| Refund Review | Revisión Reembolso | `RevisionReembolso` / `revision_reembolso` | Aprobación/evidencia de reembolso. |
| Fee | Cargo | `Cargo` / `cargo` | Cargo adicional. |
| Discount | Descuento | `Descuento` / `descuento` | Reducción comercial. |
| Tax | Impuesto | `Impuesto` / `impuesto` | Impuesto/tasa. |
| Total | Total | `Total` / `total` | Monto total. |

### 2.6 Promociones y fidelizacion

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Promotion | Promoción | `Promocion` / `promocion` | Campaña/descuento. |
| Promotion Rule | Regla Promoción | `ReglaPromocion` / `regla_promocion` | Regla de elegibilidad/efecto. |
| Coupon | Cupón | `Cupon` / `cupon` | Código o beneficio. |
| Coupon Redemption | Canje Cupón | `CanjeCupon` / `canje_cupon` | Uso de cupón. |
| Loyalty | Fidelización | `Fidelizacion` / `fidelizacion` | Programa de lealtad. |
| Loyalty Account | Cuenta Fidelización | `CuentaFidelizacion` / `cuenta_fidelizacion` | Cuenta del cliente. |
| Loyalty Ledger | Libro Fidelización | `LibroFidelizacion` / `libro_fidelizacion` | Ledger append-only de puntos. |
| Loyalty Transaction | Movimiento Fidelización | `MovimientoFidelizacion` / `movimiento_fidelizacion` | Movimiento de puntos. |
| Reward | Recompensa | `Recompensa` / `recompensa` | Beneficio ganado/canjeable. |
| Redemption | Canje | `Canje` / `canje` | Acto de usar beneficio. |

### 2.7 Cocina y operaciones

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Kitchen | Cocina | `Cocina` / `cocina` | Operación de preparación. |
| Kitchen Ticket | Ticket Cocina | `TicketCocina` / `ticket_cocina` | Unidad de preparación. |
| Kitchen Station | Estación Cocina | `EstacionCocina` / `estacion_cocina` | Puesto de preparación. |
| Kitchen Assignment | Asignación Cocina | `AsignacionCocina` / `asignacion_cocina` | Asignación a personal/estación. |
| Kitchen Event | Evento Cocina | `EventoCocina` / `evento_cocina` | Evento operativo de cocina. |
| Queue | Cola | `Cola` / `cola` | Cola operativa. |
| Dispatch | Despacho | `Despacho` / `despacho` | Coordinación de salida/entrega. |
| Capacity | Capacidad | `Capacidad` / `capacidad` | Capacidad operativa. |
| Operational Override | Override Operativo | `OverrideOperativo` / `override_operativo` | Cambio manual excepcional. |
| Incident | Incidente | `Incidente` / `incidente` | Evento de degradación/problema. |

### 2.8 Entregas

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Delivery | Entrega | `Entrega` / `entrega` | Flujo de entrega. |
| Delivery Assignment | Asignación Entrega | `AsignacionEntrega` / `asignacion_entrega` | Asignación a repartidor. |
| Delivery Event | Evento Entrega | `EventoEntrega` / `evento_entrega` | Evento de entrega. |
| Delivery Zone | Zona Entrega | `ZonaEntrega` / `zona_entrega` | Área de cobertura. |
| Delivery Proof | Comprobante Entrega | `ComprobanteEntrega` / `comprobante_entrega` | Evidencia de entrega. |
| Pickup | Retiro | `Retiro` / `retiro` | Retiro por cliente/repartidor. |
| Courier | Repartidor | `Repartidor` / `repartidor` | Sinónimo técnico-operativo; preferir repartidor. |
| Tracking | Seguimiento | `Seguimiento` / `seguimiento` | Estado visible de entrega/pedido. |

### 2.9 Notificaciones y soporte

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Notification | Notificación | `Notificacion` / `notificacion` | Comunicación saliente. |
| Notification Template | Plantilla Notificación | `PlantillaNotificacion` / `plantilla_notificacion` | Template versionado. |
| Notification Delivery | Entrega Notificación | `EntregaNotificacion` / `entrega_notificacion` | Intento/resultado de envío. |
| Notification Preference | Preferencia Notificación | `PreferenciaNotificacion` / `preferencia_notificacion` | Preferencia del cliente. |
| Support | Soporte | `Soporte` / `soporte` | Atención al cliente/operación. |
| Support Case | Caso Soporte | `CasoSoporte` / `caso_soporte` | Caso de soporte. |
| Support Interaction | Interacción Soporte | `InteraccionSoporte` / `interaccion_soporte` | Mensaje/contacto. |
| Support Action | Acción Soporte | `AccionSoporte` / `accion_soporte` | Acción ejecutada por soporte. |

### 2.10 Analitica de negocio

| English deprecated | Español humano | Identificador canónico | Uso |
| --- | --- | --- | --- |
| Analytics Event | Evento Analítica | `EventoAnalitica` / `evento_analitica` | Evento de tracking. |
| Operational Metric | Métrica Operativa | `MetricaOperativa` / `metrica_operativa` | Métrica operacional. |
| Business Metric | Métrica Negocio | `MetricaNegocio` / `metrica_negocio` | Métrica comercial. |
| Customer Analytics | Analítica Clientes | `AnaliticaClientes` / `analitica_clientes` | Análisis de clientes. |
| Sales Analytics | Analítica Ventas | `AnaliticaVentas` / `analitica_ventas` | Análisis comercial. |
| Branch Analytics | Analítica Sucursales | `AnaliticaSucursales` / `analitica_sucursales` | Análisis por sucursal. |

---

## 3. Canonical Domain Map

### 3.1 Dominios canónicos

| Dominio anterior/deprecated | Dominio canónico | Carpeta canónica | Owner principal |
| --- | --- | --- | --- |
| `domains/shared-kernel` | `nucleo-compartido` | `domains/nucleo-compartido` | Architecture Council |
| `domains/audit-compliance` | `audit-compliance` | `domains/audit-compliance` | Security/Governance; técnico permitido por política |
| `domains/identity-access` | `identidad-acceso` | `domains/identidad-acceso` | Security Platform |
| `domains/tenant-branch` | `organizaciones-sucursales` | `domains/organizaciones-sucursales` | Platform/Tenant Team |
| `domains/catalog-menu` | `catalogo-menu` | `domains/catalogo-menu` | Commerce Team |
| `domains/cart-checkout` | `carrito-finalizacion-compra` | `domains/carrito-finalizacion-compra` | Commerce Team |
| `domains/orders` | `pedidos` | `domains/pedidos` | Orders/Commerce Team |
| `domains/payments` | `pagos` | `domains/pagos` | Payments Team |
| `domains/kitchen` | `cocina` | `domains/cocina` | Operations Team |
| `domains/delivery` | `entregas` | `domains/entregas` | Delivery Team |
| `domains/notifications` | `notificaciones` | `domains/notificaciones` | Notifications Team |
| `domains/promotions-loyalty` | `promociones-fidelizacion` | `domains/promociones-fidelizacion` | Growth/Commerce Team |
| `domains/support` | `soporte` | `domains/soporte` | Support Engineering |
| `domains/analytics` | `analytics` | `domains/analytics` | Data Platform; técnico permitido |
| `domains/platform-admin` | `administracion-plataforma` | `domains/administracion-plataforma` | Platform Admin Team |

### 3.2 Reglas para carpetas de dominio

- Carpetas de dominio de negocio: español, kebab-case, sin tildes.
- Carpetas de infraestructura técnica: inglés permitido.
- Si una carpeta mezcla negocio y técnica, la parte de negocio va en español y la técnica en inglés.
- Ejemplos correctos: `pedidos`, `pagos`, `cocina`, `entregas`, `promociones-fidelizacion`, `administracion-plataforma`.
- Ejemplos incorrectos: `orders`, `payments`, `kitchen`, `delivery`, `promotions-loyalty`, `platform-admin`.

### 3.3 Módulos internos de dominio

Los subfolders técnicos permanecen en inglés porque describen patrón técnico:

```text
domains/pedidos/
├── model/
├── commands/
├── queries/
├── services/
├── repositories/
├── policies/
├── events/
├── workers/
├── projections/
├── integrations/
└── tests/
```

Los nombres de archivos dentro de esos subfolders deben usar español para conceptos de negocio:

- Correcto: `crear-pedido.command.ts`, `pedido-creado.event.ts`, `pedido-repository.ts`.
- Incorrecto: `create-order.command.ts`, `order-created.event.ts`, `order-repository.ts`.

---

## 4. Canonical Database Dictionary

### 4.1 Reglas generales de base de datos

- Tablas y columnas de negocio: español, snake_case, sin tildes.
- Schemas técnicos: conservar inglés: `app_public`, `app_private`, `app_internal`, `audit`, `analytics`, `storage_meta`.
- Columnas técnicas transversales pueden estar en inglés si son estándar técnico: `id`, `created_at`, `updated_at`, `deleted_at`, `metadata`, `payload`, `version`, `status`.
- Columnas de negocio deben estar en español: `organizacion_id`, `sucursal_id`, `cliente_usuario_id`, `estado_pedido`, `motivo_cancelacion`.
- Para compatibilidad PostgreSQL, no usar ñ ni tildes en identificadores: `direccion`, `promocion`, `telefono`, `codigo`.

### 4.2 Tablas canónicas por dominio

| Deprecated table | Tabla canónica | Schema recomendado | Dominio |
| --- | --- | --- | --- |
| `organizations` | `organizaciones` | `app_public` | organizaciones-sucursales |
| `brands` | `marcas` | `app_public` | organizaciones-sucursales |
| `branches` | `sucursales` | `app_public` | organizaciones-sucursales |
| `branch_settings` | `configuracion_sucursal` | `app_private` | organizaciones-sucursales |
| `branch_hours` | `horarios_sucursal` | `app_public` | organizaciones-sucursales |
| `branch_hour_exceptions` | `excepciones_horario_sucursal` | `app_public` | organizaciones-sucursales |
| `branch_delivery_zones` | `zonas_entrega_sucursal` | `app_public` | entregas |
| `branch_operational_settings` | `configuracion_operativa_sucursal` | `app_private` | organizaciones-sucursales |
| `profiles` | `perfiles` | `app_public` | identidad-acceso |
| `user_private_profiles` | `perfiles_privados_usuario` | `app_private` | identidad-acceso |
| `roles` | `roles` | `app_private` | identidad-acceso |
| `permissions` | `permisos` | `app_private` | identidad-acceso |
| `role_permissions` | `permisos_rol` | `app_private` | identidad-acceso |
| `user_roles` | `roles_usuario` | `app_private` | identidad-acceso |
| `sessions` | `sesiones` | `app_private` | identidad-acceso |
| `categories` | `categorias` | `app_public` | catalogo-menu |
| `menu_items` | `productos_menu` | `app_public` | catalogo-menu |
| `modifier_groups` | `grupos_modificadores` | `app_public` | catalogo-menu |
| `modifiers` | `modificadores` | `app_public` | catalogo-menu |
| `menu_item_modifier_groups` | `grupos_modificadores_producto_menu` | `app_public` | catalogo-menu |
| `combos` | `combos` | `app_public` | catalogo-menu |
| `combo_items` | `items_combo` | `app_public` | catalogo-menu |
| `images` | `imagenes` | `app_public` | catalogo-menu/marca |
| `availability_rules` | `reglas_disponibilidad` | `app_public` | catalogo-menu |
| `menu_item_branch_overrides` | `overrides_producto_menu_sucursal` | `app_public` | catalogo-menu |
| `carts` | `carritos` | `app_public` | carrito-finalizacion-compra |
| `cart_items` | `items_carrito` | `app_public` | carrito-finalizacion-compra |
| `cart_modifiers` | `modificadores_carrito` | `app_public` | carrito-finalizacion-compra |
| `checkout_sessions` | `sesiones_finalizacion_compra` | `app_private` | carrito-finalizacion-compra |
| `orders` | `pedidos` | `app_public` | pedidos |
| `order_items` | `items_pedido` | `app_public` | pedidos |
| `order_modifiers` | `modificadores_pedido` | `app_public` | pedidos |
| `order_status_history` | `historial_estado_pedido` | `app_private` | pedidos |
| `order_events` | `eventos_pedido` | `app_internal` | pedidos |
| `payments` | `pagos` | `app_private` | pagos |
| `payment_attempts` | `intentos_pago` | `app_private` | pagos |
| `payment_webhooks` | `webhooks_pago` | `app_private` | pagos; `webhook` técnico permitido |
| `refunds` | `reembolsos` | `app_private` | pagos |
| `payment_reconciliations` | `conciliaciones_pago` | `app_private` | pagos |
| `promotions` | `promociones` | `app_public` | promociones-fidelizacion |
| `promotion_rules` | `reglas_promocion` | `app_private` | promociones-fidelizacion |
| `coupons` | `cupones` | `app_public` | promociones-fidelizacion |
| `coupon_redemptions` | `canjes_cupon` | `app_private` | promociones-fidelizacion |
| `loyalty_accounts` | `cuentas_fidelizacion` | `app_private` | promociones-fidelizacion |
| `loyalty_ledger` | `libro_fidelizacion` | `app_private` | promociones-fidelizacion |
| `rewards` | `recompensas` | `app_public` | promociones-fidelizacion |
| `kitchen_stations` | `estaciones_cocina` | `app_public` | cocina |
| `kitchen_tickets` | `tickets_cocina` | `app_public` | cocina |
| `kitchen_ticket_items` | `items_ticket_cocina` | `app_public` | cocina |
| `kitchen_assignments` | `asignaciones_cocina` | `app_private` | cocina |
| `kitchen_events` | `eventos_cocina` | `app_internal` | cocina |
| `drivers` | `repartidores` | `app_private` | entregas |
| `delivery_assignments` | `asignaciones_entrega` | `app_public` | entregas |
| `delivery_events` | `eventos_entrega` | `app_internal` | entregas |
| `delivery_zones` | `zonas_entrega` | `app_public` | entregas |
| `delivery_proofs` | `comprobantes_entrega` | `app_private` | entregas |
| `notification_templates` | `plantillas_notificacion` | `app_private` | notificaciones |
| `notification_events` | `eventos_notificacion` | `app_internal` | notificaciones |
| `notification_deliveries` | `entregas_notificacion` | `app_private` | notificaciones |
| `notification_preferences` | `preferencias_notificacion` | `app_public` | notificaciones |
| `support_cases` | `casos_soporte` | `app_private` | soporte |
| `support_interactions` | `interacciones_soporte` | `app_private` | soporte |
| `support_actions` | `acciones_soporte` | `app_private` | soporte |
| `audit_events` | `eventos_audit` | `audit` | audit-compliance; `audit` técnico permitido |
| `audit_logs` | `logs_audit` | `audit` | audit-compliance |
| `security_events` | `eventos_seguridad` | `audit` | audit-compliance |
| `compliance_events` | `eventos_compliance` | `audit` | audit-compliance; `compliance` técnico-regulatorio permitido |
| `permission_changes` | `cambios_permisos` | `audit` | audit-compliance |
| `operational_overrides` | `overrides_operativos` | `audit` | audit-compliance/operaciones |
| `incident_records` | `registros_incidente` | `audit` | audit-compliance |
| `outbox_events` | `outbox_events` | `app_internal` | event platform; técnico permitido |
| `event_consumers` | `event_consumers` | `app_internal` | event platform; técnico permitido |
| `replay_operations` | `replay_operations` | `app_internal` | event platform; técnico permitido |
| `analytics_events` | `analytics_events` | `analytics` | analytics; técnico permitido |
| `operational_metrics` | `metricas_operativas` | `analytics` | analytics |
| `business_metrics` | `metricas_negocio` | `analytics` | analytics |

### 4.3 Columnas canónicas frecuentes

| Deprecated column | Columna canónica | Regla |
| --- | --- | --- |
| `organization_id` | `organizacion_id` | FK tenant de negocio. |
| `branch_id` | `sucursal_id` | FK sucursal. |
| `brand_id` | `marca_id` | FK marca. |
| `customer_user_id` | `cliente_usuario_id` | Usuario cliente. |
| `driver_id` | `repartidor_id` | Repartidor. |
| `order_id` | `pedido_id` | Pedido. |
| `order_item_id` | `item_pedido_id` | Item pedido. |
| `payment_id` | `pago_id` | Pago. |
| `refund_id` | `reembolso_id` | Reembolso. |
| `cart_id` | `carrito_id` | Carrito. |
| `cart_item_id` | `item_carrito_id` | Item carrito. |
| `coupon_id` | `cupon_id` | Cupón. |
| `promotion_id` | `promocion_id` | Promoción. |
| `loyalty_account_id` | `cuenta_fidelizacion_id` | Cuenta fidelización. |
| `kitchen_ticket_id` | `ticket_cocina_id` | Ticket cocina. |
| `delivery_assignment_id` | `asignacion_entrega_id` | Asignación entrega. |
| `support_case_id` | `caso_soporte_id` | Caso soporte. |
| `status` | `estado` cuando representa negocio | `status` permitido si es estado técnico de worker/outbox. |
| `reason` | `motivo` | Motivo de negocio. |
| `display_name` | `nombre_mostrar` | Label de negocio. |
| `description` | `descripcion` | Descripción de negocio. |
| `address` | `direccion` | Dirección. |
| `phone` | `telefono` | Teléfono. |
| `currency_code` | `codigo_moneda` | Dinero. |
| `amount_minor` | `monto_minor` | Dinero en unidad menor. |
| `subtotal_amount_minor` | `subtotal_monto_minor` | Total parcial. |
| `discount_amount_minor` | `descuento_monto_minor` | Descuento. |
| `delivery_fee_amount_minor` | `cargo_entrega_monto_minor` | Cargo entrega. |
| `tax_amount_minor` | `impuesto_monto_minor` | Impuesto. |
| `total_amount_minor` | `total_monto_minor` | Total. |
| `expires_at` | `expira_at` o `expires_at` | Si es expiración de negocio usar `expira_at`; si TTL técnico, `expires_at`. |
| `created_at` | `created_at` | Técnico estándar, mantener inglés. |
| `updated_at` | `updated_at` | Técnico estándar, mantener inglés. |
| `deleted_at` | `deleted_at` | Técnico estándar, mantener inglés. |

### 4.4 Estados canónicos de negocio

| Contexto | English deprecated | Español canónico para enum/status |
| --- | --- | --- |
| General | `draft` | `borrador` |
| General | `active` | `activo` |
| General | `inactive` | `inactivo` |
| General | `archived` | `archivado` |
| General | `cancelled` | `cancelado` |
| General | `expired` | `expirado` |
| Pedido | `created` | `creado` |
| Pedido | `awaiting_payment` | `esperando_pago` |
| Pedido | `paid` | `pagado` |
| Pedido | `accepted` | `aceptado` |
| Pedido | `preparing` | `en_preparacion` |
| Pedido | `ready` | `listo` |
| Pedido | `dispatched` | `despachado` |
| Pedido | `completed` | `completado` |
| Pago | `pending` | `pendiente` |
| Pago | `approved` | `aprobado` |
| Pago | `rejected` | `rechazado` |
| Pago | `refunded` | `reembolsado` |
| Pago | `partially_refunded` | `reembolsado_parcial` |
| Reembolso | `requested` | `solicitado` |
| Reembolso | `under_review` | `en_revision` |
| Reembolso | `submitted` | `enviado` |
| Cocina | `queued` | `en_cola` |
| Cocina | `claimed` | `tomado` |
| Cocina | `blocked` | `bloqueado` |
| Cocina | `handed_off` | `entregado_a_despacho` |
| Entrega | `assigned` | `asignada` |
| Entrega | `picking_up` | `retirando` |
| Entrega | `picked_up` | `retirado` |
| Entrega | `en_route` | `en_camino` |
| Entrega | `delivered` | `entregado` |
| Entrega | `failed` | `fallido` |
| Notificación | `sent` | `enviada` |
| Notificación | `delivered` | `entregada` |
| Notificación | `suppressed` | `suprimida` |
| Soporte | `open` | `abierto` |
| Soporte | `triaged` | `triageado` |
| Soporte | `resolved` | `resuelto` |
| Soporte | `closed` | `cerrado` |

---

## 5. Canonical Event Dictionary

### 5.1 Regla de eventos

Los nombres de eventos mantienen la infraestructura técnica de `event`, versionado y metadata en inglés, pero el nombre de evento de negocio usa español.

Formato canónico:

```text
<dominio_es>.<agregado_es>.<accion_pasado_es>.v<major>
```

Ejemplos:

- `pedidos.pedido.creado.v1`
- `pagos.pago.aprobado.v1`
- `entregas.entrega.asignada.v1`

### 5.2 Eventos de pedidos

| Deprecated event | Evento canónico |
| --- | --- |
| `orders.order.created.v1` | `pedidos.pedido.creado.v1` |
| `orders.order.confirmed.v1` | `pedidos.pedido.confirmado.v1` |
| `orders.order.status_changed.v1` | `pedidos.pedido.estado_cambiado.v1` |
| `orders.order.cancelled.v1` | `pedidos.pedido.cancelado.v1` |
| `orders.order.completed.v1` | `pedidos.pedido.completado.v1` |
| `orders.order.refund_linked.v1` | `pedidos.pedido.reembolso_asociado.v1` |

### 5.3 Eventos de pagos y reembolsos

| Deprecated event | Evento canónico |
| --- | --- |
| `payments.payment.created.v1` | `pagos.pago.creado.v1` |
| `payments.payment.preference_created.v1` | `pagos.pago.preferencia_creada.v1` |
| `payments.payment.approved.v1` | `pagos.pago.aprobado.v1` |
| `payments.payment.rejected.v1` | `pagos.pago.rechazado.v1` |
| `payments.payment.reconciled.v1` | `pagos.pago.conciliado.v1` |
| `payments.refund.requested.v1` | `pagos.reembolso.solicitado.v1` |
| `payments.refund.approved.v1` | `pagos.reembolso.aprobado.v1` |
| `payments.refund.rejected.v1` | `pagos.reembolso.rechazado.v1` |
| `payments.refund.completed.v1` | `pagos.reembolso.completado.v1` |

### 5.4 Eventos de catalogo y promociones

| Deprecated event | Evento canónico |
| --- | --- |
| `catalog.item.created.v1` | `catalogo.producto_menu.creado.v1` |
| `catalog.item.price_changed.v1` | `catalogo.producto_menu.precio_cambiado.v1` |
| `catalog.item.availability_changed.v1` | `catalogo.producto_menu.disponibilidad_cambiada.v1` |
| `catalog.category.visibility_changed.v1` | `catalogo.categoria.visibilidad_cambiada.v1` |
| `promotions.promotion.created.v1` | `promociones.promocion.creada.v1` |
| `promotions.promotion.approved.v1` | `promociones.promocion.aprobada.v1` |
| `promotions.coupon.redeemed.v1` | `promociones.cupon.canjeado.v1` |
| `loyalty.points.adjusted.v1` | `fidelizacion.puntos.ajustados.v1` |
| `loyalty.reward.redeemed.v1` | `fidelizacion.recompensa.canjeada.v1` |

### 5.5 Eventos de cocina y entregas

| Deprecated event | Evento canónico |
| --- | --- |
| `kitchen.ticket.created.v1` | `cocina.ticket_cocina.creado.v1` |
| `kitchen.ticket.claimed.v1` | `cocina.ticket_cocina.tomado.v1` |
| `kitchen.ticket.blocked.v1` | `cocina.ticket_cocina.bloqueado.v1` |
| `kitchen.ticket.ready.v1` | `cocina.ticket_cocina.listo.v1` |
| `delivery.assignment.created.v1` | `entregas.asignacion_entrega.creada.v1` |
| `delivery.assignment.changed.v1` | `entregas.asignacion_entrega.cambiada.v1` |
| `delivery.delivery.delivered.v1` | `entregas.entrega.entregada.v1` |
| `delivery.delivery.failed.v1` | `entregas.entrega.fallida.v1` |

### 5.6 Eventos de notificaciones, soporte y sucursales

| Deprecated event | Evento canónico |
| --- | --- |
| `notifications.notification.sent.v1` | `notificaciones.notificacion.enviada.v1` |
| `notifications.notification.delivered.v1` | `notificaciones.notificacion.entregada.v1` |
| `notifications.template.approved.v1` | `notificaciones.plantilla.aprobada.v1` |
| `support.case.created.v1` | `soporte.caso_soporte.creado.v1` |
| `support.action.performed.v1` | `soporte.accion_soporte.ejecutada.v1` |
| `tenant.branch.status_changed.v1` | `sucursales.sucursal.estado_cambiado.v1` |
| `tenant.branch.hours_changed.v1` | `sucursales.sucursal.horarios_cambiados.v1` |
| `tenant.branch.delivery_zone_changed.v1` | `sucursales.zona_entrega.cambiada.v1` |

### 5.7 Eventos audit-compliance

`audit` y `compliance` permanecen en inglés como capacidades técnicas/regulatorias, pero el objeto de negocio dentro del evento se nombra en español.

| Deprecated event | Evento canónico |
| --- | --- |
| `audit.permission.changed.v1` | `audit.permiso.cambiado.v1` |
| `audit.operational_override.created.v1` | `audit.override_operativo.creado.v1` |
| `audit.incident.created.v1` | `audit.incidente.creado.v1` |
| `audit.audit_export.requested.v1` | `audit.export_audit.solicitado.v1` |
| `security.support_access.granted.v1` | `security.acceso_soporte.otorgado.v1` |

---

## 6. Canonical API Dictionary

### 6.1 Regla de APIs

- El sufijo técnico queda en inglés: `Command`, `Query`, `DTO`, `Request`, `Response`, `Controller`, `Service`, `Repository`.
- El concepto y verbo de negocio van en español.
- Los paths de API de negocio usan español sin tildes.
- `api`, `v1`, `webhook`, `health`, `internal` permanecen en inglés.

### 6.2 Commands

| Deprecated | Canónico |
| --- | --- |
| `CreateOrderCommand` | `CrearPedidoCommand` |
| `CancelOrderCommand` | `CancelarPedidoCommand` |
| `ValidateCartCommand` | `ValidarCarritoCommand` |
| `StartCheckoutCommand` | `IniciarFinalizacionCompraCommand` |
| `CreatePaymentPreferenceCommand` | `CrearPreferenciaPagoCommand` |
| `RequestRefundCommand` | `SolicitarReembolsoCommand` |
| `ApproveRefundCommand` | `AprobarReembolsoCommand` |
| `ClaimKitchenTicketCommand` | `TomarTicketCocinaCommand` |
| `AssignDeliveryCommand` | `AsignarEntregaCommand` |
| `RedeemCouponCommand` | `CanjearCuponCommand` |
| `AdjustLoyaltyPointsCommand` | `AjustarPuntosFidelizacionCommand` |
| `CreateSupportCaseCommand` | `CrearCasoSoporteCommand` |
| `UpdateBranchHoursCommand` | `ActualizarHorariosSucursalCommand` |

### 6.3 Queries

| Deprecated | Canónico |
| --- | --- |
| `GetOrderQuery` | `ObtenerPedidoQuery` |
| `ListOrdersQuery` | `ListarPedidosQuery` |
| `ListBranchOrdersQuery` | `ListarPedidosSucursalQuery` |
| `GetCustomerProfileQuery` | `ObtenerPerfilClienteQuery` |
| `ListMenuItemsQuery` | `ListarProductosMenuQuery` |
| `GetCartQuery` | `ObtenerCarritoQuery` |
| `GetPaymentQuery` | `ObtenerPagoQuery` |
| `ListKitchenTicketsQuery` | `ListarTicketsCocinaQuery` |
| `ListDeliveryAssignmentsQuery` | `ListarAsignacionesEntregaQuery` |
| `ListPromotionsQuery` | `ListarPromocionesQuery` |
| `GetSupportCaseQuery` | `ObtenerCasoSoporteQuery` |

### 6.4 DTOs, Request Models y Response Models

| Deprecated | Canónico |
| --- | --- |
| `OrderDTO` | `PedidoDTO` |
| `OrderResponse` | `PedidoResponse` |
| `OrderRequest` | `PedidoRequest` |
| `CartDTO` | `CarritoDTO` |
| `CartItemDTO` | `ItemCarritoDTO` |
| `PaymentDTO` | `PagoDTO` |
| `RefundDTO` | `ReembolsoDTO` |
| `CustomerProfile` | `PerfilCliente` |
| `BranchDTO` | `SucursalDTO` |
| `MenuItemDTO` | `ProductoMenuDTO` |
| `PromotionDTO` | `PromocionDTO` |
| `CouponDTO` | `CuponDTO` |
| `DeliveryAssignmentDTO` | `AsignacionEntregaDTO` |
| `KitchenTicketDTO` | `TicketCocinaDTO` |
| `NotificationDTO` | `NotificacionDTO` |
| `SupportCaseDTO` | `CasoSoporteDTO` |

### 6.5 API paths

| Deprecated path | Path canónico |
| --- | --- |
| `/api/v1/orders/create` | `/api/v1/pedidos/crear` |
| `/api/v1/orders/{orderId}` | `/api/v1/pedidos/{pedidoId}` |
| `/api/v1/cart/validate` | `/api/v1/carrito/validar` |
| `/api/v1/checkout/start` | `/api/v1/finalizacion-compra/iniciar` |
| `/api/v1/payments/mercado-pago/webhook` | `/api/v1/pagos/mercado-pago/webhook` |
| `/api/v1/refunds/request` | `/api/v1/reembolsos/solicitar` |
| `/api/v1/kitchen/tickets/claim` | `/api/v1/cocina/tickets/tomar` |
| `/api/v1/delivery/assignments` | `/api/v1/entregas/asignaciones` |
| `/api/v1/promotions` | `/api/v1/promociones` |
| `/api/v1/support/cases` | `/api/v1/soporte/casos` |

---

## 7. Shared Kernel Dictionary

### 7.1 Value Objects y conceptos compartidos

| Deprecated | Español humano | Identificador canónico | Nota |
| --- | --- | --- | --- |
| Money | Dinero | `Dinero` | Monto + moneda. |
| Currency | Moneda | `Moneda` | Código moneda. |
| Address | Dirección | `Direccion` | Dirección postal/entrega. |
| Email | Correo Electrónico | `CorreoElectronico` | Email como contacto; `email` técnico en providers permitido. |
| Phone | Teléfono | `Telefono` | Contacto telefónico. |
| Coordinates | Coordenadas | `Coordenadas` | Latitud/longitud. |
| GeoArea | Área Geográfica | `AreaGeografica` | Zona/radio/polígono. |
| DateRange | Rango Fechas | `RangoFechas` | Rango de fechas. |
| TimeRange | Rango Horarios | `RangoHorarios` | Rango de hora del día. |
| BusinessHours | Horario Comercial | `HorarioComercial` | Horarios de atención. |
| ImageAsset | Asset Imagen | `AssetImagen` | `asset` técnico permitido; negocio imagen. |
| AuditMetadata | Metadata Audit | `MetadataAudit` | `audit` técnico permitido. |
| TenantContext | Contexto Organización | `ContextoOrganizacion` | Para negocio usar organización; `tenant` solo técnico. |
| BranchContext | Contexto Sucursal | `ContextoSucursal` | Scope operativo. |
| Pagination | Paginación | `Paginacion` | Concepto API; técnico-negocio transversal. |
| DomainError | Error Dominio | `ErrorDominio` | Error de dominio. |
| DomainEventMetadata | Metadata Event Dominio | `MetadataEventDominio` | `event` técnico permitido. |

### 7.2 Reglas del nucleo compartido

- `domains/nucleo-compartido` es el nombre canónico del shared kernel.
- Value Objects de negocio en español.
- Subfolders técnicos como `concepts`, `policies`, `tests` pueden permanecer en inglés.
- Si el concepto está presente en tablas, eventos y APIs, el nombre español debe coincidir en los tres niveles.

---

## 8. Domain Types Dictionary

### 8.1 Tipos de dominio canónicos

| Deprecated Type | Tipo canónico |
| --- | --- |
| `Organization` | `Organizacion` |
| `Brand` | `Marca` |
| `Branch` | `Sucursal` |
| `Customer` | `Cliente` |
| `Address` | `Direccion` |
| `MenuItem` | `ProductoMenu` |
| `Category` | `Categoria` |
| `Modifier` | `Modificador` |
| `ModifierGroup` | `GrupoModificadores` |
| `Combo` | `Combo` |
| `Cart` | `Carrito` |
| `CartItem` | `ItemCarrito` |
| `Order` | `Pedido` |
| `OrderItem` | `ItemPedido` |
| `Payment` | `Pago` |
| `PaymentAttempt` | `IntentoPago` |
| `Refund` | `Reembolso` |
| `Delivery` | `Entrega` |
| `DeliveryAssignment` | `AsignacionEntrega` |
| `Driver` | `Repartidor` |
| `KitchenTicket` | `TicketCocina` |
| `KitchenStation` | `EstacionCocina` |
| `Notification` | `Notificacion` |
| `NotificationTemplate` | `PlantillaNotificacion` |
| `Coupon` | `Cupon` |
| `Promotion` | `Promocion` |
| `PromotionRule` | `ReglaPromocion` |
| `LoyaltyAccount` | `CuentaFidelizacion` |
| `LoyaltyTransaction` | `MovimientoFidelizacion` |
| `Reward` | `Recompensa` |
| `SupportCase` | `CasoSoporte` |
| `IncidentRecord` | `RegistroIncidente` |
| `AuditEvent` | `EventoAudit` |
| `AnalyticsEvent` | `EventoAnalytics` |
| `UserMembership` | `MembresiaUsuario` |
| `Role` | `Rol` |
| `Permission` | `Permiso` |
| `FeatureFlag` | `FeatureFlag` si es técnica; `BanderaFuncionalidad` si negocio/admin label |

### 8.2 Reglas para `packages/domain-types`

- El paquete técnico conserva el nombre `packages/domain-types` porque `package` y `types` son términos técnicos.
- Los tipos exportados de negocio deben estar en español.
- Los nombres de lifecycle/status de negocio deben estar en español.
- Los nombres de propiedades de negocio en DTOs deben estar en español cuando cruzan contratos propios de la plataforma.
- Integraciones externas pueden tener adapter/mapping con nombres del provider, pero no contaminar el dominio interno.

---

## 9. Operational UX Dictionary

### 9.1 Labels administrativos y operativos

| Deprecated UX Label | Label canónico |
| --- | --- |
| Kitchen Dashboard | Panel Cocina |
| Order Queue | Cola Pedidos |
| Delivery Queue | Cola Entregas |
| Branch Dashboard | Panel Sucursal |
| Operations Center | Centro Operaciones |
| Customer Analytics | Analítica Clientes |
| Sales Analytics | Analítica Ventas |
| Branch Operations | Operaciones Sucursal |
| Menu Management | Gestión Menú |
| Promotions Management | Gestión Promociones |
| Loyalty Management | Gestión Fidelización |
| Payment Reconciliation | Conciliación Pagos |
| Refund Review | Revisión Reembolsos |
| Support Inbox | Bandeja Soporte |
| Incident Center | Centro Incidentes |
| Availability Controls | Controles Disponibilidad |
| Delivery Dispatch | Despacho Entregas |
| Pickup Queue | Cola Retiros |
| Staff Settings | Configuración Personal |
| Audit Log | Log Audit |
| Access Review | Revisión Accesos |

### 9.2 Labels de cliente

| Deprecated UX Label | Label canónico |
| --- | --- |
| Menu | Menú |
| Cart | Carrito |
| Checkout | Finalizar Compra |
| Order Tracking | Seguimiento Pedido |
| My Orders | Mis Pedidos |
| Reorder | Volver a Pedir |
| Loyalty | Fidelización |
| Rewards | Recompensas |
| Account | Cuenta |
| Help | Ayuda |
| Delivery Address | Dirección Entrega |
| Pickup | Retiro |
| Delivery | Entrega |
| Payment | Pago |
| Coupon | Cupón |

### 9.3 Reglas de UX

- Labels visibles para usuarios, staff, administradores y franquicias deben estar en español rioplatense neutro.
- Términos técnicos internos no deben aparecer en UX si existe equivalente de negocio.
- `Dashboard` debe evitarse en label final si `Panel` es suficiente.
- `Analytics` puede aparecer como `Analítica` en negocio; la plataforma técnica puede seguir usando `analytics`.

---

## 10. Code Style Policy

### 10.1 Clases, interfaces y types

| Tipo | Regla | Correcto | Incorrecto |
| --- | --- | --- | --- |
| Clase de negocio | PascalCase español + sufijo técnico si aplica | `PedidoService`, `PagoRepository` | `OrderService`, `PaymentRepository` |
| Interface | `I` no obligatoria; concepto en español | `PedidoRepository`, `ClienteProvider` | `OrderRepository` |
| Type | PascalCase español | `Pedido`, `ItemPedido` | `Order`, `OrderItem` |
| Enum | PascalCase español | `EstadoPedido` | `OrderStatus` |
| Enum values | snake_case español | `esperando_pago`, `en_preparacion` | `awaiting_payment`, `preparing` |
| DTO | Concepto español + DTO | `PedidoDTO`, `PagoDTO` | `OrderDTO`, `PaymentDTO` |

### 10.2 Commands y Queries

| Tipo | Regla | Correcto | Incorrecto |
| --- | --- | --- | --- |
| Command | Verbo español infinitivo/acción + concepto + `Command` | `CrearPedidoCommand` | `CreateOrderCommand` |
| Query | Verbo español + concepto + `Query` | `ObtenerPedidoQuery` | `GetOrderQuery` |
| Handler | Nombre del command/query + `Handler` | `CrearPedidoCommandHandler` | `CreateOrderCommandHandler` |
| Request | Concepto español + `Request` | `CrearPedidoRequest` | `CreateOrderRequest` |
| Response | Concepto español + `Response` | `PedidoResponse` | `OrderResponse` |

### 10.3 Repositories y Services

Los sufijos técnicos se mantienen en inglés, pero el concepto de negocio va en español.

Correcto:

- `PedidoRepository`
- `PagoRepository`
- `TicketCocinaRepository`
- `CrearPedidoService`
- `ConciliarPagoService`

Incorrecto:

- `OrderRepository`
- `PaymentRepository`
- `KitchenTicketRepository`
- `CreateOrderService`
- `ReconcilePaymentService`

### 10.4 Tablas y columnas

| Elemento | Regla | Correcto | Incorrecto |
| --- | --- | --- | --- |
| Tabla de negocio | snake_case español plural | `pedidos` | `orders` |
| Tabla relación | snake_case español por relación | `permisos_rol` | `role_permissions` |
| FK negocio | singular español + `_id` | `pedido_id` | `order_id` |
| Columna estado negocio | `estado` o `estado_<concepto>` | `estado_pedido` | `order_status` |
| Técnico timestamps | Inglés estándar | `created_at` | `creado_en` |
| Técnico metadata | Inglés permitido | `metadata`, `payload` | N/A |

### 10.5 Eventos

| Elemento | Regla | Correcto | Incorrecto |
| --- | --- | --- | --- |
| Evento negocio | dominio.agregado.accion.vN en español | `pedidos.pedido.creado.v1` | `orders.order.created.v1` |
| Metadata técnica | Inglés | `correlation_id`, `causation_id`, `event_version` | `correlacion_id` |
| Payload negocio | Campos de negocio en español | `pedido_id`, `estado` | `order_id`, `status` |

### 10.6 APIs

| Elemento | Regla | Correcto | Incorrecto |
| --- | --- | --- | --- |
| Path negocio | Español kebab-case | `/api/v1/pedidos/crear` | `/api/v1/orders/create` |
| Path técnico | Inglés permitido | `/api/v1/health`, `/api/v1/webhooks` | N/A |
| Mercado Pago webhook | Mixto permitido | `/api/v1/pagos/mercado-pago/webhook` | `/api/v1/payments/mercado-pago/webhook` |

---

## 11. Language Governance Policy

### 11.1 Patrones permitidos

Permitido:

- Negocio en español + sufijo técnico en inglés: `PedidoRepository`, `CrearPedidoCommand`, `PedidoDTO`.
- Schemas técnicos en inglés: `audit`, `analytics`, `app_internal`.
- Packages técnicos en inglés: `packages/contracts`, `packages/events`, `packages/domain-types`.
- Provider names oficiales: Mercado Pago, Supabase, Vercel.
- Protocolos y estándares: API, JWT, OAuth, RLS, Webhook.
- Columnas técnicas ampliamente estándar: `id`, `created_at`, `updated_at`, `deleted_at`, `metadata`, `payload`, `version`.

### 11.2 Patrones prohibidos

Prohibido:

- Nuevos dominios de negocio en inglés: `orders`, `payments`, `delivery`, `support`.
- Nuevas entidades de negocio en inglés: `Order`, `Payment`, `Customer`, `Branch`.
- Nuevas tablas de negocio en inglés: `orders`, `payment_attempts`, `delivery_assignments`.
- Eventos de negocio en inglés: `order.created`, `payment.approved`.
- DTOs de negocio en inglés: `OrderDTO`, `PaymentResponse`.
- Labels UX de negocio en inglés: `Kitchen Dashboard`, `Order Queue`.
- Mezclas innecesarias: `PedidoStatus`, `OrderEstado`, `ClienteProfile`.

### 11.3 Ejemplos correctos e incorrectos

| Contexto | Correcto | Incorrecto |
| --- | --- | --- |
| Dominio | `domains/pedidos` | `domains/orders` |
| Entidad | `Pedido` | `Order` |
| Tabla | `items_pedido` | `order_items` |
| Columna | `pedido_id` | `order_id` |
| Enum | `EstadoPedido.en_preparacion` | `OrderStatus.preparing` |
| Evento | `pedido.creado.v1` | `order.created.v1` |
| Command | `CrearPedidoCommand` | `CreateOrderCommand` |
| Query | `ListarPedidosSucursalQuery` | `ListBranchOrdersQuery` |
| Service | `ConciliarPagoService` | `ReconcilePaymentService` |
| UX | `Panel Cocina` | `Kitchen Dashboard` |

### 11.4 Review process

Toda PR debe revisar lenguaje si toca:

- Dominio.
- Entidad.
- Tabla/columna/enum/status.
- Evento.
- Command/query/DTO.
- API path.
- Label UX.
- Documentación de negocio.
- Métrica o dashboard de negocio.

Checklist obligatorio:

1. ¿El concepto es de negocio? Si sí, debe estar en español.
2. ¿El concepto es técnico? Si sí, debe permanecer en inglés.
3. ¿El identificador usa ASCII sin tildes si es código/base de datos?
4. ¿El label humano usa español correcto y tildes cuando corresponde?
5. ¿El nombre existe en el glosario? Si no existe, requiere revisión de arquitectura.
6. ¿Se introdujo una excepción? Si sí, requiere ADR o RFC.

### 11.5 Reglas de revisión de arquitectura

Architecture Review obligatorio para:

- Nuevo dominio.
- Nueva entidad/agregado.
- Nuevo value object compartido.
- Nuevo evento de negocio.
- Nuevo command/query transversal.
- Nuevo workflow de negocio.
- Cambio de traducción canónica.

La revisión debe validar:

- Consistencia con glosario.
- Coherencia con DDD bounded context.
- Ausencia de mixed-language business naming.
- Compatibilidad con base de datos, eventos, APIs y UX.

### 11.6 Reglas de revisión de base de datos

Database Review obligatorio para:

- Nueva tabla de negocio.
- Nueva columna de negocio.
- Nuevo enum/status de negocio.
- Nueva FK de negocio.
- Nueva vista/read model de negocio.

La revisión debe bloquear:

- Tablas de negocio en inglés.
- Columnas de negocio en inglés.
- Status de negocio en inglés.
- Uso de tildes/ñ en identificadores SQL.
- Nombres ambiguos o no presentes en el diccionario.

### 11.7 Reglas de revisión API

API Review obligatorio para:

- Nuevo endpoint de negocio.
- Nuevo DTO/request/response.
- Nuevo command/query.
- Nuevo event payload público.

La revisión debe validar:

- Path de negocio en español.
- DTO de negocio en español.
- Sufijos técnicos conservados en inglés.
- Provider paths técnicos correctamente aislados.

### 11.8 Reglas de Pull Request

Toda PR que introduzca naming debe incluir una sección:

```text
Language Policy Check
- Business terms introduced:
- Canonical Spanish names used:
- Technical English terms preserved:
- Glossary additions required: yes/no
```

PRs deben ser rechazadas si:

- Introducen business naming en inglés sin ADR.
- Mezclan español/inglés en un mismo concepto de negocio.
- Usan traducciones distintas para un término ya definido.
- Añaden tablas/columnas/eventos/APIs que contradicen este documento.

### 11.9 Proceso para agregar términos al glosario

1. Abrir RFC corto con el concepto nuevo.
2. Indicar contexto de dominio.
3. Proponer español humano e identificador ASCII.
4. Listar impactos en dominio, tablas, eventos, APIs, UX y analytics.
5. Obtener aprobación de Architecture Council y owner de dominio.
6. Actualizar este documento antes de implementar.

---

## 12. Final Standard Output

Este documento produce y oficializa:

1. Language Audit Report.
2. Canonical Business Glossary.
3. Canonical Domain Map.
4. Canonical Database Dictionary.
5. Canonical Event Dictionary.
6. Canonical API Dictionary.
7. Shared Kernel Dictionary.
8. Domain Types Dictionary.
9. Operational UX Dictionary.
10. Language Governance Policy.

La regla final y obligatoria para toda implementación es:

```text
BUSINESS LANGUAGE = SPANISH
TECHNICAL LANGUAGE = ENGLISH
```

Todo término de negocio en inglés que exista en documentos anteriores debe considerarse histórico/deprecated y reemplazarse por el término español canónico definido aquí antes o durante la implementación correspondiente.
