import { describe, expect, it } from 'vitest';
import { PriceCalculator } from './index.js';
describe('PriceCalculator', () => {
  it('keeps deterministic base, override, and modifier adjustment calculation', () => {
    const price = new PriceCalculator().calculate(
      { amount: 100, currency: 'USD' },
      [{ targetType: 'menu', targetId: 'm', price: { amount: 90, currency: 'USD' } }],
      [{ modifierOptionId: 'extra-bacon', adjustment: { amount: 10, currency: 'USD' } }],
    );
    expect(price.amount).toBe(100);
  });
});
