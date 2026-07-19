import type {
  DisponibilidadProducto,
  Menu,
  MenuCategoria,
  MenuProducto,
  Producto,
} from '@jburger/domain-types';
import type { MenuSource } from './contracts.js';
export interface MenuQuery {
  tenantId: string;
  branchId: string;
}
const toMenuProducto = (
  producto: Producto,
  disponibilidad: DisponibilidadProducto | undefined,
): MenuProducto => ({
  id: producto.id,
  nombre: producto.nombre,
  ...(producto.descripcion !== undefined ? { descripcion: producto.descripcion } : {}),
  precio: disponibilidad?.precioOverride ?? producto.precio,
  ...(producto.imagenUrl !== undefined ? { imagenUrl: producto.imagenUrl } : {}),
});
export class MenuService {
  constructor(private readonly source: MenuSource) {}
  async getMenu(query: MenuQuery): Promise<Menu> {
    const [categorias, productos, disponibilidad] = await Promise.all([
      this.source.listActiveCategories(query.tenantId),
      this.source.listActiveProducts(query.tenantId),
      this.source.listAvailability(query.tenantId, query.branchId),
    ]);
    const disponibilidadPorProducto = new Map(disponibilidad.map((item) => [item.productId, item]));
    const categoriasMenu: MenuCategoria[] = [...categorias]
      .sort((a, b) => a.orden - b.orden)
      .map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        orden: categoria.orden,
        productos: productos
          .filter((producto) => producto.categoriaId === categoria.id)
          .filter((producto) => disponibilidadPorProducto.get(producto.id)?.disponible ?? true)
          .map((producto) => toMenuProducto(producto, disponibilidadPorProducto.get(producto.id))),
      }))
      .filter((categoria) => categoria.productos.length > 0);
    return {
      tenantId: query.tenantId,
      branchId: query.branchId,
      categorias: categoriasMenu,
      generatedAt: new Date().toISOString(),
    };
  }
}
