import type { Address, AuditMetadata, Coordinates, Money } from '@jburger/shared-kernel';
export type EntityId = string;
export interface OperatingWindow {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
}
export interface ExceptionalClosure {
  date: string;
  reason: string;
}
export interface BranchAvailabilitySettings {
  status: 'available' | 'unavailable' | 'paused' | 'scheduled' | 'sold_out';
  message?: string;
}
export interface BranchCommerceSettings {
  branchMenuIds: EntityId[];
  branchPricingRuleIds: EntityId[];
  operatingHours: OperatingWindow[];
  holidayHours: OperatingWindow[];
  exceptionalClosures: ExceptionalClosure[];
  phone?: string;
  whatsapp?: string;
  coordinates?: Coordinates;
  deliveryRadiusKm?: number;
  deliveryBaseFee?: Money;
  availability: BranchAvailabilitySettings;
}
export interface Branch {
  id: EntityId;
  tenantId: EntityId;
  name: string;
  address?: Address;
  active: boolean;
  commerce: BranchCommerceSettings;
  audit: AuditMetadata;
}
export const defaultBranchCommerceSettings = (): BranchCommerceSettings => ({
  branchMenuIds: [],
  branchPricingRuleIds: [],
  operatingHours: [],
  holidayHours: [],
  exceptionalClosures: [],
  availability: { status: 'available' },
});
