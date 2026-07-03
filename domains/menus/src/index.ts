import type { AuditMetadata, Money } from '@jburger/shared-kernel';
export type EntityId = string;
export type MenuType =
  | 'delivery'
  | 'in_store'
  | 'lunch'
  | 'dinner'
  | 'happy_hour'
  | 'promotion'
  | string;
export type MenuStatus = 'draft' | 'published' | 'paused' | 'archived' | 'disabled';
export interface MenuVisibility {
  channel: MenuType;
  branchIds?: EntityId[];
  visible: boolean;
}
export interface MenuSchedule {
  startsAt?: string;
  endsAt?: string;
  daysOfWeek?: number[];
  serviceStart?: string;
  serviceEnd?: string;
}
export interface MenuPublication {
  publishedAt?: string;
  publishedBy?: EntityId;
  pausedAt?: string;
  pausedBy?: EntityId;
}
export interface MenuItem {
  id: EntityId;
  productId: EntityId;
  sortOrder: number;
  visibilityOverride?: boolean;
  priceOverride?: Money;
  modifierGroupIds: EntityId[];
}
export interface MenuSection {
  id: EntityId;
  name: string;
  categoryId?: EntityId;
  sortOrder: number;
  items: MenuItem[];
  visible: boolean;
}
export interface Menu {
  id: EntityId;
  tenantId: EntityId;
  name: string;
  type: MenuType;
  sections: MenuSection[];
  visibility: MenuVisibility[];
  schedule?: MenuSchedule;
  publication: MenuPublication;
  status: MenuStatus;
  audit: AuditMetadata;
}
export class MenuService {
  private menus = new Map<EntityId, Menu>();
  list(tenantId: EntityId) {
    return [...this.menus.values()].filter((m) => m.tenantId === tenantId);
  }
  create(
    input: Omit<Menu, 'id' | 'tenantId' | 'status' | 'publication' | 'audit'>,
    tenantId: EntityId,
    actorId?: EntityId,
  ) {
    const menu: Menu = {
      ...input,
      id: crypto.randomUUID(),
      tenantId,
      status: 'draft',
      publication: {},
      audit: { createdAt: new Date().toISOString(), ...(actorId ? { createdBy: actorId } : {}) },
    };
    this.menus.set(menu.id, menu);
    return menu;
  }
  publish(id: EntityId, tenantId: EntityId, actorId?: EntityId) {
    return this.transition(id, tenantId, 'published', {
      publishedAt: new Date().toISOString(),
      ...(actorId ? { publishedBy: actorId } : {}),
    });
  }
  pause(id: EntityId, tenantId: EntityId, actorId?: EntityId) {
    return this.transition(id, tenantId, 'paused', {
      pausedAt: new Date().toISOString(),
      ...(actorId ? { pausedBy: actorId } : {}),
    });
  }
  private transition(
    id: EntityId,
    tenantId: EntityId,
    status: MenuStatus,
    publication: Partial<MenuPublication>,
  ) {
    const menu = this.menus.get(id);
    if (!menu || menu.tenantId !== tenantId) throw new Error('MENU_NOT_FOUND');
    const current = { ...menu, status, publication: { ...menu.publication, ...publication } };
    this.menus.set(id, current);
    return current;
  }
}
