import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthorizationContext } from '@jburger/authorization';
import { PaymentService } from '@jburger/domain-payments';
import type { PaymentOrderSource } from '@jburger/domain-payments';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Tenant } from '../common/decorators/tenant.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { BranchGuard } from '../common/guards/branch.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { PaymentDomainErrorFilter } from './payment-domain-error.filter.js';
import { InitiatePaymentDto } from './payments.dto.js';
import { PAYMENT_ORDER_SOURCE } from './payments.tokens.js';

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

@ApiTags('payments')
@ApiBearerAuth()
@Controller('orders/:id/payment')
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard)
@UseInterceptors(AuditInterceptor)
@UseFilters(PaymentDomainErrorFilter)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentService,
    @Inject(PAYMENT_ORDER_SOURCE) private readonly orders: PaymentOrderSource,
  ) {}

  /** Inicia el cobro de un pedido propio en `borrador` y devuelve la URL de checkout del proveedor. */
  @Post()
  async initiate(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    const tenant = requireTenant(tenantId);
    const actorId = requireActor(user);
    await this.requireOwnedOrder(tenant, orderId, user);
    const payment = await this.payments.initiatePayment({
      tenantId: tenant,
      orderId,
      customerId: actorId,
      idempotencyKey: dto.idempotencyKey,
      actorId,
    });
    return { data: payment };
  }

  /** Estado del pago del pedido (dueño o staff con `payments.read`). */
  @Get()
  async get(
    @Tenant() tenantId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    const tenant = requireTenant(tenantId);
    await this.requireOwnedOrder(tenant, orderId, user, 'payments.read');
    const payment = await this.payments.findByOrder(tenant, orderId);
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    return { data: payment };
  }

  /**
   * Aislamiento (PT-7): pedido inexistente o de otro tenant → 404 sin distinguir de "no existe".
   * Un pedido ajeno dentro del mismo tenant → 403 salvo que el actor tenga el permiso de staff.
   */
  private async requireOwnedOrder(
    tenantId: string,
    orderId: string,
    user: AuthorizationContext | undefined,
    staffPermission?: string,
  ): Promise<void> {
    const order = await this.orders.findById(tenantId, orderId);
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    const isOwner = order.clienteId === user?.actorId;
    if (!isOwner && !(staffPermission && hasPermission(user, staffPermission))) {
      throw new ForbiddenException('You cannot access this order.');
    }
  }
}
