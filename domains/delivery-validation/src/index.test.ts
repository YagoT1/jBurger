import { describe, expect, it } from 'vitest';
import { DeliveryValidationService } from './index.js';
describe('DeliveryValidationService', () => {
  it('validates Roque Perez local delivery radius', () => {
    const result = new DeliveryValidationService().validate({
      branchId: 'branch',
      branchActive: true,
      branchCoordinates: { latitude: -35.4, longitude: -59.3 },
      deliveryAddress: {
        line1: 'Main',
        city: 'Roque Perez',
        state: 'BA',
        postalCode: '7245',
        country: 'AR',
        coordinates: { latitude: -35.41, longitude: -59.31 },
      },
      deliveryRadiusKm: 5,
      baseFee: { amount: 100, currency: 'USD' },
      localMode: 'roque_perez',
    });
    expect(result.valid).toBe(true);
    expect(result.estimatedDeliveryMinutes).toBe(35);
  });
});
