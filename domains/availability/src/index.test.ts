import { describe, expect, it } from 'vitest';
import { AvailabilityService } from './index.js';
describe('AvailabilityService', () => {
  it('tracks operations availability without inventory management', () => {
    const service = new AvailabilityService();
    service.set({
      tenantId: 'tenant',
      targetType: 'product',
      targetId: 'p',
      status: 'sold_out',
      inventoryIntegrationKey: 'future-stock',
    });
    expect(service.list('tenant')[0]?.status).toBe('sold_out');
  });
});
