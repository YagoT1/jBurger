import { createEventMetadata, type AuditAction, type EventPublisher } from '@jburger/domain-events';
import type { Cart, CartItem } from '@jburger/domain-types';
import type {
  AddItemCommand,
  CartCatalogSource,
  CartConfig,
  CartRepository,
  ClearCartCommand,
  GuestCartItem,
  MergeGuestCartCommand,
  MergeReportEntry,
  MergeResult,
  RemoveItemCommand,
  UpdateItemQuantityCommand,
} from './contracts.js';
import { CartDomainError } from './errors.js';

export class CartService {
  constructor(
    private readonly repository: CartRepository,
    private readonly catalog: CartCatalogSource,
    private readonly config: CartConfig,
    private readonly events: EventPublisher,
  ) {}

  getActiveCart(tenantId: string, customerId: string): Promise<Cart | undefined> {
    return this.repository.findActiveByCustomer(tenantId, customerId);
  }

  async addItem(command: AddItemCommand): Promise<Cart> {
    this.assertQuantity(command.quantity);
    const producto = await this.catalog.findActiveProduct(command.tenantId, command.productId);
    if (!producto) {
      throw new CartDomainError('PRODUCT_NOT_FOUND', 'Product does not exist or is inactive.');
    }

    const existingCart = await this.repository.findActiveByCustomer(
      command.tenantId,
      command.customerId,
    );
    const cart =
      existingCart ??
      (await this.repository.createActive(command.tenantId, command.customerId, command.branchId));
    if (!existingCart) {
      await this.audit('CART_CREATED', command.tenantId, command.actorId, cart.id, {
        customerId: command.customerId,
      });
    }

    const branchId = command.branchId ?? cart.branchId;
    if (branchId) {
      const disponibilidad = await this.catalog.findAvailability(
        command.tenantId,
        branchId,
        command.productId,
      );
      if (disponibilidad && !disponibilidad.disponible) {
        throw new CartDomainError(
          'PRODUCT_UNAVAILABLE',
          'Product is not available at this branch.',
        );
      }
    }

    const existingItem = cart.items.find((item) => item.productId === command.productId);
    const nextQuantity = (existingItem?.quantity ?? 0) + command.quantity;
    this.assertQuantity(nextQuantity);

    const items: CartItem[] = existingItem
      ? cart.items.map((item) =>
          item.productId === command.productId ? { ...item, quantity: nextQuantity } : item,
        )
      : [
          ...cart.items,
          {
            id: crypto.randomUUID(),
            productId: command.productId,
            quantity: command.quantity,
            ...(command.notas !== undefined ? { notas: command.notas } : {}),
          },
        ];

    const expectedVersion = command.expectedVersion ?? cart.version;
    const updated = await this.applyOrConflict(command.tenantId, cart.id, expectedVersion, {
      items,
      ...(branchId !== undefined ? { branchId } : {}),
    });
    await this.audit(
      existingItem ? 'CART_ITEM_UPDATED' : 'CART_ITEM_ADDED',
      command.tenantId,
      command.actorId,
      cart.id,
      { productId: command.productId, quantity: nextQuantity },
    );
    return updated;
  }

  async updateItemQuantity(command: UpdateItemQuantityCommand): Promise<Cart> {
    this.assertQuantity(command.quantity);
    const cart = await this.requireActiveCart(command.tenantId, command.customerId);
    const existingItem = cart.items.find((item) => item.productId === command.productId);
    if (!existingItem) {
      throw new CartDomainError('ITEM_NOT_FOUND', 'Item is not in the cart.');
    }
    const items = cart.items.map((item) =>
      item.productId === command.productId ? { ...item, quantity: command.quantity } : item,
    );
    const updated = await this.applyOrConflict(command.tenantId, cart.id, command.expectedVersion, {
      items,
    });
    await this.audit('CART_ITEM_UPDATED', command.tenantId, command.actorId, cart.id, {
      productId: command.productId,
      quantity: command.quantity,
    });
    return updated;
  }

  async removeItem(command: RemoveItemCommand): Promise<Cart> {
    const cart = await this.requireActiveCart(command.tenantId, command.customerId);
    if (!cart.items.some((item) => item.productId === command.productId)) {
      throw new CartDomainError('ITEM_NOT_FOUND', 'Item is not in the cart.');
    }
    const items = cart.items.filter((item) => item.productId !== command.productId);
    const updated = await this.applyOrConflict(command.tenantId, cart.id, command.expectedVersion, {
      items,
    });
    await this.audit('CART_ITEM_REMOVED', command.tenantId, command.actorId, cart.id, {
      productId: command.productId,
    });
    return updated;
  }

  async clear(command: ClearCartCommand): Promise<Cart> {
    const cart = await this.requireActiveCart(command.tenantId, command.customerId);
    const updated = await this.applyOrConflict(command.tenantId, cart.id, command.expectedVersion, {
      items: [],
    });
    await this.audit('CART_CLEARED', command.tenantId, command.actorId, cart.id, {});
    return updated;
  }

  /** Merge Guest → Login. Reglas documentadas en phase-2-block-3-cart-plan.md (§ merge). Mutación única y versionada. */
  async mergeGuestCart(command: MergeGuestCartCommand): Promise<MergeResult> {
    const existingCart = await this.repository.findActiveByCustomer(
      command.tenantId,
      command.customerId,
    );
    const cart =
      existingCart ??
      (await this.repository.createActive(command.tenantId, command.customerId, command.branchId));
    if (!existingCart) {
      await this.audit('CART_CREATED', command.tenantId, command.actorId, cart.id, {
        customerId: command.customerId,
      });
    }

    const report: MergeReportEntry[] = [];
    const items: CartItem[] = [...cart.items];

    for (const guestItem of command.items) {
      const entry = await this.mergeGuestItem(command.tenantId, items, guestItem);
      if (entry) {
        report.push(entry);
      }
    }

    const branchId = cart.branchId ?? command.branchId;
    const updated = await this.applyOrConflict(command.tenantId, cart.id, cart.version, {
      items,
      ...(branchId !== undefined ? { branchId } : {}),
    });
    await this.audit('CART_MERGED', command.tenantId, command.actorId, cart.id, {
      incomingItems: command.items.length,
      discarded: report.filter((item) => item.reason !== 'capped').length,
      capped: report.filter((item) => item.reason === 'capped').length,
    });
    return { cart: updated, report };
  }

  private async mergeGuestItem(
    tenantId: string,
    items: CartItem[],
    guestItem: GuestCartItem,
  ): Promise<MergeReportEntry | undefined> {
    if (!Number.isInteger(guestItem.quantity) || guestItem.quantity < 1) {
      return { productId: guestItem.productId, reason: 'invalid_quantity' };
    }
    const producto = await this.catalog.findActiveProduct(tenantId, guestItem.productId);
    if (!producto) {
      return { productId: guestItem.productId, reason: 'removed' };
    }
    const index = items.findIndex((item) => item.productId === guestItem.productId);
    const existing = index >= 0 ? items[index] : undefined;
    const requested = (existing?.quantity ?? 0) + guestItem.quantity;
    const quantity = Math.min(requested, this.config.maxItemQuantity);
    if (existing) {
      // Notas: prevalecen las del servidor; se adoptan las del guest solo si el servidor no tiene.
      items[index] = {
        ...existing,
        quantity,
        ...(existing.notas === undefined && guestItem.notas !== undefined
          ? { notas: guestItem.notas }
          : {}),
      };
    } else {
      items.push({
        id: crypto.randomUUID(),
        productId: guestItem.productId,
        quantity,
        ...(guestItem.notas !== undefined ? { notas: guestItem.notas } : {}),
      });
    }
    return requested > this.config.maxItemQuantity
      ? { productId: guestItem.productId, reason: 'capped' }
      : undefined;
  }

  private async requireActiveCart(tenantId: string, customerId: string): Promise<Cart> {
    const cart = await this.repository.findActiveByCustomer(tenantId, customerId);
    if (!cart) {
      throw new CartDomainError('CART_NOT_FOUND', 'No active cart for this customer.');
    }
    return cart;
  }

  private async applyOrConflict(
    tenantId: string,
    cartId: string,
    expectedVersion: number,
    mutation: { items: CartItem[]; branchId?: string },
  ): Promise<Cart> {
    const updated = await this.repository.applyMutation(
      tenantId,
      cartId,
      expectedVersion,
      mutation,
    );
    if (!updated) {
      throw new CartDomainError(
        'VERSION_CONFLICT',
        'Cart was modified concurrently. Reload and retry.',
      );
    }
    return updated;
  }

  private assertQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > this.config.maxItemQuantity) {
      throw new CartDomainError(
        'QUANTITY_OUT_OF_RANGE',
        `Quantity must be an integer between 1 and ${this.config.maxItemQuantity}.`,
      );
    }
  }

  private async audit(
    action: AuditAction,
    tenantId: string,
    actorId: string,
    resourceId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.events.publish({
      metadata: createEventMetadata({
        eventName: action,
        category: 'audit',
        schemaVersion: 1,
        tenantId,
        actorId,
      }),
      action,
      resource: 'cart',
      resourceId,
      payload,
    });
  }
}
