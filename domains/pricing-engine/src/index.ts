import type { Money } from '@jburger/shared-kernel';
export type EntityId = string;
export interface PricedLineInput {
  id: EntityId;
  quantity: number;
  unitPrice: Money;
  modifierAdjustments?: Money[];
  comboAdjustment?: Money;
}
export interface TaxInput {
  taxableAmount: Money;
  rate: number;
  name: string;
}
export interface CalculatedLine {
  id: EntityId;
  quantity: number;
  unitPrice: Money;
  modifiersTotal: Money;
  lineTotal: Money;
}
const money = (amount: number, currency: Money['currency']): Money => ({ amount, currency });
const add = (a: Money, b?: Money) => money(a.amount + (b?.amount ?? 0), a.currency);
export class ModifierCalculator {
  calculate(base: Money, adjustments: Money[] = []) {
    return adjustments.reduce(
      (total, adjustment) => add(total, adjustment),
      money(0, base.currency),
    );
  }
}
export class ComboCalculator {
  calculate(base: Money, adjustment?: Money) {
    return add(base, adjustment);
  }
}
export class DeliveryCalculator {
  calculate(distanceKm: number, baseFee: Money, radiusKm: number) {
    if (distanceKm > radiusKm) throw new Error('DELIVERY_OUT_OF_RADIUS');
    return baseFee;
  }
}
export class TaxCalculator {
  calculate(input: TaxInput): Money {
    return money(Math.round(input.taxableAmount.amount * input.rate), input.taxableAmount.currency);
  }
}
export class PriceCalculator {
  constructor(
    private readonly modifiers = new ModifierCalculator(),
    private readonly combos = new ComboCalculator(),
  ) {}
  calculateLine(input: PricedLineInput): CalculatedLine {
    const modifiersTotal = this.modifiers.calculate(input.unitPrice, input.modifierAdjustments);
    const unitWithCombo = this.combos.calculate(
      add(input.unitPrice, modifiersTotal),
      input.comboAdjustment,
    );
    return {
      id: input.id,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      modifiersTotal,
      lineTotal: money(unitWithCombo.amount * input.quantity, input.unitPrice.currency),
    };
  }
}
export class OrderTotalsCalculator {
  constructor(
    private readonly price = new PriceCalculator(),
    private readonly tax = new TaxCalculator(),
  ) {}
  calculate(lines: PricedLineInput[], taxRate = 0, deliveryFee?: Money) {
    const calculatedLines = lines.map((line) => this.price.calculateLine(line));
    const currency = calculatedLines[0]?.lineTotal.currency ?? deliveryFee?.currency ?? 'USD';
    const subtotal = calculatedLines.reduce(
      (total, line) => add(total, line.lineTotal),
      money(0, currency),
    );
    const taxes =
      taxRate > 0
        ? this.tax.calculate({ taxableAmount: subtotal, rate: taxRate, name: 'sales_tax' })
        : money(0, currency);
    const total = add(add(subtotal, taxes), deliveryFee);
    return {
      lines: calculatedLines,
      subtotal,
      taxes,
      deliveryFee: deliveryFee ?? money(0, currency),
      discounts: money(0, currency),
      total,
    };
  }
}
