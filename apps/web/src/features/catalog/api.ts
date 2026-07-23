import { apiRequest, type ApiContext } from '../../lib/api/http.js';
import type { Menu } from '../../entities/product.js';
import { toMenu, type MenuDto } from './mappers.js';

/**
 * Acceso a catálogo (SC-01/SC-02). Única puerta del feature al backend.
 * Los componentes consumen modelos (`Menu`, `Product`), nunca DTOs.
 */
export const fetchMenu = async (context: ApiContext): Promise<Menu> => {
  const response = await apiRequest<{ data: MenuDto }>('/menu', context);
  return toMenu(response.data);
};
