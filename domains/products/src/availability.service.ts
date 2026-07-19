import { createEventMetadata, type EventPublisher } from '@jburger/domain-events';
import type { DisponibilidadProducto } from '@jburger/domain-types';
import type { AvailabilityRepository, SetAvailabilityCommand } from './contracts.js';
export class AvailabilityService {
  constructor(
    private readonly repository: AvailabilityRepository,
    private readonly events: EventPublisher,
  ) {}
  listByBranch(tenantId: string, branchId: string): Promise<DisponibilidadProducto[]> {
    return this.repository.listByBranch(tenantId, branchId);
  }
  async set(command: SetAvailabilityCommand): Promise<DisponibilidadProducto> {
    if (
      command.precioOverride &&
      (!Number.isFinite(command.precioOverride.amount) || command.precioOverride.amount <= 0)
    ) {
      throw new Error('Availability price override must be greater than zero.');
    }
    const disponibilidad = await this.repository.set(command);
    await this.events.publish({
      metadata: createEventMetadata({
        eventName: 'AVAILABILITY_UPDATED',
        category: 'audit',
        schemaVersion: 1,
        tenantId: command.tenantId,
        branchId: command.branchId,
        actorId: command.actorId,
      }),
      action: 'AVAILABILITY_UPDATED',
      resource: 'product_branch_availability',
      resourceId: command.productId,
      payload: {
        branchId: command.branchId,
        disponible: command.disponible,
        hasPriceOverride: Boolean(command.precioOverride),
      },
    });
    return disponibilidad;
  }
}
