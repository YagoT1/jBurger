import type { Money } from './money.js';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: Money;
  imageUrl?: string;
  available: boolean;
  /** Derivado por el mapper (única fuente frontend de RN-010) hasta que el backend exponga el flag de modificadores. */
  allowsExtraPatty: boolean;
  /** Derivado por el mapper (RF-060) hasta que el backend exponga el flag de alcohol. */
  containsAlcohol: boolean;
  /** Cajita Feliz: exige elección burger/nuggets (RN-011). Derivado por el mapper. */
  requiresVariantChoice: boolean;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  products: Product[];
}

export interface Menu {
  categories: Category[];
  generatedAt: string;
}

/**
 * Reglas de producto del frontend (regla 15 de arquitectura: nunca `if (category === …)` en la UI).
 * Los flags provienen del mapper — un solo lugar decide; la UI solo pregunta.
 */
export const ProductRules = {
  canHaveExtraPatty: (product: Product): boolean => product.allowsExtraPatty,
  requiresVariantChoice: (product: Product): boolean => product.requiresVariantChoice,
  containsAlcohol: (product: Product): boolean => product.containsAlcohol,
} as const;
