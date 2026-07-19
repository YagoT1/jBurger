import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Categoria, DisponibilidadProducto, Producto } from '@jburger/domain-types';
import type {
  CategoryRepository,
  CreateCategoryCommand,
  DisableCategoryCommand,
  UpdateCategoryCommand,
} from '@jburger/domain-categories';
import type {
  AvailabilityRepository,
  CreateProductCommand,
  DisableProductCommand,
  MenuSource,
  ProductRepository,
  SetAvailabilityCommand,
  UpdateProductCommand,
} from '@jburger/domain-products';
import type { InMemoryCatalogStore } from './in-memory-catalog.store.js';

export class InMemoryCategoryRepository implements CategoryRepository {
  constructor(private readonly store: InMemoryCatalogStore) {}
  async list(tenantId: string): Promise<Categoria[]> {
    return this.store.categories.filter((categoria) => categoria.tenantId === tenantId);
  }
  async findById(tenantId: string, id: string): Promise<Categoria | undefined> {
    return this.store.categories.find(
      (categoria) => categoria.tenantId === tenantId && categoria.id === id,
    );
  }
  async create(command: CreateCategoryCommand): Promise<Categoria> {
    if (
      this.store.categories.some(
        (categoria) =>
          categoria.tenantId === command.tenantId && categoria.nombre === command.nombre,
      )
    ) {
      throw new ConflictException('Category name already exists.');
    }
    const categoria: Categoria = {
      id: crypto.randomUUID(),
      tenantId: command.tenantId,
      nombre: command.nombre,
      orden: command.orden ?? 0,
      activa: true,
      audit: { createdAt: new Date().toISOString(), createdBy: command.actorId },
    };
    this.store.categories.push(categoria);
    return categoria;
  }
  async update(command: UpdateCategoryCommand): Promise<Categoria> {
    const index = this.store.categories.findIndex(
      (categoria) => categoria.tenantId === command.tenantId && categoria.id === command.id,
    );
    const existing = this.store.categories[index];
    if (!existing) {
      throw new NotFoundException('Category not found.');
    }
    const categoria: Categoria = {
      ...existing,
      ...(command.nombre !== undefined ? { nombre: command.nombre } : {}),
      ...(command.orden !== undefined ? { orden: command.orden } : {}),
      audit: { ...existing.audit, updatedAt: new Date().toISOString(), updatedBy: command.actorId },
    };
    this.store.categories[index] = categoria;
    return categoria;
  }
  async disable(command: DisableCategoryCommand): Promise<void> {
    const index = this.store.categories.findIndex(
      (categoria) => categoria.tenantId === command.tenantId && categoria.id === command.id,
    );
    const existing = this.store.categories[index];
    if (!existing) {
      throw new NotFoundException('Category not found.');
    }
    this.store.categories[index] = {
      ...existing,
      activa: false,
      audit: { ...existing.audit, updatedAt: new Date().toISOString(), updatedBy: command.actorId },
    };
  }
}

export class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly store: InMemoryCatalogStore) {}
  async list(tenantId: string): Promise<Producto[]> {
    return this.store.products.filter((producto) => producto.tenantId === tenantId);
  }
  async findById(tenantId: string, id: string): Promise<Producto | undefined> {
    return this.store.products.find(
      (producto) => producto.tenantId === tenantId && producto.id === id,
    );
  }
  async create(command: CreateProductCommand): Promise<Producto> {
    if (
      this.store.products.some(
        (producto) => producto.tenantId === command.tenantId && producto.nombre === command.nombre,
      )
    ) {
      throw new ConflictException('Product name already exists.');
    }
    if (
      !this.store.categories.some(
        (categoria) =>
          categoria.tenantId === command.tenantId && categoria.id === command.categoriaId,
      )
    ) {
      throw new NotFoundException('Category not found.');
    }
    const producto: Producto = {
      id: crypto.randomUUID(),
      tenantId: command.tenantId,
      categoriaId: command.categoriaId,
      nombre: command.nombre,
      ...(command.descripcion !== undefined ? { descripcion: command.descripcion } : {}),
      precio: command.precio,
      ...(command.imagenUrl !== undefined ? { imagenUrl: command.imagenUrl } : {}),
      activo: true,
      audit: { createdAt: new Date().toISOString(), createdBy: command.actorId },
    };
    this.store.products.push(producto);
    return producto;
  }
  async update(command: UpdateProductCommand): Promise<Producto> {
    const index = this.store.products.findIndex(
      (producto) => producto.tenantId === command.tenantId && producto.id === command.id,
    );
    const existing = this.store.products[index];
    if (!existing) {
      throw new NotFoundException('Product not found.');
    }
    if (
      command.categoriaId !== undefined &&
      !this.store.categories.some(
        (categoria) =>
          categoria.tenantId === command.tenantId && categoria.id === command.categoriaId,
      )
    ) {
      throw new NotFoundException('Category not found.');
    }
    const producto: Producto = {
      ...existing,
      ...(command.categoriaId !== undefined ? { categoriaId: command.categoriaId } : {}),
      ...(command.nombre !== undefined ? { nombre: command.nombre } : {}),
      ...(command.descripcion !== undefined ? { descripcion: command.descripcion } : {}),
      ...(command.precio !== undefined ? { precio: command.precio } : {}),
      ...(command.imagenUrl !== undefined ? { imagenUrl: command.imagenUrl } : {}),
      audit: { ...existing.audit, updatedAt: new Date().toISOString(), updatedBy: command.actorId },
    };
    this.store.products[index] = producto;
    return producto;
  }
  async disable(command: DisableProductCommand): Promise<void> {
    const index = this.store.products.findIndex(
      (producto) => producto.tenantId === command.tenantId && producto.id === command.id,
    );
    const existing = this.store.products[index];
    if (!existing) {
      throw new NotFoundException('Product not found.');
    }
    this.store.products[index] = {
      ...existing,
      activo: false,
      audit: { ...existing.audit, updatedAt: new Date().toISOString(), updatedBy: command.actorId },
    };
  }
}

export class InMemoryAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly store: InMemoryCatalogStore) {}
  async listByBranch(tenantId: string, branchId: string): Promise<DisponibilidadProducto[]> {
    return this.store.availability.filter(
      (item) => item.tenantId === tenantId && item.branchId === branchId,
    );
  }
  async set(command: SetAvailabilityCommand): Promise<DisponibilidadProducto> {
    if (
      !this.store.products.some(
        (producto) => producto.tenantId === command.tenantId && producto.id === command.productId,
      )
    ) {
      throw new NotFoundException('Product not found.');
    }
    const disponibilidad: DisponibilidadProducto = {
      tenantId: command.tenantId,
      branchId: command.branchId,
      productId: command.productId,
      disponible: command.disponible,
      ...(command.precioOverride !== undefined ? { precioOverride: command.precioOverride } : {}),
      updatedAt: new Date().toISOString(),
    };
    const index = this.store.availability.findIndex(
      (item) =>
        item.tenantId === command.tenantId &&
        item.branchId === command.branchId &&
        item.productId === command.productId,
    );
    if (index >= 0) {
      this.store.availability[index] = disponibilidad;
    } else {
      this.store.availability.push(disponibilidad);
    }
    return disponibilidad;
  }
}

export class InMemoryMenuSource implements MenuSource {
  constructor(private readonly store: InMemoryCatalogStore) {}
  async listActiveCategories(tenantId: string): Promise<Categoria[]> {
    return this.store.categories.filter(
      (categoria) => categoria.tenantId === tenantId && categoria.activa,
    );
  }
  async listActiveProducts(tenantId: string): Promise<Producto[]> {
    return this.store.products.filter(
      (producto) => producto.tenantId === tenantId && producto.activo,
    );
  }
  async listAvailability(tenantId: string, branchId: string): Promise<DisponibilidadProducto[]> {
    return this.store.availability.filter(
      (item) => item.tenantId === tenantId && item.branchId === branchId,
    );
  }
}
