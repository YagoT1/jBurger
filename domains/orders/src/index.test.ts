import { describe, expect, it } from 'vitest';
import { OrderService } from './index.js';
describe('OrderService', () => {
  it('creates immutable snapshots and confirms orders', async () => {
    const usd = { amount: 100, currency: 'USD' as const };
    const service = new OrderService();
    const order = await service.createOrder(
      {
        tenantId: 'tenant',
        branchId: 'branch',
        customer: { name: 'Ada' },
        delivery: { mode: 'pickup', deliveryFee: { amount: 0, currency: 'USD' } },
        items: [
          {
            id: 'item',
            productId: 'product',
            quantity: 1,
            lineTotal: usd,
            snapshot: {
              productName: 'Burger',
              price: usd,
              modifierSelection: [],
              appliedTaxes: [],
              appliedDiscounts: [],
              images: [],
              branchName: 'Centro',
            },
          },
        ],
        totals: {
          subtotal: usd,
          taxes: { amount: 0, currency: 'USD' },
          discounts: { amount: 0, currency: 'USD' },
          deliveryFee: { amount: 0, currency: 'USD' },
          total: usd,
        },
      },
      { tenantId: 'tenant', branchId: 'branch' },
    );
    expect(order.immutableSnapshot).toBeDefined();
    expect(
      (await service.confirmOrder(order.id, { tenantId: 'tenant', branchId: 'branch' })).status,
    ).toBe('confirmed');
  });
});
