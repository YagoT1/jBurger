import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthorizationContext } from '@jburger/authorization';
import { CategoryService } from '@jburger/domain-categories';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { Tenant } from '../common/decorators/tenant.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { BranchGuard } from '../common/guards/branch.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { CreateCategoryDto, UpdateCategoryDto } from './catalog.dto.js';
const requireTenant = (tenantId: string | undefined): string => {
  if (!tenantId) {
    throw new BadRequestException('x-tenant-id header is required.');
  }
  return tenantId;
};
@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog/categories')
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get()
  @RequirePermissions('products.read')
  async list(@Tenant() tenantId: string | undefined) {
    return { data: await this.categoryService.list(requireTenant(tenantId)) };
  }
  @Post()
  @RequirePermissions('products.write')
  create(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.create({
      tenantId: requireTenant(tenantId),
      nombre: dto.nombre,
      ...(dto.orden !== undefined ? { orden: dto.orden } : {}),
      actorId: user?.actorId ?? 'unknown',
    });
  }
  @Patch(':id')
  @RequirePermissions('products.write')
  update(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update({
      id,
      tenantId: requireTenant(tenantId),
      ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
      ...(dto.orden !== undefined ? { orden: dto.orden } : {}),
      actorId: user?.actorId ?? 'unknown',
    });
  }
  @Post(':id/disable')
  @RequirePermissions('products.write')
  async disable(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.categoryService.disable({
      id,
      tenantId: requireTenant(tenantId),
      actorId: user?.actorId ?? 'unknown',
    });
    return { id, activa: false };
  }
}
