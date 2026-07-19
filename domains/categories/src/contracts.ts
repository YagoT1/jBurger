import type { Categoria } from '@jburger/domain-types';
export interface CreateCategoryCommand {
  tenantId: string;
  nombre: string;
  orden?: number;
  actorId: string;
}
export interface UpdateCategoryCommand {
  id: string;
  tenantId: string;
  nombre?: string;
  orden?: number;
  actorId: string;
}
export interface DisableCategoryCommand {
  id: string;
  tenantId: string;
  actorId: string;
}
export interface CategoryQueries {
  list(tenantId: string): Promise<Categoria[]>;
  findById(tenantId: string, id: string): Promise<Categoria | undefined>;
}
export interface CategoryCommands {
  create(command: CreateCategoryCommand): Promise<Categoria>;
  update(command: UpdateCategoryCommand): Promise<Categoria>;
  disable(command: DisableCategoryCommand): Promise<void>;
}
export interface CategoryRepository extends CategoryQueries, CategoryCommands {}
