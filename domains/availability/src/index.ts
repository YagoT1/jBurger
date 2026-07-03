export type EntityId = string;
export type AvailabilityStatus = 'available' | 'unavailable' | 'paused' | 'scheduled' | 'sold_out';
export interface AvailabilityRule {
  id: EntityId;
  tenantId: EntityId;
  targetType: 'product' | 'menu' | 'combo' | 'modifier';
  targetId: EntityId;
  branchId?: EntityId;
  status: AvailabilityStatus;
  reason?: string;
  inventoryIntegrationKey?: string;
}
export interface BranchAvailability {
  branchId: EntityId;
  status: AvailabilityStatus;
  reason?: string;
}
export interface ScheduleAvailability {
  startsAt: string;
  endsAt: string;
  status: AvailabilityStatus;
}
export interface OperationalAvailability {
  current: AvailabilityStatus;
  branch: BranchAvailability;
  schedules: ScheduleAvailability[];
}
export class AvailabilityService {
  private rules = new Map<EntityId, AvailabilityRule>();
  list(tenantId: EntityId) {
    return [...this.rules.values()].filter((r) => r.tenantId === tenantId);
  }
  set(input: Omit<AvailabilityRule, 'id'>) {
    const rule: AvailabilityRule = { ...input, id: crypto.randomUUID() };
    this.rules.set(rule.id, rule);
    return rule;
  }
}
