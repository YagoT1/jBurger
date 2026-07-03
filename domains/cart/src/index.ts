import type { AuditMetadata, Money } from '@jburger/shared-kernel';
import {
  createEventMetadata,
  type AuditEvent,
  type DomainEvent,
  type EventPublisher,
} from '@jburger/domain-events';

export type EntityId = string;
export type CartOwnerType = 'guest' | 'customer';
export type CartStatus = 'active' | 'expired' | 'abandoned' | 'converted';
export type CartEventName =
  | 'CART_CREATED'
  | 'CART_RECOVERED'
  | 'ITEM_ADDED'
  | 'ITEM_UPDATED'
  | 'ITEM_REMOVED'
  | 'CART_CLEARED';
export interface CartContext {
  tenantId: EntityId;
  branchId: EntityId;
  actorId?: EntityId;
  customerId?: EntityId;
  reason?: string;
}
export interface CartSession {
  id: EntityId;
  cartId: EntityId;
  ownerType: CartOwnerType;
  ownerId?: EntityId;
  anonymousSessionId?: string;
  expiresAt: string;
}
export interface CartItemModifierSelection {
  modifierGroupId: EntityId;
  optionIds: EntityId[];
}
export interface CartItem {
  id: EntityId;
  productId: EntityId;
  menuId?: EntityId;
  comboId?: EntityId;
  quantity: number;
  notes?: string;
  modifiers: CartItemModifierSelection[];
  unitPricePreview?: Money;
  audit: AuditMetadata;
}
export interface CartSummary {
  itemCount: number;
  subtotalPreview?: Money;
  status: CartStatus;
}
export interface Cart {
  id: EntityId;
  tenantId: EntityId;
  branchId: EntityId;
  ownerType: CartOwnerType;
  ownerId?: EntityId;
  status: CartStatus;
  items: CartItem[];
  sessions: CartSession[];
  version: number;
  expiresAt: string;
  audit: AuditMetadata;
}
export interface CartRepository {
  save(cart: Cart): Promise<Cart>;
  get(id: EntityId, tenantId: EntityId): Promise<Cart | undefined>;
  listByOwner(tenantId: EntityId, ownerType: CartOwnerType, ownerId?: EntityId): Promise<Cart[]>;
}
export interface CartQueries {
  getCart(id: EntityId, tenantId: EntityId): Promise<Cart | undefined>;
  summary(id: EntityId, tenantId: EntityId): Promise<CartSummary>;
}
export interface CartCommands {
  createCart(
    input: { ownerType: CartOwnerType; ownerId?: EntityId; anonymousSessionId?: string },
    context: CartContext,
  ): Promise<Cart>;
  recoverCart(id: EntityId, context: CartContext): Promise<Cart>;
  mergeGuestCart(
    guestCartId: EntityId,
    customerCartId: EntityId,
    context: CartContext,
  ): Promise<Cart>;
  mergeCustomerCart(
    sourceCartId: EntityId,
    targetCartId: EntityId,
    context: CartContext,
  ): Promise<Cart>;
  addItem(
    cartId: EntityId,
    item: Omit<CartItem, 'id' | 'audit'>,
    context: CartContext,
  ): Promise<Cart>;
  removeItem(cartId: EntityId, itemId: EntityId, context: CartContext): Promise<Cart>;
  updateQuantity(
    cartId: EntityId,
    itemId: EntityId,
    quantity: number,
    context: CartContext,
  ): Promise<Cart>;
  replaceModifiers(
    cartId: EntityId,
    itemId: EntityId,
    modifiers: CartItemModifierSelection[],
    context: CartContext,
  ): Promise<Cart>;
  clearCart(cartId: EntityId, context: CartContext): Promise<Cart>;
  expireCart(cartId: EntityId, context: CartContext): Promise<Cart>;
  abandonCart(cartId: EntityId, context: CartContext): Promise<Cart>;
}
export class CartValidator {
  validateCart(cart: Cart) {
    if (!cart.tenantId) throw new Error('CART_TENANT_REQUIRED');
    if (!cart.branchId) throw new Error('CART_BRANCH_REQUIRED');
  }
  validateItem(item: Pick<CartItem, 'productId' | 'quantity'>) {
    if (!item.productId) throw new Error('CART_ITEM_PRODUCT_REQUIRED');
    if (item.quantity < 1) throw new Error('CART_ITEM_QUANTITY_INVALID');
  }
}
export class InMemoryCartRepository implements CartRepository {
  private carts = new Map<EntityId, Cart>();
  async save(cart: Cart) {
    this.carts.set(cart.id, cart);
    return cart;
  }
  async get(id: EntityId, tenantId: EntityId) {
    const cart = this.carts.get(id);
    return cart?.tenantId === tenantId ? cart : undefined;
  }
  async listByOwner(tenantId: EntityId, ownerType: CartOwnerType, ownerId?: EntityId) {
    return [...this.carts.values()].filter(
      (cart) =>
        cart.tenantId === tenantId && cart.ownerType === ownerType && cart.ownerId === ownerId,
    );
  }
}
const audit = (actorId?: string): AuditMetadata => ({
  createdAt: new Date().toISOString(),
  ...(actorId ? { createdBy: actorId } : {}),
});
const touch = (metadata: AuditMetadata, actorId?: string): AuditMetadata => ({
  ...metadata,
  updatedAt: new Date().toISOString(),
  ...(actorId ? { updatedBy: actorId } : {}),
});
export class CartService implements CartCommands, CartQueries {
  constructor(
    private readonly repository: CartRepository = new InMemoryCartRepository(),
    private readonly events?: EventPublisher,
    private readonly validator = new CartValidator(),
  ) {}
  async getCart(id: EntityId, tenantId: EntityId) {
    return this.repository.get(id, tenantId);
  }
  async summary(id: EntityId, tenantId: EntityId) {
    const cart = await this.requireCart(id, tenantId);
    return {
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      status: cart.status,
    };
  }
  async createCart(
    input: { ownerType: CartOwnerType; ownerId?: EntityId; anonymousSessionId?: string },
    context: CartContext,
  ) {
    const cartId = crypto.randomUUID();
    const cart: Cart = {
      id: cartId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      ownerType: input.ownerType,
      ...(input.ownerId ? { ownerId: input.ownerId } : {}),
      status: 'active',
      items: [],
      sessions: [
        {
          id: crypto.randomUUID(),
          cartId,
          ownerType: input.ownerType,
          ...(input.ownerId ? { ownerId: input.ownerId } : {}),
          ...(input.anonymousSessionId ? { anonymousSessionId: input.anonymousSessionId } : {}),
          expiresAt: expiresAt(),
        },
      ],
      version: 1,
      expiresAt: expiresAt(),
      audit: audit(context.actorId),
    };
    this.validator.validateCart(cart);
    await this.repository.save(cart);
    await this.publish('CART_CREATED', cart.id, undefined, cart, context);
    return cart;
  }
  async recoverCart(id: EntityId, context: CartContext) {
    const cart = await this.requireCart(id, context.tenantId);
    const current = {
      ...cart,
      status: 'active' as const,
      version: cart.version + 1,
      audit: touch(cart.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish('CART_RECOVERED', id, cart, current, context);
    return current;
  }
  async mergeGuestCart(guestCartId: EntityId, customerCartId: EntityId, context: CartContext) {
    return this.mergeCarts(guestCartId, customerCartId, context);
  }
  async mergeCustomerCart(sourceCartId: EntityId, targetCartId: EntityId, context: CartContext) {
    return this.mergeCarts(sourceCartId, targetCartId, context);
  }
  async addItem(cartId: EntityId, item: Omit<CartItem, 'id' | 'audit'>, context: CartContext) {
    this.validator.validateItem(item);
    const cart = await this.requireCart(cartId, context.tenantId);
    const current = {
      ...cart,
      items: [...cart.items, { ...item, id: crypto.randomUUID(), audit: audit(context.actorId) }],
      version: cart.version + 1,
      audit: touch(cart.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish('ITEM_ADDED', cartId, cart, current, context);
    return current;
  }
  async removeItem(cartId: EntityId, itemId: EntityId, context: CartContext) {
    const cart = await this.requireCart(cartId, context.tenantId);
    const current = {
      ...cart,
      items: cart.items.filter((item) => item.id !== itemId),
      version: cart.version + 1,
      audit: touch(cart.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish('ITEM_REMOVED', cartId, cart, current, context);
    return current;
  }
  async updateQuantity(cartId: EntityId, itemId: EntityId, quantity: number, context: CartContext) {
    this.validator.validateItem({ productId: itemId, quantity });
    return this.mapItem(cartId, itemId, context, (item) => ({
      ...item,
      quantity,
      audit: touch(item.audit, context.actorId),
    }));
  }
  async replaceModifiers(
    cartId: EntityId,
    itemId: EntityId,
    modifiers: CartItemModifierSelection[],
    context: CartContext,
  ) {
    return this.mapItem(cartId, itemId, context, (item) => ({
      ...item,
      modifiers,
      audit: touch(item.audit, context.actorId),
    }));
  }
  async clearCart(cartId: EntityId, context: CartContext) {
    const cart = await this.requireCart(cartId, context.tenantId);
    const current = {
      ...cart,
      items: [],
      version: cart.version + 1,
      audit: touch(cart.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish('CART_CLEARED', cartId, cart, current, context);
    return current;
  }
  async expireCart(cartId: EntityId, context: CartContext) {
    return this.transition(cartId, 'expired', context);
  }
  async abandonCart(cartId: EntityId, context: CartContext) {
    return this.transition(cartId, 'abandoned', context);
  }
  private async mapItem(
    cartId: EntityId,
    itemId: EntityId,
    context: CartContext,
    map: (item: CartItem) => CartItem,
  ) {
    const cart = await this.requireCart(cartId, context.tenantId);
    const current = {
      ...cart,
      items: cart.items.map((item) => (item.id === itemId ? map(item) : item)),
      version: cart.version + 1,
      audit: touch(cart.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish('ITEM_UPDATED', cartId, cart, current, context);
    return current;
  }
  private async transition(cartId: EntityId, status: CartStatus, context: CartContext) {
    const cart = await this.requireCart(cartId, context.tenantId);
    const current = {
      ...cart,
      status,
      version: cart.version + 1,
      audit: touch(cart.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish(
      status === 'expired' ? 'CART_CLEARED' : 'ITEM_UPDATED',
      cartId,
      cart,
      current,
      context,
    );
    return current;
  }
  private async mergeCarts(sourceCartId: EntityId, targetCartId: EntityId, context: CartContext) {
    const source = await this.requireCart(sourceCartId, context.tenantId);
    const target = await this.requireCart(targetCartId, context.tenantId);
    const current = {
      ...target,
      items: [...target.items, ...source.items],
      version: target.version + 1,
      audit: touch(target.audit, context.actorId),
    };
    await this.repository.save(current);
    await this.publish('ITEM_UPDATED', targetCartId, target, current, context);
    return current;
  }
  private async requireCart(id: EntityId, tenantId: EntityId) {
    const cart = await this.repository.get(id, tenantId);
    if (!cart) throw new Error('CART_NOT_FOUND');
    return cart;
  }
  private async publish(
    eventName: CartEventName,
    cartId: EntityId,
    previousState: unknown,
    currentState: unknown,
    context: CartContext,
  ) {
    if (!this.events) return;
    const metadata = createEventMetadata({
      eventName,
      category: 'domain',
      tenantId: context.tenantId,
      branchId: context.branchId,
      actorId: context.actorId,
      schemaVersion: 1,
    });
    await this.events.publish({
      metadata,
      payload: {
        cartId,
        customerId: context.customerId,
        previousState,
        currentState,
        reason: context.reason,
      },
    } satisfies DomainEvent);
    await this.events.publish({
      metadata: {
        ...metadata,
        eventId: crypto.randomUUID(),
        category: 'audit',
        eventName: `${eventName}_AUDIT`,
      },
      action: eventName as never,
      resource: 'cart',
      resourceId: cartId,
      payload: {
        actorId: context.actorId,
        customerId: context.customerId,
        tenantId: context.tenantId,
        branchId: context.branchId,
        previousState,
        currentState,
        reason: context.reason,
      },
    } satisfies AuditEvent);
  }
}
const expiresAt = () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
