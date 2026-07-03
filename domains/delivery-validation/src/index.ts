import type { Address, Coordinates, Money } from '@jburger/shared-kernel';
export type EntityId = string;
export interface DeliveryValidationInput {
  branchId: EntityId;
  branchActive: boolean;
  branchCoordinates: Coordinates;
  deliveryAddress: Address & { coordinates?: Coordinates };
  deliveryRadiusKm: number;
  baseFee: Money;
  now?: Date;
  operatingHours?: { dayOfWeek: number; opensAt: string; closesAt: string }[];
  localMode?: 'roque_perez' | 'regional';
}
export interface DeliveryValidationResult {
  valid: boolean;
  reasons: string[];
  deliveryFee?: Money;
  estimatedDeliveryMinutes?: number;
  distanceKm?: number;
}
const distanceKm = (a: Coordinates, b: Coordinates) => {
  const dx = a.latitude - b.latitude;
  const dy = a.longitude - b.longitude;
  return Math.sqrt(dx * dx + dy * dy) * 111;
};
export class DeliveryValidationService {
  validate(input: DeliveryValidationInput): DeliveryValidationResult {
    const reasons: string[] = [];
    if (!input.branchActive) reasons.push('BRANCH_INACTIVE');
    if (!input.deliveryAddress.line1 || !input.deliveryAddress.city)
      reasons.push('ADDRESS_INVALID');
    const now = input.now ?? new Date();
    const day = now.getUTCDay();
    const hhmm = now.toISOString().slice(11, 16);
    const windows = input.operatingHours?.filter((window) => window.dayOfWeek === day) ?? [];
    if (
      windows.length > 0 &&
      !windows.some((window) => window.opensAt <= hhmm && hhmm <= window.closesAt)
    )
      reasons.push('BRANCH_CLOSED');
    const distance = input.deliveryAddress.coordinates
      ? distanceKm(input.branchCoordinates, input.deliveryAddress.coordinates)
      : undefined;
    if (distance !== undefined && distance > input.deliveryRadiusKm)
      reasons.push('DELIVERY_OUT_OF_RADIUS');
    return {
      valid: reasons.length === 0,
      reasons,
      ...(reasons.includes('DELIVERY_OUT_OF_RADIUS') ? {} : { deliveryFee: input.baseFee }),
      estimatedDeliveryMinutes: input.localMode === 'roque_perez' ? 35 : 50,
      ...(distance === undefined ? {} : { distanceKm: distance }),
    };
  }
}
