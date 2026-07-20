import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthorizationContext } from '@jburger/authorization';
import { CartPricingService, CartService } from '@jburger/domain-cart';
import type { MergeReportEntry } from '@jburger/domain-cart';
import type { Cart, PricedCart } from '@jburger/domain-types';
import { Branch } from '../common/decorators/branch.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Tenant } from '../common/decorators/tenant.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { BranchGuard } from '../common/guards/branch.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { CartDomainErrorFilter } from './cart-domain-error.filter.js';
import { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from './cart.dto.js';

interface CartActor {
  tenantId: string;
  customerId: string;
  branchId?: string;
}

/**
 * El carrito es del cliente autenticado: ownership por `customerId = actorId`.
 * No requiere permisos de vocabulario (el rol CLIENTE opera su propio carrito).
 */
@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard)
@UseInterceptors(AuditInterceptor)
@UseFilters(CartDomainErrorFilter)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly pricingService: CartPricingService,
  ) {}

  @Get()
  async getCart(
    @Tenant() tenantId: string | undefined,
    @Branch() branchId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
  ) {
    const actor = this.requireActor(tenantId, branchId, user);
    const cart = await this.cartService.getActiveCart(actor.tenantId, actor.customerId);
    if (!cart) {
      return { data: null };
    }
    return { data: await this.pricingService.price(cart) };
  }

  @Post('items')
  async addItem(
    @Tenant() tenantId: string | undefined,
    @Branch() branchId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    const actor = this.requireActor(tenantId, branchId, user);
    const cart = await this.cartService.addItem({
      tenantId: actor.tenantId,
      customerId: actor.customerId,
      ...(actor.branchId !== undefined ? { branchId: actor.branchId } : {}),
      productId: dto.productId,
      quantity: dto.quantity,
      ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
      ...(dto.cartVersion !== undefined ? { expectedVersion: dto.cartVersion } : {}),
      actorId: actor.customerId,
    });
    return { data: await this.price(cart) };
  }

  @Patch('items/:productId')
  async updateItem(
    @Tenant() tenantId: string | undefined,
    @Branch() branchId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const actor = this.requireActor(tenantId, branchId, user);
    const cart = await this.cartService.updateItemQuantity({
      tenantId: actor.tenantId,
      customerId: actor.customerId,
      productId,
      quantity: dto.quantity,
      expectedVersion: dto.cartVersion,
      actorId: actor.customerId,
    });
    return { data: await this.price(cart) };
  }

  @Delete('items/:productId')
  async removeItem(
    @Tenant() tenantId: string | undefined,
    @Branch() branchId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('version', ParseIntPipe) version: number,
  ) {
    const actor = this.requireActor(tenantId, branchId, user);
    const cart = await this.cartService.removeItem({
      tenantId: actor.tenantId,
      customerId: actor.customerId,
      productId,
      expectedVersion: version,
      actorId: actor.customerId,
    });
    return { data: await this.price(cart) };
  }

  @Delete()
  async clear(
    @Tenant() tenantId: string | undefined,
    @Branch() branchId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Query('version', ParseIntPipe) version: number,
  ) {
    const actor = this.requireActor(tenantId, branchId, user);
    const cart = await this.cartService.clear({
      tenantId: actor.tenantId,
      customerId: actor.customerId,
      expectedVersion: version,
      actorId: actor.customerId,
    });
    return { data: await this.price(cart) };
  }

  @Post('merge')
  async merge(
    @Tenant() tenantId: string | undefined,
    @Branch() branchId: string | undefined,
    @CurrentUser() user: AuthorizationContext | undefined,
    @Body() dto: MergeCartDto,
  ): Promise<{ data: PricedCart; report: MergeReportEntry[] }> {
    const actor = this.requireActor(tenantId, branchId, user);
    const result = await this.cartService.mergeGuestCart({
      tenantId: actor.tenantId,
      customerId: actor.customerId,
      ...(actor.branchId !== undefined ? { branchId: actor.branchId } : {}),
      items: dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        ...(item.notas !== undefined ? { notas: item.notas } : {}),
      })),
      actorId: actor.customerId,
    });
    return { data: await this.price(result.cart), report: result.report };
  }

  private price(cart: Cart): Promise<PricedCart> {
    return this.pricingService.price(cart);
  }

  private requireActor(
    tenantId: string | undefined,
    branchId: string | undefined,
    user: AuthorizationContext | undefined,
  ): CartActor {
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required.');
    }
    if (!user?.actorId) {
      throw new BadRequestException('Authenticated actor is required.');
    }
    return { tenantId, customerId: user.actorId, ...(branchId !== undefined ? { branchId } : {}) };
  }
}
