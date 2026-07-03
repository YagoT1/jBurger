import type { AuditMetadata } from '@jburger/shared-kernel';
import {
  createEventMetadata,
  type AuditEvent,
  type DomainEvent,
  type EventPublisher,
} from '@jburger/domain-events';

export type EntityId = string;
export type LifecycleStatus = 'draft' | 'published' | 'paused' | 'archived' | 'disabled';
export type Visibility = 'public' | 'private' | 'hidden';
export type CommerceEventName =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_PUBLISHED'
  | 'PRODUCT_DISABLED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'MENU_CREATED'
  | 'MENU_PUBLISHED'
  | 'MENU_PAUSED'
  | 'MODIFIER_CREATED'
  | 'COMBO_CREATED'
  | 'COMBO_UPDATED'
  | 'PRICE_CHANGED'
  | 'AVAILABILITY_CHANGED';
export interface MutationContext {
  tenantId: EntityId;
  branchId?: EntityId;
  actorId?: EntityId;
  correlationId?: string;
}
export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
}
export interface OpenGraphMetadata {
  title?: string;
  description?: string;
  image?: string;
}
export interface ProductGallery {
  primaryImage?: string;
  additionalImages: string[];
}
export interface NutritionalInformation {
  calories?: number;
  allergens?: string[];
  proteinGrams?: number;
  carbohydrateGrams?: number;
  fatGrams?: number;
}
export interface Product {
  id: EntityId;
  tenantId: EntityId;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  gallery: ProductGallery;
  tags: string[];
  visibility: Visibility;
  status: LifecycleStatus;
  preparationTimeMinutes?: number;
  sortOrder: number;
  nutritionalInformation?: NutritionalInformation;
  seo?: SeoMetadata;
  openGraph?: OpenGraphMetadata;
  audit: AuditMetadata;
}
export interface ProductCommands {
  create(
    input: Omit<Product, 'id' | 'tenantId' | 'status' | 'audit'>,
    context: MutationContext,
  ): Promise<Product>;
  update(
    id: EntityId,
    input: Partial<Omit<Product, 'id' | 'tenantId' | 'audit'>>,
    context: MutationContext,
  ): Promise<Product>;
  publish(id: EntityId, context: MutationContext): Promise<Product>;
  pause(id: EntityId, context: MutationContext): Promise<Product>;
  archive(id: EntityId, context: MutationContext): Promise<Product>;
  disable(id: EntityId, context: MutationContext): Promise<Product>;
  restore(id: EntityId, context: MutationContext): Promise<Product>;
  duplicate(id: EntityId, context: MutationContext): Promise<Product>;
}
export interface ProductQueries {
  list(context: Pick<MutationContext, 'tenantId'>): Promise<Product[]>;
  get(id: EntityId, context: Pick<MutationContext, 'tenantId'>): Promise<Product | undefined>;
}
export interface ProductRepository extends ProductQueries {
  save(product: Product): Promise<Product>;
}
export class ProductValidator {
  validate(input: Pick<Product, 'name' | 'slug'>) {
    if (!input.name.trim()) throw new Error('PRODUCT_NAME_REQUIRED');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw new Error('PRODUCT_SLUG_INVALID');
  }
}
export class InMemoryProductRepository implements ProductRepository {
  private products = new Map<EntityId, Product>();
  async save(product: Product) {
    this.products.set(product.id, product);
    return product;
  }
  async list(context: Pick<MutationContext, 'tenantId'>) {
    return [...this.products.values()].filter((p) => p.tenantId === context.tenantId);
  }
  async get(id: EntityId, context: Pick<MutationContext, 'tenantId'>) {
    const product = this.products.get(id);
    return product?.tenantId === context.tenantId ? product : undefined;
  }
}
const auditCreated = (actorId?: string): AuditMetadata => ({
  createdAt: new Date().toISOString(),
  ...(actorId ? { createdBy: actorId } : {}),
});
const auditUpdated = (audit: AuditMetadata, actorId?: string): AuditMetadata => ({
  ...audit,
  updatedAt: new Date().toISOString(),
  ...(actorId ? { updatedBy: actorId } : {}),
});
export class ProductService implements ProductCommands, ProductQueries {
  constructor(
    private readonly repository: ProductRepository = new InMemoryProductRepository(),
    private readonly events?: EventPublisher,
    private readonly validator = new ProductValidator(),
  ) {}
  list(context: Pick<MutationContext, 'tenantId'>) {
    return this.repository.list(context);
  }
  get(id: EntityId, context: Pick<MutationContext, 'tenantId'>) {
    return this.repository.get(id, context);
  }
  async create(
    input: Omit<Product, 'id' | 'tenantId' | 'status' | 'audit'>,
    context: MutationContext,
  ) {
    this.validator.validate(input);
    const product: Product = {
      ...input,
      id: crypto.randomUUID(),
      tenantId: context.tenantId,
      status: 'draft',
      audit: auditCreated(context.actorId),
    };
    await this.repository.save(product);
    await this.publishAuditAndDomain(
      'PRODUCT_CREATED',
      'product',
      product.id,
      undefined,
      product,
      context,
    );
    return product;
  }
  async update(
    id: EntityId,
    input: Partial<Omit<Product, 'id' | 'tenantId' | 'audit'>>,
    context: MutationContext,
  ) {
    const previous = await this.requireProduct(id, context);
    const current = { ...previous, ...input, audit: auditUpdated(previous.audit, context.actorId) };
    this.validator.validate(current);
    await this.repository.save(current);
    await this.publishAuditAndDomain('PRODUCT_UPDATED', 'product', id, previous, current, context);
    return current;
  }
  publish(id: EntityId, context: MutationContext) {
    return this.transition(id, 'published', 'PRODUCT_PUBLISHED', context);
  }
  pause(id: EntityId, context: MutationContext) {
    return this.transition(id, 'paused', 'PRODUCT_UPDATED', context);
  }
  archive(id: EntityId, context: MutationContext) {
    return this.transition(id, 'archived', 'PRODUCT_UPDATED', context);
  }
  disable(id: EntityId, context: MutationContext) {
    return this.transition(id, 'disabled', 'PRODUCT_DISABLED', context);
  }
  restore(id: EntityId, context: MutationContext) {
    return this.transition(id, 'draft', 'PRODUCT_UPDATED', context);
  }
  async duplicate(id: EntityId, context: MutationContext) {
    const source = await this.requireProduct(id, context);
    return this.create(
      {
        ...source,
        name: `${source.name} Copy`,
        slug: `${source.slug}-copy`,
        gallery: { ...source.gallery, additionalImages: [...source.gallery.additionalImages] },
        tags: [...source.tags],
        sortOrder: source.sortOrder + 1,
      },
      context,
    );
  }
  private async transition(
    id: EntityId,
    status: LifecycleStatus,
    eventName: CommerceEventName,
    context: MutationContext,
  ) {
    const previous = await this.requireProduct(id, context);
    const current = { ...previous, status, audit: auditUpdated(previous.audit, context.actorId) };
    await this.repository.save(current);
    await this.publishAuditAndDomain(eventName, 'product', id, previous, current, context);
    return current;
  }
  private async requireProduct(id: EntityId, context: Pick<MutationContext, 'tenantId'>) {
    const product = await this.repository.get(id, context);
    if (!product) throw new Error('PRODUCT_NOT_FOUND');
    return product;
  }
  private async publishAuditAndDomain(
    eventName: CommerceEventName,
    resource: string,
    resourceId: string,
    previousState: unknown,
    currentState: unknown,
    context: MutationContext,
  ) {
    if (!this.events) return;
    const metadata = createEventMetadata({
      eventName,
      category: 'domain',
      tenantId: context.tenantId,
      branchId: context.branchId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      schemaVersion: 1,
    });
    await this.events.publish({
      metadata,
      payload: { resource, resourceId, previousState, currentState },
    } satisfies DomainEvent);
    await this.events.publish({
      metadata: {
        ...metadata,
        eventId: crypto.randomUUID(),
        category: 'audit',
        eventName: `${eventName}_AUDIT`,
      },
      action: eventName as never,
      resource,
      resourceId,
      payload: {
        actorId: context.actorId,
        tenantId: context.tenantId,
        branchId: context.branchId,
        previousState,
        currentState,
      },
    } satisfies AuditEvent);
  }
}
