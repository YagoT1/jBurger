/**
 * Única fuente de verdad de las rutas del cliente (Screen Spec §5).
 * Prohibido hardcodear paths en componentes: siempre `ROUTES.*`.
 */
export const ROUTES = {
  menu: '/menu',
  product: (id: string) => `/producto/${id}`,
  cart: '/carrito',
  checkout: {
    identity: '/checkout/identidad',
    delivery: '/checkout/entrega',
    review: '/checkout/revision',
    payment: '/checkout/pago',
    result: (orderId: string) => `/checkout/resultado?order=${orderId}`,
  },
  tracking: (code: string) => `/seguimiento/${code}`,
  auth: '/auth',
  account: {
    orders: '/cuenta/pedidos',
    order: (id: string) => `/cuenta/pedidos/${id}`,
  },
  admin: {
    orders: '/admin/pedidos',
    order: (id: string) => `/admin/pedidos/${id}`,
    catalog: '/admin/catalogo',
    params: '/admin/parametros',
  },
} as const;
