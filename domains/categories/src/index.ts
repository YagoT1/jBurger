import type { AuditMetadata } from '@jburger/shared-kernel';
export type EntityId = string;
export type CategoryStatus = 'draft' | 'published' | 'paused' | 'archived' | 'disabled';
export type CategoryVisibility = 'public' | 'private' | 'hidden';
export interface Category {
  id: EntityId;
  tenantId: EntityId;
  parentCategoryId?: EntityId;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  visibility: CategoryVisibility;
  status: CategoryStatus;
  audit: AuditMetadata;
}
export interface CategoryRepository {
  save(category: Category): Promise<Category>;
  list(tenantId: EntityId): Promise<Category[]>;
  get(id: EntityId, tenantId: EntityId): Promise<Category | undefined>;
}
export class InMemoryCategoryRepository implements CategoryRepository {
  private categories = new Map<EntityId, Category>();
  async save(category: Category) {
    this.categories.set(category.id, category);
    return category;
  }
  async list(tenantId: EntityId) {
    return [...this.categories.values()]
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async get(id: EntityId, tenantId: EntityId) {
    const c = this.categories.get(id);
    return c?.tenantId === tenantId ? c : undefined;
  }
}
export class CategoryService {
  constructor(private readonly repository: CategoryRepository = new InMemoryCategoryRepository()) {}
  list(tenantId: EntityId) {
    return this.repository.list(tenantId);
  }
  async create(
    input: Omit<Category, 'id' | 'tenantId' | 'status' | 'audit'>,
    tenantId: EntityId,
    actorId?: EntityId,
  ) {
    const category: Category = {
      ...input,
      id: crypto.randomUUID(),
      tenantId,
      status: 'draft',
      audit: { createdAt: new Date().toISOString(), ...(actorId ? { createdBy: actorId } : {}) },
    };
    return this.repository.save(category);
  }
  async update(
    id: EntityId,
    tenantId: EntityId,
    input: Partial<Omit<Category, 'id' | 'tenantId' | 'audit'>>,
    actorId?: EntityId,
  ) {
    const previous = await this.repository.get(id, tenantId);
    if (!previous) throw new Error('CATEGORY_NOT_FOUND');
    return this.repository.save({
      ...previous,
      ...input,
      audit: {
        ...previous.audit,
        updatedAt: new Date().toISOString(),
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }
}
