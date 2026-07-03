import { describe, expect, it } from 'vitest';
import { OrderTotalsCalculator } from './index.js';
describe('OrderTotalsCalculator', () => {
  it('calculates deterministic totals', () => {
    const totals = new OrderTotalsCalculator().calculate(
      [
        {
          id: 'line',
          quantity: 2,
          unitPrice: { amount: 100, currency: 'USD' },
          modifierAdjustments: [{ amount: 25, currency: 'USD' }],
        },
      ],
      0.1,
      { amount: 50, currency: 'USD' },
    );
    expect(totals.total.amount).toBe(325);
  });
});
