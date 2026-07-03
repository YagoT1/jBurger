import type { AuditMetadata, Money } from '@jburger/shared-kernel';
export type EntityId = string;
export type ComboType = 'fixed' | 'configurable' | 'family' | 'promotional';
export interface ComboItem {
  id: EntityId;
  productId: EntityId;
  quantity: number;
  required: boolean;
}
export interface ComboRule {
  minItems?: number;
  maxItems?: number;
  allowedCategoryIds?: EntityId[];
}
export interface ComboPricing {
  type: 'fixed' | 'sum_items' | 'discounted';
  price?: Money;
  discountAmount?: Money;
}
export interface Combo {
  id: EntityId;
  tenantId: EntityId;
  name: string;
  type: ComboType;
  items: ComboItem[];
  rules: ComboRule[];
  pricing: ComboPricing;
  available: boolean;
  audit: AuditMetadata;
}
export class ComboService {
  private combos = new Map<EntityId, Combo>();
  list(tenantId: EntityId) {
    return [...this.combos.values()].filter((c) => c.tenantId === tenantId);
  }
  create(input: Omit<Combo, 'id' | 'tenantId' | 'audit'>, tenantId: EntityId, actorId?: EntityId) {
    const combo: Combo = {
      ...input,
      id: crypto.randomUUID(),
      tenantId,
      audit: { createdAt: new Date().toISOString(), ...(actorId ? { createdBy: actorId } : {}) },
    };
    this.combos.set(combo.id, combo);
    return combo;
  }
  update(
    id: EntityId,
    tenantId: EntityId,
    input: Partial<Omit<Combo, 'id' | 'tenantId' | 'audit'>>,
    actorId?: EntityId,
  ) {
    const previous = this.combos.get(id);
    if (!previous || previous.tenantId !== tenantId) throw new Error('COMBO_NOT_FOUND');
    const combo = {
      ...previous,
      ...input,
      audit: {
        ...previous.audit,
        updatedAt: new Date().toISOString(),
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    };
    this.combos.set(id, combo);
    return combo;
  }
}
