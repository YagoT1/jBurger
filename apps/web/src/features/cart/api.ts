import { apiRequest, type ApiContext } from '../../lib/api/http.js';

/**
 * Carrito server-side (clientes autenticados) — espejo del CartModule existente.
 * El carrito invitado vive en `entities/cart.ts` (núcleo puro) y se fusiona al iniciar
 * sesión vía `POST /cart/merge` (RF-021). Un solo modelo de línea en toda la app.
 */
export interface ServerCartItemDto {
  id: string;
  productId: string;
  quantity: number;
  notas?: string;
}
export interface ServerCartDto {
  id: string;
  version: number;
  status: 'active' | 'converted' | 'expired' | 'abandoned';
  items: ServerCartItemDto[];
}

export const fetchCart = async (context: ApiContext): Promise<ServerCartDto | undefined> => {
  const response = await apiRequest<{ data: ServerCartDto | null }>('/cart', context);
  return response.data ?? undefined;
};

export const addCartItem = async (
  context: ApiContext,
  input: { productId: string; quantity: number; notas?: string; cartVersion?: number },
): Promise<ServerCartDto> => {
  const response = await apiRequest<{ data: ServerCartDto }>('/cart/items', context, {
    method: 'POST',
    body: input,
  });
  return response.data;
};

export const mergeGuestCart = async (
  context: ApiContext,
  items: { productId: string; quantity: number; notas?: string }[],
): Promise<ServerCartDto> => {
  const response = await apiRequest<{ data: { cart: ServerCartDto } }>('/cart/merge', context, {
    method: 'POST',
    body: { items },
  });
  return response.data.cart;
};
