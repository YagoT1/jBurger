import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthorizationContext } from '@jburger/authorization';
import { CheckoutService, OrderService } from '@jburger/domain-orders';
import type { Address } from '@jburger/shared-kernel';
import type { EstadoPedido, Pedido } from '@jburger/domain-types';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { Tenant } from '../common/decorators/tenant.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { BranchGuard } from '../common/guards/branch.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { OrderDomainErrorFilter } from './order-domain-error.filter.js';
import { CancelOrderDto, PlaceOrderDto, TransitionOrderDto } from './orders.dto.js';

const requireTenant = (tenantId: string | undefined): string => {
  if (!tenantId) {
    throw new BadRequestException('x-tenant-id header is required.');
  }
  return tenantId;
};
const requireActor = (user: AuthorizationContext | undefined): string => {
  if (!user?.actorId) {
    throw new BadRequestException('Authenticated actor is required.');
  }
  return user.actorId;
};
const hasPermission = (user: AuthorizationContext | undefined, permission: string): boolean =>
  (user?.permissions ?? []).includes(permission);

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard)
@UseInterceptors(AuditInterceptor)
@UseFilters(OrderDomainErrorFilter)
export class OrdersController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly orderService: OrderService,
  ) {}

  /** Checkout del cliente: convierte su carrito activo en un pedido. */
  @Post()
  async place(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Body() dto: PlaceOrderDto,
  ) {
    const tenant = requireTenant(tenantId);
    const actorId = requireActor(user);
    if (!user?.branchId) {
      throw new BadRequestException('x-branch-id header is required for checkout.');
    }
    const order = await this.checkoutService.placeOrder({
      tenantId: tenant,
      customerId: actorId,
      branchId: user.branchId,
      idempotencyKey: dto.idempotencyKey,
      fulfillmentType: dto.fulfillmentType,
      expectedTotal: dto.expectedTotal,
      ...(dto.direccionEntrega !== undefined
        ? { direccionEntrega: dto.direccionEntrega as Address }
        : {}),
      ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
      actorId,
    });
    return { data: order };
  }

  /** Lista: staff con `orders.read` ve la sucursal; el cliente ve los propios. */
  @Get()
  async list(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Query('estado') estado?: EstadoPedido,
  ) {
    const tenant = requireTenant(tenantId);
    const actorId = requireActor(user);
    if (hasPermission(user, 'orders.read') && user?.branchId) {
      return { data: await this.orderService.listByBranch(tenant, user.branchId, estado) };
    }
    return { data: await this.orderService.listByCustomer(tenant, actorId) };
  }

  @Get(':id')
  async get(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.requireVisibleOrder(requireTenant(tenantId), id, user);
    return { data: order };
  }

  /** Confirmación explícita (separada del checkout para que Pagos pueda gatearla). */
  @Post(':id/confirm')
  async confirm(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const tenant = requireTenant(tenantId);
    await this.requireVisibleOrder(tenant, id, user);
    const order = await this.orderService.transition({
      tenantId: tenant,
      orderId: id,
      to: 'confirmado',
      actorId: requireActor(user),
    });
    return { data: order };
  }

  @Post(':id/status')
  @UseGuards(PermissionGuard)
  @RequirePermissions('orders.write')
  async changeStatus(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionOrderDto,
  ) {
    const order = await this.orderService.transition({
      tenantId: requireTenant(tenantId),
      orderId: id,
      to: dto.to,
      actorId: requireActor(user),
      ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
    });
    return { data: order };
  }

  @Post(':id/cancel')
  async cancel(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    const tenant = requireTenant(tenantId);
    const order = await this.requireVisibleOrder(tenant, id, user);
    // El staff con orders.write puede cancelar según la máquina de estados; el cliente solo desde estados permitidos.
    if (!hasPermission(user, 'orders.write')) {
      this.orderService.assertCustomerCanCancel(order.estado);
    }
    const cancelled = await this.orderService.cancel({
      tenantId: tenant,
      orderId: id,
      actorId: requireActor(user),
      ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
    });
    return { data: cancelled };
  }

  private async requireVisibleOrder(
    tenantId: string,
    orderId: string,
    user: AuthorizationContext | undefined,
  ): Promise<Pedido> {
    const order = await this.orderService.findById(tenantId, orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    const isOwner = order.clienteId === user?.actorId;
    if (!isOwner && !hasPermission(user, 'orders.read')) {
      throw new ForbiddenException('You cannot access this order.');
    }
    return order;
  }
}
