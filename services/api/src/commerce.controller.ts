import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductService, type MutationContext } from '@jburger/domain-products';
import { CategoryService } from '@jburger/domain-categories';
import { MenuService } from '@jburger/domain-menus';
import { ModifierService } from '@jburger/domain-modifiers';
import { ComboService } from '@jburger/domain-combos';
import { AvailabilityService } from '@jburger/domain-availability';
import { PricingService } from '@jburger/domain-pricing';
import { RequirePermissions } from './common/decorators/permissions.decorator.js';
import { Tenant } from './common/decorators/tenant.decorator.js';
import { CurrentUser } from './common/decorators/current-user.decorator.js';
import { AuthenticatedGuard } from './common/guards/authenticated.guard.js';
import { BranchGuard } from './common/guards/branch.guard.js';
import { PermissionGuard } from './common/guards/permission.guard.js';
import { TenantGuard } from './common/guards/tenant.guard.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import type { RequestContext } from './security/security.types.js';

const tenant = (tenantId?: string) => tenantId ?? 'default-tenant';
const actor = (auth?: NonNullable<RequestContext['auth']>) => auth?.actorId;
const mutationContext = (
  tenantId?: string,
  auth?: NonNullable<RequestContext['auth']>,
): MutationContext => {
  const actorId = actor(auth);
  return { tenantId: tenant(tenantId), ...(actorId ? { actorId } : {}) };
};

@ApiBearerAuth()
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class CommerceBaseController {
  protected readonly products = new ProductService();
  protected readonly categories = new CategoryService();
  protected readonly menus = new MenuService();
  protected readonly modifiers = new ModifierService();
  protected readonly combos = new ComboService();
  protected readonly availability = new AvailabilityService();
  protected readonly pricing = new PricingService();
}

@ApiTags('products')
@Controller('products')
export class ProductsController extends CommerceBaseController {
  @Get() @RequirePermissions('products.read') list(@Tenant() tenantId?: string) {
    return { data: this.products.list({ tenantId: tenant(tenantId) }) };
  }
  @Post() @RequirePermissions('products.write') create(
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @CurrentUser() auth?: NonNullable<RequestContext['auth']>,
  ) {
    return this.products.create(dto, mutationContext(tenantId, auth));
  }
  @Patch(':id') @RequirePermissions('products.write') update(
    @Param('id') id: string,
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @CurrentUser() auth?: NonNullable<RequestContext['auth']>,
  ) {
    return this.products.update(id, dto, mutationContext(tenantId, auth));
  }
  @Post(':id/publish') @RequirePermissions('products.write') publish(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.products.publish(id, { tenantId: tenant(tenantId) });
  }
  @Post(':id/pause') @RequirePermissions('products.write') pause(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.products.pause(id, { tenantId: tenant(tenantId) });
  }
  @Post(':id/archive') @RequirePermissions('products.write') archive(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.products.archive(id, { tenantId: tenant(tenantId) });
  }
  @Post(':id/disable') @RequirePermissions('products.write') disable(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.products.disable(id, { tenantId: tenant(tenantId) });
  }
  @Post(':id/restore') @RequirePermissions('products.write') restore(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.products.restore(id, { tenantId: tenant(tenantId) });
  }
  @Post(':id/duplicate') @RequirePermissions('products.write') duplicate(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.products.duplicate(id, { tenantId: tenant(tenantId) });
  }
}
@ApiTags('categories')
@Controller('categories')
export class CategoriesController extends CommerceBaseController {
  @Get() @RequirePermissions('categories.read') list(@Tenant() tenantId?: string) {
    return { data: this.categories.list(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('categories.write') create(
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @CurrentUser() auth?: NonNullable<RequestContext['auth']>,
  ) {
    return this.categories.create(dto, tenant(tenantId), actor(auth));
  }
  @Patch(':id') @RequirePermissions('categories.write') update(
    @Param('id') id: string,
    @Body() dto: never,
    @Tenant() tenantId?: string,
  ) {
    return this.categories.update(id, tenant(tenantId), dto);
  }
}
@ApiTags('menus')
@Controller('menus')
export class MenusController extends CommerceBaseController {
  @Get() @RequirePermissions('menus.read') list(@Tenant() tenantId?: string) {
    return { data: this.menus.list(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('menus.write') create(
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @CurrentUser() auth?: NonNullable<RequestContext['auth']>,
  ) {
    return this.menus.create(dto, tenant(tenantId), actor(auth));
  }
  @Post(':id/publish') @RequirePermissions('menus.write') publish(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.menus.publish(id, tenant(tenantId));
  }
  @Post(':id/pause') @RequirePermissions('menus.write') pause(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.menus.pause(id, tenant(tenantId));
  }
}
@ApiTags('modifiers')
@Controller('modifiers')
export class ModifiersController extends CommerceBaseController {
  @Get() @RequirePermissions('modifiers.read') list(@Tenant() tenantId?: string) {
    return { data: this.modifiers.list(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('modifiers.write') create(
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @CurrentUser() auth?: NonNullable<RequestContext['auth']>,
  ) {
    return this.modifiers.create(dto, tenant(tenantId), actor(auth));
  }
}
@ApiTags('combos')
@Controller('combos')
export class CombosController extends CommerceBaseController {
  @Get() @RequirePermissions('combos.read') list(@Tenant() tenantId?: string) {
    return { data: this.combos.list(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('combos.write') create(
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @CurrentUser() auth?: NonNullable<RequestContext['auth']>,
  ) {
    return this.combos.create(dto, tenant(tenantId), actor(auth));
  }
  @Patch(':id') @RequirePermissions('combos.write') update(
    @Param('id') id: string,
    @Body() dto: never,
    @Tenant() tenantId?: string,
  ) {
    return this.combos.update(id, tenant(tenantId), dto);
  }
}
@ApiTags('availability')
@Controller('availability')
export class AvailabilityController extends CommerceBaseController {
  @Get() @RequirePermissions('availability.read') list(@Tenant() tenantId?: string) {
    return { data: this.availability.list(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('availability.write') set(
    @Body() dto: Record<string, unknown>,
    @Tenant() tenantId?: string,
  ) {
    return this.availability.set({ ...dto, tenantId: tenant(tenantId) } as never);
  }
}
@ApiTags('pricing')
@Controller('pricing')
export class PricingController extends CommerceBaseController {
  @Get() @RequirePermissions('pricing.read') list(@Tenant() tenantId?: string) {
    return { data: this.pricing.list(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('pricing.write') create(
    @Body() dto: Record<string, unknown>,
    @Tenant() tenantId?: string,
  ) {
    return this.pricing.create({ ...dto, tenantId: tenant(tenantId) } as never);
  }
}
