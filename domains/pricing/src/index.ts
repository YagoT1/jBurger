import type { Money } from '@jburger/shared-kernel';
export type EntityId = string;
export interface BasePrice {
  productId: EntityId;
  price: Money;
}
export interface PriceOverride {
  targetType: 'branch' | 'menu' | 'modifier' | 'combo';
  targetId: EntityId;
  price: Money;
}
export interface BranchOverride extends PriceOverride {
  targetType: 'branch';
  branchId: EntityId;
}
export interface MenuOverride extends PriceOverride {
  targetType: 'menu';
  menuId: EntityId;
}
export interface ModifierAdjustment {
  modifierOptionId: EntityId;
  adjustment: Money;
}
export interface ComboPrice {
  comboId: EntityId;
  price: Money;
}
export interface PricingRule {
  id: EntityId;
  tenantId: EntityId;
  basePrice?: BasePrice;
  override?: PriceOverride;
}
export class PriceCalculator {
  calculate(
    base: Money,
    overrides: PriceOverride[] = [],
    adjustments: ModifierAdjustment[] = [],
  ): Money {
    const override = overrides.at(-1)?.price;
    const start = override ?? base;
    return adjustments.reduce(
      (total, item) => ({ ...total, amount: total.amount + item.adjustment.amount }),
      start,
    );
  }
}
export class PricingService {
  private rules = new Map<EntityId, PricingRule>();
  list(tenantId: EntityId) {
    return [...this.rules.values()].filter((r) => r.tenantId === tenantId);
  }
  create(input: Omit<PricingRule, 'id'>) {
    const rule: PricingRule = { ...input, id: crypto.randomUUID() };
    this.rules.set(rule.id, rule);
    return rule;
  }
}
