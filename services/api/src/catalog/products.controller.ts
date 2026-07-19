import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthorizationContext } from '@jburger/authorization';
import { AvailabilityService, ProductService } from '@jburger/domain-products';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { Tenant } from '../common/decorators/tenant.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { BranchGuard } from '../common/guards/branch.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { CreateProductDto, SetAvailabilityDto, UpdateProductDto } from './catalog.dto.js';
const requireTenant = (tenantId: string | undefined): string => {
  if (!tenantId) {
    throw new BadRequestException('x-tenant-id header is required.');
  }
  return tenantId;
};
@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog/products')
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class ProductsController {
  constructor(
    private readonly productService: ProductService,
    private readonly availabilityService: AvailabilityService,
  ) {}
  @Get()
  @RequirePermissions('products.read')
  async list(@Tenant() tenantId: string | undefined) {
    return { data: await this.productService.list(requireTenant(tenantId)) };
  }
  @Get(':id')
  @RequirePermissions('products.read')
  async get(@Tenant() tenantId: string | undefined, @Param('id', ParseUUIDPipe) id: string) {
    const producto = await this.productService.findById(requireTenant(tenantId), id);
    if (!producto) {
      throw new NotFoundException('Product not found.');
    }
    return producto;
  }
  @Post()
  @RequirePermissions('products.write')
  create(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.create({
      tenantId: requireTenant(tenantId),
      categoriaId: dto.categoriaId,
      nombre: dto.nombre,
      ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
      precio: { amount: dto.precioAmount, currency: dto.precioCurrency ?? 'ARS' },
      ...(dto.imagenUrl !== undefined ? { imagenUrl: dto.imagenUrl } : {}),
      actorId: user?.actorId ?? 'unknown',
    });
  }
  @Patch(':id')
  @RequirePermissions('products.write')
  update(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    if (dto.precioAmount === undefined && dto.precioCurrency !== undefined) {
      throw new BadRequestException('precioAmount is required when precioCurrency is provided.');
    }
    return this.productService.update({
      id,
      tenantId: requireTenant(tenantId),
      ...(dto.categoriaId !== undefined ? { categoriaId: dto.categoriaId } : {}),
      ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
      ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
      ...(dto.precioAmount !== undefined
        ? { precio: { amount: dto.precioAmount, currency: dto.precioCurrency ?? 'ARS' } }
        : {}),
      ...(dto.imagenUrl !== undefined ? { imagenUrl: dto.imagenUrl } : {}),
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
    await this.productService.disable({
      id,
      tenantId: requireTenant(tenantId),
      actorId: user?.actorId ?? 'unknown',
    });
    return { id, activo: false };
  }
  @Put(':id/availability')
  @RequirePermissions('products.write')
  setAvailability(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.availabilityService.set({
      tenantId: requireTenant(tenantId),
      branchId: dto.branchId,
      productId: id,
      disponible: dto.disponible,
      ...(dto.precioOverrideAmount !== undefined
        ? {
            precioOverride: {
              amount: dto.precioOverrideAmount,
              currency: dto.precioOverrideCurrency ?? 'ARS',
            },
          }
        : {}),
      actorId: user?.actorId ?? 'unknown',
    });
  }
}
