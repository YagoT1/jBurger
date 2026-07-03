import type { AuditMetadata, Money } from '@jburger/shared-kernel';
export type EntityId = string;
export type ModifierSelection = 'single' | 'multiple';
export interface ModifierOption {
  id: EntityId;
  name: string;
  priceAdjustment?: Money;
  selectedByDefault: boolean;
}
export interface ModifierGroup {
  id: EntityId;
  name: string;
  required: boolean;
  selection: ModifierSelection;
  minSelections?: number;
  maxSelections?: number;
  options: ModifierOption[];
}
export interface Modifier {
  id: EntityId;
  tenantId: EntityId;
  name: string;
  groups: ModifierGroup[];
  audit: AuditMetadata;
}
export class ModifierService {
  private modifiers = new Map<EntityId, Modifier>();
  list(tenantId: EntityId) {
    return [...this.modifiers.values()].filter((m) => m.tenantId === tenantId);
  }
  create(
    input: Omit<Modifier, 'id' | 'tenantId' | 'audit'>,
    tenantId: EntityId,
    actorId?: EntityId,
  ) {
    const modifier: Modifier = {
      ...input,
      id: crypto.randomUUID(),
      tenantId,
      audit: { createdAt: new Date().toISOString(), ...(actorId ? { createdBy: actorId } : {}) },
    };
    this.modifiers.set(modifier.id, modifier);
    return modifier;
  }
}
