import { addMoney, multiplyMoney, type Money } from './money.js';
import type { Product } from './product.js';

/**
 * Carrito del cliente — núcleo funcional puro (Functional Core: sin IO, sin React).
 * Para invitados vive local; para registrados se sincroniza con CartModule.
 * El total calculado aquí es SIEMPRE preview (RN-030): el compromiso ocurre en checkout.
 */
export interface CartLine {
  productId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  extraPatties: number;
  variant?: 'burger' | 'nuggets';
  notes?: string;
}

export interface GuestCart {
  lines: CartLine[];
}

export interface CartConfig {
  maxItemQuantity: number; // RN-032 (parámetro, default 20)
  maxExtraPatties: number; // RN-010 (parámetro, default 3)
  extraPattyPrice: Money; // parámetro SA-04
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const replaceLine = (cart: GuestCart, line: CartLine): GuestCart => ({
  lines: cart.lines.map((existing) => (existing.productId === line.productId ? line : existing)),
});

export const CartOps = {
  empty: (): GuestCart => ({ lines: [] }),

  addLine: (
    cart: GuestCart,
    product: Product,
    config: CartConfig,
    input: Omit<CartLine, 'name' | 'unitPrice'>,
  ): GuestCart => {
    const existing = cart.lines.find((line) => line.productId === product.id);
    const quantity = clamp((existing?.quantity ?? 0) + input.quantity, 1, config.maxItemQuantity);
    const line: CartLine = {
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      extraPatties: clamp(input.extraPatties, 0, config.maxExtraPatties),
      ...(input.variant !== undefined ? { variant: input.variant } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
    return existing ? replaceLine(cart, line) : { lines: [...cart.lines, line] };
  },

  updateQuantity: (
    cart: GuestCart,
    productId: string,
    quantity: number,
    config: CartConfig,
  ): GuestCart => {
    if (quantity < 1) {
      return CartOps.removeLine(cart, productId);
    }
    return {
      lines: cart.lines.map((line) =>
        line.productId === productId
          ? { ...line, quantity: clamp(quantity, 1, config.maxItemQuantity) }
          : line,
      ),
    };
  },

  removeLine: (cart: GuestCart, productId: string): GuestCart => ({
    lines: cart.lines.filter((line) => line.productId !== productId),
  }),

  /** Preview local del subtotal de una línea: (unitario + extras) × cantidad. */
  lineSubtotal: (line: CartLine, config: CartConfig): Money =>
    multiplyMoney(
      addMoney(line.unitPrice, multiplyMoney(config.extraPattyPrice, line.extraPatties)),
      line.quantity,
    ),

  /** Preview local del total (RN-030: nunca vinculante). */
  previewTotal: (cart: GuestCart, config: CartConfig): Money =>
    cart.lines.reduce((total, line) => addMoney(total, CartOps.lineSubtotal(line, config)), {
      amount: 0,
      currency: config.extraPattyPrice.currency,
    } as Money),

  itemCount: (cart: GuestCart): number =>
    cart.lines.reduce((count, line) => count + line.quantity, 0),
} as const;
