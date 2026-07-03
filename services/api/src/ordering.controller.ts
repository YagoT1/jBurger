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
import { CartService } from '@jburger/domain-cart';
import { OrderDraftService } from '@jburger/domain-order-drafts';
import { OrderService, OrderValidationEngine } from '@jburger/domain-orders';
import { OrderTotalsCalculator } from '@jburger/domain-pricing-engine';
import { DeliveryValidationService } from '@jburger/domain-delivery-validation';
import { Branch } from './common/decorators/branch.decorator.js';
import { CurrentUser } from './common/decorators/current-user.decorator.js';
import { RequirePermissions } from './common/decorators/permissions.decorator.js';
import { Tenant } from './common/decorators/tenant.decorator.js';
import { AuthenticatedGuard } from './common/guards/authenticated.guard.js';
import { BranchGuard } from './common/guards/branch.guard.js';
import { PermissionGuard } from './common/guards/permission.guard.js';
import { TenantGuard } from './common/guards/tenant.guard.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import type { RequestContext } from './security/security.types.js';
const tenant = (tenantId?: string) => tenantId ?? 'default-tenant';
const branch = (branchId?: string) => branchId ?? 'default-branch';
const actor = (auth?: NonNullable<RequestContext['auth']>) => auth?.actorId;
const ctx = (tenantId?: string, branchId?: string, auth?: NonNullable<RequestContext['auth']>) => {
  const actorId = actor(auth);
  return {
    tenantId: tenant(tenantId),
    branchId: branch(branchId),
    ...(actorId ? { actorId } : {}),
  };
};
@ApiBearerAuth()
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class OrderingBaseController {
  protected readonly carts = new CartService();
  protected readonly drafts = new OrderDraftService();
  protected readonly orders = new OrderService();
  protected readonly pricing = new OrderTotalsCalculator();
  protected readonly delivery = new DeliveryValidationService();
  protected readonly validation = new OrderValidationEngine();
}
@ApiTags('cart')
@Controller('cart')
export class CartController extends OrderingBaseController {
  @Post() @RequirePermissions('cart.write') create(
    @Body()
    dto: { ownerType?: 'guest' | 'customer'; ownerId?: string; anonymousSessionId?: string },
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
    @CurrentUser() auth?: NonNullable<RequestContext['auth']>,
  ) {
    return this.carts.createCart(
      {
        ownerType: dto.ownerType ?? 'guest',
        ...(dto.ownerId ? { ownerId: dto.ownerId } : {}),
        ...(dto.anonymousSessionId ? { anonymousSessionId: dto.anonymousSessionId } : {}),
      },
      ctx(tenantId, branchId, auth),
    );
  }
  @Get(':id') @RequirePermissions('cart.read') get(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.carts.getCart(id, tenant(tenantId));
  }
  @Post(':id/recover') @RequirePermissions('cart.write') recover(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.recoverCart(id, ctx(tenantId, branchId));
  }
  @Post('merge') @RequirePermissions('cart.write') merge(
    @Body() dto: { sourceCartId: string; targetCartId: string; mode?: 'guest' | 'customer' },
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return dto.mode === 'customer'
      ? this.carts.mergeCustomerCart(dto.sourceCartId, dto.targetCartId, ctx(tenantId, branchId))
      : this.carts.mergeGuestCart(dto.sourceCartId, dto.targetCartId, ctx(tenantId, branchId));
  }
  @Get(':id/summary') @RequirePermissions('cart.read') summary(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.carts.summary(id, tenant(tenantId));
  }
  @Post(':id/items') @RequirePermissions('cart.write') addItem(
    @Param('id') id: string,
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.addItem(id, dto, ctx(tenantId, branchId));
  }
  @Patch(':id/items/:itemId/quantity') @RequirePermissions('cart.write') updateQuantity(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: { quantity: number },
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.updateQuantity(id, itemId, dto.quantity, ctx(tenantId, branchId));
  }
  @Patch(':id/items/:itemId/modifiers') @RequirePermissions('cart.write') replaceModifiers(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: { modifiers: never[] },
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.replaceModifiers(id, itemId, dto.modifiers, ctx(tenantId, branchId));
  }
  @Post(':id/items/:itemId/remove') @RequirePermissions('cart.write') removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.removeItem(id, itemId, ctx(tenantId, branchId));
  }
  @Post(':id/clear') @RequirePermissions('cart.write') clear(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.clearCart(id, ctx(tenantId, branchId));
  }
  @Post(':id/expire') @RequirePermissions('cart.write') expire(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.expireCart(id, ctx(tenantId, branchId));
  }
  @Post(':id/abandon') @RequirePermissions('cart.write') abandon(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.carts.abandonCart(id, ctx(tenantId, branchId));
  }
}
@ApiTags('order-drafts')
@Controller('order-drafts')
export class OrderDraftsController extends OrderingBaseController {
  @Get() @RequirePermissions('orders.read') list(@Tenant() tenantId?: string) {
    return { data: this.drafts.list(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('orders.write') create(
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.drafts.createDraft(dto, ctx(tenantId, branchId));
  }
  @Get(':id') @RequirePermissions('orders.read') get(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.drafts.get(id, tenant(tenantId));
  }
  @Post(':id/recalculate') @RequirePermissions('orders.write') recalculate(
    @Param('id') id: string,
    @Body() dto: { totals: never },
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.drafts.recalculate(id, dto.totals, ctx(tenantId, branchId));
  }
  @Post(':id/validate') @RequirePermissions('orders.write') validate(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.drafts.validate(id, ctx(tenantId, branchId));
  }
  @Post(':id/freeze') @RequirePermissions('orders.write') freeze(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.drafts.freezeSnapshot(id, ctx(tenantId, branchId));
  }
  @Post(':id/invalidate') @RequirePermissions('orders.write') invalidate(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.drafts.invalidateDraft(id, ctx(tenantId, branchId));
  }
}
@ApiTags('orders')
@Controller('orders')
export class OrdersController extends OrderingBaseController {
  @Get() @RequirePermissions('orders.read') list(@Tenant() tenantId?: string) {
    return { data: this.orders.listOrders(tenant(tenantId)) };
  }
  @Post() @RequirePermissions('orders.write') create(
    @Body() dto: never,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.orders.createOrder(dto, ctx(tenantId, branchId));
  }
  @Get(':id') @RequirePermissions('orders.read') get(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.orders.getOrder(id, tenant(tenantId));
  }
  @Get(':id/timeline') @RequirePermissions('orders.read') timeline(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
  ) {
    return this.orders.timeline(id, tenant(tenantId));
  }
  @Post(':id/confirm') @RequirePermissions('orders.write') confirm(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.orders.confirmOrder(id, ctx(tenantId, branchId));
  }
  @Post(':id/cancel') @RequirePermissions('orders.write') cancel(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.orders.cancelOrder(id, ctx(tenantId, branchId));
  }
  @Post(':id/reject') @RequirePermissions('orders.write') reject(
    @Param('id') id: string,
    @Tenant() tenantId?: string,
    @Branch() branchId?: string,
  ) {
    return this.orders.rejectOrder(id, ctx(tenantId, branchId));
  }
  @Post('validate') @RequirePermissions('orders.write') validate(@Body() dto: never) {
    return this.validation.validate(dto);
  }
}
