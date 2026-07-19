import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
import { eq, SupabaseRestClient } from '../../common/persistence/supabase-rest.client.js';

interface CategoryRow {
  id: string;
  tenant_id: string;
  nombre: string;
  orden: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}
interface ProductRow {
  id: string;
  tenant_id: string;
  category_id: string;
  nombre: string;
  descripcion: string | null;
  price_amount: number | string;
  price_currency: Producto['precio']['currency'];
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
interface AvailabilityRow {
  tenant_id: string;
  branch_id: string;
  product_id: string;
  disponible: boolean;
  price_override_amount: number | string | null;
  updated_at: string;
}

const toCategoria = (row: CategoryRow): Categoria => ({
  id: row.id,
  tenantId: row.tenant_id,
  nombre: row.nombre,
  orden: row.orden,
  activa: row.activa,
  audit: { createdAt: row.created_at, updatedAt: row.updated_at },
});
const toProducto = (row: ProductRow): Producto => ({
  id: row.id,
  tenantId: row.tenant_id,
  categoriaId: row.category_id,
  nombre: row.nombre,
  ...(row.descripcion !== null ? { descripcion: row.descripcion } : {}),
  precio: { amount: Number(row.price_amount), currency: row.price_currency },
  ...(row.imagen_url !== null ? { imagenUrl: row.imagen_url } : {}),
  activo: row.activo,
  audit: { createdAt: row.created_at, updatedAt: row.updated_at },
});
const toDisponibilidad = (
  row: AvailabilityRow,
  currency: Producto['precio']['currency'] = 'ARS',
): DisponibilidadProducto => ({
  tenantId: row.tenant_id,
  branchId: row.branch_id,
  productId: row.product_id,
  disponible: row.disponible,
  ...(row.price_override_amount !== null
    ? { precioOverride: { amount: Number(row.price_override_amount), currency } }
    : {}),
  updatedAt: row.updated_at,
});

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly client: SupabaseRestClient) {}
  async list(tenantId: string): Promise<Categoria[]> {
    const rows = await this.client.select<CategoryRow>(
      `categories?tenant_id=${eq(tenantId)}&order=orden.asc`,
    );
    return rows.map(toCategoria);
  }
  async findById(tenantId: string, id: string): Promise<Categoria | undefined> {
    const rows = await this.client.select<CategoryRow>(
      `categories?tenant_id=${eq(tenantId)}&id=${eq(id)}&limit=1`,
    );
    const row = rows[0];
    return row ? toCategoria(row) : undefined;
  }
  async create(command: CreateCategoryCommand): Promise<Categoria> {
    const rows = await this.client.insert<CategoryRow>('categories', {
      tenant_id: command.tenantId,
      nombre: command.nombre,
      orden: command.orden ?? 0,
    });
    const row = rows[0];
    if (!row) {
      throw new ServiceUnavailableException('Catalog storage is unavailable.');
    }
    return toCategoria(row);
  }
  async update(command: UpdateCategoryCommand): Promise<Categoria> {
    const rows = await this.client.patch<CategoryRow>(
      `categories?tenant_id=${eq(command.tenantId)}&id=${eq(command.id)}`,
      {
        ...(command.nombre !== undefined ? { nombre: command.nombre } : {}),
        ...(command.orden !== undefined ? { orden: command.orden } : {}),
        updated_at: new Date().toISOString(),
      },
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Category not found.');
    }
    return toCategoria(row);
  }
  async disable(command: DisableCategoryCommand): Promise<void> {
    const rows = await this.client.patch<CategoryRow>(
      `categories?tenant_id=${eq(command.tenantId)}&id=${eq(command.id)}`,
      { activa: false, updated_at: new Date().toISOString() },
    );
    if (!rows[0]) {
      throw new NotFoundException('Category not found.');
    }
  }
}

export class SupabaseProductRepository implements ProductRepository {
  constructor(private readonly client: SupabaseRestClient) {}
  async list(tenantId: string): Promise<Producto[]> {
    const rows = await this.client.select<ProductRow>(
      `products?tenant_id=${eq(tenantId)}&order=nombre.asc`,
    );
    return rows.map(toProducto);
  }
  async findById(tenantId: string, id: string): Promise<Producto | undefined> {
    const rows = await this.client.select<ProductRow>(
      `products?tenant_id=${eq(tenantId)}&id=${eq(id)}&limit=1`,
    );
    const row = rows[0];
    return row ? toProducto(row) : undefined;
  }
  async create(command: CreateProductCommand): Promise<Producto> {
    const rows = await this.client.insert<ProductRow>('products', {
      tenant_id: command.tenantId,
      category_id: command.categoriaId,
      nombre: command.nombre,
      descripcion: command.descripcion ?? null,
      price_amount: command.precio.amount,
      price_currency: command.precio.currency,
      imagen_url: command.imagenUrl ?? null,
    });
    const row = rows[0];
    if (!row) {
      throw new ServiceUnavailableException('Catalog storage is unavailable.');
    }
    return toProducto(row);
  }
  async update(command: UpdateProductCommand): Promise<Producto> {
    const rows = await this.client.patch<ProductRow>(
      `products?tenant_id=${eq(command.tenantId)}&id=${eq(command.id)}`,
      {
        ...(command.categoriaId !== undefined ? { category_id: command.categoriaId } : {}),
        ...(command.nombre !== undefined ? { nombre: command.nombre } : {}),
        ...(command.descripcion !== undefined ? { descripcion: command.descripcion } : {}),
        ...(command.precio !== undefined
          ? { price_amount: command.precio.amount, price_currency: command.precio.currency }
          : {}),
        ...(command.imagenUrl !== undefined ? { imagen_url: command.imagenUrl } : {}),
        updated_at: new Date().toISOString(),
      },
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Product not found.');
    }
    return toProducto(row);
  }
  async disable(command: DisableProductCommand): Promise<void> {
    const rows = await this.client.patch<ProductRow>(
      `products?tenant_id=${eq(command.tenantId)}&id=${eq(command.id)}`,
      { activo: false, updated_at: new Date().toISOString() },
    );
    if (!rows[0]) {
      throw new NotFoundException('Product not found.');
    }
  }
}

export class SupabaseAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly client: SupabaseRestClient) {}
  async listByBranch(tenantId: string, branchId: string): Promise<DisponibilidadProducto[]> {
    const rows = await this.client.select<AvailabilityRow>(
      `product_branch_availability?tenant_id=${eq(tenantId)}&branch_id=${eq(branchId)}`,
    );
    return rows.map((row) => toDisponibilidad(row));
  }
  async set(command: SetAvailabilityCommand): Promise<DisponibilidadProducto> {
    const rows = await this.client.insert<AvailabilityRow>(
      'product_branch_availability',
      {
        tenant_id: command.tenantId,
        branch_id: command.branchId,
        product_id: command.productId,
        disponible: command.disponible,
        price_override_amount: command.precioOverride?.amount ?? null,
        updated_by: command.actorId,
        updated_at: new Date().toISOString(),
      },
      'resolution=merge-duplicates,return=representation',
    );
    const row = rows[0];
    if (!row) {
      throw new ServiceUnavailableException('Catalog storage is unavailable.');
    }
    return toDisponibilidad(row, command.precioOverride?.currency ?? 'ARS');
  }
}

export class SupabaseMenuSource implements MenuSource {
  constructor(private readonly client: SupabaseRestClient) {}
  async listActiveCategories(tenantId: string): Promise<Categoria[]> {
    const rows = await this.client.select<CategoryRow>(
      `categories?tenant_id=${eq(tenantId)}&activa=eq.true&order=orden.asc`,
    );
    return rows.map(toCategoria);
  }
  async listActiveProducts(tenantId: string): Promise<Producto[]> {
    const rows = await this.client.select<ProductRow>(
      `products?tenant_id=${eq(tenantId)}&activo=eq.true`,
    );
    return rows.map(toProducto);
  }
  async listAvailability(tenantId: string, branchId: string): Promise<DisponibilidadProducto[]> {
    const rows = await this.client.select<AvailabilityRow>(
      `product_branch_availability?tenant_id=${eq(tenantId)}&branch_id=${eq(branchId)}`,
    );
    return rows.map((row) => toDisponibilidad(row));
  }
}
