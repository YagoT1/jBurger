import { describe, expect, it } from 'vitest';
import {
  canTransition,
  CheckoutService,
  OrderDomainError,
  OrderService,
  ORDER_TRANSITIONS,
} from './index.js';

// Smoke test de la superficie pública del dominio de pedidos.
// El comportamiento detallado vive en checkout.service.test.ts y order.service.test.ts.
describe('domain-orders public API', () => {
  it('exposes services, errors and the transition machine', () => {
    expect(typeof CheckoutService).toBe('function');
    expect(typeof OrderService).toBe('function');
    expect(new OrderDomainError('ORDER_NOT_FOUND', 'x').code).toBe('ORDER_NOT_FOUND');
    expect(canTransition('borrador', 'confirmado')).toBe(true);
    expect(ORDER_TRANSITIONS.entregado).toEqual([]);
  });
});
