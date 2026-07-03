import { describe, expect, it } from 'vitest';
import { OrderDraftService } from './index.js';
describe('OrderDraftService', () => {
  it('creates and freezes a validated draft', async () => {
    const service = new OrderDraftService();
    const totals = {
      subtotal: { amount: 100, currency: 'USD' as const },
      taxes: { amount: 0, currency: 'USD' as const },
      discounts: { amount: 0, currency: 'USD' as const },
      deliveryFee: { amount: 0, currency: 'USD' as const },
      total: { amount: 100, currency: 'USD' as const },
    };
    const draft = await service.createDraft(
      {
        tenantId: 'tenant',
        branchId: 'branch',
        cartId: 'cart',
        items: [
          {
            id: 'i',
            cartItemId: 'ci',
            productId: 'p',
            nameSnapshot: 'Burger',
            quantity: 1,
            unitPrice: totals.total,
            modifiersSnapshot: [],
            lineTotal: totals.total,
          },
        ],
        totals,
      },
      { tenantId: 'tenant', branchId: 'branch' },
    );
    expect(
      (await service.freezeSnapshot(draft.id, { tenantId: 'tenant', branchId: 'branch' })).status,
    ).toBe('frozen');
  });
});
